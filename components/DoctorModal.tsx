'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Doctor, AREAS, DAYS, formatDate, getDoctorStatus, STATUS_COLORS } from '@/lib/utils';
import { api } from '@/lib/api';

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
    location: '',
    days: [] as string[],
    time: '',
    request: '',
    note: '',
    apr_visit1: '',
    apr_visit2: '',
  });

  useEffect(() => {
    if (doctor) {
      setForm({
        class: doctor.class || '',
        phone: doctor.phone || '',
        location: doctor.location || '',
        days: Array.isArray(doctor.days) ? doctor.days : [],
        time: doctor.time || '',
        request: doctor.request || '',
        note: doctor.note || '',
        apr_visit1: doctor.apr_visit1 || '',
        apr_visit2: doctor.apr_visit2 || '',
      });
    }
  }, [doctor]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Doctor>) => api.doctors.update(doctor!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      onClose();
    },
  });

  const visitTodayMutation = useMutation({
    mutationFn: () => api.visits.visitToday(doctor!.id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setForm((f) => ({
        ...f,
        apr_visit1: updated.apr_visit1 || f.apr_visit1,
        apr_visit2: updated.apr_visit2 || f.apr_visit2,
      }));
    },
  });

  if (!doctor) return null;

  const status = getDoctorStatus(doctor);
  const statusColor = STATUS_COLORS[status];

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const handleSave = () => {
    updateMutation.mutate({
      class: form.class,
      phone: form.phone,
      location: form.location,
      days: form.days,
      time: form.time,
      request: form.request,
      note: form.note,
      apr_visit1: form.apr_visit1 || null,
      apr_visit2: form.apr_visit2 || null,
    } as any);
  };

  const inputClass = 'w-full bg-base border border-line rounded-lg px-3 py-2 text-sm text-content focus:outline-none focus:border-accent';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 md:right-0 md:top-0 md:left-auto md:w-[420px] bg-surface border-t md:border-t-0 md:border-l border-line z-50 flex flex-col max-h-[92vh] md:max-h-screen rounded-t-2xl md:rounded-none overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-line flex-shrink-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-content truncate">{doctor.name}</h2>
            <p className="text-xs text-muted">{doctor.specialty} · {doctor.area}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-content p-1 rounded-lg hover:bg-surface-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* March Reference */}
          <div className="bg-surface-2 rounded-lg p-3">
            <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">March 2026 Reference</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-subtle">Visit 1</p>
                <p className="text-sm text-content">{formatDate(doctor.mar_visit1)}</p>
              </div>
              <div>
                <p className="text-[10px] text-subtle">Visit 2</p>
                <p className="text-sm text-content">{formatDate(doctor.mar_visit2)}</p>
              </div>
            </div>
          </div>

          {/* April Visits */}
          <div>
            <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">April 2026 Visits</p>

            {/* Visit 1 */}
            <div className="mb-3">
              <label className="text-xs text-muted mb-1 block">Visit 1</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={form.apr_visit1}
                  onChange={(e) => setForm((f) => ({ ...f, apr_visit1: e.target.value }))}
                  className="flex-1 bg-base border border-line rounded-lg px-3 py-2 text-sm text-content focus:outline-none focus:border-[#FFD700]"
                />
                <button
                  onClick={() => setForm((f) => ({ ...f, apr_visit1: TODAY }))}
                  className="px-3 py-2 bg-[#FFD700] text-black text-xs font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Today
                </button>
                {form.apr_visit1 && (
                  <button
                    onClick={() => setForm((f) => ({ ...f, apr_visit1: '' }))}
                    className="px-3 py-2 bg-surface-2 text-muted text-xs rounded-lg hover:bg-line transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Visit 2 */}
            <div>
              <label className="text-xs text-muted mb-1 block">Visit 2</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={form.apr_visit2}
                  onChange={(e) => setForm((f) => ({ ...f, apr_visit2: e.target.value }))}
                  className="flex-1 bg-base border border-line rounded-lg px-3 py-2 text-sm text-content focus:outline-none focus:border-[#00A550]"
                />
                <button
                  onClick={() => setForm((f) => ({ ...f, apr_visit2: TODAY }))}
                  className="px-3 py-2 bg-[#00A550] text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors"
                >
                  Today
                </button>
                {form.apr_visit2 && (
                  <button
                    onClick={() => setForm((f) => ({ ...f, apr_visit2: '' }))}
                    className="px-3 py-2 bg-surface-2 text-muted text-xs rounded-lg hover:bg-line transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick visit */}
            <button
              onClick={() => visitTodayMutation.mutate()}
              disabled={visitTodayMutation.isPending}
              className="mt-3 w-full py-2 bg-accent/20 border border-accent/40 text-accent text-sm font-semibold rounded-lg hover:bg-accent/30 transition-colors disabled:opacity-50"
            >
              {visitTodayMutation.isPending ? 'Recording...' : '⚡ Quick Visit Today'}
            </button>
          </div>

          {/* Class */}
          <div>
            <label className="text-xs text-muted mb-1 block">Class</label>
            <select
              value={form.class}
              onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
              className={inputClass}
            >
              <option value="A">A — Priority</option>
              <option value="a">a — Deal Priority</option>
              <option value="B">B — Normal</option>
              <option value="F">F — Colleague (Do Not Visit)</option>
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs text-muted mb-1 block">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-muted mb-1 block">Location / Clinic</label>
            <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className={inputClass} />
          </div>

          {/* Days */}
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

          {/* Time */}
          <div>
            <label className="text-xs text-muted mb-1 block">Time</label>
            <input type="text" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} placeholder="e.g. 9am-1pm" className={inputClass} />
          </div>

          {/* Request */}
          <div>
            <label className="text-xs text-muted mb-1 block">Products / Request</label>
            <input type="text" value={form.request} onChange={(e) => setForm((f) => ({ ...f, request: e.target.value }))} className={inputClass} />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-muted mb-1 block">Note</label>
            <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line flex-shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-surface-2 text-content text-sm font-semibold rounded-xl hover:bg-line transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1 py-3 bg-accent text-on-accent text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
