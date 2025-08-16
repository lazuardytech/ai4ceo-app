'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState, useActionState } from 'react';
import { fetcher } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

import { Trash2, Plus, Edit } from 'lucide-react';
import { Badge } from '../ui/badge';
import Form from 'next/form';
import { useFormStatus } from 'react-dom';
import {
  createVoucherAction,
  deleteVoucherAction,
  updateVoucherAction,
  type ActionState,
} from '@/app/admin/vouchers/actions';

interface VoucherRow {
  id: string;
  code: string;
  type: string;
  discountType: string | null;
  discountValue: string | null;
  planId: string | null;
  duration: string | null;
  maxUsages: string | null;
  currentUsages: string;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
}

export function AdminVouchersPanel() {
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [filterType, setFilterType] = useState<
    'all' | 'discount' | 'free_subscription'
  >('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Form state for non-native selects to ensure values submit
  const [createType, setCreateType] = useState<
    'discount' | 'free_subscription' | ''
  >('');
  const [createDiscountType, setCreateDiscountType] = useState<
    'percentage' | 'fixed' | ''
  >('');
  const [showErrors, setShowErrors] = useState<Record<string, string>>({});
  const [createDuration, setCreateDuration] = useState<
    '1_month' | '3_months' | '6_months' | '1_year' | ''
  >('');
  const [createDiscountValue, setCreateDiscountValue] = useState('');
  const [createPlanId, setCreatePlanId] = useState('');

  const key = useMemo(
    () =>
      `/admin/api/vouchers/list?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}${filterType !== 'all' ? `&type=${filterType}` : ''}${filterStatus !== 'all' ? `&status=${filterStatus}` : ''}`,
    [q, limit, offset, filterType, filterStatus],
  );
  const { data, isLoading, mutate } = useSWR<{
    items: VoucherRow[];
    total: number;
  }>(key, fetcher);

  const total = data?.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  // Server action form states
  const [createState, createAction] = useActionState(
    createVoucherAction as unknown as (
      state: ActionState<'create'>,
    ) => Promise<ActionState<'create'>>,
    undefined as unknown as ActionState<'create'>,
  );
  const [updateState, updateAction] = useActionState(
    updateVoucherAction as unknown as (
      state: ActionState<'update'>,
    ) => Promise<ActionState<'update'>>,
    undefined as unknown as ActionState<'update'>,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteVoucherAction as unknown as (
      state: ActionState<'delete'>,
    ) => Promise<ActionState<'delete'>>,
    undefined as unknown as ActionState<'delete'>,
  );

  // Refresh UI on successful server actions
  useEffect(() => {
    if (createState?.ok) {
      setIsCreateOpen(false);
      setCreateType('');
      setCreateDiscountType('');
      setShowErrors({});
      setCreateDuration('');
      mutate();
    } else if (createState && !createState.ok) {
      setShowErrors(createState.fieldErrors || {});
    }
  }, [createState, mutate]);

  useEffect(() => {
    if (updateState?.ok) {
      setEditingVoucher(null);
      mutate();
    }
  }, [updateState, mutate]);

  useEffect(() => {
    if (deleteState?.ok) {
      mutate();
    }
  }, [deleteState, mutate]);

  function SubmitButton({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending || isSubmitting}>
        {pending ? 'Saving…' : children}
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="max-w-sm"
            placeholder="Search vouchers..."
            value={q}
            onChange={(e) => {
              setOffset(0);
              setQ(e.target.value);
            }}
          />
          <Select
            value={filterType}
            onValueChange={(v) => {
              setOffset(0);
              setFilterType(v as any);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="discount">Discount</SelectItem>
              <SelectItem value="free_subscription">
                Free Subscription
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setOffset(0);
              setFilterStatus(v as any);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={limit.toString()}
            onValueChange={(value) => {
              setOffset(0);
              setLimit(Number(value));
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Create Voucher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Voucher</DialogTitle>
              <DialogDescription>
                Create a new discount or free subscription voucher.
              </DialogDescription>
            </DialogHeader>
            <Form action={createAction}>
              <div className="grid gap-4 py-4">
                {/* Preview */}
                <div className="rounded border p-3 bg-muted/30 text-xs">
                  <span className="font-medium">Preview:</span>{' '}
                  <span className="text-muted-foreground">
                    {createType === 'discount' &&
                    createDiscountType &&
                    createDiscountValue
                      ? `${createDiscountValue}${createDiscountType === 'percentage' ? '%' : ' IDR'} discount on your next subscription`
                      : createType === 'free_subscription' &&
                          (createDuration || createPlanId)
                        ? `Free ${createPlanId || 'premium'} subscription for ${
                            createDuration === '1_month'
                              ? '1 month'
                              : createDuration === '3_months'
                                ? '3 months'
                                : createDuration === '6_months'
                                  ? '6 months'
                                  : createDuration === '1_year'
                                    ? '1 year'
                                    : '1 month'
                          }`
                        : 'Fill fields to see description'}
                  </span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Code
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    className="col-span-3"
                    placeholder="DISCOUNT10"
                    required
                  />
                  {showErrors.code && (
                    <p className="col-span-4 col-start-2 text-xs text-red-600">
                      {showErrors.code}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  {/* Hidden input to include value in FormData */}
                  <input type="hidden" name="type" value={createType} />
                  <Select
                    value={createType}
                    onValueChange={(v) => setCreateType(v as any)}
                    required
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="free_subscription">
                        Free Subscription
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {showErrors.type && (
                    <p className="col-span-4 col-start-2 text-xs text-red-600">
                      {showErrors.type}
                    </p>
                  )}
                </div>
                {createType === 'discount' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="discountType" className="text-right">
                        Discount Type
                      </Label>
                      <input
                        type="hidden"
                        name="discountType"
                        value={createDiscountType}
                      />
                      <Select
                        value={createDiscountType}
                        onValueChange={(v) => setCreateDiscountType(v as any)}
                        required
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select discount type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      {showErrors.discountType && (
                        <p className="col-span-4 col-start-2 text-xs text-red-600">
                          {showErrors.discountType}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="discountValue" className="text-right">
                        Discount Value
                      </Label>
                      <Input
                        id="discountValue"
                        name="discountValue"
                        className="col-span-3"
                        placeholder="10 or 50000"
                        value={createDiscountValue}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^\\d.]/g, '');
                          v = v.replace(/\\..*/, '');
                          if (createDiscountType === 'percentage') {
                            const n = Math.max(
                              1,
                              Math.min(100, Number(v || '')),
                            );
                            if (!Number.isNaN(n)) v = String(n);
                          }
                          setCreateDiscountValue(v);
                        }}
                        required
                      />
                      <p className="col-span-4 col-start-2 text-xs text-muted-foreground">
                        Percentage accepts 1–100; Fixed amount is a positive
                        number.
                      </p>
                      {showErrors.discountValue && (
                        <p className="col-span-4 col-start-2 text-xs text-red-600">
                          {showErrors.discountValue}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {createType === 'free_subscription' && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="planId" className="text-right">
                        Plan ID
                      </Label>
                      <Input
                        id="planId"
                        name="planId"
                        className="col-span-3"
                        placeholder="premium_monthly"
                        value={createPlanId}
                        onChange={(e) => setCreatePlanId(e.target.value)}
                        required
                      />
                      {showErrors.planId && (
                        <p className="col-span-4 col-start-2 text-xs text-red-600">
                          {showErrors.planId}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="duration" className="text-right">
                        Duration
                      </Label>
                      <input
                        type="hidden"
                        name="duration"
                        value={createDuration}
                      />
                      <Select
                        value={createDuration}
                        onValueChange={(v) => setCreateDuration(v as any)}
                        required
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1_month">1 month</SelectItem>
                          <SelectItem value="3_months">3 months</SelectItem>
                          <SelectItem value="6_months">6 months</SelectItem>
                          <SelectItem value="1_year">1 year</SelectItem>
                        </SelectContent>
                      </Select>
                      {showErrors.duration && (
                        <p className="col-span-4 col-start-2 text-xs text-red-600">
                          {showErrors.duration}
                        </p>
                      )}
                    </div>
                  </>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maxUsages" className="text-right">
                    Max Uses
                  </Label>
                  <Input
                    id="maxUsages"
                    name="maxUsages"
                    className="col-span-3"
                    placeholder="100"
                  />
                  <p className="col-span-4 col-start-2 text-xs text-muted-foreground">
                    Optional. Positive integer limit for total redemptions.
                  </p>
                  {showErrors.maxUsages && (
                    <p className="col-span-4 col-start-2 text-xs text-red-600">
                      {showErrors.maxUsages}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="validFrom" className="text-right">
                    Valid From
                  </Label>
                  <Input
                    id="validFrom"
                    name="validFrom"
                    type="datetime-local"
                    className="col-span-3"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    required
                  />
                  <p className="col-span-4 col-start-2 text-xs text-muted-foreground">
                    The voucher becomes usable from this date/time.
                  </p>
                  {showErrors.validFrom && (
                    <p className="col-span-4 col-start-2 text-xs text-red-600">
                      {showErrors.validFrom}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="validUntil" className="text-right">
                    Valid Until
                  </Label>
                  <Input
                    id="validUntil"
                    name="validUntil"
                    type="datetime-local"
                    className="col-span-3"
                  />
                  <p className="col-span-4 col-start-2 text-xs text-muted-foreground">
                    Optional. Must be after &quot;Valid From&quot; if provided.
                  </p>
                  {showErrors.validUntil && (
                    <p className="col-span-4 col-start-2 text-xs text-red-600">
                      {showErrors.validUntil}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <SubmitButton>Create Voucher</SubmitButton>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-xs text-muted-foreground">
        {isLoading
          ? 'Loading…'
          : `${Math.min(offset + 1, total)}–${Math.min(offset + (data?.items.length || 0), total)} of ${total}`}
      </div>
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          onClick={() => {
            const url = `/admin/api/vouchers/export?q=${encodeURIComponent(q)}${filterType !== 'all' ? `&type=${filterType}` : ''}${filterStatus !== 'all' ? `&status=${filterStatus}` : ''}`;
            window.open(url, '_blank');
          }}
        >
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4">
        {data?.items.map((voucher) => (
          <Card key={voucher.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-mono">
                    {voucher.code}
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(voucher.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={voucher.isActive ? 'default' : 'secondary'}>
                    {voucher.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{voucher.type}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingVoucher(voucher)}
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Form action={deleteAction}>
                    <input type="hidden" name="id" value={voucher.id} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        if (
                          !confirm(
                            'Are you sure you want to delete this voucher?',
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </Form>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Usage:</span>{' '}
                  {voucher.currentUsages}
                  {voucher.maxUsages && ` / ${voucher.maxUsages}`}
                </div>
                {voucher.discountType && voucher.discountValue && (
                  <div>
                    <span className="font-medium">Discount:</span>{' '}
                    {voucher.discountValue}
                    {voucher.discountType === 'percentage' ? '%' : ' IDR'}
                  </div>
                )}
                {voucher.planId && (
                  <div>
                    <span className="font-medium">Plan:</span> {voucher.planId}
                  </div>
                )}
                {voucher.duration && (
                  <div>
                    <span className="font-medium">Duration:</span>{' '}
                    {voucher.duration}
                  </div>
                )}
                <div>
                  <span className="font-medium">Valid From:</span>{' '}
                  {new Date(voucher.validFrom).toLocaleDateString()}
                </div>
                {voucher.validUntil && (
                  <div>
                    <span className="font-medium">Valid Until:</span>{' '}
                    {new Date(voucher.validUntil).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="outline"
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={!canPrev}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setOffset(offset + limit)}
          disabled={!canNext}
        >
          Next
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingVoucher}
        onOpenChange={() => setEditingVoucher(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Voucher</DialogTitle>
            <DialogDescription>Update voucher settings.</DialogDescription>
          </DialogHeader>
          {editingVoucher && (
            <Form action={updateAction}>
              <input type="hidden" name="id" value={editingVoucher.id} />
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <input
                    type="hidden"
                    name="isActive"
                    value={editingVoucher.isActive ? 'true' : 'false'}
                  />
                  <Select
                    value={editingVoucher.isActive ? 'active' : 'inactive'}
                    onValueChange={(value) =>
                      setEditingVoucher({
                        ...editingVoucher,
                        isActive: value === 'active',
                      })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Max Uses</Label>
                  <Input
                    className="col-span-3"
                    name="maxUsages"
                    defaultValue={editingVoucher.maxUsages || ''}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Valid Until</Label>
                  <Input
                    type="datetime-local"
                    className="col-span-3"
                    name="validUntil"
                    defaultValue={
                      editingVoucher.validUntil
                        ? new Date(editingVoucher.validUntil)
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <SubmitButton>Update Voucher</SubmitButton>
              </DialogFooter>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
