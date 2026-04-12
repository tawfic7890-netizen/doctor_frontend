'use client';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Doctor, getDoctorStatus, STATUS_COLORS,
  getCurrentMonthStatus, getCurrentMonthName,
  getLastVisit, isDeal, DAYS, AREAS,
} from '@/lib/utils';
import DoctorModal from '@/components/DoctorModal';
import Link from 'next/link';

interface Props { params: { day: string }; }

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
};
const DAY_MAP: Record<string, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

export default function DailyPlanPage({ params }: Props) {
  const queryClient = useQueryClient();
  const [modalDoctor, setModalDoctor] = useState<Doctor | null>(null);
  const [editing, setEditing] = useState(false);
  const [plannedIds, setPlannedIds] = useState<number[]>([]);
  const [editSelection, setEditSelection] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [subLocation, setSubLocation] = useState('');
  const [statusFilter, setStatusFilter] = useState('');   // '' | 'NEED_VISIT' | 'NEVER' | 'CURRENT_MONTH' | 'DEAL'
  const [filterByDay, setFilterByDay] = useState(true);   // only show doctors available on this day

  let day = params.day.toLowerCase();
  if (day === 'today') day = DAY_MAP[new Date().getDay()] || 'mon';
  const dayLabel = DAY_LABELS[day] || day;
  const monthName = getCurrentMonthName();
  // Map URL param ('mon') → day abbreviation used in doctor.days ('Mon')
  const dayAbbrev = day.charAt(0).toUpperCase() + day.slice(1);

  // Load plan from API
  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: ['plan', day],
    queryFn: () => api.plans.get(day),
  });

  // Sync planned IDs whenever the API returns a plan
  // Cast to Number — Postgres bigint[] can come back as strings over JSON
  useEffect(() => {
    if (planData) {
      setPlannedIds((planData.doctor_ids ?? []).map(Number));
    }
  }, [planData]);

  // Reset edit state when day changes
  useEffect(() => {
    setEditing(false);
    setSearch(''); setArea(''); setSubLocation('');
  }, [day]);

  const savePlanMutation = useMutation({
    mutationFn: (ids: number[]) => api.plans.set(day, ids),
    onSuccess: (saved) => {
      setPlannedIds((saved.doctor_ids ?? []).map(Number));
      queryClient.invalidateQueries({ queryKey: ['plan', day] });
      setEditing(false);
      setSearch(''); setArea(''); setSubLocation('');
      setStatusFilter(''); setFilterByDay(true);
    },
    onError: (err: Error) => {
      alert(`Failed to save plan: ${err.message}`);
    },
  });

  const { data: allDoctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors', { hideF: false }],
    queryFn: () => api.doctors.list({ hideF: false }),
  });

  const visitMutation = useMutation({
    mutationFn: (id: number) => api.visits.visitToday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const isLoading = planLoading || doctorsLoading;

  // Resolve planned IDs → Doctor objects (preserving order)
  const plannedDoctors = useMemo(
    () => plannedIds.map((id) => allDoctors.find((d) => d.id === id)).filter(Boolean) as Doctor[],
    [plannedIds, allDoctors]
  );

  // Sub-locations for selected area (edit mode)
  const subLocations = useMemo(() => {
    if (!area) return [];
    const locs = allDoctors
      .filter((d) => d.area === area && d.class?.toLowerCase() !== 'f' && d.location?.trim())
      .map((d) => d.location.trim());
    return [...new Set(locs)].sort();
  }, [allDoctors, area]);

  // Doctors shown in edit mode (exclude F, apply all active filters)
  const filteredDoctors = useMemo(() => {
    return allDoctors.filter((d) => {
      if (d.class?.toLowerCase() === 'f') return false;

      // Day availability filter
      if (filterByDay && !(Array.isArray(d.days) && d.days.includes(dayAbbrev))) return false;

      // Status filter
      if (statusFilter) {
        if (statusFilter === 'CURRENT_MONTH') {
          if (getCurrentMonthStatus(d) === 'none') return false;
        } else {
          if (getDoctorStatus(d) !== statusFilter) return false;
        }
      }

      // Area / sub-location filter
      if (area && d.area !== area) return false;
      if (subLocation && d.location?.trim() !== subLocation) return false;

      // Search
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
  }, [allDoctors, area, subLocation, search, statusFilter, filterByDay, dayAbbrev]);

  function enterEdit() {
    setEditSelection(new Set(plannedIds));
    setStatusFilter('');
    setFilterByDay(true);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSearch(''); setArea(''); setSubLocation('');
    setStatusFilter(''); setFilterByDay(true);
  }

  function saveEdit() {
    const prev = plannedIds.filter((id) => editSelection.has(id));
    const added = [...editSelection].filter((id) => !plannedIds.includes(id));
    const ids = [...prev, ...added];
    savePlanMutation.mutate(ids);
  }

  function toggleDoctor(id: number) {
    setEditSelection((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectArea(a: string) { setArea(a); setSubLocation(''); }

  const dayNav = (
    <div className="flex gap-1">
      {DAYS.map((d) => (
        <Link
          key={d}
          href={`/plan/${d.toLowerCase()}`}
          className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
            d.toLowerCase() === day
              ? 'bg-accent text-on-accent'
              : 'bg-surface-2 text-muted hover:text-content'
          }`}
        >
          {d}
        </Link>
      ))}
    </div>
  );

  // ─── VIEW MODE ───────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="min-h-screen bg-base pb-28">
        {/* Header */}
        <div className="bg-surface border-b border-line px-4 py-3 pr-14">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-content">{dayLabel} Plan</h1>
              <p className="text-xs text-muted">
                {plannedDoctors.length} doctor{plannedDoctors.length !== 1 ? 's' : ''} planned
              </p>
            </div>
            {dayNav}
          </div>
        </div>

        <div className="px-3 py-3 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-surface rounded-xl h-16 animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && plannedDoctors.length === 0 && (
            <div className="text-center py-20 text-muted">
              <p className="text-5xl mb-4">📋</p>
              <p className="font-semibold text-content text-base">No plan for {dayLabel}</p>
              <p className="text-sm mt-1">Tap "Edit Plan" to select doctors to visit</p>
            </div>
          )}

          {plannedDoctors.map((doctor, idx) => {
            const status = getDoctorStatus(doctor);
            const color = STATUS_COLORS[status];
            const monthStatus = getCurrentMonthStatus(doctor);
            const lastVisit = getLastVisit(doctor);
            const isPending = visitMutation.isPending && visitMutation.variables === doctor.id;

            return (
              <div
                key={doctor.id}
                className="bg-surface border border-line rounded-xl p-3 flex items-center gap-3"
                style={isDeal(doctor) ? { borderColor: 'rgba(245,158,11,0.3)' } : {}}
              >
                {/* Stop number */}
                <div className="w-7 h-7 rounded-full bg-surface-2 border border-line flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-muted">{idx + 1}</span>
                </div>

                {/* Status dot */}
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

                {/* Info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setModalDoctor(doctor)}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-content truncate">{doctor.name}</p>
                    {isDeal(doctor) && <span className="text-xs text-amber-400">⭐</span>}
                  </div>
                  <p className="text-xs text-muted truncate">
                    {doctor.specialty} · {doctor.location || doctor.area}
                    {lastVisit && ` · ${Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))}d ago`}
                  </p>
                </div>

                {/* Month badge + visit button */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                    style={{
                      color: monthStatus === 'twice' ? '#00A550' : monthStatus === 'once' ? '#FFD700' : 'rgb(var(--c-subtle))',
                      background: monthStatus === 'twice' ? 'rgba(0,165,80,0.15)' : monthStatus === 'once' ? 'rgba(255,215,0,0.1)' : 'rgb(var(--c-surface-2))',
                    }}
                  >
                    {monthStatus === 'twice' ? `✓✓ ${monthName}` : monthStatus === 'once' ? `✓ ${monthName}` : `— ${monthName}`}
                  </span>
                  {monthStatus !== 'twice' && (
                    <button
                      onClick={() => visitMutation.mutate(doctor.id)}
                      disabled={isPending}
                      className="text-[10px] bg-accent/20 text-accent border border-accent/30 px-2 py-1 rounded-lg font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {isPending ? '...' : '✓ Visit'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Plan FAB */}
        <div className="fixed bottom-[72px] right-4 z-40">
          <button
            onClick={enterEdit}
            className="bg-accent text-on-accent font-bold px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm active:scale-95 transition-transform"
          >
            ✏️ Edit Plan
          </button>
        </div>

        {modalDoctor && (
          <DoctorModal doctor={modalDoctor} onClose={() => setModalDoctor(null)} />
        )}
      </div>
    );
  }

  // ─── EDIT / SELECTION MODE ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base pb-36">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-base/95 backdrop-blur border-b border-line px-4 pt-4 pb-3 pr-14">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-content">Select for {dayLabel}</h1>
            <p className="text-xs text-muted">
              {editSelection.size === 0
                ? 'Tap doctors to add to plan'
                : `${editSelection.size} doctor${editSelection.size !== 1 ? 's' : ''} selected`}
            </p>
          </div>
          <button
            onClick={cancelEdit}
            className="text-xs text-muted hover:text-content border border-line rounded-lg px-3 py-1.5 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Status + Day-filter row */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {/* Day toggle */}
          <button
            onClick={() => setFilterByDay((v) => !v)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              filterByDay
                ? 'bg-accent/15 text-accent border-accent/40'
                : 'text-muted border-line'
            }`}
          >
            📆 {dayLabel} only
          </button>

          {/* Divider */}
          <span className="flex-shrink-0 w-px bg-line self-stretch mx-0.5" />

          {/* All statuses */}
          <button
            onClick={() => setStatusFilter('')}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === '' ? 'bg-accent/15 text-accent border-accent/40' : 'text-muted border-line'
            }`}
          >
            All
          </button>

          {[
            { value: 'NEED_VISIT',    label: '🟠 Need' },
            { value: 'NEVER',         label: '🔴 Never' },
            { value: 'CURRENT_MONTH', label: `🟢 ${monthName}` },
            { value: 'DEAL',          label: '⭐ Deal' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(statusFilter === tab.value ? '' : tab.value)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === tab.value
                  ? 'bg-accent/15 text-accent border-accent/40'
                  : 'text-muted border-line'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
              area === '' ? 'bg-accent/15 text-accent border-accent/40' : 'text-muted border-line'
            }`}
          >
            All Areas
          </button>
          {AREAS.map((a) => (
            <button
              key={a}
              onClick={() => selectArea(area === a ? '' : a)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                area === a ? 'bg-accent/15 text-accent border-accent/40' : 'text-muted border-line'
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
                subLocation === '' ? 'bg-violet-500/20 text-violet-500 border-violet-500/40' : 'text-muted border-line'
              }`}
            >
              All of {area}
            </button>
            {subLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => setSubLocation(subLocation === loc ? '' : loc)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  subLocation === loc ? 'bg-violet-500/20 text-violet-500 border-violet-500/40' : 'text-muted border-line'
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
        {filteredDoctors.length === 0 && (
          <div className="text-center text-muted py-12 text-sm">No doctors found</div>
        )}

        {filteredDoctors.map((doctor) => {
          const isSelected = editSelection.has(doctor.id);
          const statusColor = STATUS_COLORS[getDoctorStatus(doctor)];
          const location = doctor.location?.trim() || doctor.area;
          const monthStatus = getCurrentMonthStatus(doctor);

          return (
            <div
              key={doctor.id}
              onClick={() => toggleDoctor(doctor.id)}
              className={`rounded-xl border p-3 cursor-pointer transition-all active:scale-[0.98] ${
                isSelected ? 'bg-accent/8 border-accent/50' : 'bg-surface border-line hover:border-subtle'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox */}
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
                    {doctor.class && <span className="text-[10px] text-subtle uppercase">{doctor.class}</span>}
                  </div>
                  <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{location}</span>
                    {doctor.area && location !== doctor.area && (
                      <span className="text-subtle flex-shrink-0">· {doctor.area}</span>
                    )}
                  </div>
                </div>

                {/* Month badge */}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    color: monthStatus === 'twice' ? '#00A550' : monthStatus === 'once' ? '#FFD700' : 'rgb(var(--c-subtle))',
                    background: monthStatus === 'twice' ? 'rgba(0,165,80,0.15)' : monthStatus === 'once' ? 'rgba(255,215,0,0.1)' : 'transparent',
                  }}
                >
                  {monthStatus === 'twice' ? '✓✓' : monthStatus === 'once' ? '✓' : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      <div className="fixed bottom-[56px] left-0 right-0 z-40 px-4 pb-3 pt-2 bg-gradient-to-t from-base via-base to-transparent">
        <button
          onClick={saveEdit}
          disabled={savePlanMutation.isPending}
          className="w-full bg-accent text-on-accent font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg disabled:opacity-60"
        >
          {savePlanMutation.isPending ? 'Saving...' : `✓ Save Plan for ${dayLabel}`}
          {editSelection.size > 0 && !savePlanMutation.isPending && (
            <span className="bg-black/20 rounded-full px-2 py-0.5 text-xs">
              {editSelection.size} doctor{editSelection.size !== 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
