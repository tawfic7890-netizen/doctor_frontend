'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Doctor, getDoctorStatus, STATUS_COLORS, AREAS } from '@/lib/utils';

function buildMapsUrl(doctors: Doctor[]): string {
  const locations = doctors.map((d) => {
    const loc = d.location?.trim() || `${d.area}, Lebanon`;
    return encodeURIComponent(loc);
  });
  return `https://www.google.com/maps/dir/${locations.join('/')}`;
}

export default function TripPage() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [subLocation, setSubLocation] = useState('');

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors', 'trip'],
    queryFn: () => api.doctors.list({ hideF: true }),
  });

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

  const selectedDoctors = useMemo(
    () => doctors.filter((d) => selected.has(d.id)),
    [doctors, selected]
  );

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectArea(a: string) {
    setArea(a);
    setSubLocation('');
  }

  function clearAll() { setSelected(new Set()); }

  function openMaps() {
    if (selectedDoctors.length === 0) return;
    window.open(buildMapsUrl(selectedDoctors), '_blank');
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base">
        <div className="text-muted text-sm">Loading doctors…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base pb-40">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-base/95 backdrop-blur border-b border-line px-4 pt-4 pb-3 pr-14">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-content">🗺️ Trip Planner</h1>
            <p className="text-xs text-muted">
              {selected.size === 0
                ? 'Tap doctors to add them to your route'
                : `${selected.size} stop${selected.size > 1 ? 's' : ''} selected`}
            </p>
          </div>
          {selected.size > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-muted hover:text-content border border-line rounded-lg px-3 py-1.5 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-sm text-content placeholder-muted outline-none focus:border-accent mb-2"
        />

        {/* Area pills */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => selectArea('')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              area === '' ? 'bg-accent/15 text-accent border-accent/40' : 'text-muted border-line hover:border-subtle'
            }`}
          >
            All Areas
          </button>
          {AREAS.map((a) => (
            <button
              key={a}
              onClick={() => selectArea(area === a ? '' : a)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                area === a ? 'bg-accent/15 text-accent border-accent/40' : 'text-muted border-line hover:border-subtle'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Sub-location pills */}
        {subLocations.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pt-2 pb-0.5" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setSubLocation('')}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                subLocation === ''
                  ? 'bg-violet-500/20 text-violet-500 border-violet-500/40'
                  : 'text-muted border-line hover:border-subtle'
              }`}
            >
              All of {area}
            </button>
            {subLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => setSubLocation(subLocation === loc ? '' : loc)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  subLocation === loc
                    ? 'bg-violet-500/20 text-violet-500 border-violet-500/40'
                    : 'text-muted border-line hover:border-subtle'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Doctor list */}
      <div className="px-4 pt-3 space-y-2">
        {filtered.length === 0 && (
          <div className="text-center text-muted py-12 text-sm">No doctors found</div>
        )}
        {filtered.map((doctor) => {
          const isSelected = selected.has(doctor.id);
          const statusColor = STATUS_COLORS[getDoctorStatus(doctor)];
          const location = doctor.location?.trim() || doctor.area;
          const stopIndex = selectedDoctors.findIndex((d) => d.id === doctor.id);

          return (
            <div
              key={doctor.id}
              onClick={() => toggle(doctor.id)}
              className={`rounded-xl border p-3 cursor-pointer transition-all active:scale-[0.98] ${
                isSelected
                  ? 'bg-accent/8 border-accent/50'
                  : 'bg-surface border-line hover:border-subtle'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox circle */}
                <div
                  className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                    isSelected ? 'bg-accent border-accent' : 'border-subtle'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-on-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-content truncate">{doctor.name}</span>
                    {doctor.class && (
                      <span className="text-[10px] text-subtle flex-shrink-0 uppercase">{doctor.class}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{location}</span>
                    {doctor.area && location !== doctor.area && (
                      <span className="text-subtle flex-shrink-0">· {doctor.area}</span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-on-accent">{stopIndex + 1}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-[56px] left-0 right-0 z-40 px-4 pb-3 pt-2 bg-gradient-to-t from-base via-base to-transparent">
          <div className="flex gap-1.5 overflow-x-auto mb-2 pb-1" style={{ scrollbarWidth: 'none' }}>
            {selectedDoctors.map((d, i) => (
              <button
                key={d.id}
                onClick={() => toggle(d.id)}
                className="flex-shrink-0 flex items-center gap-1 text-[10px] bg-accent/15 text-accent border border-accent/30 rounded-full px-2.5 py-1 transition-colors active:bg-accent/25"
              >
                <span className="font-bold">{i + 1}.</span>
                <span>{d.name.split(' ')[0]}</span>
                <span className="opacity-50 ml-0.5">✕</span>
              </button>
            ))}
          </div>

          <button
            onClick={openMaps}
            className="w-full bg-accent text-on-accent font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
          >
            <span>🗺️</span>
            <span>Open Route in Google Maps</span>
            <span className="bg-black/20 rounded-full px-2 py-0.5 text-xs font-semibold">
              {selected.size} stop{selected.size > 1 ? 's' : ''}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
