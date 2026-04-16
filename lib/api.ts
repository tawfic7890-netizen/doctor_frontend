import { Doctor, Visit } from './utils';
import { getToken, clearToken } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  // Token expired or invalid — clear it and redirect to login
  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    req<{ access_token: string; user: { id: string; email: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),
};

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

    /**
     * Returns the URL for downloading visits as CSV.
     * Pass { date: 'YYYY-MM-DD' } for a single day,
     *      { month: 'YYYY-MM' }  for a whole month,
     *      nothing               for all visits.
     */
    exportUrl: (params?: { date?: string; month?: string }) => {
      if (!params) return `${BASE}/visits/export`;
      if (params.date)  return `${BASE}/visits/export?date=${params.date}`;
      if (params.month) return `${BASE}/visits/export?month=${params.month}`;
      return `${BASE}/visits/export`;
    },
  },

  plans: {
    /** Get the plan for a specific date (YYYY-MM-DD) */
    get: (date: string) => req<Plan>(`/plans/${date}`),

    /** Get all saved plans */
    getAll: () => req<Plan[]>('/plans'),

    /**
     * Get plans for the Mon–Sat week containing date.
     * Defaults to the current week when date is omitted.
     */
    getWeek: (date?: string) =>
      req<Plan[]>(`/plans/week${date ? `?date=${date}` : ''}`),

    /** Save the planned doctor IDs for a specific date (YYYY-MM-DD) */
    set: (date: string, doctorIds: number[]) =>
      req<Plan>(`/plans/${date}`, {
        method: 'PUT',
        body: JSON.stringify({ doctorIds }),
      }),
  },

  stats: {
    history: (months = 6) =>
      req<Array<{
        month: string;
        label: string;
        visited: number;
        totalActive: number;
        coverage: number;
        isCurrent: boolean;
      }>>(`/stats/history?months=${months}`),

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
