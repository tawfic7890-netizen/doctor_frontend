'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { extractLatLng } from '@/lib/utils';
import Portal from '@/components/Portal';

// Leaflet must be client-only — it touches window at import time
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

interface Coords { lat: number; lng: number }

interface Props {
  /** Initial string value (raw "lat,lng" or a Google Maps URL). */
  initialValue?: string | null;
  /** Fallback area name to seed the initial map centre (e.g. "Tripoli"). */
  areaHint?: string | null;
  /** Called with a normalised "lat,lng" string when the user confirms. */
  onSave: (value: string) => void;
  onClose: () => void;
}

/** Centre of North Lebanon — used when nothing else is available */
const DEFAULT_CENTER: Coords = { lat: 34.4367, lng: 35.8497 };
const DEFAULT_ZOOM = 10;

/** Rough area → coordinates table, used only as a starting view */
const AREA_CENTERS: Record<string, Coords> = {
  Tripoli: { lat: 34.4367, lng: 35.8497 },
  Akkar:   { lat: 34.5429, lng: 36.1020 },
  Koura:   { lat: 34.3300, lng: 35.8000 },
  Batroun: { lat: 34.2553, lng: 35.6586 },
  Zgharta: { lat: 34.3981, lng: 35.9000 },
  Badawi:  { lat: 34.4600, lng: 35.8500 },
  Bared:   { lat: 34.5036, lng: 35.9425 },
  Menye:   { lat: 34.4700, lng: 36.0200 },
  Anfeh:   { lat: 34.3519, lng: 35.7283 },
  Chekka:  { lat: 34.3247, lng: 35.7106 },
};

interface NomResult { display_name: string; lat: string; lon: string }

export default function MapPickerModal({ initialValue, areaHint, onSave, onClose }: Props) {
  // ── Seed state ──────────────────────────────────────────────────────────
  const seedCoords = useMemo(() => extractLatLng(initialValue), [initialValue]);
  // Use ternary (not &&) so an empty areaHint string doesn't leak through ??
  const areaCenter = areaHint ? AREA_CENTERS[areaHint] : undefined;
  const seedCenter: Coords = seedCoords ?? areaCenter ?? DEFAULT_CENTER;
  const seedZoom = seedCoords ? 16 : areaCenter ? 13 : DEFAULT_ZOOM;

  const [pin,    setPin]    = useState<Coords | null>(seedCoords);
  const [center, setCenter] = useState<Coords>(seedCenter);
  const [zoom,   setZoom]   = useState<number>(seedZoom);
  const [flyToken, setFlyToken] = useState(0); // increment to pan the map

  const [search,   setSearch]   = useState('');
  const [results,  setResults]  = useState<NomResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoBusy,  setGeoBusy]  = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Esc closes ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Search via OpenStreetMap Nominatim (free, no key) ───────────────────
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const q = search.trim();
    if (q.length < 3) { setResults([]); return; }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        // Bias the search toward Lebanon so local clinics surface first
        const url =
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=lb&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data = (await res.json()) as NomResult[];
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  function pickSearchResult(r: NomResult) {
    const c = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    setPin(c);
    setCenter(c);
    setZoom(16);
    setFlyToken((n) => n + 1);
    setResults([]);
    setSearch(r.display_name.split(',').slice(0, 2).join(','));
  }

  function useMyLocation() {
    if (!navigator.geolocation) { setGeoError('Geolocation is not supported on this device'); return; }
    setGeoError(null);
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPin(c);
        setCenter(c);
        setZoom(17);
        setFlyToken((n) => n + 1);
        setGeoBusy(false);
      },
      (err) => {
        setGeoBusy(false);
        setGeoError(err.code === err.PERMISSION_DENIED
          ? 'Location permission denied — enable it in your browser settings'
          : 'Could not get your location. Try again or tap the map.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  function handleSave() {
    if (!pin) return;
    onSave(`${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`);
  }

  return (
    <Portal>
    <>
      {/* Mobile: backdrop + panel stacked. Desktop: backdrop with flex centering */}
      {/* Backdrop (mobile only — on md+ the outer wrapper acts as backdrop) */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] md:hidden" onClick={onClose} />

      {/* Outer wrapper: full-screen on mobile, flex-centering backdrop on desktop */}
      <div
        className="fixed inset-0 z-[61] flex flex-col md:items-center md:justify-center md:bg-black/70 md:backdrop-blur-md md:p-4"
        onClick={onClose}
      >
      {/* Panel */}
      <div
        className="w-full h-full md:h-[min(720px,88vh)] md:w-[min(720px,92vw)] md:rounded-2xl md:border md:border-line flex flex-col bg-base overflow-hidden animate-fade-up"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center gap-3 p-3 border-b border-line flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-on-accent"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-2)))',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-content tracking-tight">Pick clinic location</h2>
            <p className="text-[11px] text-muted mt-0.5">Search, tap the map, or use your GPS</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-muted hover:text-content rounded-xl hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Search + GPS */}
        <div className="relative px-3 pt-3 pb-2 flex-shrink-0 z-[2]">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search address or clinic…"
                className="w-full bg-surface border border-line rounded-xl pl-10 pr-4 py-2.5 text-sm text-content placeholder-muted outline-none focus:border-accent"
              />
              {/* Results dropdown */}
              {(results.length > 0 || searching) && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-line overflow-hidden"
                  style={{ background: 'rgb(var(--c-surface))', boxShadow: 'var(--shadow-md)', zIndex: 3 }}
                >
                  {searching && (
                    <div className="px-3 py-2 text-[11px] text-muted">Searching…</div>
                  )}
                  {results.map((r, i) => (
                    <button
                      key={`${r.lat}-${r.lon}-${i}`}
                      type="button"
                      onClick={() => pickSearchResult(r)}
                      className="w-full text-left px-3 py-2 text-xs text-content hover:bg-surface-2 border-b border-line last:border-b-0 transition-colors"
                    >
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={geoBusy}
              className="flex-shrink-0 px-3 py-2.5 rounded-xl bg-accent/15 text-accent border border-accent/30 text-xs font-bold hover:bg-accent/25 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              title="Use my current location"
            >
              {geoBusy ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
              <span className="hidden sm:inline">My location</span>
            </button>
          </div>
          {geoError && (
            <p
              className="text-[11px] mt-1.5 px-2 py-1 rounded-md"
              style={{ background: 'rgb(var(--c-danger) / 0.10)', color: 'rgb(var(--c-danger))' }}
            >
              {geoError}
            </p>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative bg-surface-2" style={{ minHeight: 0 }}>
          <LeafletMap
            value={pin}
            onPick={(c) => setPin(c)}
            center={center}
            zoom={zoom}
            flyToken={flyToken}
          />
          {/* Centre crosshair hint when no pin yet */}
          {!pin && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="px-3 py-1.5 rounded-full text-[11px] font-semibold text-content"
                style={{ background: 'rgb(var(--c-surface) / 0.92)', boxShadow: 'var(--shadow-md)' }}
              >
                Tap anywhere on the map to drop a pin
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-line flex-shrink-0 space-y-2">
          {pin && (
            <div className="flex items-center justify-between text-[11px] tabular px-2">
              <span className="text-muted">Selected pin</span>
              <span className="font-semibold text-content">
                {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-surface-2 text-content text-sm font-semibold rounded-xl hover:bg-line transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!pin}
              className="btn-primary flex-1 py-3 text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pin ? 'Save Location' : 'Pick a location first'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
    </Portal>
  );
}
