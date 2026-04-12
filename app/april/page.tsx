'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DoctorCard from '@/components/DoctorCard';
import DoctorModal from '@/components/DoctorModal';
import { api } from '@/lib/api';
import { Doctor, getAprilStatus } from '@/lib/utils';

type TabFilter = 'all' | 'once' | 'twice' | 'none';

export default function AprilPage() {
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [tab, setTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors', { hideF: false }],
    queryFn: () => api.doctors.list({ hideF: false }),
  });

  const filtered = doctors.filter((d) => {
    if (d.class?.toLowerCase() === 'f' && !d.apr_visit1 && !d.apr_visit2) return false;
    const aprStatus = getAprilStatus(d);
    if (tab === 'once'  && aprStatus !== 'once')  return false;
    if (tab === 'twice' && aprStatus !== 'twice') return false;
    if (tab === 'none'  && aprStatus !== 'none')  return false;
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
    all:   doctors.filter((d) => !(d.class?.toLowerCase() === 'f' && !d.apr_visit1 && !d.apr_visit2)).length,
    twice: doctors.filter((d) => getAprilStatus(d) === 'twice').length,
    once:  doctors.filter((d) => getAprilStatus(d) === 'once').length,
    none:  doctors.filter((d) => getAprilStatus(d) === 'none' && d.class?.toLowerCase() !== 'f').length,
  };

  const tabs: { key: TabFilter; label: string; color: string }[] = [
    { key: 'all',   label: `All (${counts.all})`,           color: 'rgb(var(--c-accent))' },
    { key: 'twice', label: `✓✓ Twice (${counts.twice})`,   color: '#00A550' },
    { key: 'once',  label: `✓ Once (${counts.once})`,       color: '#FFD700' },
    { key: 'none',  label: `— None (${counts.none})`,       color: '#ff3d3d' },
  ];

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="bg-surface border-b border-line px-4 py-3 pr-14">
        <h1 className="text-lg font-bold text-content">April 2026 Tracker</h1>
        <p className="text-xs text-muted">
          {counts.twice} twice · {counts.once} once · {counts.none} not visited
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 bg-surface/50">
        <div className="flex justify-between text-xs text-muted mb-1.5">
          <span>{counts.twice + counts.once} visited</span>
          <span>{Math.round(((counts.twice + counts.once) / (counts.all || 1)) * 100)}%</span>
        </div>
        <div className="w-full bg-surface-2 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full"
            style={{
              width: `${Math.round(((counts.twice + counts.once) / (counts.all || 1)) * 100)}%`,
              background: 'linear-gradient(90deg, #FFD700, #00A550)',
            }}
          />
        </div>
      </div>

      {/* Sticky filters */}
      <div className="sticky top-0 z-40 bg-base border-b border-line px-3 py-2 space-y-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-sm text-content placeholder-muted focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border ${
                tab === t.key
                  ? 'border-transparent text-black'
                  : 'bg-surface text-muted border-line hover:text-content'
              }`}
              style={tab === t.key ? { backgroundColor: t.color } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 py-3 space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted">
            <p className="text-4xl mb-3">📋</p>
            <p>No doctors match this filter</p>
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
