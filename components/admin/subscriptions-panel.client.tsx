"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState, useActionState } from "react";
import { fetcher } from "@/lib/utils";
import Form from "next/form";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { setUserSubscriptionAction, type ActionState } from "@/app/admin/subscriptions/actions";

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
        <Input
          placeholder="Search email / plan / user..."
          value={q}
          onChange={(e) => {
            setOffset(0);
            setQ(e.target.value);
          }}
          className="w-64"
        />
        <Select value={String(limit)} onValueChange={(v) => { setOffset(0); setLimit(Number(v)); }}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground ml-auto">
          {isLoading ? 'Loading…' : `${Math.min(offset + 1, total)}–${Math.min(offset + (data?.items.length || 0), total)} of ${total}`}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Period End</TableHead>
              <TableHead className="w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((u) => (
              <TableRow key={u.userId}>
                <TableCell>{u.userEmail}</TableCell>
                <TableCell>
                  <Badge variant={u.userRole === 'admin' ? 'default' : 'secondary'}>{u.userRole}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.status === 'active' ? 'default' : u.status === 'pending' ? 'secondary' : 'outline'}>
                    {u.status || 'Free User'}
                  </Badge>
                </TableCell>
                <TableCell>{u.planId || '-'}</TableCell>
                <TableCell>{u.currentPeriodEnd ? new Date(u.currentPeriodEnd).toLocaleString() : '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(u)}>Set Subscription</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">More</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(u.userId)}>Copy User ID</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button variant="outline" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={!canPrev}>Previous</Button>
        <Button variant="outline" onClick={() => setOffset(offset + limit)} disabled={!canNext}>Next</Button>
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
