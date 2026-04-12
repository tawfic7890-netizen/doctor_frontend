'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DoctorCard from '@/components/DoctorCard';
import DoctorModal from '@/components/DoctorModal';
import FilterBar, { Filters } from '@/components/FilterBar';
import { api } from '@/lib/api';
import { Doctor } from '@/lib/utils';

export default function DoctorsPage() {
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    day: '',
    area: '',
    hideF: true,
  });

  const { data: doctors = [], isLoading, error } = useQuery({
    queryKey: ['doctors', filters],
    queryFn: () =>
      api.doctors.list({
        search: filters.search || undefined,
        status: filters.status || undefined,
        day: filters.day || undefined,
        area: filters.area || undefined,
        hideF: filters.hideF,
      }),
    staleTime: 15000,
  });

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="bg-surface border-b border-line px-4 py-3 pr-14">
        <h1 className="text-lg font-bold text-content">Doctors</h1>
        <p className="text-xs text-muted">{doctors.length} shown</p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="px-3 py-3 space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-surface rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-400">
            <p className="text-4xl mb-2">⚠️</p>
            <p>Failed to load doctors</p>
            <p className="text-xs text-muted mt-1">{String(error)}</p>
          </div>
        )}

        {!isLoading && !error && doctors.length === 0 && (
          <div className="text-center py-16 text-muted">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">No doctors found</p>
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
