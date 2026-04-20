'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import DoctorCard from '@/components/DoctorCard';
import DoctorModal from '@/components/DoctorModal';
import FilterBar, { Filters } from '@/components/FilterBar';
import { api } from '@/lib/api';
import { Doctor, getDoctorStatus, getCurrentMonthStatus, getLastVisit } from '@/lib/utils';

export default function DoctorsPage() {
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    statuses: [],
    day: '',
    area: '',
    hideF: true,
    needVisitRanges: [],
  });

  // Always fetch ALL doctors (including F) — hideF + statuses filtered client-side
  const { data: allDoctors = [], isLoading, error } = useQuery({
    queryKey: ['doctors', {
      search: filters.search,
      day: filters.day,
      area: filters.area,
    }],
    queryFn: () =>
      api.doctors.list({
        search: filters.search || undefined,
        day: filters.day || undefined,
        area: filters.area || undefined,
        hideF: false, // always get all, we filter F client-side
      }),
    staleTime: 15000,
  });

  // Apply hideF + multi-status client-side
  const doctors = useMemo(() => {
    let result = allDoctors;

    // Hide ALL F colleagues when hideF is on
    if (filters.hideF) {
      result = result.filter((d) => d.class?.toLowerCase() !== 'f');
    }

    // Multi-status filter (OR logic)
    if (filters.statuses.length > 0) {
      result = result.filter((d) =>
        filters.statuses.some((s) => {
          if (s === 'CURRENT_MONTH') return getCurrentMonthStatus(d) !== 'none';
          return getDoctorStatus(d) === s;
        })
      );
    }

    // Need Visit range sub-filter
    if (filters.needVisitRanges.length > 0) {
      result = result.filter((d) => {
        const last = getLastVisit(d);
        const days = last ? (Date.now() - last.getTime()) / 86400000 : null;
        if (days === null || days <= 12) return false;
        if (filters.needVisitRanges.includes('12_20') && days > 12 && days <= 20) return true;
        if (filters.needVisitRanges.includes('20_30') && days > 20 && days <= 30) return true;
        if (filters.needVisitRanges.includes('30_PLUS') && days > 30) return true;
        return false;
      });
    }

    return result;
  }, [allDoctors, filters.hideF, filters.statuses, filters.needVisitRanges]);

  return (
    <div className="min-h-screen bg-base">
      <div className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgb(var(--c-accent) / 0.10) 0%, transparent 55%)',
          }}
        />
        <div className="relative px-5 py-4 pl-14 pr-14">
          <h1 className="text-xl font-bold text-content tracking-tight">Doctors</h1>
          <p className="text-xs text-muted mt-0.5">
            <span className="tabular font-semibold text-content">{doctors.length}</span> {doctors.length === 1 ? 'doctor' : 'doctors'} shown
          </p>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="px-3 py-3 space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton rounded-2xl h-[78px]" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-400">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="font-medium">Failed to load doctors</p>
            <p className="text-xs text-muted mt-1">{String(error)}</p>
          </div>
        )}

        {!isLoading && !error && doctors.length === 0 && (
          <div className="text-center py-16 text-muted">
            <div className="w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center mx-auto mb-3 text-subtle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p className="font-medium text-content">No doctors found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}

        {doctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={doctor}
            onClick={() => setSelected(doctor)}
          />
        ))}
      </div>

      {selected && (
        <DoctorModal doctor={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
