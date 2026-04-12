'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/doctors', label: 'Doctors', icon: '👨‍⚕️' },
  { href: '/trip', label: 'Trip', icon: '🗺️' },
  { href: '/plan/today', label: 'Daily', icon: '🗓️' },
  { href: '/add', label: 'Add', icon: '➕' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-50 flex">
      {navItems.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
              isActive ? 'text-accent' : 'text-muted hover:text-content'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
