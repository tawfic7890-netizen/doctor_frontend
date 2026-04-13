import { Doctor, Visit } from './utils';

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
  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as unknown as T;
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
  if (filters.area)   params.set('area',   filters.area);
  if (filters.status) params.set('status', filters.status);
  if (filters.day)    params.set('day',    filters.day);
  if (filters.search) params.set('search', filters.search);
  if (filters.hideF !== undefined) params.set('hideF', String(filters.hideF));
  const q = params.toString();
  return q ? `?${q}` : '';
}

export interface Plan {
  day: string;
  doctor_ids: number[];
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
    /** Record a visit on a specific date */
    record: (doctorId: number, date: string) =>
      req<Visit>(`/doctors/${doctorId}/visit`, {
        method: 'POST',
        body: JSON.stringify({ date }),
      }),

    /** Record today as a visit */
    visitToday: (doctorId: number) =>
      req<Visit>(`/doctors/${doctorId}/visit-today`, { method: 'POST' }),

    /** Delete a specific visit by its ID */
    clear: (doctorId: number, visitId: number) =>
      req<void>(`/doctors/${doctorId}/visits/${visitId}`, { method: 'DELETE' }),

    /** Returns the URL for downloading visits as CSV (open in browser / anchor href) */
    exportUrl: (month?: string) =>
      `${BASE}/visits/export${month ? `?month=${month}` : ''}`,
  },

  plans: {
    /** Get the planned doctor IDs for a specific day */
    get: (day: string) => req<Plan>(`/plans/${day}`),

    /** Get plans for all days */
    getAll: () => req<Plan[]>('/plans'),

    /** Save the planned doctor IDs for a specific day */
    set: (day: string, doctorIds: number[]) =>
      req<Plan>(`/plans/${day}`, {
        method: 'PUT',
        body: JSON.stringify({ doctorIds }),
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
