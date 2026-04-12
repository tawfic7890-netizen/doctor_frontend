import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Tawfic Tracker',
  description: 'Doctor visit tracker for North Lebanon',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Apply saved theme before first paint — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t?t==='dark':true);})();`,
          }}
        />
      </head>
      <body className="bg-base text-content min-h-screen">
        <Providers>
          <ThemeToggle />
          <main className="pb-20 min-h-screen">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
