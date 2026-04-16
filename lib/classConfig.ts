/**
 * Dynamic doctor class configuration.
 * Custom classes are persisted in localStorage under 'doctorClasses'.
 * Built-in classes are always present and cannot be removed.
 */

export interface ClassDef {
  value: string;   // single token, e.g. 'A', 'C', 'VIP'
  label: string;   // human-readable, e.g. 'Priority'
  color: string;   // CSS color for the badge, e.g. '#38bdf8'
  builtIn?: boolean;
}

export const BUILT_IN_CLASSES: ClassDef[] = [
  { value: 'A', label: 'Priority',  color: '#38bdf8', builtIn: true },
  { value: 'a', label: 'Deal',      color: '#fbbf24', builtIn: true },
  { value: 'B', label: 'Normal',    color: '#818cf8', builtIn: true },
  { value: 'F', label: 'Colleague', color: '#6b7280', builtIn: true },
];

const STORAGE_KEY = 'doctorClasses';

function load(): ClassDef[] {
  if (typeof window === 'undefined') return [...BUILT_IN_CLASSES];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const custom: ClassDef[] = raw ? JSON.parse(raw) : [];
    // Merge: built-ins first, then any custom ones not already present
    const builtInValues = new Set(BUILT_IN_CLASSES.map((c) => c.value));
    const extras = custom.filter((c) => !builtInValues.has(c.value));
    return [...BUILT_IN_CLASSES, ...extras];
  } catch {
    return [...BUILT_IN_CLASSES];
  }
}

function saveCustom(classes: ClassDef[]): void {
  if (typeof window === 'undefined') return;
  const custom = classes.filter((c) => !c.builtIn);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

export function getClasses(): ClassDef[] {
  return load();
}

export function getClassDef(value: string | null | undefined): ClassDef {
  if (!value) return { value: '?', label: '?', color: '#6b7280' };
  const found = load().find((c) => c.value === value);
  if (found) return found;
  // Unknown class — return a sensible default so the UI never breaks
  return { value, label: value, color: '#6b7280' };
}

export function addClass(def: Omit<ClassDef, 'builtIn'>): ClassDef[] {
  const all = load();
  if (all.find((c) => c.value === def.value)) {
    // Update existing custom class
    const updated = all.map((c) =>
      c.value === def.value && !c.builtIn ? { ...def } : c,
    );
    saveCustom(updated);
    return updated;
  }
  const updated = [...all, def];
  saveCustom(updated);
  return updated;
}

export function updateClass(value: string, patch: Partial<Omit<ClassDef, 'value' | 'builtIn'>>): ClassDef[] {
  const all = load();
  const updated = all.map((c) =>
    c.value === value && !c.builtIn ? { ...c, ...patch } : c,
  );
  saveCustom(updated);
  return updated;
}

export function deleteClass(value: string): ClassDef[] {
  const all = load();
  const updated = all.filter((c) => c.value !== value || c.builtIn);
  saveCustom(updated);
  return updated;
}
