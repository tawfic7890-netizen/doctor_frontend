'use client';
import { useState } from 'react';
import { AREAS, DAYS, getCurrentMonthName } from '@/lib/utils';

export interface Filters {
  search: string;
  statuses: string[];   // multi-select: 'NEVER' | 'NEED_VISIT' | 'CURRENT_MONTH' | 'DEAL'
  day: string;
  area: string;
  hideF: boolean;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const STATUS_TABS = [
  { value: 'CURRENT_MONTH', label: `🟢 ${getCurrentMonthName()}` },
  { value: 'NEVER',         label: '🔴 Never' },
  { value: 'NEED_VISIT',    label: '🟠 Need' },
  { value: 'DEAL',          label: '⭐ Deal' },
];

const DAY_TABS = DAYS.map((d) => ({ value: d, label: d }));

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [showDays, setShowDays] = useState(false);

  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  function toggleStatus(value: string) {
    const has = filters.statuses.includes(value);
    set({ statuses: has ? filters.statuses.filter((s) => s !== value) : [...filters.statuses, value] });
  }

  function clearStatuses() {
    set({ statuses: [] });
  }

  return (
    <div className="bg-base sticky top-0 z-40 border-b border-line px-3 py-2 space-y-2">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">🔍</span>
        <input
          type="text"
          placeholder="Search name, specialty, area, phone..."
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="w-full bg-surface border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-content placeholder-muted focus:outline-none focus:border-accent"
        />
        {filters.search && (
          <button
            onClick={() => set({ search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-content"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status tabs (multi-select) + day + hideF + area */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {/* All = clear */}
        <button
          onClick={clearStatuses}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                active
                  ? 'bg-accent text-on-accent border-accent'
                  : 'bg-surface text-muted hover:text-content border-line'
              }`}
            >
              {tab.label}
              {active && filters.statuses.length > 1 && (
                <span className="ml-1 opacity-60">✓</span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => setShowDays((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
            filters.day
              ? 'bg-accent text-on-accent border-accent'
              : 'bg-surface text-muted hover:text-content border-line'
          }`}
        >
          {filters.day ? filters.day : '📆 Days'}
        </button>

        <button
          onClick={() => set({ hideF: !filters.hideF })}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
            !filters.hideF
              ? 'bg-surface-2 text-content border-subtle'
              : 'bg-surface text-muted hover:text-content border-line'
          }`}
        >
          {filters.hideF ? '👁 Show F' : '🙈 Hide F'}
        </button>

        <select
          value={filters.area}
          onChange={(e) => set({ area: e.target.value })}
          className="bg-surface border border-line text-xs text-content rounded-lg px-2 py-1.5 focus:outline-none focus:border-accent min-w-[90px]"
        >
          <option value="">All Areas</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Active filter summary */}
      {filters.statuses.length > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted">Showing:</span>
          {filters.statuses.map((s) => {
            const tab = STATUS_TABS.find((t) => t.value === s);
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className="text-[10px] bg-accent/15 text-accent border border-accent/30 rounded-full px-2 py-0.5 flex items-center gap-1"
              >
                {tab?.label} <span className="opacity-60">✕</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Day tabs */}
      {showDays && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => { set({ day: '' }); setShowDays(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border ${
              !filters.day ? 'bg-accent text-on-accent border-accent' : 'bg-surface text-muted border-line'
            }`}
          >
            All
          </button>
          {DAY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { set({ day: tab.value }); setShowDays(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border ${
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
