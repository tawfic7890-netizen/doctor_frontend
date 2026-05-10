'use client';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Doctor, DoctorDeal } from '@/lib/utils';

/* ── Icons ────────────────────────────────────────────────────────────── */
const IconSpinner = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>
);

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function BudgetPage() {
  const queryClient = useQueryClient();
  const [month] = useState(currentMonth);
  const [budgetInput, setBudgetInput] = useState('');
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealForm, setDealForm] = useState({ doctor_id: '', amount: '', note: '' });

  // Fetch budget summary, deals, and doctors
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['budget-summary', month],
    queryFn: () => api.budgets.summary(month),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['budget-deals', month],
    queryFn: () => api.budgets.deals(month),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-all'],
    queryFn: () => api.doctors.list({ hideF: false }),
  });

  const doctorMap = useMemo(() => {
    const map = new Map<number, Doctor>();
    doctors.forEach((d) => map.set(d.id, d));
    return map;
  }, [doctors]);

  const setBudgetMut = useMutation({
    mutationFn: (budget: number) => api.budgets.set(month, budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-summary', month] });
      setBudgetInput('');
    },
  });

  const createDealMut = useMutation({
    mutationFn: (body: { doctor_id: number; month: string; amount: number; note?: string }) =>
      api.budgets.createDeal(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-summary', month] });
      queryClient.invalidateQueries({ queryKey: ['budget-deals', month] });
      setDealForm({ doctor_id: '', amount: '', note: '' });
      setShowDealForm(false);
    },
  });

  const removeDealMut = useMutation({
    mutationFn: (id: number) => api.budgets.removeDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-summary', month] });
      queryClient.invalidateQueries({ queryKey: ['budget-deals', month] });
    },
  });

  function handleSetBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!budgetInput) return;
    setBudgetMut.mutate(Number(budgetInput));
  }

  function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    if (!dealForm.doctor_id || !dealForm.amount) return;
    createDealMut.mutate({
      doctor_id: Number(dealForm.doctor_id),
      month,
      amount: Number(dealForm.amount),
      note: dealForm.note || undefined,
    });
  }

  const monthLabel = new Date(`${month}-15`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const pct = summary && summary.budget > 0 ? Math.round((summary.spent / summary.budget) * 100) : 0;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-content mb-1">Deals & Budget</h1>
      <p className="text-xs text-muted mb-6">{monthLabel}</p>

      {/* Budget Summary Card */}
      <div className="p-4 rounded-2xl bg-surface border border-line mb-4">
        {loadingSummary ? (
          <div className="flex justify-center py-4"><IconSpinner /></div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-muted uppercase tracking-wider">Monthly Budget</span>
              <span className="text-lg font-bold text-content">
                ${summary?.budget?.toFixed(2) ?? '0.00'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-surface-2 mb-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#00c853',
                }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">
                Spent: <span className="text-content font-medium">${summary?.spent?.toFixed(2) ?? '0.00'}</span>
              </span>
              <span className="text-muted">
                Remaining: <span className={`font-medium ${(summary?.remaining ?? 0) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ${summary?.remaining?.toFixed(2) ?? '0.00'}
                </span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* Set Budget Form */}
      <form onSubmit={handleSetBudget} className="flex gap-2 mb-6">
        <input
          type="number"
          step="0.01"
          placeholder="Set budget amount..."
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-line text-content text-sm"
        />
        <button
          type="submit"
          disabled={!budgetInput || setBudgetMut.isPending}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50"
        >
          Set
        </button>
      </form>

      {/* Add Deal Button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-content">Doctor Deals</h2>
        <button
          onClick={() => setShowDealForm(!showDealForm)}
          className="px-3 py-1.5 rounded-xl bg-accent/15 text-accent text-xs font-semibold"
        >
          + Add Deal
        </button>
      </div>

      {/* Deal Form */}
      {showDealForm && (
        <form onSubmit={handleCreateDeal} className="mb-4 p-4 rounded-2xl bg-surface border border-line space-y-3">
          <select
            value={dealForm.doctor_id}
            onChange={(e) => setDealForm({ ...dealForm, doctor_id: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-content text-sm"
            required
          >
            <option value="">Select doctor...</option>
            {doctors
              .filter((d) => d.class === 'a')
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.area}</option>
              ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Amount *"
            value={dealForm.amount}
            onChange={(e) => setDealForm({ ...dealForm, amount: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-content text-sm"
            required
          />
          <input
            placeholder="Note (optional)"
            value={dealForm.note}
            onChange={(e) => setDealForm({ ...dealForm, note: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-content text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!dealForm.doctor_id || !dealForm.amount || createDealMut.isPending}
              className="flex-1 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createDealMut.isPending && <IconSpinner />}
              Add Deal
            </button>
            <button
              type="button"
              onClick={() => setShowDealForm(false)}
              className="px-4 py-2 rounded-xl bg-surface-2 text-muted text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Deals List */}
      {deals.length === 0 ? (
        <p className="text-center text-muted text-xs py-8">No deals allocated this month.</p>
      ) : (
        <div className="space-y-2">
          {deals.map((deal: DoctorDeal) => {
            const doc = doctorMap.get(deal.doctor_id);
            return (
              <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-line">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-content truncate">
                    {doc?.name ?? `Doctor #${deal.doctor_id}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="font-medium text-amber-400">${deal.amount}</span>
                    {deal.note && <span className="truncate">— {deal.note}</span>}
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm('Remove this deal?')) removeDealMut.mutate(deal.id); }}
                  className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-red-400 transition-colors"
                >
                  <IconTrash />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
