'use client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DoctorModal from '@/components/DoctorModal';

interface Props {
  params: { id: string };
}

export default function DoctorDetailPage({ params }: Props) {
  const router = useRouter();
  const id = parseInt(params.id, 10);

  const { data: doctor, isLoading, error } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => api.doctors.get(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center text-gray-400 gap-3">
        <p className="text-4xl">⚠️</p>
        <p>Doctor not found</p>
        <button onClick={() => router.back()} className="text-[#00d4ff] text-sm">
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <DoctorModal
      doctor={doctor}
      onClose={() => router.back()}
    />
  );
}
