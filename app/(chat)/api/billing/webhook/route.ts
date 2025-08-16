import { ChatSDKError } from '@/lib/errors';
import {
  getSubscriptionByExternalId,
  updateSubscriptionStatus,
} from '@/lib/db/queries';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const callbackToken = process.env.XENDIT_CALLBACK_TOKEN;
  const signature =
    request.headers.get('x-callback-token') ||
    request.headers.get('X-Callback-Token');

  if (!callbackToken) {
    return new ChatSDKError(
      'bad_request:api',
      'Callback token not configured',
    ).toResponse();
  }

  if (!signature || signature !== callbackToken) {
    return new ChatSDKError('forbidden:api').toResponse();
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  // Handle invoice callback
  // Typical fields: id, external_id, status ('PAID', 'EXPIRED', 'CANCELED'), paid_at
  const externalId = payload?.external_id as string | undefined;
  const status = (payload?.status as string | undefined)?.toUpperCase();

  if (!externalId || !status) {
    return new ChatSDKError('bad_request:api', 'Missing fields').toResponse();
  }

  const sub = await getSubscriptionByExternalId({ externalId });
  if (!sub)
    return new ChatSDKError(
      'not_found:api',
      'Subscription not found',
    ).toResponse();

  if (status === 'PAID' || status === 'SETTLED') {
    const nextPeriod = new Date();
    nextPeriod.setMonth(nextPeriod.getMonth() + 1);
    await updateSubscriptionStatus({
      id: sub.id,
      status: 'active',
      currentPeriodEnd: nextPeriod,
      providerInvoiceId: payload.id,
    });
  } else if (status === 'EXPIRED' || status === 'CANCELED') {
    await updateSubscriptionStatus({ id: sub.id, status: 'expired' });
  }

  return new Response('OK', { status: 200 });
}
