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
  location: string;
  phone: string;
  days: string[];
  time: string;
  class: string;
  request: string;
  note: string;
  schedules: any;
  visits?: Visit[];
}

export type DoctorStatus = 'DEAL' | 'NEVER' | 'NEED_VISIT' | 'RECENT' | 'F';

export const DEAL_NAMES = ['abdulrazak othman', 'ayad fallah', 'ahmad moustafa'];

export function isDeal(doctor: Doctor): boolean {
  const name = doctor.name?.toLowerCase() || '';
  return DEAL_NAMES.some((n) => name.includes(n));
}

export function getLastVisit(doctor: Doctor): Date | null {
  const visits = doctor.visits ?? [];
  if (visits.length === 0) return null;
  const dates = visits.map((v) => new Date(v.visited_at));
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

export function getDoctorStatus(doctor: Doctor): DoctorStatus {
  if (isDeal(doctor)) return 'DEAL';
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

export function sortDoctors(doctors: Doctor[]): Doctor[] {
  return [...doctors].sort((a, b) => {
    const wa = getSortWeight(a);
    const wb = getSortWeight(b);
    if (wa !== wb) return wa - wb;
    if (a.area < b.area) return -1;
    if (a.area > b.area) return 1;
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

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
