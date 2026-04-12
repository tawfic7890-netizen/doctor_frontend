'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Doctor,
  getDoctorStatus,
  STATUS_COLORS,
  getAprilStatus,
  getLastVisit,
  isDeal,
  DAYS,
} from '@/lib/utils';
import DoctorModal from '@/components/DoctorModal';
import Link from 'next/link';

interface Props {
  params: { day: string };
}

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday', today: 'Today',
};

const DAY_MAP: Record<string, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

export default function DailyPlanPage({ params }: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Doctor | null>(null);
  const [showColleagues, setShowColleagues] = useState(false);

  let day = params.day.toLowerCase();
  if (day === 'today') day = DAY_MAP[new Date().getDay()] || 'mon';

  const dayLabel = DAY_LABELS[day] || day;

  const { data: allDoctors = [], isLoading } = useQuery({
    queryKey: ['doctors', { hideF: false }],
    queryFn: () => api.doctors.list({ hideF: false }),
  });

  const visitTodayMutation = useMutation({
    mutationFn: (id: number) => api.visits.visitToday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const scheduled = allDoctors.filter(
    (d) => Array.isArray(d.days) && d.days.map((x) => x.toLowerCase()).includes(day),
  );

  const fColleagues = scheduled.filter((d) => d.class?.toLowerCase() === 'f' && d.apr_visit1);
  const mainScheduled = scheduled
    .filter((d) => d.class?.toLowerCase() !== 'f')
    .sort((a, b) => {
      if (isDeal(a) && !isDeal(b)) return -1;
      if (!isDeal(a) && isDeal(b)) return 1;
      const ws: Record<string, number> = { NEVER: 0, NEED_VISIT: 1, RECENT: 2, DEAL: -1, F: 9 };
      return (ws[getDoctorStatus(a)] ?? 5) - (ws[getDoctorStatus(b)] ?? 5);
    });

  const scheduledAreas = new Set(scheduled.map((d) => d.area).filter(Boolean));
  const backup = allDoctors
    .filter((d) => {
      if (d.class?.toLowerCase() === 'f') return false;
      if (Array.isArray(d.days) && d.days.map((x) => x.toLowerCase()).includes(day)) return false;
      const status = getDoctorStatus(d);
      return scheduledAreas.has(d.area) && (status === 'NEVER' || status === 'NEED_VISIT');
    })
    .slice(0, 15);

  const renderDoctorRow = (doctor: Doctor, isBackup = false) => {
    const status = getDoctorStatus(doctor);
    const color = STATUS_COLORS[status];
    const aprStatus = getAprilStatus(doctor);
    const lastVisit = getLastVisit(doctor);
    const isPending = visitTodayMutation.isPending && visitTodayMutation.variables === doctor.id;

    return (
      <div
        key={doctor.id}
        className="bg-surface border border-line rounded-xl p-3 flex items-center gap-3"
        style={isDeal(doctor) ? { borderColor: 'rgba(245,158,11,0.3)' } : {}}
      >
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelected(doctor)}>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-content truncate">{doctor.name}</p>
            {isDeal(doctor) && <span className="text-xs text-amber-400">⭐</span>}
            {isBackup && (
              <span className="text-[10px] bg-surface-2 text-muted px-1.5 py-0.5 rounded">backup</span>
            )}
          </div>
          <p className="text-xs text-muted truncate">
            {doctor.specialty} · {doctor.area}
            {lastVisit && ` · ${Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))}d ago`}
          </p>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              color: aprStatus === 'twice' ? '#00A550' : aprStatus === 'once' ? '#FFD700' : 'rgb(var(--c-subtle))',
              background: aprStatus === 'twice' ? 'rgba(0,165,80,0.15)' : aprStatus === 'once' ? 'rgba(255,215,0,0.1)' : 'rgb(var(--c-surface-2))',
            }}
          >
            {aprStatus === 'twice' ? '✓✓' : aprStatus === 'once' ? '✓' : '—'}
          </span>
          {aprStatus !== 'twice' && (
            <button
              onClick={() => visitTodayMutation.mutate(doctor.id)}
              disabled={isPending}
              className="text-[10px] bg-accent/20 text-accent border border-accent/30 px-2 py-1 rounded-lg font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isPending ? '...' : '✓ Visit'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="bg-surface border-b border-line px-4 py-3 pr-14">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-content">{dayLabel} Plan</h1>
            <p className="text-xs text-muted">
              {mainScheduled.length} scheduled · {backup.length} backup
            </p>
          </div>
          {/* Day switcher */}
          <div className="flex gap-1">
            {DAYS.map((d) => (
              <Link
                key={d}
                href={`/plan/${d.toLowerCase()}`}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  d.toLowerCase() === day
                    ? 'bg-accent text-on-accent'
                    : 'bg-surface-2 text-muted hover:text-content'
                }`}
              >
                {d}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 py-3 space-y-4">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        )}

        {mainScheduled.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Scheduled for {dayLabel} ({mainScheduled.length})
            </h2>
            <div className="space-y-2">{mainScheduled.map((d) => renderDoctorRow(d))}</div>
          </div>
        )}

        {mainScheduled.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted">
            <p className="text-3xl mb-2">📭</p>
            <p>No doctors scheduled for {dayLabel}</p>
          </div>
        )}

        {backup.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-[#ff6b35] uppercase tracking-wide mb-2">
              🟠 Backup — Same Area, Need Visit ({backup.length})
            </h2>
            <div className="space-y-2">{backup.map((d) => renderDoctorRow(d, true))}</div>
          </div>
        )}

        {fColleagues.length > 0 && (
          <div>
            <button
              onClick={() => setShowColleagues((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wide mb-2"
            >
              <span>{showColleagues ? '▼' : '▶'}</span>
              Colleagues F ({fColleagues.length})
            </button>
            {showColleagues && (
              <div className="space-y-2">{fColleagues.map((d) => renderDoctorRow(d))}</div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <DoctorModal doctor={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
