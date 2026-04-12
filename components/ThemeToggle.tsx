'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored ? stored === 'dark' : true;
    setDark(isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="fixed top-3 right-3 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-surface border border-line shadow-md text-base hover:bg-surface-2 transition-colors"
    >
      <span className="text-lg leading-none">{dark ? '☀️' : '🌙'}</span>
    </button>
  );
}
