'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children directly on document.body, outside any stacking context.
 * Required for modals that must appear above everything (BottomNav, other modals).
 */
export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
