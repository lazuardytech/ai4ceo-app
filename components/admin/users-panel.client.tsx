'use client';

import useSWR from 'swr';
import { useCallback, useMemo, useState } from 'react';
import { fetcher } from '@/lib/utils';
import { toast } from '@/components/toast';

interface UserRow {
  id: string;
  email: string | null;
  role?: 'user' | 'admin';
}

export function AdminUsersPanel() {
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const key = useMemo(
    () =>
      `/admin/api/users/list?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`,
    [q, limit, offset],
  );
  const { data, isLoading, mutate } = useSWR<{
    items: UserRow[];
    total: number;
  }>(key, fetcher);

  const total = data?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const updateRole = useCallback(
    async (userId: string, role: string) => {
      try {
        const form = new FormData();
        form.append('userId', userId);
        form.append('role', role);
        const res = await fetch('/admin/api/users/role', {
          method: 'POST',
          body: form,
        });
        if (!res.ok) throw new Error(await res.text());
        toast({ type: 'success', description: 'Role updated' });
        mutate();
      } catch (e) {
        console.error(e);
        toast({ type: 'error', description: 'Failed to update role' });
      }
    },
    [mutate],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Search email..."
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
              {/*<th className="p-2">ID</th>*/}
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u, i) => (
              <tr
                key={u.id}
                className={`border-t ${i % 2 ? 'bg-muted/20' : ''}`}
              >
                {/*<td className="p-2 align-top">{u.id}</td>*/}
                <td className="p-2 align-top">{u.email}</td>
                <td className="p-2 align-top">{(u as any).role}</td>
                <td className="p-2 align-top">
                  <div className="flex gap-2">
                    <select
                      defaultValue={(u as any).role}
                      className="border rounded px-2 py-1"
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
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
