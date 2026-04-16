/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — driven by CSS variables
        base:        'rgb(var(--c-base)        / <alpha-value>)',
        surface:     'rgb(var(--c-surface)     / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2)   / <alpha-value>)',
        'surface-3': 'rgb(var(--c-surface-3)   / <alpha-value>)',
        line:        'rgb(var(--c-line)        / <alpha-value>)',
        'line-2':    'rgb(var(--c-line-2)      / <alpha-value>)',
        content:     'rgb(var(--c-content)     / <alpha-value>)',
        muted:       'rgb(var(--c-muted)       / <alpha-value>)',
        subtle:      'rgb(var(--c-subtle)      / <alpha-value>)',
        accent:      'rgb(var(--c-accent)      / <alpha-value>)',
        'accent-2':  'rgb(var(--c-accent-2)    / <alpha-value>)',
        'on-accent': 'rgb(var(--c-on-accent)   / <alpha-value>)',
        success:     'rgb(var(--c-success)     / <alpha-value>)',
        warning:     'rgb(var(--c-warning)     / <alpha-value>)',
        danger:      'rgb(var(--c-danger)      / <alpha-value>)',
        // Status legacy
        deal:        '#f59e0b',
        never:       '#f87171',
        need:        '#fb923c',
        recent:      '#22c55e',
        colleague:   '#6b7280',
        'apr-once':  '#eab308',
        'apr-twice': '#22c55e',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm-soft':  'var(--shadow-sm)',
        'md-soft':  'var(--shadow-md)',
        'lg-soft':  'var(--shadow-lg)',
        'glow':     'var(--shadow-glow)',
      },
    },
  },
  plugins: [],
};
