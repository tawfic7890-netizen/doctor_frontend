'use client';
import { useState } from 'react';
import { AREAS, DAYS, getCurrentMonthName } from '@/lib/utils';

export interface Filters {
  search: string;
  statuses: string[];
  day: string;
  area: string;
  hideF: boolean;
  needVisitRanges: string[];
}

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const STATUS_TABS = [
  { value: 'CURRENT_MONTH', label: getCurrentMonthName(), dot: '#22c55e' },
  { value: 'NEVER',         label: 'Never',               dot: '#f87171' },
  { value: 'NEED_VISIT',    label: 'Need Visit',           dot: '#fb923c' },
  { value: 'DEAL',          label: 'Deal',                 dot: '#f59e0b' },
];

const DAY_TABS = DAYS.map((d) => ({ value: d, label: d }));

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [showDays, setShowDays] = useState(false);
  const [needVisitOpen, setNeedVisitOpen] = useState(false);

  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  function toggleStatus(value: string) {
    if (value === 'NEED_VISIT') {
      if (needVisitOpen) {
        // close: remove NEED_VISIT and clear ranges
        setNeedVisitOpen(false);
        set({ statuses: filters.statuses.filter((s) => s !== 'NEED_VISIT'), needVisitRanges: [] });
      } else {
        // open: add NEED_VISIT if not already there
        setNeedVisitOpen(true);
        if (!filters.statuses.includes('NEED_VISIT')) {
          set({ statuses: [...filters.statuses, 'NEED_VISIT'] });
        }
      }
      return;
    }
    const has = filters.statuses.includes(value);
    set({ statuses: has ? filters.statuses.filter((s) => s !== value) : [...filters.statuses, value] });
  }

  function toggleNeedVisitRange(range: string) {
    const has = filters.needVisitRanges.includes(range);
    set({ needVisitRanges: has ? filters.needVisitRanges.filter((r) => r !== range) : [...filters.needVisitRanges, range] });
  }

  return (
    <div className="bg-base sticky top-0 z-40 border-b border-line px-3 py-2 space-y-2">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search name, specialty, area, phone…"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="w-full bg-surface border border-line rounded-xl pl-8 pr-8 py-2 text-sm text-content placeholder-subtle focus:outline-none focus:border-accent transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => set({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-content transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Filter pills row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {/* All */}
        <button
          onClick={() => { setNeedVisitOpen(false); set({ statuses: [], needVisitRanges: [] }); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
            filters.statuses.length === 0
              ? 'bg-accent text-on-accent border-accent'
              : 'bg-surface text-muted hover:text-content border-line'
          }`}
        >
          All
        </button>

        {STATUS_TABS.map((tab) => {
          const active = filters.statuses.includes(tab.value);
          return (
            <button
              key={tab.value}
              onClick={() => toggleStatus(tab.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
                active
                  ? 'bg-accent text-on-accent border-accent'
                  : 'bg-surface text-muted hover:text-content border-line'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: active ? 'currentColor' : tab.dot, opacity: active ? 0.6 : 1 }}
              />
              {tab.label}
            </button>
          );
        })}

        {/* Days toggle */}
        <button
          onClick={() => setShowDays((v) => !v)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
            filters.day
              ? 'bg-accent text-on-accent border-accent'
              : 'bg-surface text-muted hover:text-content border-line'
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {filters.day || 'Days'}
        </button>

        {/* Hide/show F */}
        <button
          onClick={() => set({ hideF: !filters.hideF })}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
            !filters.hideF
              ? 'bg-surface-2 text-content border-subtle'
              : 'bg-surface text-muted hover:text-content border-line'
          }`}
        >
          {filters.hideF ? 'Show F' : 'Hide F'}
        </button>

        {/* Area select */}
        <select
          value={filters.area}
          onChange={(e) => set({ area: e.target.value })}
          className="flex-shrink-0 bg-surface border border-line text-xs text-content rounded-full px-3 py-1.5 focus:outline-none focus:border-accent min-w-[95px] cursor-pointer"
        >
          <option value="">All Areas</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Need Visit range sub-row */}
      {needVisitOpen && (
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {([
            { range: '12_20',   label: '12–20 days' },
            { range: '20_30',   label: '20–30 days' },
            { range: '30_PLUS', label: '30+ days' },
          ] as const).map(({ range, label }) => {
            const active = filters.needVisitRanges.includes(range);
            return (
              <button
                key={range}
                onClick={() => toggleNeedVisitRange(range)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  active ? 'border-transparent text-on-accent' : 'bg-surface text-muted border-line hover:border-line-2'
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

      {/* Active multi-filter chips */}
      {filters.statuses.length > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-subtle">Active:</span>
          {filters.statuses.map((s) => {
            const tab = STATUS_TABS.find((t) => t.value === s);
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className="text-[10px] bg-accent/10 text-accent border border-accent/25 rounded-full px-2 py-0.5 flex items-center gap-1 transition-colors hover:bg-accent/20"
              >
                {tab?.label}
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            );
          })}
        </div>
      )}

      {/* Day tabs */}
      {showDays && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => { set({ day: '' }); setShowDays(false); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              !filters.day ? 'bg-accent text-on-accent border-accent' : 'bg-surface text-muted border-line'
            }`}
          >
            All
          </button>
          {DAY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { set({ day: tab.value }); setShowDays(false); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filters.day === tab.value
                  ? 'bg-accent text-on-accent border-accent'
                  : 'bg-surface text-muted border-line hover:text-content'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
