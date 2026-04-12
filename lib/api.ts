import { Doctor } from './utils';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// --- Doctors ---

export interface DoctorsFilter {
  area?: string;
  status?: string;
  day?: string;
  search?: string;
  hideF?: boolean;
}

export function buildQuery(filters: DoctorsFilter): string {
  const params = new URLSearchParams();
  if (filters.area) params.set('area', filters.area);
  if (filters.status) params.set('status', filters.status);
  if (filters.day) params.set('day', filters.day);
  if (filters.search) params.set('search', filters.search);
  if (filters.hideF !== undefined) params.set('hideF', String(filters.hideF));
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const api = {
  doctors: {
    list: (filters: DoctorsFilter = {}) =>
      req<Doctor[]>(`/doctors${buildQuery(filters)}`),

    get: (id: number) => req<Doctor>(`/doctors/${id}`),

    create: (body: Partial<Doctor>) =>
      req<Doctor>('/doctors', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: number, body: Partial<Doctor>) =>
      req<Doctor>(`/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    delete: (id: number) =>
      req<void>(`/doctors/${id}`, { method: 'DELETE' }),
  },

  visits: {
    record: (id: number, month: string, visitNumber: 1 | 2, date: string) =>
      req<Doctor>(`/doctors/${id}/visit`, {
        method: 'PATCH',
        body: JSON.stringify({ month, visitNumber, date }),
      }),

    visitToday: (id: number) =>
      req<Doctor>(`/doctors/${id}/visit-today`, { method: 'POST' }),

    clear: (id: number, field: string) =>
      req<Doctor>(`/doctors/${id}/visit-clear`, {
        method: 'DELETE',
        body: JSON.stringify({ field }),
      }),
  },

  stats: {
    get: () =>
      req<{
        total: number;
        totalActive: number;
        visitedThisMonth: number;
        visitedOnce: number;
        visitedTwice: number;
        neverVisited: number;
        needVisit: number;
        byArea: Array<{ area: string; total: number; visited: number }>;
      }>('/stats'),
  },
};
