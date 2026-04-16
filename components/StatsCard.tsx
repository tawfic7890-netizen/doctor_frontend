'use client';

interface StatsCardProps {
  label: string;
  value: number | string;
  color?: string;
  sub?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'flat' | null;
}

export default function StatsCard({ label, value, color = 'rgb(var(--c-accent))', sub, icon, trend }: StatsCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 border border-line group transition-all hover:border-line-2"
      style={{
        background: `linear-gradient(180deg, rgb(var(--c-surface)) 0%, rgb(var(--c-surface-2)) 100%)`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Decorative gradient glow in corner */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none transition-opacity group-hover:opacity-50"
        style={{ background: color }}
      />

      <div className="relative flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">{label}</span>
          {icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: `${color}15`,
                color,
                border: `1px solid ${color}25`,
              }}
            >
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular tracking-tight" style={{ color }}>
            {value}
          </span>
          {trend && (
            <span
              className="text-[10px] font-bold flex items-center gap-0.5"
              style={{
                color:
                  trend === 'up'   ? 'rgb(var(--c-success))' :
                  trend === 'down' ? 'rgb(var(--c-danger))'  : 'rgb(var(--c-subtle))',
              }}
            >
              {trend === 'up'   ? '▲' : trend === 'down' ? '▼' : '–'}
            </span>
          )}
        </div>

        {sub && <div className="text-[11px] text-subtle">{sub}</div>}
      </div>
    </div>
  );
}
