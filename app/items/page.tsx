'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Item } from '@/lib/utils';
import {
  DndContext, closestCenter, DragEndEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
const IconGrip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
  </svg>
);

function SortableItem({ id, children }: { id: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
      }}
    >
      <div className="flex items-stretch">
        <button
          {...attributes}
          {...listeners}
          className="flex items-center px-1.5 text-subtle hover:text-muted touch-none cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <IconGrip />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

export default function ItemsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', ingredients: '' });
  const [orderedItems, setOrderedItems] = useState<Item[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => api.items.list(),
  });

  // Sync fetched items into local ordered state
  useEffect(() => {
    if (items.length > 0) {
      setOrderedItems((prev) => {
        // Preserve existing order for items that still exist, append new ones
        const existingIds = new Set(prev.map((i) => i.id));
        const fetched = new Map(items.map((i) => [i.id, i]));
        const kept = prev.filter((i) => fetched.has(i.id)).map((i) => fetched.get(i.id)!);
        const newItems = items.filter((i) => !existingIds.has(i.id));
        return [...kept, ...newItems];
      });
    }
  }, [items]);

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const sensors = useSensors(pointerSensor, touchSensor);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedItems((prev) => {
      const oldIdx = prev.findIndex((i) => i.id === active.id);
      const newIdx = prev.findIndex((i) => i.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      const next = [...prev];
      next.splice(oldIdx, 1);
      next.splice(newIdx, 0, prev[oldIdx]);
      return next;
    });
  }

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
  const displayItems = orderedItems.length > 0 ? orderedItems : items;

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
      ) : displayItems.length === 0 ? (
        <p className="text-center text-muted text-sm py-12">No items yet. Add your first product.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {displayItems.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <SortableItem key={item.id} id={item.id}>
                    <div
                      className="p-4 rounded-2xl bg-surface border border-line cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-content text-sm truncate">{item.name}</h3>
                          {item.description && (
                            <p className={`text-xs text-muted mt-0.5 ${isExpanded ? '' : 'line-clamp-2'}`}>{item.description}</p>
                          )}
                          <div className="flex gap-3 mt-2 text-xs text-subtle flex-wrap">
                            {item.price != null && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                                ${item.price}
                              </span>
                            )}
                            {item.ingredients && !isExpanded && (
                              <span className="truncate max-w-[200px]">{item.ingredients}</span>
                            )}
                          </div>
                          {isExpanded && item.ingredients && (
                            <p className="text-xs text-subtle mt-2 leading-relaxed">{item.ingredients}</p>
                          )}
                        </div>
                        <div className="flex gap-1.5 ml-2 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                            className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-accent transition-colors"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${item.name}"?`)) deleteMut.mutate(item.id); }}
                            className="p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-red-400 transition-colors"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </SortableItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
