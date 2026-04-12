'use client';
import { useState } from 'react';
import { AREAS, DAYS } from '@/lib/utils';

export interface Filters {
  search: string;
  status: string;
  day: string;
  area: string;
  hideF: boolean;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'RECENT', label: '🟢 Apr' },
  { value: 'NEVER', label: '🔴 Never' },
  { value: 'NEED_VISIT', label: '🟠 Need' },
];

const DAY_TABS = DAYS.map((d) => ({ value: d, label: d }));

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [showDays, setShowDays] = useState(false);

  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

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

      {/* Status tabs + area + hideF */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => set({ status: tab.value, day: '' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filters.status === tab.value && !filters.day
                ? 'bg-accent text-on-accent'
                : 'bg-surface text-muted hover:text-content border border-line'
            }`}
          >
            {tab.label}
          </button>
        ))}

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

        {/* Area dropdown */}
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

      {/* Day tabs */}
      {showDays && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => { set({ day: '', status: '' }); setShowDays(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border ${
              !filters.day ? 'bg-accent text-on-accent border-accent' : 'bg-surface text-muted border-line'
            }`}
          >
            All
          </button>
          {DAY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { set({ day: tab.value, status: '' }); setShowDays(false); }}
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
