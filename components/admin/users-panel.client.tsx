"use client";

import useSWR from "swr";
import { useCallback, useMemo, useState } from "react";
import { fetcher } from "@/lib/utils";
import { toast } from "@/components/toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface UserRow {
  id: string;
  email: string | null;
  role?: "user" | "admin";
  name?: string | null;
  onboarded?: boolean;
  tour?: boolean;
}

export function AdminUsersPanel() {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState<{ name?: string; email?: string; role?: "user" | "admin"; onboarded?: boolean; tour?: boolean }>({});

  const key = useMemo(
    () => `/admin/api/users/list?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`,
    [q, limit, offset],
  );
  const { data, isLoading, mutate } = useSWR<{ items: UserRow[]; total: number }>(key, fetcher);

  const total = data?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  const updateRole = useCallback(
    async (userId: string, role: string) => {
      try {
        const form = new FormData();
        form.append("userId", userId);
        form.append("role", role);
        const res = await fetch("/admin/api/users/role", { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());
        toast({ type: "success", description: "Role updated" });
        mutate();
      } catch (e) {
        console.error(e);
        toast({ type: "error", description: "Failed to update role" });
      }
    },
    [mutate],
  );

  const openEdit = (u: UserRow) => {
    setEditing(u);
    setForm({ name: u.name || "", email: u.email || "", role: u.role || "user", onboarded: !!u.onboarded, tour: !!u.tour });
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const res = await fetch("/admin/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editing.id, ...form }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ type: "success", description: "User updated" });
      setEditing(null);
      mutate();
    } catch (e) {
      console.error(e);
      toast({ type: "error", description: "Failed to update user" });
    }
  };

  const triggerResetPassword = async (email: string | null) => {
    if (!email) return;
    try {
      const res = await fetch('/admin/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ type: 'success', description: 'Password reset email sent (if user exists)' });
    } catch (e) {
      console.error(e);
      toast({ type: 'error', description: 'Failed to send reset email' });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search email..."
          value={q}
          onChange={(e) => {
            setOffset(0);
            setQ(e.target.value);
          }}
          className="w-64"
        />
        <Select
          value={String(limit)}
          onValueChange={(v) => {
            setOffset(0);
            setLimit(Number(v));
          }}
        >
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground ml-auto">
          {isLoading ? "Loading…" : `${Math.min(offset + 1, total)}–${Math.min(offset + (data?.items.length || 0), total)} of ${total}`}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[160px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role || 'user'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Select defaultValue={u.role || 'user'} onValueChange={(v) => updateRole(u.id, v)}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">More</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEdit(u)}>Edit Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => triggerResetPassword(u.email)}>Reset Password</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(u.id)}>Copy User ID</DropdownMenuItem>
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

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update user details and flags.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Name</Label>
              <Input className="col-span-3" value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email</Label>
              <Input className="col-span-3" value={form.email || ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Role</Label>
              <Select value={form.role || 'user'} onValueChange={(v: any) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Onboarded</Label>
              <Select value={String(!!form.onboarded)} onValueChange={(v) => setForm((f) => ({ ...f, onboarded: v === 'true' }))}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tour Completed</Label>
              <Select value={String(!!form.tour)} onValueChange={(v) => setForm((f) => ({ ...f, tour: v === 'true' }))}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditing(null)} variant="outline">Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
