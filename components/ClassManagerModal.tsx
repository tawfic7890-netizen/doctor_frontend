'use client';
import { useEffect, useState } from 'react';
import {
  ClassDef, getClasses, addClass, updateClass, deleteClass,
} from '@/lib/classConfig';
import Portal from '@/components/Portal';

const PALETTE = [
  '#38bdf8', '#818cf8', '#a78bfa', '#f472b6',
  '#34d399', '#fbbf24', '#fb923c', '#f87171',
  '#6b7280', '#2dd4bf', '#60a5fa', '#e879f9',
];

interface Props { onClose: () => void }

export default function ClassManagerModal({ onClose }: Props) {
  const [classes, setClasses] = useState<ClassDef[]>([]);
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#38bdf8');
  const [error, setError] = useState('');
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');

  useEffect(() => { setClasses(getClasses()); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleAdd() {
    const v = newValue.trim().toUpperCase();
    const l = newLabel.trim();
    if (!v) { setError('Class code is required'); return; }
    if (!/^[A-Za-z0-9]+$/.test(v)) { setError('Code must be alphanumeric (e.g. C, VIP, P1)'); return; }
    if (v.length > 10) { setError('Code must be 10 characters or fewer'); return; }
    if (!l) { setError('Label is required'); return; }
    setError('');
    const updated = addClass({ value: v, label: l, color: newColor });
    setClasses(updated);
    setNewValue('');
    setNewLabel('');
    setNewColor('#38bdf8');
  }

  function startEdit(def: ClassDef) {
    setEditingValue(def.value);
    setEditLabel(def.label);
    setEditColor(def.color);
  }

  function saveEdit(value: string) {
    const updated = updateClass(value, { label: editLabel.trim() || editLabel, color: editColor });
    setClasses(updated);
    setEditingValue(null);
  }

  function handleDelete(value: string) {
    const updated = deleteClass(value);
    setClasses(updated);
  }

  const customClasses = classes.filter((c) => !c.builtIn);
  const builtInClasses = classes.filter((c) => c.builtIn);

  return (
    <Portal>
    <>
      {/* Full-viewport flex container — backdrop + centering in one, no transform-based positioning */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70] flex items-center justify-center p-4"
        onClick={onClose}
      >
      <div
        className="w-full max-w-[480px] max-h-[80vh] rounded-2xl border border-line flex flex-col overflow-hidden animate-fade-up"
        style={{ background: 'rgb(var(--c-surface))', boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-line flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-accent flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-2)))', boxShadow: 'var(--shadow-glow)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-content">Manage Doctor Classes</h2>
            <p className="text-[11px] text-muted mt-0.5">Add custom classes beyond the built-in ones</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-muted hover:text-content rounded-lg hover:bg-surface-2 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Built-in classes (read-only) */}
          <div>
            <p className="text-[10px] font-bold text-subtle uppercase tracking-wider mb-2">Built-in Classes</p>
            <div className="grid grid-cols-2 gap-2">
              {builtInClasses.map((c) => (
                <div
                  key={c.value}
                  className="flex items-center gap-2 bg-surface-2 rounded-xl px-3 py-2.5 border border-line"
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs text-on-accent flex-shrink-0"
                       style={{ background: c.color }}>
                    {c.value}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-content">{c.label}</p>
                    <p className="text-[10px] text-subtle">Built-in</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom classes */}
          {customClasses.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-subtle uppercase tracking-wider mb-2">Custom Classes</p>
              <div className="space-y-2">
                {customClasses.map((c) => (
                  <div key={c.value} className="bg-surface-2 rounded-xl border border-line overflow-hidden">
                    {editingValue === c.value ? (
                      <div className="p-3 space-y-2">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full bg-base border border-line rounded-lg px-3 py-2 text-sm text-content focus:outline-none focus:border-accent"
                          placeholder="Label"
                        />
                        <div>
                          <p className="text-[11px] text-muted mb-1.5">Color</p>
                          <div className="flex flex-wrap gap-2">
                            {PALETTE.map((col) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setEditColor(col)}
                                className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                                  editColor === col ? 'scale-110 border-white' : 'border-transparent'
                                }`}
                                style={{ background: col }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingValue(null)}
                            className="flex-1 py-2 bg-surface-3 text-muted text-xs font-semibold rounded-lg hover:bg-line transition-colors"
                          >Cancel</button>
                          <button
                            type="button"
                            onClick={() => saveEdit(c.value)}
                            className="btn-primary flex-1 py-2 text-xs font-bold rounded-lg"
                          >Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-on-accent flex-shrink-0"
                          style={{ background: c.color, boxShadow: `0 4px 10px -2px ${c.color}88` }}
                        >
                          {c.value}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-content">{c.label}</p>
                          <p className="text-[10px] text-subtle">Custom</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="text-muted hover:text-content p-1.5 rounded-lg hover:bg-surface-3 transition-colors"
                          title="Edit"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.value)}
                          className="text-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new class */}
          <div>
            <p className="text-[10px] font-bold text-subtle uppercase tracking-wider mb-2">Add New Class</p>
            <div
              className="rounded-xl border border-line p-3 space-y-3"
              style={{ background: 'rgb(var(--c-surface-2))' }}
            >
              <div className="flex gap-2">
                <div className="w-20">
                  <p className="text-[11px] text-muted mb-1">Code</p>
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => { setNewValue(e.target.value.toUpperCase()); setError(''); }}
                    placeholder="C"
                    maxLength={10}
                    className="w-full bg-base border border-line rounded-lg px-3 py-2 text-sm text-content font-bold focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-muted mb-1">Label</p>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => { setNewLabel(e.target.value); setError(''); }}
                    placeholder="e.g. Pharmacist"
                    className="w-full bg-base border border-line rounded-lg px-3 py-2 text-sm text-content focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <p className="text-[11px] text-muted mb-1.5">Color</p>
                <div className="flex flex-wrap gap-2">
                  {PALETTE.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewColor(col)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${
                        newColor === col ? 'scale-110 border-white shadow-md' : 'border-transparent'
                      }`}
                      style={{ background: col }}
                    />
                  ))}
                </div>
              </div>
              {error && (
                <p className="text-[11px]" style={{ color: 'rgb(var(--c-danger))' }}>{error}</p>
              )}
              {/* Preview */}
              {(newValue || newLabel) && (
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-muted">Preview:</p>
                  <span
                    className="text-[11px] font-bold px-2 py-1 rounded-md border"
                    style={{
                      background: `${newColor}20`,
                      color: newColor,
                      borderColor: `${newColor}50`,
                    }}
                  >
                    {newValue || 'CODE'} — {newLabel || 'Label'}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={handleAdd}
                className="btn-primary w-full py-2.5 text-sm font-bold rounded-xl"
              >
                Add Class
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
    </Portal>
  );
}
