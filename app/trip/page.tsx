'use client';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Doctor, getDoctorStatus, STATUS_COLORS, AREAS, formatFullDate,
  extractLatLng, mapsDirectionsStop,
} from '@/lib/utils';

function buildMapsUrl(doctors: Doctor[]): string {
  const stops = doctors.map(mapsDirectionsStop);
  return `https://www.google.com/maps/dir/${stops.join('/')}`;
}

/* ── Icons ────────────────────────────────────────────────────────────── */
const IconRoute = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M6.7 17.3L17.3 6.7"/>
  </svg>
);
const IconPin = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconStar = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconClose = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconNavigation = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>
);
const IconSearch = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

function TripPageInner() {
  const searchParams  = useSearchParams();
  const planDate      = searchParams.get('plan'); // YYYY-MM-DD or null

  const [selected,    setSelected]    = useState<Set<number>>(new Set());
  const [initialised, setInitialised] = useState(false);
  const [search,      setSearch]      = useState('');
  const [area,        setArea]        = useState('');
  const [subLocation, setSubLocation] = useState('');

  // All doctors (for manual selection)
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors', 'trip'],
    queryFn: () => api.doctors.list({ hideF: true }),
  });

  // If a plan date was passed, fetch that plan to pre-select its doctors
  const { data: planData } = useQuery({
    queryKey: ['plan', planDate],
    queryFn: () => api.plans.get(planDate!),
    enabled: !!planDate,
  });

  // Pre-populate selection once plan data + doctors are both loaded
  useEffect(() => {
    if (initialised || !planDate || !planData || doctors.length === 0) return;
    const ids = (planData.doctor_ids ?? []).map(Number);
    setSelected(new Set(ids));
    setInitialised(true);
  }, [planData, doctors, planDate, initialised]);

  const subLocations = useMemo(() => {
    if (!area) return [];
    const locs = doctors
      .filter((d) => d.area === area && d.location?.trim())
      .map((d) => d.location.trim());
    return Array.from(new Set(locs)).sort();
  }, [doctors, area]);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      if (area && d.area !== area) return false;
      if (subLocation && d.location?.trim() !== subLocation) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          d.name.toLowerCase().includes(s) ||
          d.location?.toLowerCase().includes(s) ||
          d.area?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [doctors, area, subLocation, search]);

  // Preserve plan order for selected doctors
  const selectedDoctors = useMemo(() => {
    if (planDate && planData) {
      // Keep the plan's original order
      const planIds = (planData.doctor_ids ?? []).map(Number);
      const inPlan  = planIds
        .map((id) => doctors.find((d) => d.id === id))
        .filter(Boolean) as Doctor[];
      // Append any manually added doctors that weren't in the plan
      const extra = doctors.filter((d) => selected.has(d.id) && !planIds.includes(d.id));
      return [...inPlan.filter((d) => selected.has(d.id)), ...extra];
    }
    return doctors.filter((d) => selected.has(d.id));
  }, [doctors, selected, planDate, planData]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectArea(a: string) { setArea(a); setSubLocation(''); }
  function clearAll() { setSelected(new Set()); }
  function openMaps() {
    if (selectedDoctors.length === 0) return;
    window.open(buildMapsUrl(selectedDoctors), '_blank');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base px-3 py-3 space-y-2">
        <div className="skeleton rounded-2xl h-28" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton rounded-2xl h-[72px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base pb-40">
      {/* Hero header */}
      <div className="sticky top-0 z-40 glass border-b border-line">
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at top right, rgb(var(--c-accent) / 0.14) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgb(var(--c-accent-2) / 0.10) 0%, transparent 50%)',
            }}
          />
          <div className="relative px-4 pt-4 pb-3 pl-14 pr-14">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-on-accent"
                  style={{
                    background: 'linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-2)))',
                    boxShadow: 'var(--shadow-glow)',
                  }}
                >
                  <IconRoute size={16} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-content tracking-tight">
                    {planDate ? 'Plan Trip' : 'Trip Planner'}
                  </h1>
                  <p className="text-xs text-muted mt-0.5">
                    {planDate
                      ? formatFullDate(planDate)
                      : selected.size === 0
                      ? 'Tap doctors to add them to your route'
                      : (
                        <>
                          <span className="tabular font-semibold text-content">{selected.size}</span>{' '}
                          stop{selected.size > 1 ? 's' : ''} selected
                        </>
                      )}
                  </p>
                </div>
              </div>
              {selected.size > 0 && (
                <button
                  onClick={clearAll}
                  className="flex-shrink-0 text-xs text-muted hover:text-content border border-line rounded-lg px-3 py-1.5 transition-colors hover:border-line-2"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none">
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Search by name or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface border border-line rounded-xl pl-10 pr-4 py-2.5 text-sm text-content placeholder-muted outline-none focus:border-accent"
              />
            </div>

            {/* Area pills */}
            <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => selectArea('')}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  area === '' ? 'bg-accent/15 text-accent border-accent/40' : 'bg-surface text-muted border-line hover:border-line-2'
                }`}
              >All Areas</button>
              {AREAS.map((a) => (
                <button
                  key={a}
                  onClick={() => selectArea(area === a ? '' : a)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    area === a ? 'bg-accent/15 text-accent border-accent/40' : 'bg-surface text-muted border-line hover:border-line-2'
                  }`}
                >{a}</button>
              ))}
            </div>

            {/* Sub-location pills */}
            {subLocations.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pt-2 pb-0.5" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setSubLocation('')}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    subLocation === '' ? 'bg-accent-2/15 text-accent-2 border-accent-2/40' : 'bg-surface text-muted border-line hover:border-line-2'
                  }`}
                >All of {area}</button>
                {subLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSubLocation(subLocation === loc ? '' : loc)}
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      subLocation === loc ? 'bg-accent-2/15 text-accent-2 border-accent-2/40' : 'bg-surface text-muted border-line hover:border-line-2'
                    }`}
                  >{loc}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor list */}
      <div className="px-3 pt-3 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted">
            <div className="w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center mx-auto mb-3 text-subtle">
              <IconSearch size={18} />
            </div>
            <p className="font-medium text-content">No doctors found</p>
            <p className="text-xs mt-1">Try clearing a filter</p>
          </div>
        )}
        {filtered.map((doctor) => {
          const isSelected  = selected.has(doctor.id);
          const statusColor = STATUS_COLORS[getDoctorStatus(doctor)];
          const location    = doctor.location?.trim() || doctor.area;
          const stopIndex   = selectedDoctors.findIndex((d) => d.id === doctor.id);
          const isFromPlan  = planData?.doctor_ids?.map(Number).includes(doctor.id);

          return (
            <div
              key={doctor.id}
              onClick={() => toggle(doctor.id)}
              className={`doctor-card rounded-2xl border p-3 cursor-pointer ${
                isSelected
                  ? 'bg-accent/8 border-accent/50'
                  : 'bg-surface border-line hover:border-line-2'
              }`}
              style={isSelected ? { boxShadow: 'var(--shadow-md)' } : {}}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox / stop number */}
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                    isSelected ? 'border-accent text-on-accent' : 'border-line-2 text-transparent'
                  }`}
                  style={isSelected ? {
                    background: 'linear-gradient(180deg, rgb(var(--c-accent)), rgb(var(--c-accent) / 0.85))',
                    boxShadow: '0 4px 12px -2px rgb(var(--c-accent) / 0.45)',
                  } : {}}
                >
                  {isSelected && (
                    <span className="text-[11px] font-bold tabular">{stopIndex + 1}</span>
                  )}
                </div>

                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}66` }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-content truncate">{doctor.name}</span>
                    {doctor.class === 'a' && (
                      <span className="text-amber-400 flex-shrink-0"><IconStar size={10} /></span>
                    )}
                    {isFromPlan && !isSelected && (
                      <span className="text-[9px] text-muted border border-line rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide flex-shrink-0">plan</span>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                    <span
                      className={`flex-shrink-0 ${extractLatLng(doctor.maps_url) ? 'text-accent' : 'text-subtle'}`}
                      title={extractLatLng(doctor.maps_url) ? 'Precise pin saved' : 'Text-based location'}
                    >
                      <IconPin size={11} />
                    </span>
                    <span className="truncate">{location}</span>
                    {doctor.area && location !== doctor.area && (
                      <span className="text-subtle flex-shrink-0">· {doctor.area}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-[56px] left-0 right-0 z-40 px-4 pb-3 pt-6 bg-gradient-to-t from-base via-base/95 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            {/* Stop chips (scrollable) */}
            <div className="flex gap-1.5 overflow-x-auto mb-2 pb-1" style={{ scrollbarWidth: 'none' }}>
              {selectedDoctors.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => toggle(d.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 text-[11px] bg-accent/12 text-accent border border-accent/30 rounded-full pl-2.5 pr-2 py-1 transition-colors active:bg-accent/25"
                >
                  <span className="font-bold tabular">{i + 1}.</span>
                  <span>{d.name.split(' ')[0]}</span>
                  <span className="opacity-60"><IconClose size={9} /></span>
                </button>
              ))}
            </div>

            <button
              onClick={openMaps}
              className="btn-primary w-full font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            >
              <IconNavigation size={15} />
              <span>Open Route in Google Maps</span>
              <span className="bg-black/25 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular">
                {selected.size} stop{selected.size > 1 ? 's' : ''}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TripPage() {
  return (
    <Suspense>
      <TripPageInner />
    </Suspense>
  );
}
