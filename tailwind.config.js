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
        // Semantic tokens — driven by CSS variables, opacity modifiers supported
        base:       'rgb(var(--c-base)       / <alpha-value>)',
        surface:    'rgb(var(--c-surface)    / <alpha-value>)',
        'surface-2':'rgb(var(--c-surface-2)  / <alpha-value>)',
        line:       'rgb(var(--c-line)       / <alpha-value>)',
        content:    'rgb(var(--c-content)    / <alpha-value>)',
        muted:      'rgb(var(--c-muted)      / <alpha-value>)',
        subtle:     'rgb(var(--c-subtle)     / <alpha-value>)',
        accent:     'rgb(var(--c-accent)     / <alpha-value>)',
        'on-accent':'rgb(var(--c-on-accent)  / <alpha-value>)',
        // Status / medical indicator colours (same in both modes)
        deal:        '#f59e0b',
        never:       '#ff3d3d',
        need:        '#ff6b35',
        recent:      '#00c853',
        colleague:   '#555555',
        'apr-once':  '#FFD700',
        'apr-twice': '#00A550',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
