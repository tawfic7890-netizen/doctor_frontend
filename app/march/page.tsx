'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Doctor, Visit, formatDate } from '@/lib/utils';

const MARCH_PREFIX = '2026-03';

function getMarchVisits(doctor: Doctor): Visit[] {
  return (doctor.visits ?? [])
    .filter((v) => v.visited_at.startsWith(MARCH_PREFIX))
    .sort((a, b) => a.visited_at.localeCompare(b.visited_at));
}

export default function MarchPage() {
  const [search, setSearch] = useState('');

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors', { hideF: false }],
    queryFn: () => api.doctors.list({ hideF: false }),
  });

  const visited = doctors.filter((d) => getMarchVisits(d).length > 0);
  const notVisited = doctors.filter(
    (d) => getMarchVisits(d).length === 0 && d.class?.toLowerCase() !== 'f',
  );

  const filterDocs = (list: Doctor[]) => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(
      (d) =>
        d.name?.toLowerCase().includes(s) ||
        d.area?.toLowerCase().includes(s) ||
        d.specialty?.toLowerCase().includes(s),
    );
  };

  const visitedFiltered = filterDocs(visited);
  const notVisitedFiltered = filterDocs(notVisited);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Header */}
      <div className="bg-[#111827] border-b border-gray-800 px-4 py-3">
        <h1 className="text-lg font-bold text-white">March 2026 History</h1>
        <p className="text-xs text-gray-400 mt-0.5">Read-only reference</p>
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-[#111827]/50 border-b border-gray-800 grid grid-cols-2 gap-3">
        <div className="bg-[#111827] rounded-xl p-3 border border-gray-800">
          <p className="text-xs text-gray-400">Visited March</p>
          <p className="text-2xl font-bold text-[#00c853]">{visited.length}</p>
        </div>
        <div className="bg-[#111827] rounded-xl p-3 border border-gray-800">
          <p className="text-xs text-gray-400">Not Visited</p>
          <p className="text-2xl font-bold text-[#ff3d3d]">{notVisited.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 sticky top-0 z-40 bg-[#0a0e1a] border-b border-gray-800">
        <input
          type="text"
          placeholder="Search doctors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111827] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
        />
      </div>

      <div className="px-3 py-3 space-y-4">
        {isLoading && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111827] rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        )}

        {/* Visited */}
        {visitedFiltered.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[#00c853] mb-2">
              ✅ Visited in March ({visitedFiltered.length})
            </h2>
            <div className="space-y-2">
              {visitedFiltered.map((d) => {
                const mv = getMarchVisits(d);
                return (
                  <div
                    key={d.id}
                    className="bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{d.name}</p>
                      <p className="text-xs text-gray-400">{d.specialty} · {d.area}</p>
                    </div>
                    <div className="text-right">
                      {mv.map((v, i) => (
                        <p key={v.id} className="text-xs text-gray-500">
                          V{i + 1}: {formatDate(v.visited_at)}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Not visited */}
        {notVisitedFiltered.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[#ff3d3d] mb-2">
              ❌ Not Visited in March ({notVisitedFiltered.length})
            </h2>
            <div className="space-y-2">
              {notVisitedFiltered.map((d) => (
                <div
                  key={d.id}
                  className="bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 flex justify-between items-center opacity-70"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.specialty} · {d.area}</p>
                  </div>
                  <span className="text-xs text-gray-600">—</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
