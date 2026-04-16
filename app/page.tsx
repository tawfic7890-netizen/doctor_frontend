'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import StatsCard from '@/components/StatsCard';
import { api } from '@/lib/api';
import { todayStr, getCurrentMonthName, formatMonthYear } from '@/lib/utils';

type ExportTab = 'day' | 'month' | 'all';

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// Inline icons for stats cards
const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

export default function Dashboard() {
  const [exportTab, setExportTab] = useState<ExportTab>('month');
  const [exportDate,  setExportDate]  = useState(todayStr());
  const [exportMonth, setExportMonth] = useState(todayStr().slice(0, 7));

  const monthName  = getCurrentMonthName();
  const monthYear  = formatMonthYear(todayStr());
  const today      = todayStr();
  const greeting   = timeGreeting();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.stats.get(),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['stats', 'history'],
    queryFn: () => api.stats.history(6),
  });

  const visitProgress = stats
    ? Math.round((stats.visitedThisMonth / (stats.totalActive || 1)) * 100)
    : 0;

  const exportUrl = () => {
    if (exportTab === 'day')   return api.visits.exportUrl({ date: exportDate });
    if (exportTab === 'month') return api.visits.exportUrl({ month: exportMonth });
    return api.visits.exportUrl();
  };

  const exportFilename = () => {
    if (exportTab === 'day')   return `visits-${exportDate}.csv`;
    if (exportTab === 'month') return `visits-${exportMonth}.csv`;
    return 'visits-all.csv';
  };

  const trendVs = (idx: number): 'up' | 'down' | 'flat' | null => {
    if (idx === 0 || !history[idx]) return null;
    const cur = history[idx].visited, prev = history[idx - 1].visited;
    if (cur > prev) return 'up';
    if (cur < prev) return 'down';
    return 'flat';
  };

  // Current month trend vs previous
  const currentTrend = history.length >= 2 ? trendVs(history.length - 1) : null;

  return (
    <div className="min-h-screen bg-base pb-8">

      {/* ═══ Hero Header ═══ */}
      <div className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgb(var(--c-accent) / 0.12) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgb(var(--c-accent-2) / 0.08) 0%, transparent 55%)',
          }}
        />
        <div className="relative px-5 pt-6 pb-5 pl-14 pr-14">
          <p className="text-xs text-muted font-medium">
            {greeting} · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-[26px] font-bold text-content tracking-tight mt-1">
            Tawfic Tracker
          </h1>
          <p className="text-sm text-muted mt-1">
            North Lebanon · Doctor Visit Manager
          </p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* ═══ Stats Grid ═══ */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton rounded-2xl h-24" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 gap-3 animate-fade-up">
            <StatsCard
              label="Total Doctors"
              value={stats.total}
              color="rgb(var(--c-accent))"
              icon={<IconUsers />}
            />
            <StatsCard
              label={`Visited ${monthName}`}
              value={stats.visitedThisMonth}
              color="rgb(var(--c-success))"
              sub={`${visitProgress}% of active`}
              icon={<IconCheck />}
              trend={currentTrend}
            />
            <StatsCard
              label="Never Visited"
              value={stats.neverVisited}
              color="rgb(var(--c-danger))"
              icon={<IconAlert />}
            />
            <StatsCard
              label="Need Visit"
              value={stats.needVisit}
              color="rgb(var(--c-warning))"
              icon={<IconClock />}
            />
          </div>
        )}

        {/* ═══ Monthly Progress Card ═══ */}
        {stats && (
          <div
            className="relative overflow-hidden rounded-2xl p-5 border border-line"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--c-surface)) 0%, rgb(var(--c-surface-2)) 100%)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgb(var(--c-accent)) 0%, transparent 70%)' }}
            />
            <div className="relative">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-[11px] font-bold text-subtle uppercase tracking-widest">Monthly Coverage</p>
                  <h3 className="text-xl font-bold text-content tracking-tight mt-0.5">{monthYear}</h3>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold tabular text-gradient-accent tracking-tight leading-none">
                    {visitProgress}<span className="text-xl">%</span>
                  </div>
                  <p className="text-[10px] text-subtle mt-1 uppercase tracking-wider">
                    {stats.visitedThisMonth} / {stats.totalActive} active
                  </p>
                </div>
              </div>

              <div
                className="w-full rounded-full h-2.5 overflow-hidden relative"
                style={{ background: 'rgb(var(--c-surface-3))' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 relative"
                  style={{
                    width: `${visitProgress}%`,
                    background: 'linear-gradient(90deg, rgb(var(--c-warning)) 0%, rgb(var(--c-success)) 100%)',
                    boxShadow: '0 0 12px rgb(var(--c-success) / 0.4)',
                  }}
                />
              </div>

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'rgb(var(--c-success))' }} />
                  <span className="text-xs text-muted">{stats.visitedTwice} twice</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'rgb(var(--c-warning))' }} />
                  <span className="text-xs text-muted">{stats.visitedOnce} once</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'rgb(var(--c-subtle))' }} />
                  <span className="text-xs text-muted">{stats.neverVisited} never</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ This Week ═══ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-bold text-subtle uppercase tracking-widest">This Week</h2>
            <Link href={`/plan/${today}`} className="text-xs text-accent hover:underline font-semibold flex items-center gap-1">
              View today
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {(() => {
              const d = new Date();
              const dow = d.getDay();
              const monday = new Date(d);
              monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
              return Array.from({ length: 6 }, (_, i) => {
                const dt = new Date(monday);
                dt.setDate(monday.getDate() + i);
                const dateStr = dt.toISOString().split('T')[0];
                const dayAbbr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
                const dayNum  = dt.getDate();
                const isToday = dateStr === today;
                const isPast  = dateStr < today;
                return (
                  <Link
                    key={dateStr}
                    href={`/plan/${dateStr}`}
                    className={`relative rounded-xl py-3 text-center transition-all border ${
                      isToday
                        ? 'bg-accent text-on-accent border-accent shadow-md'
                        : isPast
                        ? 'bg-surface text-subtle border-line hover:border-line-2'
                        : 'bg-surface text-content border-line hover:border-line-2'
                    }`}
                    style={isToday ? { boxShadow: '0 4px 14px -2px rgb(var(--c-accent) / 0.35)' } : {}}
                  >
                    <div className={`text-[9px] font-bold uppercase tracking-widest ${isToday ? 'opacity-80' : isPast ? 'text-subtle' : 'text-muted'}`}>
                      {dayAbbr}
                    </div>
                    <div className="text-base font-bold tabular mt-0.5">{dayNum}</div>
                    {isToday && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-on-accent opacity-80" />
                    )}
                  </Link>
                );
              });
            })()}
          </div>
        </div>

        {/* ═══ Historical Analysis ═══ */}
        {history.length > 0 && (() => {
          const maxVisited = Math.max(...history.map((h) => h.visited), 1);
          return (
            <div>
              <h2 className="text-[11px] font-bold text-subtle uppercase tracking-widest mb-3">Performance History</h2>
              <div
                className="rounded-2xl p-5 border border-line"
                style={{
                  background: 'linear-gradient(180deg, rgb(var(--c-surface)) 0%, rgb(var(--c-surface-2)) 100%)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Bar chart with area fill feeling */}
                <div className="flex items-end gap-2 h-40 mb-4">
                  {history.map((m, idx) => {
                    const heightPct = Math.round((m.visited / maxVisited) * 100);
                    const trend = trendVs(idx);
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold tabular ${m.isCurrent ? 'text-accent' : 'text-content'}`}
                        >
                          {m.visited}
                        </span>
                        <div className="w-full flex flex-col justify-end" style={{ height: '90px' }}>
                          <div
                            className="w-full rounded-lg transition-all duration-500 relative overflow-hidden"
                            style={{
                              height: `${Math.max(heightPct, 6)}%`,
                              background: m.isCurrent
                                ? 'linear-gradient(180deg, rgb(var(--c-accent)) 0%, rgb(var(--c-accent) / 0.6) 100%)'
                                : 'linear-gradient(180deg, rgb(var(--c-surface-3)) 0%, rgb(var(--c-surface-2)) 100%)',
                              border: m.isCurrent ? '1px solid rgb(var(--c-accent) / 0.6)' : '1px solid rgb(var(--c-line))',
                              boxShadow: m.isCurrent ? '0 4px 14px -2px rgb(var(--c-accent) / 0.4)' : 'none',
                            }}
                          >
                            {m.isCurrent && (
                              <div
                                className="absolute inset-x-0 top-0 h-1/3 opacity-40"
                                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)' }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          {trend && idx > 0 && (
                            <span
                              className="text-[8px] font-bold inline-block"
                              style={{
                                color:
                                  trend === 'up'   ? 'rgb(var(--c-success))' :
                                  trend === 'down' ? 'rgb(var(--c-danger))'  : 'rgb(var(--c-subtle))',
                              }}
                            >
                              {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '–'}
                            </span>
                          )}
                          <div className={`text-[9px] leading-tight mt-0.5 ${m.isCurrent ? 'text-accent font-bold' : 'text-muted'}`}>
                            {m.label.split(' ')[0]}
                          </div>
                          <div className={`text-[9px] leading-tight ${m.isCurrent ? 'text-accent' : 'text-subtle'}`}>
                            {m.label.split(' ')[1]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-line pt-3 space-y-2">
                  {history.map((m) => (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className={`text-xs w-16 flex-shrink-0 tabular ${m.isCurrent ? 'text-accent font-semibold' : 'text-muted'}`}>
                        {m.label}
                      </span>
                      <div className="flex-1 bg-surface-3 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${m.coverage}%`,
                            background: m.isCurrent
                              ? 'linear-gradient(90deg, rgb(var(--c-warning)) 0%, rgb(var(--c-success)) 100%)'
                              : 'rgb(var(--c-subtle))',
                          }}
                        />
                      </div>
                      <span className={`text-xs w-20 text-right flex-shrink-0 tabular ${m.isCurrent ? 'text-accent' : 'text-subtle'}`}>
                        {m.visited}/{m.totalActive} · {m.coverage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══ Export ═══ */}
        <div>
          <h2 className="text-[11px] font-bold text-subtle uppercase tracking-widest mb-3">Export Data</h2>
          <div
            className="rounded-2xl overflow-hidden border border-line"
            style={{
              background: 'rgb(var(--c-surface))',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex border-b border-line">
              {(['day', 'month', 'all'] as ExportTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setExportTab(t)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                    exportTab === t
                      ? 'text-accent'
                      : 'text-muted hover:text-content'
                  }`}
                >
                  {t === 'day' ? 'By Day' : t === 'month' ? 'By Month' : 'All'}
                  {exportTab === t && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                      style={{
                        background: 'rgb(var(--c-accent))',
                        boxShadow: '0 0 8px rgb(var(--c-accent) / 0.6)',
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="p-4">
              {exportTab === 'day' && (
                <div className="space-y-2">
                  <p className="text-xs text-muted">Select a specific date to export</p>
                  <input
                    type="date"
                    value={exportDate}
                    onChange={(e) => setExportDate(e.target.value)}
                    className="w-full bg-base border border-line rounded-xl px-3 py-2.5 text-sm text-content focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              {exportTab === 'month' && (
                <div className="space-y-2">
                  <p className="text-xs text-muted">Select a month to export</p>
                  <input
                    type="month"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full bg-base border border-line rounded-xl px-3 py-2.5 text-sm text-content focus:outline-none focus:border-accent"
                  />
                </div>
              )}

              {exportTab === 'all' && (
                <p className="text-xs text-muted leading-relaxed">
                  Download the complete visit history for all doctors across all time.
                </p>
              )}

              <a
                href={exportUrl()}
                download={exportFilename()}
                className="btn-primary mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download CSV
              </a>
            </div>
          </div>
        </div>

        {/* ═══ By Area ═══ */}
        {stats?.byArea && (
          <div>
            <h2 className="text-[11px] font-bold text-subtle uppercase tracking-widest mb-3">Coverage by Area</h2>
            <div
              className="rounded-2xl border border-line overflow-hidden"
              style={{
                background: 'rgb(var(--c-surface))',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {stats.byArea.map((areaData, idx) => {
                const pct = Math.round((areaData.visited / (areaData.total || 1)) * 100);
                return (
                  <div
                    key={areaData.area}
                    className={`px-4 py-3 transition-colors hover:bg-surface-2 ${idx < stats.byArea.length - 1 ? 'border-b border-line' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-content">{areaData.area}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted tabular">{areaData.visited}/{areaData.total}</span>
                        <span
                          className="text-xs font-bold tabular"
                          style={{
                            color:
                              pct >= 70 ? 'rgb(var(--c-success))' :
                              pct >= 40 ? 'rgb(var(--c-warning))' :
                              'rgb(var(--c-danger))',
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background:
                            pct >= 70
                              ? 'linear-gradient(90deg, rgb(var(--c-success) / 0.7), rgb(var(--c-success)))'
                              : pct >= 40
                              ? 'linear-gradient(90deg, rgb(var(--c-warning) / 0.7), rgb(var(--c-warning)))'
                              : 'linear-gradient(90deg, rgb(var(--c-danger) / 0.7), rgb(var(--c-danger)))',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
