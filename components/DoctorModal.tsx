'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Doctor, Visit, AREAS, CITIES, DAYS,
  formatDate, getDoctorStatus, STATUS_COLORS,
  getAllVisitsSorted, extractLatLng,
} from '@/lib/utils';
import { getClasses, ClassDef } from '@/lib/classConfig';
import { api } from '@/lib/api';
import MapPickerModal from '@/components/MapPickerModal';
import ClassManagerModal from '@/components/ClassManagerModal';

interface DoctorModalProps {
  doctor: Doctor | null;
  onClose: () => void;
}

const TODAY = new Date().toISOString().split('T')[0];

export default function DoctorModal({ doctor, onClose }: DoctorModalProps) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    class: '',
    phone: '',
    city: '',
    location: '',
    maps_url: '',
    days: [] as string[],
    time: '',
    request: '',
    note: '',
  });
  const [classDefs, setClassDefs] = useState<ClassDef[]>(() => getClasses());
  const [classManagerOpen, setClassManagerOpen] = useState(false);

  const [newVisitDate, setNewVisitDate] = useState(TODAY);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (doctor) {
      setForm({
        class: doctor.class || 'B',
        phone: doctor.phone || '',
        city: doctor.city || '',
        location: doctor.location || '',
        maps_url: doctor.maps_url || '',
        days: Array.isArray(doctor.days) ? doctor.days : [],
        time: doctor.time || '',
        request: doctor.request || '',
        note: doctor.note || '',
      });
      setNewVisitDate(TODAY);
      setShowDatePicker(false);
      setConfirmDelete(false);
      setSaveError(null);
    }
  }, [doctor]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['doctors'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Doctor>) => api.doctors.update(doctor!.id, data),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (e: any) => setSaveError(e.message || 'Failed to save changes'),
  });

  const visitTodayMutation = useMutation({
    mutationFn: () => api.visits.visitToday(doctor!.id),
    onSuccess: invalidate,
  });

  const recordVisitMutation = useMutation({
    mutationFn: (date: string) => api.visits.record(doctor!.id, date),
    onSuccess: () => { invalidate(); setShowDatePicker(false); setNewVisitDate(TODAY); },
  });

  const clearVisitMutation = useMutation({
    mutationFn: (visitId: number) => api.visits.clear(doctor!.id, visitId),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.doctors.delete(doctor!.id),
    onSuccess: () => { invalidate(); onClose(); },
  });

  if (!doctor) return null;

  const status = getDoctorStatus(doctor);
  const statusColor = STATUS_COLORS[status];
  const visits = getAllVisitsSorted(doctor);

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const handleSave = () => {
    setSaveError(null);
    updateMutation.mutate({
      class:    form.class           || undefined,
      phone:    form.phone           || null,
      city:     form.city.trim()     || null,
      location: form.location        || null,
      maps_url: form.maps_url.trim() || null,
      days:     form.days,
      time:     form.time            || null,
      request:  form.request         || null,
      note:     form.note            || null,
    } as any);
  };

  const inputClass =
    'w-full bg-base border border-line rounded-lg px-3 py-2 text-sm text-content focus:outline-none focus:border-accent';

  // Group visits by month label
  const groupedVisits: { label: string; items: Visit[] }[] = [];
  for (const v of visits) {
    const d = new Date(v.visited_at);
    const label = d.toLocaleString('en', { month: 'long', year: 'numeric' });
    const last = groupedVisits[groupedVisits.length - 1];
    if (last && last.label === label) {
      last.items.push(v);
    } else {
      groupedVisits.push({ label, items: [v] });
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 animate-fade-up" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed bottom-14 left-0 right-0 md:bottom-0 md:right-0 md:top-0 md:left-auto md:w-[440px] border-t md:border-t-0 md:border-l border-line z-50 flex flex-col max-h-[calc(92vh-56px)] md:max-h-screen rounded-t-2xl md:rounded-none overflow-hidden animate-fade-up"
        style={{
          background: 'linear-gradient(180deg, rgb(var(--c-surface)) 0%, rgb(var(--c-base)) 100%)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div
          className="relative flex items-center gap-3 p-4 border-b border-line flex-shrink-0 overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top left, ${statusColor}18 0%, transparent 60%)`,
            }}
          />
          <div className="relative w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor, boxShadow: `0 0 10px ${statusColor}` }} />
          <div className="relative flex-1 min-w-0">
            <h2 className="font-bold text-content truncate tracking-tight">{doctor.name}</h2>
            <p className="text-xs text-muted">{doctor.specialty} · {doctor.area}</p>
          </div>
          <button
            onClick={onClose}
            className="relative w-8 h-8 flex items-center justify-center text-muted hover:text-content rounded-lg hover:bg-surface-2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* ── Visits ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                Visit History ({visits.length})
              </p>
              <button
                onClick={() => visitTodayMutation.mutate()}
                disabled={visitTodayMutation.isPending}
                className="text-[11px] bg-accent/15 border border-accent/25 text-accent px-3 py-1 rounded-lg font-semibold hover:bg-accent/25 transition-colors disabled:opacity-50"
              >
                {visitTodayMutation.isPending ? 'Recording…' : '+ Visit Today'}
              </button>
            </div>

            {/* Visits list */}
            {visits.length === 0 ? (
              <p className="text-xs text-muted italic py-2">No visits recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {groupedVisits.map(({ label, items }) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-subtle uppercase tracking-wider mb-1">{label}</p>
                    <div className="space-y-1">
                      {items.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm text-content">{formatDate(v.visited_at)}</span>
                          <button
                            onClick={() => clearVisitMutation.mutate(v.id)}
                            disabled={clearVisitMutation.isPending && clearVisitMutation.variables === v.id}
                            className="text-muted hover:text-red-400 transition-colors p-1 disabled:opacity-40"
                            title="Delete visit"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add specific date */}
            {showDatePicker ? (
              <div className="mt-3 flex gap-2">
                <input
                  type="date"
                  value={newVisitDate}
                  onChange={(e) => setNewVisitDate(e.target.value)}
                  className="flex-1 bg-base border border-line rounded-lg px-3 py-2 text-sm text-content focus:outline-none focus:border-accent"
                />
                <button
                  onClick={() => recordVisitMutation.mutate(newVisitDate)}
                  disabled={!newVisitDate || recordVisitMutation.isPending}
                  className="px-3 py-2 bg-accent text-on-accent text-xs font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {recordVisitMutation.isPending ? '...' : 'Add'}
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="px-3 py-2 bg-surface-2 text-muted text-xs rounded-lg hover:bg-line transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDatePicker(true)}
                className="mt-3 w-full py-2 border border-dashed border-line text-xs text-muted rounded-lg hover:border-accent hover:text-accent transition-colors"
              >
                + Add specific date
              </button>
            )}
          </div>

          {/* ── Class ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-muted">Class</label>
              <button
                type="button"
                onClick={() => setClassManagerOpen(true)}
                className="text-[11px] text-accent hover:underline flex items-center gap-1"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Manage
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {classDefs.map((c) => {
                const active = form.class === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, class: c.value }))}
                    className={`flex-1 min-w-[60px] py-2 rounded-lg text-xs font-bold border transition-all ${
                      active ? 'border-transparent' : 'bg-base text-muted border-line hover:border-line-2'
                    }`}
                    style={active ? {
                      background: c.color,
                      color: 'rgb(var(--c-on-accent))',
                      boxShadow: `0 4px 12px -2px ${c.color}88`,
                    } : {}}
                  >
                    {c.value}
                    <span className="block text-[9px] font-normal opacity-80 mt-0.5 truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── City ── */}
          <div>
            <label className="text-xs text-muted mb-1.5 block">City / Town</label>
            {(CITIES[doctor.area]?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CITIES[doctor.area].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, city: f.city === c ? '' : c }))}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                      form.city === c
                        ? 'border-transparent text-on-accent'
                        : 'bg-base text-muted border-line hover:border-line-2'
                    }`}
                    style={form.city === c ? {
                      background: 'linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-2)))',
                      boxShadow: '0 4px 10px -2px rgb(var(--c-accent) / 0.45)',
                    } : {}}
                  >{c}</button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="Or type a city…"
              className={inputClass}
            />
          </div>

          {/* ── Phone ── */}
          <div>
            <label className="text-xs text-muted mb-1 block">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* ── Location ── */}
          <div>
            <label className="text-xs text-muted mb-1 block">Location / Clinic</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* ── Map location ── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Map Location
              </label>
              {form.maps_url && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, maps_url: '' }))}
                  className="text-[11px] text-muted hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {(() => {
              const coords = extractLatLng(form.maps_url);
              return (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className={`w-full text-left flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                    coords
                      ? 'bg-accent/8 border-accent/40 hover:border-accent/60'
                      : 'bg-base border-line hover:border-line-2'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      coords ? 'text-on-accent' : 'bg-surface-2 text-muted'
                    }`}
                    style={coords ? {
                      background: 'linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-2)))',
                      boxShadow: '0 4px 12px -2px rgb(var(--c-accent) / 0.45)',
                    } : {}}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </span>
                  <span className="flex-1 min-w-0">
                    {coords ? (
                      <>
                        <span className="block text-sm font-semibold text-content">Pin saved</span>
                        <span className="block text-[11px] text-muted tabular truncate">
                          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="block text-sm font-medium text-content">Tap to pick on map</span>
                        <span className="block text-[11px] text-muted truncate">
                          Search, drop a pin, or use GPS
                        </span>
                      </>
                    )}
                  </span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-subtle flex-shrink-0">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              );
            })()}
          </div>

          {/* ── Days ── */}
          <div>
            <label className="text-xs text-muted mb-2 block">Days Available</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.days.includes(day)
                      ? 'bg-accent text-on-accent border-accent'
                      : 'bg-base text-muted border-line hover:border-subtle'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* ── Time ── */}
          <div>
            <label className="text-xs text-muted mb-1 block">Time</label>
            <input
              type="text"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              placeholder="e.g. 9am-1pm"
              className={inputClass}
            />
          </div>

          {/* ── Request ── */}
          <div>
            <label className="text-xs text-muted mb-1 block">Products / Request</label>
            <input
              type="text"
              value={form.request}
              onChange={(e) => setForm((f) => ({ ...f, request: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* ── Note ── */}
          <div>
            <label className="text-xs text-muted mb-1 block">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line flex-shrink-0 space-y-2">
          {saveError && (
            <p className="text-xs text-red-400 text-center pb-1">{saveError}</p>
          )}
          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 bg-surface-2 text-content text-sm font-semibold rounded-xl hover:bg-line transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-surface-2 text-content text-sm font-semibold rounded-xl hover:bg-line transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="btn-primary flex-1 py-3 text-sm font-bold rounded-xl disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
          {!confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 text-red-400 text-sm font-semibold rounded-xl border border-red-400/30 hover:bg-red-500/10 transition-colors"
            >
              Delete Doctor
            </button>
          )}
        </div>
      </div>

      {pickerOpen && (
        <MapPickerModal
          initialValue={form.maps_url}
          areaHint={doctor.area}
          onSave={(value) => { setForm((f) => ({ ...f, maps_url: value })); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {classManagerOpen && (
        <ClassManagerModal
          onClose={() => {
            setClassManagerOpen(false);
            setClassDefs(getClasses());
          }}
        />
      )}
    </>
  );
}
