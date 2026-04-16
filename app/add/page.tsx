'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AREAS, CITIES, DAYS, Doctor, extractLatLng, todayStr } from '@/lib/utils';
import { getClasses, ClassDef } from '@/lib/classConfig';
import MapPickerModal from '@/components/MapPickerModal';
import ClassManagerModal from '@/components/ClassManagerModal';

/* ── Icons ────────────────────────────────────────────────────────────── */
const IconBack = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconUserPlus = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
  </svg>
);
const IconClose = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconAlert = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconPin = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconSpinner = ({ size = 15 }: { size?: number }) => (
  <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export default function AddDoctorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name:         '',
    specialty:    '',
    area:         '',
    city:         '',
    location:     '',
    maps_url:     '',
    phone:        '',
    class:        'B',
    days:         [] as string[],
    time:         '',
    request:      '',
    note:         '',
    initialVisit: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [classManagerOpen, setClassManagerOpen] = useState(false);
  const [classDefs, setClassDefs] = useState<ClassDef[]>(() => getClasses());

  const createMutation = useMutation({
    mutationFn: (data: Partial<Doctor>) => api.doctors.create(data),
    onSuccess: async (newDoctor) => {
      // If an initial visit date was provided, record it now
      if (form.initialVisit) {
        try {
          await api.visits.record(newDoctor.id, form.initialVisit);
        } catch {
          // Visit recording failed — doctor was still created successfully
        }
      }
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      router.push('/doctors');
    },
    onError: (e: any) => {
      setErrors({ submit: e.message || 'Failed to add doctor' });
    },
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.area)        e.area = 'Area is required';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // Strip initialVisit — it's not a doctor field; handled in onSuccess
    const { initialVisit: _iv, maps_url, city, ...rest } = form;
    const doctorData: Partial<Doctor> = {
      ...rest,
      city:     city.trim()     || null,
      maps_url: maps_url.trim() || null,
    };
    createMutation.mutate(doctorData);
  };

  const inputClass =
    'w-full bg-surface border border-line rounded-xl px-3.5 py-2.5 text-sm text-content placeholder-muted focus:outline-none focus:border-accent';

  // Refresh classDefs from localStorage when manager modal closes
  function onClassManagerClose() {
    setClassManagerOpen(false);
    setClassDefs(getClasses());
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgb(var(--c-accent) / 0.14) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgb(var(--c-accent-2) / 0.10) 0%, transparent 50%)',
          }}
        />
        <div className="relative px-4 py-4 pl-14 pr-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-surface border border-line text-muted hover:text-content hover:border-line-2 transition-colors flex items-center justify-center flex-shrink-0"
            aria-label="Go back"
          >
            <IconBack size={15} />
          </button>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-on-accent"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-2)))',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <IconUserPlus size={16} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-content tracking-tight">Add New Doctor</h1>
            <p className="text-xs text-muted mt-0.5">Create a new entry in your tracker</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5 max-w-lg mx-auto">
        {errors.submit && (
          <div
            className="flex items-start gap-2 rounded-xl p-3 text-sm animate-fade-up"
            style={{
              background: 'rgb(var(--c-danger) / 0.10)',
              border: '1px solid rgb(var(--c-danger) / 0.30)',
              color: 'rgb(var(--c-danger))',
            }}
          >
            <span className="mt-0.5 flex-shrink-0"><IconAlert /></span>
            <span>{errors.submit}</span>
          </div>
        )}

        {/* ── Basic info card ── */}
        <section className="card-elevated p-4 space-y-4">
          <p className="text-[10px] font-bold text-subtle uppercase tracking-wider">Basic Info</p>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1.5">
              Name <span style={{ color: 'rgb(var(--c-danger))' }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Dr. Full Name"
              className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--c-danger))' }}>{errors.name}</p>
            )}
          </div>

          {/* Specialty */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1.5">Specialty</label>
            <input
              type="text"
              value={form.specialty}
              onChange={(e) => set('specialty', e.target.value)}
              placeholder="e.g. Internal Medicine"
              className={inputClass}
            />
          </div>

          {/* Class */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted">Class</label>
              <button
                type="button"
                onClick={() => setClassManagerOpen(true)}
                className="text-[11px] text-accent hover:underline flex items-center gap-1"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Manage classes
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 flex-wrap">
              {classDefs.map((c) => {
                const active = form.class === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set('class', c.value)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      active ? 'border-transparent' : 'bg-surface text-muted border-line hover:border-line-2'
                    }`}
                    style={active ? {
                      background: c.color,
                      color: 'rgb(var(--c-on-accent))',
                      boxShadow: `0 6px 16px -4px ${c.color}88`,
                    } : {}}
                  >
                    {c.value}
                    <span className="block text-[9px] font-medium opacity-80 mt-0.5 truncate px-1">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Location card ── */}
        <section className="card-elevated p-4 space-y-4">
          <p className="text-[10px] font-bold text-subtle uppercase tracking-wider">Location & Contact</p>

          {/* Area */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1.5">
              Area <span style={{ color: 'rgb(var(--c-danger))' }}>*</span>
            </label>
            <select
              value={form.area}
              onChange={(e) => { set('area', e.target.value); set('city', ''); }}
              className={`${inputClass} ${errors.area ? 'border-red-500' : ''}`}
            >
              <option value="">Select area...</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            {errors.area && (
              <p className="text-xs mt-1" style={{ color: 'rgb(var(--c-danger))' }}>{errors.area}</p>
            )}
          </div>

          {/* City */}
          {form.area && (
            <div>
              <label className="text-xs font-semibold text-muted block mb-1.5">City / Town</label>
              {/* Known cities as pills */}
              {(CITIES[form.area]?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {CITIES[form.area].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('city', form.city === c ? '' : c)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                        form.city === c
                          ? 'border-transparent text-on-accent'
                          : 'bg-surface text-muted border-line hover:border-line-2'
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
                onChange={(e) => set('city', e.target.value)}
                placeholder="Or type a city…"
                className={inputClass}
              />
            </div>
          )}

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1.5">Location / Clinic</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Clinic name or address"
              className={inputClass}
            />
          </div>

          {/* Map location */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                <span className="text-accent"><IconPin /></span>
                Map Location <span className="text-subtle font-normal">(recommended)</span>
              </label>
              {form.maps_url && (
                <button
                  type="button"
                  onClick={() => set('maps_url', '')}
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
                  className={`w-full text-left flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                    coords
                      ? 'bg-accent/8 border-accent/40 hover:border-accent/60'
                      : 'bg-surface border-line hover:border-line-2'
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
                    <IconPin size={15} />
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
                          Search, drop a pin, or use your GPS
                        </span>
                      </>
                    )}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-subtle flex-shrink-0">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              );
            })()}
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1.5">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+961 ..."
              className={inputClass}
            />
          </div>
        </section>

        {/* ── Schedule card ── */}
        <section className="card-elevated p-4 space-y-4">
          <p className="text-[10px] font-bold text-subtle uppercase tracking-wider">Schedule</p>

          {/* Days */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-2">Available Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day) => {
                const active = form.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? 'btn-primary border-transparent'
                        : 'bg-surface text-muted border-line hover:border-line-2 hover:text-content'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1.5">Time</label>
            <input
              type="text"
              value={form.time}
              onChange={(e) => set('time', e.target.value)}
              placeholder="e.g. 9am–1pm"
              className={inputClass}
            />
          </div>
        </section>

        {/* ── Details card ── */}
        <section className="card-elevated p-4 space-y-4">
          <p className="text-[10px] font-bold text-subtle uppercase tracking-wider">Details</p>

          {/* Request */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1.5">Products / Request</label>
            <input
              type="text"
              value={form.request}
              onChange={(e) => set('request', e.target.value)}
              placeholder="Products doctor prescribes"
              className={inputClass}
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1.5">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              rows={3}
              placeholder="Anything worth remembering"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Initial Visit (optional) */}
          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Initial Visit <span className="text-subtle font-normal">(optional)</span>
            </label>
            <p className="text-[11px] text-muted mb-2">Record a first visit date right away</p>
            <div className="flex gap-2">
              <input
                type="date"
                value={form.initialVisit}
                onChange={(e) => set('initialVisit', e.target.value)}
                className="flex-1 bg-surface border border-line rounded-xl px-3 py-2.5 text-sm text-content focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => set('initialVisit', todayStr())}
                className="px-3 py-2 bg-accent/15 text-accent border border-accent/30 text-xs font-bold rounded-xl hover:bg-accent/25 transition-colors"
              >
                Today
              </button>
              {form.initialVisit && (
                <button
                  type="button"
                  onClick={() => set('initialVisit', '')}
                  className="px-3 py-2 bg-surface-2 text-muted text-xs rounded-xl hover:bg-line hover:text-content transition-colors flex items-center justify-center"
                  aria-label="Clear date"
                >
                  <IconClose size={11} />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="btn-primary w-full py-3.5 font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? (
            <>
              <IconSpinner /> Adding...
            </>
          ) : (
            <>
              <IconUserPlus size={15} /> Add Doctor
            </>
          )}
        </button>

        <div className="h-4" />
      </form>

      {pickerOpen && (
        <MapPickerModal
          initialValue={form.maps_url}
          areaHint={form.area}
          onSave={(value) => { set('maps_url', value); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {classManagerOpen && (
        <ClassManagerModal onClose={onClassManagerClose} />
      )}
    </div>
  );
}
