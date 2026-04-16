'use client';
import {
  Doctor, getDoctorStatus, getLastVisit,
  getCurrentMonthStatus, getCurrentMonthName,
  STATUS_COLORS, daysSince,
} from '@/lib/utils';
import { getClassDef } from '@/lib/classConfig';

interface DoctorCardProps {
  doctor: Doctor;
  onClick: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic avatar color from name
function avatarGradient(name: string, isDeal: boolean): string {
  if (isDeal) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  const gradients = [
    'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', // blue-indigo
    'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)', // sky-cyan
    'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', // teal
    'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', // violet
    'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', // cyan-blue
    'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', // indigo
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return gradients[hash % gradients.length];
}

export default function DoctorCard({ doctor, onClick }: DoctorCardProps) {
  const status      = getDoctorStatus(doctor);
  const statusColor = STATUS_COLORS[status];
  const lastVisit   = getLastVisit(doctor);
  const monthStatus = getCurrentMonthStatus(doctor);
  const monthName   = getCurrentMonthName();
  const isDeal      = status === 'DEAL';

  const classDef = getClassDef(doctor.class);
  const classLabel = isDeal ? 'DEAL' : classDef.label;
  const classColor = isDeal ? '#f59e0b' : classDef.color;

  const monthBadge = (): { label: string; color: string; bg: string; border: string } => {
    if (monthStatus === 'twice') return {
      label: '✓✓',
      color: 'rgb(var(--c-success))',
      bg: 'rgb(var(--c-success) / 0.12)',
      border: 'rgb(var(--c-success) / 0.25)',
    };
    if (monthStatus === 'once') return {
      label: '✓',
      color: 'rgb(var(--c-warning))',
      bg: 'rgb(var(--c-warning) / 0.12)',
      border: 'rgb(var(--c-warning) / 0.25)',
    };
    return {
      label: '—',
      color: 'rgb(var(--c-subtle))',
      bg: 'transparent',
      border: 'rgb(var(--c-line))',
    };
  };

  const badge = monthBadge();
  const initials = getInitials(doctor.name);

  return (
    <div
      className="doctor-card relative bg-surface border border-line rounded-2xl p-3.5 cursor-pointer active:scale-[0.99]"
      onClick={onClick}
      style={isDeal ? {
        borderColor: 'rgb(245 158 11 / 0.35)',
        boxShadow: '0 0 0 1px rgb(245 158 11 / 0.12), 0 4px 12px -4px rgb(245 158 11 / 0.15)',
      } : {}}
    >
      {/* Deal accent stripe */}
      {isDeal && (
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
          style={{ background: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)' }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Avatar with initials */}
        <div className="relative flex-shrink-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-sm tracking-wide"
            style={{
              background: avatarGradient(doctor.name, isDeal),
              boxShadow: '0 2px 6px -1px rgb(0 0 0 / 0.25), inset 0 1px 0 0 rgb(255 255 255 / 0.1)',
            }}
          >
            {initials}
          </div>
          {/* Status dot overlay */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${
              status === 'NEVER' ? 'pulse-never' :
              isDeal             ? 'pulse-deal'  : ''
            }`}
            style={{
              backgroundColor: statusColor,
              borderColor: 'rgb(var(--c-surface))',
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-content leading-tight">{doctor.name}</h3>
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
              style={{
                color: classColor,
                background: `${classColor}1a`,
                borderColor: `${classColor}44`,
              }}
            >
              {classLabel}
            </span>
          </div>

          <p className="text-xs text-muted mt-0.5 truncate">
            {doctor.specialty}
            {doctor.city && <span className="text-subtle"> · {doctor.city}</span>}
            {doctor.location && <span className="text-subtle"> · {doctor.location}</span>}
          </p>

          {/* Meta row */}
          {(doctor.phone || (doctor.days?.length > 0) || doctor.time || lastVisit) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5">
              {doctor.phone && (
                <span className="text-[11px] text-subtle tabular">{doctor.phone}</span>
              )}
              {doctor.days?.length > 0 && (
                <>
                  {doctor.phone && <span className="text-[10px] text-subtle/60">·</span>}
                  <span className="text-[11px] text-subtle">{doctor.days.join(' · ')}</span>
                </>
              )}
              {doctor.time && (
                <>
                  <span className="text-[10px] text-subtle/60">·</span>
                  <span className="text-[11px] text-subtle">{doctor.time}</span>
                </>
              )}
              {lastVisit && (
                <>
                  <span className="text-[10px] text-subtle/60">·</span>
                  <span className="text-[11px] text-subtle">{daysSince(lastVisit.toISOString())}</span>
                </>
              )}
            </div>
          )}

          {/* Request pill */}
          {doctor.request && (
            <span
              className="inline-block mt-1.5 text-[10px] rounded-md px-2 py-0.5 max-w-[200px] truncate border"
              style={{
                color: 'rgb(var(--c-accent))',
                background: 'rgb(var(--c-accent) / 0.08)',
                borderColor: 'rgb(var(--c-accent) / 0.20)',
              }}
            >
              {doctor.request}
            </span>
          )}

          {/* Note */}
          {doctor.note && (
            <p className="text-[11px] text-amber-400/70 mt-1.5 leading-snug line-clamp-1">
              {doctor.note}
            </p>
          )}
        </div>

        {/* Month badge */}
        <div className="flex-shrink-0 flex flex-col items-center gap-0.5 ml-1">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border tabular font-bold text-base"
            style={{
              color: badge.color,
              background: badge.bg,
              borderColor: badge.border,
            }}
          >
            {badge.label}
          </div>
          <span className="text-[8px] text-subtle uppercase tracking-widest font-semibold">{monthName}</span>
        </div>
      </div>
    </div>
  );
}
