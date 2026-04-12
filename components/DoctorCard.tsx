'use client';
import { Doctor, getDoctorStatus, getLastVisit, getCurrentMonthStatus, getCurrentMonthName, STATUS_COLORS, formatDate, daysSince } from '@/lib/utils';

interface DoctorCardProps {
  doctor: Doctor;
  onClick: () => void;
}

export default function DoctorCard({ doctor, onClick }: DoctorCardProps) {
  const status = getDoctorStatus(doctor);
  const statusColor = STATUS_COLORS[status];
  const lastVisit = getLastVisit(doctor);
  const aprStatus = getCurrentMonthStatus(doctor);
  const monthName = getCurrentMonthName();

  const classLabel = () => {
    if (status === 'DEAL') return { label: '⭐ DEAL', bg: 'bg-amber-500/20 text-amber-500 border-amber-500/30' };
    switch (doctor.class?.toUpperCase()) {
      case 'A': return { label: 'A', bg: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30' };
      case 'B': return { label: 'B', bg: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30' };
      case 'F': return { label: 'F', bg: 'bg-subtle/20 text-muted border-line' };
      default:
        if (doctor.class?.toLowerCase() === 'a') return { label: 'a★', bg: 'bg-purple-500/20 text-purple-500 border-purple-500/30' };
        return { label: doctor.class || '?', bg: 'bg-subtle/20 text-muted border-line' };
    }
  };

  const cls = classLabel();

  const aprBadge = () => {
    if (aprStatus === 'twice') return { label: `✓✓ ${monthName}`, color: '#00A550', bg: 'rgba(0,165,80,0.15)' };
    if (aprStatus === 'once')  return { label: `✓ ${monthName}`,  color: '#FFD700', bg: 'rgba(255,215,0,0.12)' };
    return { label: `— ${monthName}`, color: '#6b7280', bg: 'rgba(107,114,128,0.15)' };
  };

  const apr = aprBadge();

  return (
    <div
      className="doctor-card bg-surface border border-line rounded-xl p-3 cursor-pointer active:scale-[0.98]"
      onClick={onClick}
      style={status === 'DEAL' ? { borderColor: 'rgba(245,158,11,0.3)', boxShadow: '0 0 12px rgba(245,158,11,0.1)' } : {}}
    >
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <div className="mt-1 flex-shrink-0">
          <div
            className={`w-3 h-3 rounded-full ${status === 'NEVER' ? 'status-dot-never' : status === 'DEAL' ? 'status-dot-deal' : ''}`}
            style={{ backgroundColor: statusColor }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-content truncate">{doctor.name}</h3>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cls.bg}`}>
              {cls.label}
            </span>
          </div>

          <p className="text-xs text-muted mt-0.5">
            {doctor.specialty}{doctor.location ? ` · ${doctor.location}` : ''}
          </p>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {doctor.phone && (
              <span className="text-[10px] bg-surface-2 text-muted px-2 py-0.5 rounded-full">
                📞 {doctor.phone}
              </span>
            )}
            {doctor.days?.length > 0 && (
              <span className="text-[10px] bg-surface-2 text-muted px-2 py-0.5 rounded-full">
                📆 {doctor.days.join(', ')}
              </span>
            )}
            {doctor.time && (
              <span className="text-[10px] bg-surface-2 text-muted px-2 py-0.5 rounded-full">
                🕐 {doctor.time}
              </span>
            )}
            {lastVisit && (
              <span className="text-[10px] bg-surface-2 text-muted px-2 py-0.5 rounded-full">
                🏥 {daysSince(lastVisit.toISOString())}
              </span>
            )}
            {doctor.request && (
              <span className="text-[10px] bg-surface-2 text-blue-500 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                💊 {doctor.request}
              </span>
            )}
          </div>

          {/* Note */}
          {doctor.note && (
            <p className="text-[11px] text-amber-400/80 mt-2 leading-snug line-clamp-2">
              📝 {doctor.note}
            </p>
          )}
        </div>

        {/* APR badge */}
        <div className="flex-shrink-0 ml-1">
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
            style={{ color: apr.color, background: apr.bg }}
          >
            {apr.label}
          </span>
        </div>
      </div>
    </div>
  );
}
