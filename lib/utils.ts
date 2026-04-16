export interface Visit {
  id: number;
  doctor_id: number;
  visited_at: string; // 'YYYY-MM-DD'
  created_at: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  area: string;
  /** City / town within the area (e.g. "Halba" inside "Akkar") */
  city?: string | null;
  location: string;
  /** Google Maps share link or raw "lat,lng" — used by the trip planner */
  maps_url?: string | null;
  phone: string;
  days: string[];
  time: string;
  class: string;
  request: string;
  note: string;
  schedules: any;
  visits?: Visit[];
}

/**
 * Parses a Google Maps share link or raw "lat,lng" string and returns
 * coordinates when they can be determined client-side. Returns null for
 * shortlinks (maps.app.goo.gl / goo.gl/maps) since those require a network
 * redirect to resolve.
 */
export function extractLatLng(
  input: string | null | undefined,
): { lat: number; lng: number } | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;

  // Raw "lat,lng"
  const raw = /^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/.exec(s);
  if (raw) return { lat: parseFloat(raw[1]), lng: parseFloat(raw[2]) };

  // @lat,lng — most common in /maps/place/... URLs
  const at = /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/.exec(s);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };

  // !3d<lat>!4d<lng> — embedded inside place URLs
  const d = /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/.exec(s);
  if (d) return { lat: parseFloat(d[1]), lng: parseFloat(d[2]) };

  // ?q=lat,lng / ?ll=lat,lng / ?destination=lat,lng (commas can be URL-encoded)
  const q =
    /[?&](?:q|ll|destination)=(-?\d{1,3}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)/i.exec(s);
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };

  return null;
}

/**
 * Returns the best stop string for a Google Maps /dir/ multi-stop URL:
 * — lat,lng when we can parse the doctor's maps_url
 * — URL-encoded free-text location / area otherwise
 */
export function mapsDirectionsStop(doctor: Doctor): string {
  const coords = extractLatLng(doctor.maps_url);
  if (coords) return `${coords.lat},${coords.lng}`;
  const fallback = doctor.location?.trim() || `${doctor.area}, Lebanon`;
  return encodeURIComponent(fallback);
}

export type DoctorStatus = 'DEAL' | 'NEVER' | 'NEED_VISIT' | 'RECENT' | 'F';

/** Deal Priority doctors are those with class 'a' — no hardcoded names. */
export function isDeal(doctor: Doctor): boolean {
  return doctor.class === 'a';
}

export function getLastVisit(doctor: Doctor): Date | null {
  const visits = doctor.visits ?? [];
  if (visits.length === 0) return null;
  const dates = visits.map((v) => new Date(v.visited_at));
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

export function getDoctorStatus(doctor: Doctor): DoctorStatus {
  if (doctor.class === 'a') return 'DEAL';
  if (doctor.class?.toLowerCase() === 'f') return 'F';
  const last = getLastVisit(doctor);
  if (!last) return 'NEVER';
  const diffDays = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 12) return 'NEED_VISIT';
  return 'RECENT';
}

export function getSortWeight(doctor: Doctor): number {
  const weights: Record<DoctorStatus, number> = {
    DEAL: 0,
    NEVER: 1,
    NEED_VISIT: 2,
    RECENT: 3,
    F: 9,
  };
  return weights[getDoctorStatus(doctor)];
}

/** Primary sort: a (Deal Priority) → A (Priority) → B (Normal) → F (Colleague) */
export function getClassWeight(doctor: Doctor): number {
  switch (doctor.class) {
    case 'a': return 0;
    case 'A': return 1;
    case 'B': return 2;
    case 'F': return 3;
    default:  return 2;
  }
}

export function sortDoctors(doctors: Doctor[]): Doctor[] {
  return [...doctors].sort((a, b) => {
    const diff = getClassWeight(a) - getClassWeight(b);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}

export const STATUS_COLORS: Record<DoctorStatus, string> = {
  DEAL: '#f59e0b',
  NEVER: '#ff3d3d',
  NEED_VISIT: '#ff6b35',
  RECENT: '#00c853',
  F: '#555555',
};

export const STATUS_LABELS: Record<DoctorStatus, string> = {
  DEAL: '⭐ DEAL',
  NEVER: 'Never Visited',
  NEED_VISIT: 'Need Visit',
  RECENT: 'Recent',
  F: 'Colleague',
};

export function getClassBadge(cls: string): { label: string; color: string } {
  switch (cls?.toUpperCase()) {
    case 'A': return { label: 'A', color: '#00d4ff' };
    case 'B': return { label: 'B', color: '#6366f1' };
    case 'F': return { label: 'F', color: '#555' };
    default:
      if (cls?.toLowerCase() === 'a') return { label: 'A*', color: '#a78bfa' };
      return { label: cls || '?', color: '#6b7280' };
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function daysSince(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'today';
  if (diff === 1) return '1d ago';
  return `${diff}d ago`;
}

/** Short name for the current month, e.g. "Apr" */
export function getCurrentMonthName(): string {
  return new Date().toLocaleString('en', { month: 'short' });
}

/** Visit count for the current calendar month from the visits array. */
export function getCurrentMonthStatus(doctor: Doctor): 'none' | 'once' | 'twice' {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const count = (doctor.visits ?? []).filter((v) => v.visited_at.startsWith(prefix)).length;
  if (count >= 2) return 'twice';
  if (count === 1) return 'once';
  return 'none';
}

/** Returns visits for the current month, sorted newest first. */
export function getCurrentMonthVisits(doctor: Doctor): Visit[] {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return (doctor.visits ?? [])
    .filter((v) => v.visited_at.startsWith(prefix))
    .sort((a, b) => b.visited_at.localeCompare(a.visited_at));
}

/** Returns all visits sorted newest first. */
export function getAllVisitsSorted(doctor: Doctor): Visit[] {
  return [...(doctor.visits ?? [])].sort((a, b) =>
    b.visited_at.localeCompare(a.visited_at)
  );
}

export const AREAS = [
  'Tripoli',
  'Akkar',
  'Koura',
  'Batroun',
  'Zgharta',
  'Badawi',
  'Bared',
  'Menye',
  'Anfeh',
  'Chekka',
];

/** Known cities / towns per area. Free-text entry is always allowed in addition. */
export const CITIES: Record<string, string[]> = {
  Tripoli: ['Tripoli', 'Al Mina', 'Al Qobbeh', 'Bab el Tabbaneh', 'Zahrieh', 'Abu Samra', 'Baddawi'],
  Akkar:   [
    'Halba', 'Abde', 'Koubayat', 'Fneidek', 'Bebnine', 'Sir', 'Akkar el Atika',
    'Minyara', 'Rahbe', 'Qobaiyat', 'Andaqt', 'Bireh', 'Chadra', 'Dweir',
    'Fakiha', 'Hanouiyeh', 'Jousieh', 'Khirbet Daoud', 'Knaisse', 'Machha',
    'Mansourieh', 'Masharih', 'Mashta Hassan', 'Mrah', 'Nahleh', 'Qayteh',
    'Safra', 'Tal Abbas', 'Tikrit', 'Wadi Khaled', 'Zeitouneh',
  ],
  Koura:   ['Amioun', 'Kousba', 'Btourram', 'Barsa', 'Ras Maska', 'Hamat', 'Kfar Hazir'],
  Batroun: ['Batroun', 'Tannourine', 'Douma', 'Hamat', 'Kfar Helda'],
  Zgharta: ['Zgharta', 'Ehden', 'Miziara', 'Kfarsghab'],
  Badawi:  ['Badawi'],
  Bared:   ['Nahr el Bared', 'Beddawi'],
  Menye:   ['Menye', 'Sir el Denniyeh', 'Srar', 'Laqlouq', 'Kfar Remmane'],
  Anfeh:   ['Anfeh', 'Qalamoun'],
  Chekka:  ['Chekka', 'Heri'],
};

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Today as YYYY-MM-DD (local, using UTC to stay consistent with backend). */
export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Returns the Mon–Sat date strings (YYYY-MM-DD) for the ISO week that
 * contains dateStr.
 */
export function getWeekDates(dateStr: string): string[] {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const dow = d.getUTCDay(); // 0 = Sun
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 6 }, (_, i) => {
    const dt = new Date(monday);
    dt.setUTCDate(monday.getUTCDate() + i);
    return dt.toISOString().split('T')[0];
  });
}

/**
 * Converts a YYYY-MM-DD date to the matching doctor.days abbreviation.
 * e.g. '2026-04-17' (Thursday) → 'Thu'
 */
export function dateToDayAbbrev(dateStr: string): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return dayNames[new Date(`${dateStr}T12:00:00Z`).getUTCDay()];
}

/** "Thursday, 16 Apr 2026" */
export function formatFullDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "Thu 16" — used in week navigation pills */
export function formatNavDate(dateStr: string): { day: string; num: string } {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return {
    day: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    num: d.toLocaleDateString('en-US', { day:     'numeric', timeZone: 'UTC' }),
  };
}

/** "Apr 2026" */
export function formatMonthYear(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/** Move dateStr by +/- N weeks → returns the Monday of that week */
export function shiftWeek(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta * 7);
  return d.toISOString().split('T')[0];
}
export const SPECIALTIES = [
  'General Practitioner',
  'Internal Medicine',
  'Cardiology',
  'Pulmonology',
  'Pediatrics',
  'Gynecology',
  'Neurology',
  'Orthopedics',
  'ENT',
  'Dermatology',
  'Ophthalmology',
  'Psychiatry',
  'Surgery',
  'Oncology',
  'Urology',
  'Other',
];
