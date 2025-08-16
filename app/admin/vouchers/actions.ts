'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ChatSDKError } from '@/lib/errors';
import { createVoucher, updateVoucher, deleteVoucher } from '@/lib/db/queries';
import { auth } from '@/app/(auth)/auth';

export type ActionState<T extends string = string> =
  | { ok: true; message?: string; tag?: T }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Record<string, string>;
      tag?: T;
    };

const baseSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(64)
    .transform((s) => s.toUpperCase()),
  type: z.enum(['discount', 'free_subscription']),
  discountType: z
    .enum(['percentage', 'fixed'])
    .optional()
    .or(z.literal('').transform(() => undefined)),
  discountValue: z
    .string()
    .optional()
    .refine(
      (v) =>
        v === undefined ||
        v === '' ||
        (!Number.isNaN(Number(v)) && Number(v) > 0),
      {
        message: 'Must be a positive number',
      },
    ),
  planId: z
    .string()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  duration: z
    .enum(['1_month', '3_months', '6_months', '1_year'])
    .optional()
    .or(z.literal('').transform(() => undefined)),
  maxUsages: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === '' || (/^\d+$/.test(v) && Number(v) > 0),
      {
        message: 'Must be a positive integer',
      },
    ),
  validFrom: z.string().min(1),
  validUntil: z.string().optional().or(z.literal('')),
});

const createSchema = baseSchema.superRefine((data, ctx) => {
  // type-specific requirements
  if (data.type === 'discount') {
    if (!data.discountType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountType'],
        message: 'Discount type is required',
      });
    }
    if (!data.discountValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Discount value is required',
      });
    }
  }

  if (data.type === 'free_subscription') {
    if (!data.planId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['planId'],
        message: 'Plan ID is required',
      });
    }
    if (!data.duration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['duration'],
        message: 'Duration is required',
      });
    }
  }

  const from = new Date(data.validFrom);
  if (Number.isNaN(from.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['validFrom'],
      message: 'Invalid date',
    });
  }

  if (data.validUntil) {
    const until = new Date(data.validUntil);
    if (Number.isNaN(until.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validUntil'],
        message: 'Invalid date',
      });
    } else if (!Number.isNaN(from.getTime()) && until <= from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['validUntil'],
        message: 'Must be after Valid From',
      });
    }
  }
});

export async function createVoucherAction(
  _prev: ActionState<'create'> | undefined,
  formData: FormData,
): Promise<ActionState<'create'>> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return { ok: false, message: 'Unauthorized', tag: 'create' };
  }

  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = createSchema.parse(raw);

    await createVoucher({
      code: parsed.code,
      type: parsed.type,
      discountType:
        parsed.type === 'discount' ? (parsed.discountType as any) : undefined,
      discountValue:
        parsed.type === 'discount' ? String(parsed.discountValue) : undefined,
      planId: parsed.type === 'free_subscription' ? parsed.planId : undefined,
      duration:
        parsed.type === 'free_subscription' ? parsed.duration : undefined,
      maxUsages: parsed.maxUsages ? String(parsed.maxUsages) : undefined,
      validFrom: new Date(parsed.validFrom),
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : undefined,
    });

    revalidatePath('/admin/vouchers');
    return { ok: true, message: 'Voucher created', tag: 'create' };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) {
        if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message;
      }
      return {
        ok: false,
        message: 'Validation failed',
        fieldErrors,
        tag: 'create',
      };
    }
    if (err instanceof ChatSDKError) {
      return { ok: false, message: err.message, tag: 'create' };
    }
    return { ok: false, message: 'Failed to create voucher', tag: 'create' };
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  isActive: z
    .union([z.string(), z.boolean()])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  validUntil: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  maxUsages: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === '' || (/^\d+$/.test(v) && Number(v) > 0),
      {
        message: 'Must be a positive integer',
      },
    ),
});

export async function updateVoucherAction(
  _prev: ActionState<'update'> | undefined,
  formData: FormData,
): Promise<ActionState<'update'>> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return { ok: false, message: 'Unauthorized', tag: 'update' };
  }

  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = updateSchema.parse(raw);

    await updateVoucher({
      id: parsed.id,
      isActive: parsed.isActive,
      maxUsages: parsed.maxUsages,
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : undefined,
    });

    revalidatePath('/admin/vouchers');
    return { ok: true, message: 'Voucher updated', tag: 'update' };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) {
        if (issue.path[0]) fieldErrors[String(issue.path[0])] = issue.message;
      }
      return {
        ok: false,
        message: 'Validation failed',
        fieldErrors,
        tag: 'update',
      };
    }
    if (err instanceof ChatSDKError) {
      return { ok: false, message: err.message, tag: 'update' };
    }
    return { ok: false, message: 'Failed to update voucher', tag: 'update' };
  }
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteVoucherAction(
  _prev: ActionState<'delete'> | undefined,
  formData: FormData,
): Promise<ActionState<'delete'>> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return { ok: false, message: 'Unauthorized', tag: 'delete' };
  }

  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = deleteSchema.parse(raw);
    await deleteVoucher({ id: parsed.id });
    revalidatePath('/admin/vouchers');
    return { ok: true, message: 'Voucher deleted', tag: 'delete' };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { ok: false, message: 'Invalid voucher ID', tag: 'delete' };
    }
    if (err instanceof ChatSDKError) {
      return { ok: false, message: err.message, tag: 'delete' };
    }
    return { ok: false, message: 'Failed to delete voucher', tag: 'delete' };
  }
}
