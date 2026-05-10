'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Item, ItemAssignment } from '@/lib/utils';

interface Props {
  doctorId: number;
  doctorName: string;
  planDate: string;
  onClose: () => void;
}

const IconSpinner = () => (
  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export default function ItemAssignModal({ doctorId, doctorName, planDate, onClose }: Props) {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState('');

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => api.items.list(),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['item-assignments', planDate, doctorId],
    queryFn: () => api.items.assignments({ plan_date: planDate, doctor_id: doctorId }),
  });

  const assignMut = useMutation({
    mutationFn: (itemId: number) =>
      api.items.assign({ item_id: itemId, doctor_id: doctorId, plan_date: planDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-assignments', planDate, doctorId] });
      setSelectedItem('');
    },
  });

  const toggleStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'pending' | 'done' }) =>
      api.items.updateAssignment(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-assignments', planDate, doctorId] });
    },
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => api.items.removeAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-assignments', planDate, doctorId] });
    },
  });

  const assignedItemIds = new Set(assignments.map((a: ItemAssignment) => a.item_id));
  const availableItems = items.filter((i: Item) => !assignedItemIds.has(i.id));

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-surface border-t border-line rounded-t-2xl p-5 pb-8 max-h-[70vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-content">Items for {doctorName}</h3>
            <p className="text-[11px] text-muted mt-0.5">{planDate}</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted hover:text-content px-2 py-1 rounded-lg border border-line">
            Close
          </button>
        </div>

        {/* Assign new item */}
        {availableItems.length > 0 && (
          <div className="flex gap-2 mb-4">
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-surface-2 border border-line text-content text-sm"
            >
              <option value="">Select item to assign...</option>
              {availableItems.map((item: Item) => (
                <option key={item.id} value={item.id}>{item.name}{item.price != null ? ` ($${item.price})` : ''}</option>
              ))}
            </select>
            <button
              onClick={() => { if (selectedItem) assignMut.mutate(Number(selectedItem)); }}
              disabled={!selectedItem || assignMut.isPending}
              className="px-3 py-2 rounded-xl bg-accent text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1"
            >
              {assignMut.isPending ? <IconSpinner /> : '+'}
            </button>
          </div>
        )}

        {/* Current assignments */}
        {assignments.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">No items assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a: ItemAssignment) => {
              const item = items.find((i: Item) => i.id === a.item_id);
              const isDone = a.status === 'done';
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-line">
                  <button
                    onClick={() => toggleStatusMut.mutate({ id: a.id, status: isDone ? 'pending' : 'done' })}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isDone ? 'bg-green-500 border-green-500' : 'border-line hover:border-accent'
                    }`}
                  >
                    {isDone && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDone ? 'line-through text-muted' : 'text-content'}`}>
                      {item?.name ?? `Item #${a.item_id}`}
                    </p>
                    {item?.price != null && (
                      <span className="text-[11px] text-subtle">${item.price}</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeMut.mutate(a.id)}
                    className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
