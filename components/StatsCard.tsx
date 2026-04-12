'use client';

interface StatsCardProps {
  label: string;
  value: number | string;
  color?: string;
  icon?: string;
  sub?: string;
}

export default function StatsCard({ label, value, color = '#00d4ff', icon, sub }: StatsCardProps) {
  return (
    <div
      className="bg-surface rounded-xl p-4 border border-line flex flex-col gap-1"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted text-sm">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      {sub && <div className="text-xs text-subtle">{sub}</div>}
    </div>
  );
}
