'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import StatsCard from '@/components/StatsCard';
import { api } from '@/lib/api';
import { DAYS } from '@/lib/utils';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.stats.get(),
  });

  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDay = dayNames[today.getDay()];

  const visitProgress = stats
    ? Math.round((stats.visitedThisMonth / (stats.totalActive || 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="bg-surface border-b border-line px-4 py-4 pr-14">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-content">Tawfic Tracker</h1>
            <p className="text-xs text-muted mt-0.5">
              North Lebanon · {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="text-3xl">🩺</div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatsCard label="Total Doctors" value={stats.total} icon="👨‍⚕️" color="rgb(var(--c-accent))" />
            <StatsCard
              label="Visited April"
              value={stats.visitedThisMonth}
              icon="✅"
              color="#00c853"
              sub={`${visitProgress}% of active`}
            />
            <StatsCard label="Never Visited" value={stats.neverVisited} icon="🔴" color="#ff3d3d" />
            <StatsCard label="Need Visit" value={stats.needVisit} icon="🟠" color="#ff6b35" />
          </div>
        )}

        {/* April Progress */}
        {stats && (
          <div className="bg-surface rounded-xl p-4 border border-line">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-content">April Progress</span>
              <span className="text-xs text-muted">
                {stats.visitedOnce} once · {stats.visitedTwice} twice
              </span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${visitProgress}%`,
                  background: 'linear-gradient(90deg, #FFD700, #00A550)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted">{stats.visitedThisMonth} visited</span>
              <span className="text-xs text-muted">{stats.totalActive} active doctors</span>
            </div>
          </div>
        )}

        {/* Quick Access */}
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/plan/${todayDay.toLowerCase()}`}
              className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-accent/20 transition-colors"
            >
              <span className="text-2xl">🗓️</span>
              <span className="text-sm font-semibold text-accent">Today's Plan</span>
              <span className="text-xs text-muted">{todayDay}</span>
            </Link>
            <Link
              href="/april"
              className="bg-[#00A550]/10 border border-[#00A550]/30 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-[#00A550]/20 transition-colors"
            >
              <span className="text-2xl">📋</span>
              <span className="text-sm font-semibold text-[#00A550]">April Tracker</span>
              <span className="text-xs text-muted">Full list</span>
            </Link>
            <Link
              href="/doctors"
              className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-indigo-500/20 transition-colors"
            >
              <span className="text-2xl">👨‍⚕️</span>
              <span className="text-sm font-semibold text-indigo-500">All Doctors</span>
              <span className="text-xs text-muted">{stats?.total || '...'} total</span>
            </Link>
            <Link
              href="/add"
              className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-amber-500/20 transition-colors"
            >
              <span className="text-2xl">➕</span>
              <span className="text-sm font-semibold text-amber-500">Add Doctor</span>
              <span className="text-xs text-muted">New record</span>
            </Link>
          </div>
        </div>

        {/* Weekly Plans */}
        <div>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Weekly Plans</h2>
          <div className="grid grid-cols-3 gap-2">
            {DAYS.map((day) => (
              <Link
                key={day}
                href={`/plan/${day.toLowerCase()}`}
                className={`rounded-xl py-3 text-center text-sm font-semibold transition-colors border ${
                  day === todayDay
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-surface text-content border-line hover:border-subtle'
                }`}
              >
                {day}
              </Link>
            ))}
          </div>
        </div>

        {/* By Area */}
        {stats?.byArea && (
          <div>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">By Area</h2>
            <div className="bg-surface rounded-xl border border-line overflow-hidden">
              {stats.byArea.map((areaData, idx) => {
                const pct = Math.round((areaData.visited / (areaData.total || 1)) * 100);
                return (
                  <div
                    key={areaData.area}
                    className={`px-4 py-3 ${idx < stats.byArea.length - 1 ? 'border-b border-line' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-content">{areaData.area}</span>
                      <span className="text-xs text-muted">{areaData.visited}/{areaData.total}</span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
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
