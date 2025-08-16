'use client';

import useSWR from 'swr';
import { useMemo, useState } from 'react';
import { fetcher } from '@/lib/utils';

interface UserSubRow {
  userId: string;
  userEmail: string;
  userRole: string;
  subscriptionId: string | null;
  planId: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  updatedAt: string | null;
}

export function AdminSubscriptionsPanel() {
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const key = useMemo(
    () =>
      `/admin/api/users/subscription-status?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`,
    [q, limit, offset],
  );
  const { data, isLoading } = useSWR<{ items: UserSubRow[]; total: number }>(
    key,
    fetcher,
  );

  const total = data?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Search email / plan / user..."
          value={q}
          onChange={(e) => {
            setOffset(0);
            setQ(e.target.value);
          }}
        />
        <select
          className="border rounded px-2 py-1 text-sm"
          value={limit}
          onChange={(e) => {
            setOffset(0);
            setLimit(Number(e.target.value));
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <div className="text-xs text-muted-foreground ml-auto">
          {isLoading
            ? 'Loading…'
            : `${Math.min(offset + 1, total)}–${Math.min(offset + (data?.items.length || 0), total)} of ${total}`}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left sticky top-0">
            <tr>
              <th className="p-2">User ID</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Subscription Status</th>
              <th className="p-2">Plan</th>
              <th className="p-2">Period End</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u, i) => (
              <tr
                key={u.userId}
                className={`border-t ${i % 2 ? 'bg-muted/20' : ''}`}
              >
                <td className="p-2 align-top font-mono text-xs">
                  {u.userId.slice(0, 8)}...
                </td>
                <td className="p-2 align-top">{u.userEmail}</td>
                <td className="p-2 align-top">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      u.userRole === 'superadmin'
                        ? 'bg-purple-100 text-purple-800'
                        : u.userRole === 'admin'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {u.userRole}
                  </span>
                </td>
                <td className="p-2 align-top">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      u.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : u.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : u.status === 'expired' || u.status === 'canceled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {u.status || 'Free User'}
                  </span>
                </td>
                <td className="p-2 align-top">{u.planId || '-'}</td>
                <td className="p-2 align-top">
                  {u.currentPeriodEnd
                    ? new Date(u.currentPeriodEnd).toLocaleString()
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          className="border rounded px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={!canPrev}
        >
          Previous
        </button>
        <button
          type="button"
          className="border rounded px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => setOffset(offset + limit)}
          disabled={!canNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
