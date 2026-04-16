'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DoctorCard from '@/components/DoctorCard';
import DoctorModal from '@/components/DoctorModal';
import { api } from '@/lib/api';
import { Doctor, getCurrentMonthStatus, getCurrentMonthName, formatMonthYear, todayStr } from '@/lib/utils';

type TabFilter = 'all' | 'once' | 'twice' | 'none';

/* ── Icons ────────────────────────────────────────────────────────────── */
const IconCalendar = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconSearch = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconEmpty = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

export default function TrackerPage() {
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [tab, setTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');

  const monthName  = getCurrentMonthName();
  const monthYear  = formatMonthYear(todayStr()); // e.g. "April 2026"

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors', { hideF: false }],
    queryFn: () => api.doctors.list({ hideF: false }),
  });

  const filtered = doctors.filter((d) => {
    // F-class colleagues: show only if they have at least one visit this month
    if (d.class?.toLowerCase() === 'f' && getCurrentMonthStatus(d) === 'none') return false;

    const status = getCurrentMonthStatus(d);
    if (tab === 'once'  && status !== 'once')  return false;
    if (tab === 'twice' && status !== 'twice') return false;
    if (tab === 'none'  && status !== 'none')  return false;

    if (search) {
      const s = search.toLowerCase();
      return (
        d.name?.toLowerCase().includes(s) ||
        d.specialty?.toLowerCase().includes(s) ||
        d.area?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const counts = {
    all:   doctors.filter((d) => !(d.class?.toLowerCase() === 'f' && getCurrentMonthStatus(d) === 'none')).length,
    twice: doctors.filter((d) => getCurrentMonthStatus(d) === 'twice').length,
    once:  doctors.filter((d) => getCurrentMonthStatus(d) === 'once').length,
    none:  doctors.filter((d) => getCurrentMonthStatus(d) === 'none' && d.class?.toLowerCase() !== 'f').length,
  };

  const progress = Math.round(((counts.twice + counts.once) / (counts.all || 1)) * 100);

  type TabDef = { key: TabFilter; label: string; count: number; tone: 'accent' | 'success' | 'warning' | 'danger' };
  const tabs: TabDef[] = [
    { key: 'all',   label: 'All',    count: counts.all,   tone: 'accent'  },
    { key: 'twice', label: '✓✓ Twice', count: counts.twice, tone: 'success' },
    { key: 'once',  label: '✓ Once',   count: counts.once,  tone: 'warning' },
    { key: 'none',  label: '— None',   count: counts.none,  tone: 'danger'  },
  ];

  const toneStyle = (tone: TabDef['tone'], active: boolean): React.CSSProperties => {
    if (!active) return {};
    const map = {
      accent:  'rgb(var(--c-accent))',
      success: 'rgb(var(--c-success))',
      warning: 'rgb(var(--c-warning))',
      danger:  'rgb(var(--c-danger))',
    } as const;
    return {
      background: map[tone],
      color: tone === 'warning' ? 'rgb(10 18 32)' : 'rgb(var(--c-on-accent))',
      borderColor: map[tone],
      boxShadow: `0 4px 14px -4px ${map[tone].replace('rgb(', 'rgba(').replace(')', ' / 0.5)')}`,
    };
  };

  return (
    <div className="min-h-screen bg-base">
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
          <div className="flex items-center gap-3">
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
              <h1 className="text-xl font-bold text-content tracking-tight">
                {monthYear} <span className="text-muted font-semibold">Tracker</span>
              </h1>
              <p className="text-xs text-muted mt-0.5 tabular">
                <span className="font-semibold" style={{ color: 'rgb(var(--c-success))' }}>{counts.twice}</span> twice ·{' '}
                <span className="font-semibold" style={{ color: 'rgb(var(--c-warning))' }}>{counts.once}</span> once ·{' '}
                <span className="font-semibold" style={{ color: 'rgb(var(--c-danger))' }}>{counts.none}</span> not visited
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-muted mb-2">
              <span>
                <span className="tabular font-semibold text-content">{counts.twice + counts.once}</span> visited in {monthName}
              </span>
              <span className="tabular font-semibold text-content">{progress}%</span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden border border-line">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, rgb(var(--c-warning)) 0%, rgb(var(--c-success)) 100%)',
                  boxShadow: '0 0 12px rgb(var(--c-success) / 0.45)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky filters */}
      <div className="sticky top-0 z-40 glass border-b border-line px-3 py-2.5 space-y-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Search doctors, specialty, area…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-line rounded-lg pl-10 pr-3 py-2 text-sm text-content placeholder-muted focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  active ? 'border-transparent' : 'bg-surface text-muted border-line hover:text-content hover:border-line-2'
                }`}
                style={toneStyle(t.tone, active)}
              >
                <span>{t.label}</span>
                <span className={`tabular rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-black/20' : 'bg-surface-2 text-subtle'}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-3 space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton rounded-2xl h-[78px]" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted">
            <div className="w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center mx-auto mb-3 text-subtle">
              <IconEmpty />
            </div>
            <p className="font-medium text-content">No doctors match this filter</p>
            <p className="text-xs mt-1">Try a different tab or search</p>
          </div>
        )}

        {filtered.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} onClick={() => setSelected(doctor)} />
        ))}
      </div>

      {selected && (
        <DoctorModal doctor={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
