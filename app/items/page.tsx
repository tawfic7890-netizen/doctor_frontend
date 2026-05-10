'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Item } from '@/lib/utils';

/* ── Icons ────────────────────────────────────────────────────────────── */
const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconSpinner = () => (
  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', ingredients: '' });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => api.items.list(),
  });

  const createMut = useMutation({
    mutationFn: (body: Partial<Item>) => api.items.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      resetForm();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Item> }) => api.items.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      resetForm();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.items.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });

  function resetForm() {
    setForm({ name: '', description: '', price: '', ingredients: '' });
    setShowForm(false);
    setEditItem(null);
  }

  function openEdit(item: Item) {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price != null ? String(item.price) : '',
      ingredients: item.ingredients || '',
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: Partial<Item> = {
      name: form.name,
      description: form.description || undefined,
      price: form.price ? Number(form.price) : undefined,
      ingredients: form.ingredients || undefined,
    };
    if (editItem) {
      updateMut.mutate({ id: editItem.id, body });
    } else {
      createMut.mutate(body);
    }
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-content">Items / Products</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/15 text-accent text-sm font-semibold"
        >
          <IconPlus /> Add
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-2xl bg-surface border border-line space-y-3">
          <h2 className="text-sm font-semibold text-content mb-2">
            {editItem ? 'Edit Item' : 'New Item'}
          </h2>
          <input
            className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-content text-sm"
            placeholder="Item name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <textarea
            className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-content text-sm resize-none"
            placeholder="Description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-content text-sm"
            placeholder="Price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <textarea
            className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line text-content text-sm resize-none"
            placeholder="Ingredients / composition"
            rows={2}
            value={form.ingredients}
            onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!form.name || saving}
              className="flex-1 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <IconSpinner />}
              {editItem ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl bg-surface-2 text-muted text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Items List */}
      {isLoading ? (
        <div className="flex justify-center py-12 text-muted"><IconSpinner /></div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted text-sm py-12">No items yet. Add your first product.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-surface border border-line">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-content text-sm truncate">{item.name}</h3>
                  {item.description && (
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-subtle">
                    {item.price != null && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                        ${item.price}
                      </span>
                    )}
                    {item.ingredients && (
                      <span className="truncate max-w-[200px]">{item.ingredients}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 ml-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-accent transition-colors"
                  >
                    <IconEdit />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteMut.mutate(item.id); }}
                    className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-red-400 transition-colors"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
