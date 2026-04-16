# Tawfic Tracker — Frontend

Next.js 14 (App Router) mobile-first PWA for tracking doctor visits across North Lebanon.

## Stack

- **Framework**: Next.js 14 with App Router (`app/`)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom CSS variables (dark/light theme)
- **State / Data fetching**: TanStack React Query v5
- **API client**: `lib/api.ts` — plain `fetch` wrapper, talks to backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)

## Dev Commands

```bash
npm run dev      # start dev server on port 3000
npm run build    # production build
npm run lint     # ESLint
```

## Project Structure

```
app/
  page.tsx              # Dashboard (stats, quick access, week calendar, export UI)
  doctors/
    page.tsx            # Doctor list with filters
    [id]/page.tsx       # Single doctor detail page (wraps DoctorModal)
  add/page.tsx          # Add new doctor form
  plan/[day]/page.tsx   # Daily visit plan — [day] is YYYY-MM-DD or 'today'
  tracker/page.tsx      # Dynamic current-month tracker (no hardcoded month)
  april/page.tsx        # Redirects to /tracker
  march/page.tsx        # Historical March 2026 read-only reference
  trip/page.tsx         # Trip planner
  layout.tsx            # Root layout (Providers, BottomNav, ThemeToggle)

components/
  DoctorModal.tsx       # Edit/view modal — visits, class, phone, location, days, time, request, note
  DoctorCard.tsx        # Doctor row card in the list
  FilterBar.tsx         # Area / status / day filters
  BottomNav.tsx         # Mobile bottom navigation
  StatsCard.tsx         # Dashboard stat tile
  ThemeToggle.tsx       # Dark/light toggle
  Providers.tsx         # React Query provider wrapper

lib/
  api.ts                # All API calls (doctors, visits, plans, stats)
  utils.ts              # Types, constants, pure helpers (status logic, formatting)
```

## Key Conventions

**Clearing optional fields**: When saving a doctor, send `null` (not `undefined`) for cleared text fields (`phone`, `location`, `time`, `request`, `note`). Sending `undefined` omits the field from the PATCH body and Supabase will not clear it.

```ts
// Correct — clears the field in DB
request: form.request || null,

// Wrong — omits the field, old value stays
request: form.request || undefined,
```

**Doctor status logic** (in `lib/utils.ts`):
- `DEAL` — hardcoded names (Abdulrazak Othman, Ayad Fallah, Ahmad Moustafa)
- `F` — class is `'f'` (colleague, do not visit)
- `NEVER` — no visits recorded
- `NEED_VISIT` — last visit > 12 days ago
- `RECENT` — last visit ≤ 12 days ago

**Doctor class values**: `A` (Priority), `a` (Deal Priority), `B` (Normal), `F` (Colleague). Always one of these four — validated by the backend.

**Areas**: Tripoli, Akkar, Koura, Batroun, Zgharta, Badawi, Bared, Menye, Anfeh, Chekka

**Days**: Mon, Tue, Wed, Thu, Fri, Sat (exact casing matters — backend validates these)

**Plan routes use real dates**: `/plan/2026-04-16` or `/plan/today`. The `[day]` param is always `YYYY-MM-DD`. `today` resolves client-side. Plans are stored per-date in the DB (not per day-of-week).

**Date helpers in `lib/utils.ts`**: `todayStr()`, `getWeekDates()`, `dateToDayAbbrev()`, `formatFullDate()`, `formatNavDate()`, `formatMonthYear()`, `shiftWeek()`.

**Export URL**: `api.visits.exportUrl({ date })` for a day, `api.visits.exportUrl({ month })` for a month, `api.visits.exportUrl()` for all.

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend base URL |

## Theme

CSS variables are defined in `globals.css`. Key tokens:
- `bg-base`, `bg-surface`, `bg-surface-2` — background layers
- `text-content`, `text-muted`, `text-subtle` — text hierarchy
- `border-line` — dividers
- `text-accent` / `bg-accent` — cyan highlight (`#00d4ff`)

Dark mode is default; toggled via `localStorage('theme')` + `.dark` class on `<html>`.
