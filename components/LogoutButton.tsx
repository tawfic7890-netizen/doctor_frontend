'use client';
import { useRouter, usePathname } from 'next/navigation';
import { clearToken } from '@/lib/auth';

export default function LogoutButton() {
  const router   = useRouter();
  const pathname = usePathname();

  if (pathname === '/login') return null;

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <button
      onClick={handleLogout}
      title="Sign out"
      className="fixed top-3 left-3 z-50 w-10 h-10 flex items-center justify-center rounded-xl glass text-muted hover:text-red-400 transition-all hover:scale-105 active:scale-95"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    </button>
  );
}
