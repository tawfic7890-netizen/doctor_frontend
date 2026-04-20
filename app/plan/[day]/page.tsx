'use client';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Doctor, getDoctorStatus, STATUS_COLORS,
  getCurrentMonthStatus, getCurrentMonthName,
  getLastVisit, daysSince, AREAS,
  todayStr, getWeekDates, dateToDayAbbrev,
  formatFullDate, formatNavDate, shiftWeek,
} from '@/lib/utils';
import { getClassDef } from '@/lib/classConfig';
import DoctorModal from '@/components/DoctorModal';
import Link from 'next/link';

/* ── Icons ────────────────────────────────────────────────────────────── */
const IconCalendar = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconEdit = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconCompass = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);
const IconPin = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconCheck = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconSearch = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconChevronLeft = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconChevronRight = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function avatarGradient(name: string, isDeal: boolean): string {
  if (isDeal) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  const gradients = [
    'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
    'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return gradients[hash % gradients.length];
}

interface Props { params: { day: string } }

export default function DailyPlanPage({ params }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Resolve 'today' → actual date string
  const dateStr = params.day === 'today' ? todayStr() : params.day;

  const [modalDoctor, setModalDoctor] = useState<Doctor | null>(null);
  const [editing, setEditing] = useState(false);
  const [plannedIds, setPlannedIds] = useState<number[]>([]);
  const [editSelection, setEditSelection] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [subLocation, setSubLocation] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [needVisitOpen, setNeedVisitOpen] = useState(false);
  const [needVisitRanges, setNeedVisitRanges] = useState<Set<string>>(new Set());
  const [filterByDay, setFilterByDay] = useState(true);

  const monthName   = getCurrentMonthName();
  const dayAbbrev   = dateToDayAbbrev(dateStr);   // e.g. 'Thu'
  const fullDate    = formatFullDate(dateStr);     // e.g. 'Thursday, 16 Apr 2026'
  const weekDates   = getWeekDates(dateStr);       // Mon–Sat of this week
  const today       = todayStr();

  // ── Load plan ──────────────────────────────────────────────────────────────
  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: ['plan', dateStr],
    queryFn: () => api.plans.get(dateStr),
  });

  useEffect(() => {
    if (planData) setPlannedIds((planData.doctor_ids ?? []).map(Number));
  }, [planData]);

  // Reset edit state when navigating to a different date
  useEffect(() => {
    setEditing(false);
    setSearch(''); setArea(''); setSubLocation('');
    setStatusFilter(''); setNeedVisitOpen(false); setNeedVisitRanges(new Set()); setFilterByDay(true);
  }, [dateStr]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const savePlanMutation = useMutation({
    mutationFn: (ids: number[]) => api.plans.set(dateStr, ids),
    onSuccess: (saved) => {
      setPlannedIds((saved.doctor_ids ?? []).map(Number));
      queryClient.invalidateQueries({ queryKey: ['plan', dateStr] });
      setEditing(false);
      setSearch(''); setArea(''); setSubLocation('');
      setStatusFilter(''); setNeedVisitOpen(false); setNeedVisitRanges(new Set()); setFilterByDay(true);
    },
    onError: (err: Error) => alert(`Failed to save plan: ${err.message}`),
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

  // ── Derived data ───────────────────────────────────────────────────────────
  const plannedDoctors = useMemo(
    () => plannedIds.map((id) => allDoctors.find((d) => d.id === id)).filter(Boolean) as Doctor[],
    [plannedIds, allDoctors],
  );

  const subLocations = useMemo(() => {
    if (!area) return [];
    const locs = allDoctors
      .filter((d) => d.area === area && d.class?.toLowerCase() !== 'f' && d.location?.trim())
      .map((d) => d.location.trim());
    return Array.from(new Set(locs)).sort();
  }, [allDoctors, area]);

  const filteredDoctors = useMemo(() => allDoctors.filter((d) => {
    if (d.class?.toLowerCase() === 'f') return false;
    if (filterByDay) {
      const hasDays = Array.isArray(d.days) && d.days.length > 0;
      if (hasDays && !d.days.includes(dayAbbrev)) return false;
    }

    if (needVisitOpen) {
      const last = getLastVisit(d);
      const days = last ? (Date.now() - last.getTime()) / 86400000 : null;
      if (days === null || days <= 12) return false; // must be NEED_VISIT
      if (needVisitRanges.size > 0) {
        let match = false;
        if (needVisitRanges.has('12_20')   && days > 12 && days <= 20) match = true;
        if (needVisitRanges.has('20_30')   && days > 20 && days <= 30) match = true;
        if (needVisitRanges.has('30_PLUS') && days > 30)               match = true;
        if (!match) return false;
      }
    } else if (statusFilter) {
      if (statusFilter === 'CURRENT_MONTH') {
        if (getCurrentMonthStatus(d) === 'none') return false;
      } else {
        if (getDoctorStatus(d) !== statusFilter) return false;
      }
    }

    if (area && d.area !== area) return false;
    if (subLocation && d.location?.trim() !== subLocation) return false;
    if (search) {
      const s = search.toLowerCase();
      return d.name.toLowerCase().includes(s) ||
             d.location?.toLowerCase().includes(s) ||
             d.area?.toLowerCase().includes(s);
    }
    return true;
  }), [allDoctors, area, subLocation, search, statusFilter, needVisitOpen, needVisitRanges, filterByDay, dayAbbrev]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function enterEdit() { setEditSelection(new Set(plannedIds)); setEditing(true); }
  function cancelEdit() {
    setEditing(false); setSearch(''); setArea(''); setSubLocation('');
    setStatusFilter(''); setNeedVisitOpen(false); setNeedVisitRanges(new Set()); setFilterByDay(true);
  }

  function toggleNeedVisitRange(range: string) {
    setNeedVisitRanges((prev) => {
      const next = new Set(prev);
      next.has(range) ? next.delete(range) : next.add(range);
      return next;
    });
  }
  function saveEdit() {
    const prev  = plannedIds.filter((id) => editSelection.has(id));
    const added = Array.from(editSelection).filter((id) => !plannedIds.includes(id));
    savePlanMutation.mutate([...prev, ...added]);
  }
  function toggleDoctor(id: number) {
    setEditSelection((prev) => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
    });
  }
  function selectArea(a: string) { setArea(a); setSubLocation(''); }

  // ── Week navigation bar ────────────────────────────────────────────────────
  const weekNav = (
    <div className="flex gap-1.5 overflow-x-auto items-center" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => router.push(`/plan/${shiftWeek(dateStr, -1)}`)}
        className="flex-shrink-0 w-8 h-10 rounded-lg text-muted hover:text-content bg-surface border border-line hover:border-line-2 transition-colors flex items-center justify-center"
        title="Previous week"
        aria-label="Previous week"
      ><IconChevronLeft /></button>

      {weekDates.map((d) => {
        const { day, num } = formatNavDate(d);
        const isActive = d === dateStr;
        const isToday  = d === today;
        return (
          <Link
            key={d}
            href={`/plan/${d}`}
            className={`flex-shrink-0 flex flex-col items-center justify-center px-2.5 h-10 rounded-lg text-[10px] font-semibold transition-all min-w-[38px] border ${
              isActive
                ? 'border-transparent text-on-accent'
                : isToday
                ? 'bg-accent/12 text-accent border-accent/35 hover:bg-accent/20'
                : 'bg-surface text-muted border-line hover:text-content hover:border-line-2'
            }`}
            style={isActive ? {
              background: 'linear-gradient(180deg, rgb(var(--c-accent)), rgb(var(--c-accent) / 0.88))',
              boxShadow: '0 4px 12px -2px rgb(var(--c-accent) / 0.45)',
            } : {}}
          >
            <span className="opacity-80">{day}</span>
            <span className="font-bold tabular leading-none mt-0.5">{num}</span>
          </Link>
        );
      })}

      <button
        onClick={() => router.push(`/plan/${shiftWeek(dateStr, 1)}`)}
        className="flex-shrink-0 w-8 h-10 rounded-lg text-muted hover:text-content bg-surface border border-line hover:border-line-2 transition-colors flex items-center justify-center"
        title="Next week"
        aria-label="Next week"
      ><IconChevronRight /></button>

      {dateStr !== today && (
        <Link
          href={`/plan/${today}`}
          className="flex-shrink-0 px-3 h-10 text-[10px] rounded-lg bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors font-bold uppercase tracking-wider flex items-center"
        >
          Today
        </Link>
      )}
    </div>
  );

  const monthBadge = (monthStatus: 'none' | 'once' | 'twice', short = false) => {
    const cfg = monthStatus === 'twice'
      ? { color: 'rgb(var(--c-success))', bg: 'rgb(var(--c-success) / 0.15)', label: short ? '✓✓' : `✓✓ ${monthName}` }
      : monthStatus === 'once'
      ? { color: 'rgb(var(--c-warning))', bg: 'rgb(var(--c-warning) / 0.12)', label: short ? '✓' : `✓ ${monthName}` }
      : { color: 'rgb(var(--c-subtle))',  bg: 'rgb(var(--c-surface-2))',       label: short ? '—' : `— ${monthName}` };
    return (
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap tabular"
        style={{ color: cfg.color, background: cfg.bg }}
      >
        {cfg.label}
      </span>
    );
  };

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="min-h-screen bg-base pb-28">
        {/* Hero header */}
        <div className="relative overflow-hidden border-b border-line">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at top right, rgb(var(--c-accent) / 0.14) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgb(var(--c-accent-2) / 0.10) 0%, transparent 50%)',
            }}
          />
          <div className="relative px-4 py-4 pl-14 pr-14">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-on-accent"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-2)))',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <IconCalendar size={16} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-content tracking-tight truncate">{fullDate}</h1>
                <p className="text-xs text-muted mt-0.5">
                  <span className="tabular font-semibold text-content">{plannedDoctors.length}</span>{' '}
                  doctor{plannedDoctors.length !== 1 ? 's' : ''} planned
                </p>
              </div>
            </div>
            {weekNav}
          </div>
        </div>

        <div className="px-3 py-3 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton rounded-2xl h-[68px]" />
              ))}
            </div>
          )}

          {!isLoading && plannedDoctors.length === 0 && (
            <div className="text-center py-20 text-muted">
              <div className="w-14 h-14 rounded-2xl bg-surface border border-line flex items-center justify-center mx-auto mb-4 text-subtle">
                <IconCalendar size={26} />
              </div>
              <p className="font-semibold text-content text-base">No plan yet for this day</p>
              <p className="text-sm mt-1">Tap <span className="text-accent font-semibold">Edit Plan</span> to select doctors</p>
            </div>
          )}

          {plannedDoctors.map((doctor, idx) => {
            const status      = getDoctorStatus(doctor);
            const statusColor = STATUS_COLORS[status];
            const monthStatus = getCurrentMonthStatus(doctor);
            const lastVisit   = getLastVisit(doctor);
            const isPending   = visitMutation.isPending && visitMutation.variables === doctor.id;
            const isDeal      = status === 'DEAL';
            const classDef    = getClassDef(doctor.class);
            const classLabel  = isDeal ? 'DEAL' : classDef.label;
            const classColor  = isDeal ? '#f59e0b' : classDef.color;
            const initials    = getInitials(doctor.name);

            const badge = monthStatus === 'twice'
              ? { label: '✓✓', color: 'rgb(var(--c-success))', bg: 'rgb(var(--c-success) / 0.12)', border: 'rgb(var(--c-success) / 0.25)' }
              : monthStatus === 'once'
              ? { label: '✓',  color: 'rgb(var(--c-warning))', bg: 'rgb(var(--c-warning) / 0.12)', border: 'rgb(var(--c-warning) / 0.25)' }
              : { label: '—',  color: 'rgb(var(--c-subtle))',  bg: 'transparent',                  border: 'rgb(var(--c-line))' };

            return (
              <div
                key={doctor.id}
                className="doctor-card relative bg-surface border border-line rounded-2xl p-3.5 cursor-pointer active:scale-[0.99]"
                onClick={() => setModalDoctor(doctor)}
                style={isDeal ? {
                  borderColor: 'rgb(245 158 11 / 0.35)',
                  boxShadow: '0 0 0 1px rgb(245 158 11 / 0.12), 0 4px 12px -4px rgb(245 158 11 / 0.15)',
                } : {}}
              >
                {isDeal && (
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)' }} />
                )}

                <div className="flex items-start gap-3">
                  {/* Number + avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-sm tracking-wide"
                      style={{
                        background: avatarGradient(doctor.name, isDeal),
                        boxShadow: '0 2px 6px -1px rgb(0 0 0 / 0.25)',
                      }}
                    >
                      {initials}
                    </div>
                    {/* Order number */}
                    <div className="absolute -top-1.5 -left-1.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full bg-surface-2 border border-line flex items-center justify-center">
                      <span className="text-[9px] font-bold text-muted tabular leading-none px-0.5">{idx + 1}</span>
                    </div>
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                      style={{ backgroundColor: statusColor, borderColor: 'rgb(var(--c-surface))' }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-content leading-tight">{doctor.name}</span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
                        style={{ color: classColor, background: `${classColor}1a`, borderColor: `${classColor}44` }}
                      >
                        {classLabel}
                      </span>
                    </div>

                    <p className="text-xs text-muted mt-0.5 truncate">
                      {doctor.specialty}
                      {doctor.city && <span className="text-subtle"> · {doctor.city}</span>}
                      {doctor.location && <span className="text-subtle"> · {doctor.location}</span>}
                    </p>

                    {(doctor.phone || (doctor.days?.length > 0) || doctor.time || lastVisit) && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                        {doctor.phone && <span className="text-[11px] text-subtle tabular">{doctor.phone}</span>}
                        {doctor.days?.length > 0 && (
                          <>
                            {doctor.phone && <span className="text-[10px] text-subtle/60">·</span>}
                            <span className="text-[11px] text-subtle">{doctor.days.join(' · ')}</span>
                          </>
                        )}
                        {doctor.time && (
                          <><span className="text-[10px] text-subtle/60">·</span><span className="text-[11px] text-subtle">{doctor.time}</span></>
                        )}
                        {lastVisit && (
                          <><span className="text-[10px] text-subtle/60">·</span><span className="text-[11px] text-subtle">{daysSince(lastVisit.toISOString())}</span></>
                        )}
                      </div>
                    )}

                    {doctor.request && (
                      <span
                        className="inline-block mt-1.5 text-[10px] rounded-md px-2 py-0.5 max-w-[200px] truncate border"
                        style={{ color: 'rgb(var(--c-accent))', background: 'rgb(var(--c-accent) / 0.08)', borderColor: 'rgb(var(--c-accent) / 0.20)' }}
                      >
                        {doctor.request}
                      </span>
                    )}

                    {doctor.note && (
                      <p className="text-[11px] text-amber-400/70 mt-1.5 leading-snug line-clamp-1">{doctor.note}</p>
                    )}
                  </div>

                  {/* Month badge + Visit button */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 ml-1">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center border tabular font-bold text-base"
                      style={{ color: badge.color, background: badge.bg, borderColor: badge.border }}
                    >
                      {badge.label}
                    </div>
                    <span className="text-[8px] text-subtle uppercase tracking-widest font-semibold">{getCurrentMonthName()}</span>
                    {monthStatus !== 'twice' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); visitMutation.mutate(doctor.id); }}
                        disabled={isPending}
                        className="mt-1 text-[10px] bg-accent/15 text-accent border border-accent/30 px-2.5 py-1 rounded-lg font-semibold hover:bg-accent/25 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {isPending ? '…' : 'Visit'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FABs */}
        <div className="fixed bottom-[72px] right-4 z-40 flex flex-col gap-2 items-end">
          {plannedDoctors.length > 0 && (
            <Link
              href={`/trip?plan=${dateStr}`}
              className="glass text-muted hover:text-accent font-semibold px-4 py-2.5 rounded-full flex items-center gap-2 text-sm active:scale-95 transition-all hover:border-accent/50"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <IconCompass />
              Trip
            </Link>
          )}
          <button
            onClick={enterEdit}
            className="btn-primary font-bold px-5 py-3 rounded-full flex items-center gap-2 text-sm active:scale-95 transition-transform"
          >
            <IconEdit />
            Edit Plan
          </button>
        </div>

        {modalDoctor && <DoctorModal doctor={modalDoctor} onClose={() => setModalDoctor(null)} />}
      </div>
    );
  }

  // ── EDIT / SELECTION MODE ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base pb-36">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 glass border-b border-line">
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at top right, rgb(var(--c-accent) / 0.12) 0%, transparent 55%)',
            }}
          />
          <div className="relative px-4 pt-4 pb-3 pl-14 pr-14">
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-on-accent"
                  style={{
                    background: 'linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-2)))',
                    boxShadow: 'var(--shadow-glow)',
                  }}
                >
                  <IconEdit />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-content tracking-tight truncate">{fullDate}</h1>
                  <p className="text-xs text-muted mt-0.5">
                    {editSelection.size === 0
                      ? 'Tap doctors to add to plan'
                      : (
                        <>
                          <span className="tabular font-semibold text-content">{editSelection.size}</span>{' '}
                          doctor{editSelection.size !== 1 ? 's' : ''} selected
                        </>
                      )}
                  </p>
                </div>
              </div>
              <button
                onClick={cancelEdit}
                className="flex-shrink-0 text-xs text-muted hover:text-content border border-line rounded-lg px-3 py-1.5 transition-colors hover:border-line-2"
              >
                Cancel
              </button>
            </div>

            {/* Status + day-filter row */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setFilterByDay((v) => !v)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
                  filterByDay ? 'bg-accent/15 text-accent border-accent/40' : 'bg-surface text-muted border-line hover:border-line-2'
                }`}
              >
                {dayAbbrev} only
              </button>
              <span className="flex-shrink-0 w-px bg-line self-stretch mx-0.5" />
              <button
                onClick={() => { setStatusFilter(''); setNeedVisitOpen(false); setNeedVisitRanges(new Set()); }}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  statusFilter === '' && !needVisitOpen ? 'bg-accent/15 text-accent border-accent/40' : 'bg-surface text-muted border-line hover:border-line-2'
                }`}
              >All</button>
              {/* Need Visit — toggles the range sub-row */}
              <button
                onClick={() => {
                  const opening = !needVisitOpen;
                  setNeedVisitOpen(opening);
                  setStatusFilter('');
                  if (!opening) setNeedVisitRanges(new Set());
                }}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  needVisitOpen
                    ? 'bg-accent/15 text-accent border-accent/40'
                    : 'bg-surface text-muted border-line hover:border-line-2'
                }`}
              >
                Need Visit
              </button>
              {[
                { value: 'NEVER',         label: 'Never' },
                { value: 'CURRENT_MONTH', label: monthName },
                { value: 'DEAL',          label: 'Deal' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { setNeedVisitOpen(false); setNeedVisitRanges(new Set()); setStatusFilter(statusFilter === tab.value ? '' : tab.value); }}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    statusFilter === tab.value
                      ? 'bg-accent/15 text-accent border-accent/40'
                      : 'bg-surface text-muted border-line hover:border-line-2'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Need Visit range pills (multi-select) — only visible when Need Visit is open */}
            {needVisitOpen && (
              <div className="flex gap-2 overflow-x-auto pb-1 pt-1" style={{ scrollbarWidth: 'none' }}>
                {([
                  { range: '12_20',   label: '12–20 days' },
                  { range: '20_30',   label: '20–30 days' },
                  { range: '30_PLUS', label: '30+ days' },
                ] as const).map(({ range, label }) => {
                  const active = needVisitRanges.has(range);
                  return (
                    <button
                      key={range}
                      onClick={() => toggleNeedVisitRange(range)}
                      className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                        active
                          ? 'border-transparent text-on-accent'
                          : 'bg-surface text-muted border-line hover:border-line-2'
                      }`}
                      style={active ? {
                        background: 'linear-gradient(135deg, rgb(var(--c-warning)), rgb(var(--c-warning) / 0.75))',
                        boxShadow: '0 4px 10px -2px rgb(var(--c-warning) / 0.45)',
                      } : {}}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div className="relative my-2">
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
        {filteredDoctors.length === 0 && (
          <div className="text-center py-16 text-muted">
            <div className="w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center mx-auto mb-3 text-subtle">
              <IconSearch size={18} />
            </div>
            <p className="font-medium text-content">No doctors found</p>
            <p className="text-xs mt-1">Try clearing a filter</p>
          </div>
        )}
        {filteredDoctors.map((doctor) => {
          const isSelected  = editSelection.has(doctor.id);
          const status      = getDoctorStatus(doctor);
          const statusColor = STATUS_COLORS[status];
          const monthStatus = getCurrentMonthStatus(doctor);
          const lastVisit   = getLastVisit(doctor);
          const isDeal      = status === 'DEAL';
          const classDef    = getClassDef(doctor.class);
          const classLabel  = isDeal ? 'DEAL' : classDef.label;
          const classColor  = isDeal ? '#f59e0b' : classDef.color;
          const initials    = getInitials(doctor.name);

          const badge = monthStatus === 'twice'
            ? { label: '✓✓', color: 'rgb(var(--c-success))', bg: 'rgb(var(--c-success) / 0.12)', border: 'rgb(var(--c-success) / 0.25)' }
            : monthStatus === 'once'
            ? { label: '✓',  color: 'rgb(var(--c-warning))', bg: 'rgb(var(--c-warning) / 0.12)', border: 'rgb(var(--c-warning) / 0.25)' }
            : { label: '—',  color: 'rgb(var(--c-subtle))',  bg: 'transparent',                  border: 'rgb(var(--c-line))' };

          return (
            <div
              key={doctor.id}
              onClick={() => toggleDoctor(doctor.id)}
              className={`doctor-card relative rounded-2xl border p-3.5 cursor-pointer active:scale-[0.99] transition-all ${
                isSelected ? 'bg-accent/8 border-accent/50' : 'bg-surface border-line hover:border-line-2'
              }`}
              style={{
                ...(isDeal && !isSelected ? {
                  borderColor: 'rgb(245 158 11 / 0.35)',
                  boxShadow: '0 0 0 1px rgb(245 158 11 / 0.12), 0 4px 12px -4px rgb(245 158 11 / 0.15)',
                } : {}),
                ...(isSelected ? { boxShadow: 'var(--shadow-md)' } : {}),
              }}
            >
              {isDeal && !isSelected && (
                <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)' }} />
              )}

              <div className="flex items-start gap-3">
                {/* Checkbox / avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-sm tracking-wide"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent) / 0.85))'
                        : avatarGradient(doctor.name, isDeal),
                      boxShadow: '0 2px 6px -1px rgb(0 0 0 / 0.25)',
                    }}
                  >
                    {isSelected ? <IconCheck size={18} /> : initials}
                  </div>
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                    style={{ backgroundColor: statusColor, borderColor: 'rgb(var(--c-surface))' }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-content leading-tight">{doctor.name}</span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
                      style={{ color: classColor, background: `${classColor}1a`, borderColor: `${classColor}44` }}
                    >
                      {classLabel}
                    </span>
                  </div>

                  <p className="text-xs text-muted mt-0.5 truncate">
                    {doctor.specialty}
                    {doctor.city && <span className="text-subtle"> · {doctor.city}</span>}
                    {doctor.location && <span className="text-subtle"> · {doctor.location}</span>}
                  </p>

                  {(doctor.phone || (doctor.days?.length > 0) || doctor.time || lastVisit) && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
                      {doctor.phone && <span className="text-[11px] text-subtle tabular">{doctor.phone}</span>}
                      {doctor.days?.length > 0 && (
                        <>
                          {doctor.phone && <span className="text-[10px] text-subtle/60">·</span>}
                          <span className="text-[11px] text-subtle">{doctor.days.join(' · ')}</span>
                        </>
                      )}
                      {doctor.time && (
                        <><span className="text-[10px] text-subtle/60">·</span><span className="text-[11px] text-subtle">{doctor.time}</span></>
                      )}
                      {lastVisit && (
                        <><span className="text-[10px] text-subtle/60">·</span><span className="text-[11px] text-subtle">{daysSince(lastVisit.toISOString())}</span></>
                      )}
                    </div>
                  )}

                  {doctor.request && (
                    <span
                      className="inline-block mt-1.5 text-[10px] rounded-md px-2 py-0.5 max-w-[200px] truncate border"
                      style={{ color: 'rgb(var(--c-accent))', background: 'rgb(var(--c-accent) / 0.08)', borderColor: 'rgb(var(--c-accent) / 0.20)' }}
                    >
                      {doctor.request}
                    </span>
                  )}

                  {doctor.note && (
                    <p className="text-[11px] text-amber-400/70 mt-1.5 leading-snug line-clamp-1">{doctor.note}</p>
                  )}
                </div>

                {/* Month badge */}
                <div className="flex-shrink-0 flex flex-col items-center gap-0.5 ml-1">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center border tabular font-bold text-base"
                    style={{ color: badge.color, background: badge.bg, borderColor: badge.border }}
                  >
                    {badge.label}
                  </div>
                  <span className="text-[8px] text-subtle uppercase tracking-widest font-semibold">{getCurrentMonthName()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      <div className="fixed bottom-[56px] left-0 right-0 z-40 px-4 pb-3 pt-6 bg-gradient-to-t from-base via-base/95 to-transparent pointer-events-none">
        <button
          onClick={saveEdit}
          disabled={savePlanMutation.isPending}
          className="btn-primary pointer-events-auto w-full font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-60"
        >
          {savePlanMutation.isPending ? 'Saving…' : 'Save Plan'}
          {editSelection.size > 0 && !savePlanMutation.isPending && (
            <span className="bg-black/25 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular">
              {editSelection.size} doctor{editSelection.size !== 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
