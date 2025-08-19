'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import {
  createSubscription,
  getActiveSubscriptionByUserId,
  getLatestSubscriptionByUserId,
  updateSubscriptionAdmin,
} from '@/lib/db/queries';
import { headers } from 'next/headers';

export type ActionState<T extends string = string> =
  | { ok: true; message?: string; tag?: T }
  | {
    ok: false;
    message?: string;
    fieldErrors?: Record<string, string>;
    tag?: T;
  };

const schema = z.object({
  userId: z.string().cuid2(),
  planId: z.string().min(1),
  status: z.enum(['pending', 'active', 'canceled', 'expired', 'failed']),
  currentPeriodEnd: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  externalId: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
});

export async function setUserSubscriptionAction(
  _prev: ActionState<'set'> | undefined,
  formData: FormData,
): Promise<ActionState<'set'>> {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (
    !session?.user ||
    (session.user.role !== 'superadmin' && session.user.role !== 'admin')
  ) {
    return { ok: false, message: 'Unauthorized', tag: 'set' };
  }

  try {
    const raw = Object.fromEntries(formData.entries());
    const parsed = schema.parse(raw);

    const when = parsed.currentPeriodEnd
      ? new Date(parsed.currentPeriodEnd)
      : undefined;
    // basic sanity for date
    if (when && Number.isNaN(when.getTime())) {
      return {
        ok: false,
        message: 'Invalid date for period end',
        tag: 'set',
        fieldErrors: { currentPeriodEnd: 'Invalid date' },
      };
    }

    // try find active or latest subscription
    const active = await getActiveSubscriptionByUserId({
      userId: parsed.userId,
    });
    let subId: string | null = active?.id ?? null;

    if (!subId) {
      const latest = await getLatestSubscriptionByUserId({
        userId: parsed.userId,
      });
      if (latest) subId = latest.id;
    }

    if (!subId) {
      const created = await createSubscription({
        userId: parsed.userId,
        planId: parsed.planId,
        externalId: parsed.externalId ?? undefined,
      });
      subId = created.id;
    }

    await updateSubscriptionAdmin({
      id: subId,
      planId: parsed.planId,
      status: parsed.status,
      currentPeriodEnd: when,
      externalId: parsed.externalId,
    });

    revalidatePath('/admin/subscriptions');
    return { ok: true, message: 'Subscription updated', tag: 'set' };
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
        tag: 'set',
      };
    }
    if (err instanceof ChatSDKError) {
      return { ok: false, message: err.message, tag: 'set' };
    }
    return { ok: false, message: 'Failed to set subscription', tag: 'set' };
  }
}
