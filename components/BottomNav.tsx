'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V9.5z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0}/>
    </svg>
  );
}

function DoctorsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0}/>
      <path d="M3 21v-1a7 7 0 0114 0v1"/>
      <path d="M19 8v4M21 10h-4"/>
    </svg>
  );
}

function TripIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.18 : 0} stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l19-9-9 19-2-8-8-2z"/>
    </svg>
  );
}

function DailyIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function AddIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}

const navItems = [
  { href: '/',           label: 'Home',    Icon: HomeIcon },
  { href: '/doctors',    label: 'Doctors', Icon: DoctorsIcon },
  { href: '/trip',       label: 'Trip',    Icon: TripIcon },
  { href: '/plan/today', label: 'Daily',   Icon: DailyIcon },
  { href: '/add',        label: 'Add',     Icon: AddIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === '/login') return null;

  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-50 flex glass"
      style={{
        borderTop: '1px solid rgb(var(--c-line))',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
      }}
    >
      {navItems.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[60px] gap-1 transition-colors relative group ${
              isActive ? 'text-accent' : 'text-muted hover:text-content'
            }`}
          >
            {isActive && (
              <>
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgb(var(--c-accent)) 50%, transparent 100%)',
                    boxShadow: '0 0 8px rgb(var(--c-accent) / 0.6)',
                  }}
                />
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgb(var(--c-accent) / 0.12) 0%, transparent 70%)',
                    transform: 'translate(-50%, -40%)',
                  }}
                />
              </>
            )}
            <item.Icon active={isActive} />
            <span className="text-[9px] font-semibold tracking-widest uppercase">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
