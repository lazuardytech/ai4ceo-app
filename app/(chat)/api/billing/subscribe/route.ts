import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { isTestEnvironment } from '@/lib/constants';
import { createSubscription } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

export const runtime = 'nodejs';

// Simple plan config. Extend as needed.
const PLANS: Record<
  string,
  { amount: number; description: string; currency?: string }
> = {
  premium_monthly: {
    amount: 99000,
    description: 'Premium Monthly Subscription',
    currency: 'IDR',
  },
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return new ChatSDKError('unauthorized:chat').toResponse();

  let body: { planId?: string };
  try {
    body = await request.json();
  } catch {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const planId = body.planId || 'premium_monthly';
  const plan = PLANS[planId];
  if (!plan)
    return new ChatSDKError('bad_request:api', 'Unknown plan').toResponse();

  const externalId = `sub_${generateUUID()}`;

  if (isTestEnvironment) {
    const subscription = await createSubscription({
      userId: session.user.id,
      planId,
      externalId,
    });

    return Response.json({
      invoice_url: `https://example.com/invoice/${externalId}`,
      external_id: externalId,
      subscriptionId: subscription.id,
    });
  }

  const secretKey = process.env.XENDIT_SECRET_KEY;
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  if (!secretKey) {
    return new ChatSDKError(
      'bad_request:api',
      'Xendit is not configured',
    ).toResponse();
  }

  const callbackToken = process.env.XENDIT_CALLBACK_TOKEN || '';
  const payload = {
    external_id: externalId,
    amount: plan.amount,
    description: plan.description,
    currency: plan.currency || 'IDR',
    success_redirect_url: `${baseUrl}/billing/success?ext=${externalId}`,
    failure_redirect_url: `${baseUrl}/billing/failed?ext=${externalId}`,
    // You may add payer_email, customer, items, etc.
  } as any;

  const res = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      ...(callbackToken ? { 'X-Callback-Token': callbackToken } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return new ChatSDKError(
      'bad_request:api',
      'Failed to create invoice',
    ).toResponse();
  }

  const data = (await res.json()) as {
    id: string;
    invoice_url: string;
    external_id: string;
  };

  const subscription = await createSubscription({
    userId: session.user.id,
    planId,
    externalId: data.external_id,
    providerInvoiceId: data.id,
  });

  return Response.json({
    invoice_url: data.invoice_url,
    external_id: data.external_id,
    subscriptionId: subscription.id,
  });
}
