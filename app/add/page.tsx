'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AREAS, DAYS, Doctor } from '@/lib/utils';

const TODAY = new Date().toISOString().split('T')[0];

export default function AddDoctorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    area: '',
    location: '',
    phone: '',
    class: 'B',
    days: [] as string[],
    time: '',
    request: '',
    note: '',
    apr_visit1: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: Partial<Doctor>) => api.doctors.create(data),
    onSuccess: () => {
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
    if (!form.area) e.area = 'Area is required';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    createMutation.mutate({ ...form, apr_visit1: form.apr_visit1 || undefined } as any);
  };

  const inputClass = 'w-full bg-surface border border-line rounded-lg px-3 py-2.5 text-sm text-content placeholder-muted focus:outline-none focus:border-accent';

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <div className="bg-surface border-b border-line px-4 py-3 pr-14 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted hover:text-content p-1">←</button>
        <h1 className="text-lg font-bold text-content">Add New Doctor</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {errors.submit && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-muted block mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Dr. Full Name"
            className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Specialty */}
        <div>
          <label className="text-xs font-semibold text-muted block mb-1">Specialty</label>
          <input
            type="text"
            value={form.specialty}
            onChange={(e) => set('specialty', e.target.value)}
            placeholder="e.g. Internal Medicine"
            className={inputClass}
          />
        </div>

        {/* Area */}
        <div>
          <label className="text-xs font-semibold text-muted block mb-1">
            Area <span className="text-red-400">*</span>
          </label>
          <select
            value={form.area}
            onChange={(e) => set('area', e.target.value)}
            className={`${inputClass} ${errors.area ? 'border-red-500' : ''}`}
          >
            <option value="">Select area...</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          {errors.area && <p className="text-red-400 text-xs mt-1">{errors.area}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold text-muted block mb-1">Location / Clinic</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Clinic name or address"
            className={inputClass}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-semibold text-muted block mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+961 ..."
            className={inputClass}
          />
        </div>

        {/* Class */}
        <div>
          <label className="text-xs font-semibold text-muted block mb-1">Class</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'A',  label: 'A',   desc: 'Priority',  color: 'rgb(var(--c-accent))' },
              { value: 'a',  label: 'a★',  desc: 'Deal',      color: '#a78bfa' },
              { value: 'B',  label: 'B',   desc: 'Normal',    color: '#6366f1' },
              { value: 'F',  label: 'F',   desc: 'Colleague', color: '#6b7280' },
            ].map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => set('class', c.value)}
                className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                  form.class === c.value ? 'border-transparent text-white' : 'bg-surface text-muted border-line'
                }`}
                style={form.class === c.value ? { backgroundColor: c.color } : {}}
              >
                {c.label}
                <span className="block text-[9px] font-normal opacity-70">{c.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Days */}
        <div>
          <label className="text-xs font-semibold text-muted block mb-2">Available Days</label>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  form.days.includes(day)
                    ? 'bg-accent text-on-accent border-accent'
                    : 'bg-surface text-muted border-line hover:border-subtle'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div>
          <label className="text-xs font-semibold text-muted block mb-1">Time</label>
          <input
            type="text"
            value={form.time}
            onChange={(e) => set('time', e.target.value)}
            placeholder="e.g. 9am–1pm"
            className={inputClass}
          />
        </div>

        {/* Request */}
        <div>
          <label className="text-xs font-semibold text-muted block mb-1">Products / Request</label>
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
          <label className="text-xs font-semibold text-muted block mb-1">Note</label>
          <textarea
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Optional April visit */}
        <div>
          <label className="text-xs font-semibold text-muted block mb-1">
            April Visit 1 (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={form.apr_visit1}
              onChange={(e) => set('apr_visit1', e.target.value)}
              className="flex-1 bg-surface border border-line rounded-lg px-3 py-2.5 text-sm text-content focus:outline-none focus:border-[#FFD700]"
            />
            <button
              type="button"
              onClick={() => set('apr_visit1', TODAY)}
              className="px-3 py-2 bg-[#FFD700] text-black text-xs font-bold rounded-lg hover:bg-yellow-400"
            >
              Today
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full py-3.5 bg-accent text-on-accent font-bold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
        >
          {createMutation.isPending ? 'Adding...' : '➕ Add Doctor'}
        </button>
      </form>
    </div>
  );
}
