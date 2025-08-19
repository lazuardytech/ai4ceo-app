'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState, useActionState } from 'react';
import { fetcher } from '@/lib/utils';
import Form from 'next/form';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  setUserSubscriptionAction,
  type ActionState,
} from '@/app/admin/subscriptions/actions';

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
  const { data, isLoading, mutate } = useSWR<{
    items: UserSubRow[];
    total: number;
  }>(key, fetcher);
  const [editing, setEditing] = useState<UserSubRow | null>(null);
  const [formState, formAction] = useActionState(
    setUserSubscriptionAction as unknown as (
      s: ActionState<'set'>,
    ) => Promise<ActionState<'set'>>,
    undefined as unknown as ActionState<'set'>,
  );

  function SubmitButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : children}
      </Button>
    );
  }

  // Close dialog on successful submit and refresh list
  useEffect(() => {
    if (formState?.ok) {
      setEditing(null);
      mutate();
    }
  }, [formState?.ok, mutate]);

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
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Subscription Status</th>
              <th className="p-2">Plan</th>
              <th className="p-2">Period End</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u, i) => (
              <tr
                key={u.userId}
                className={`border-t ${i % 2 ? 'bg-muted/20' : ''}`}
              >
                <td className="p-2 align-top">{u.userEmail}</td>
                <td className="p-2 align-top">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${u.userRole === 'superadmin'
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
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${u.status === 'active'
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
                <td className="p-2 align-top">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(u)}
                  >
                    Set Subscription
                  </Button>
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
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Subscription</DialogTitle>
            <DialogDescription>
              Manually create or update a user&apos;s subscription.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <Form action={formAction}>
              <input type="hidden" name="userId" value={editing.userId} />
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Plan ID</Label>
                  <Input
                    className="col-span-3"
                    name="planId"
                    defaultValue={editing.planId || 'premium_monthly'}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <Select
                    name="status"
                    defaultValue={editing.status || 'pending'}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">pending</SelectItem>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="canceled">canceled</SelectItem>
                      <SelectItem value="expired">expired</SelectItem>
                      <SelectItem value="failed">failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Period End</Label>
                  <Input
                    className="col-span-3"
                    type="datetime-local"
                    name="currentPeriodEnd"
                    defaultValue={
                      editing.currentPeriodEnd
                        ? new Date(editing.currentPeriodEnd)
                          .toISOString()
                          .slice(0, 16)
                        : ''
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">External ID</Label>
                  <Input
                    className="col-span-3"
                    name="externalId"
                    placeholder="optional"
                  />
                </div>
              </div>
              <DialogFooter>
                <SubmitButton>Save</SubmitButton>
              </DialogFooter>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
