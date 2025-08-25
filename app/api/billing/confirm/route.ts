import { ChatSDKError } from '@/lib/errors';
import { getSubscriptionByExternalId, updateSubscriptionStatus, completeReferralOnSubscription } from '@/lib/db/queries';

export const runtime = 'nodejs';

// Confirm payment status after Xendit redirects the user back
// GET /api/billing/confirm?ext=<external_id>
export async function GET(request: Request) {
  const url = new URL(request.url);
  const externalId = url.searchParams.get('ext') || url.searchParams.get('external_id');

  if (!externalId) {
    return new ChatSDKError('bad_request:api', 'Missing external id').toResponse();
  }

  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    return new ChatSDKError('bad_request:api', 'Xendit is not configured').toResponse();
  }

  // Find the subscription to derive period length (month/annual) if needed
  const sub = await getSubscriptionByExternalId({ externalId });
  if (!sub) return new ChatSDKError('not_found:api', 'Subscription not found').toResponse();

  // Query Xendit by external_id
  const res = await fetch(`https://api.xendit.co/v2/invoices?external_id=${encodeURIComponent(externalId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
    },
    // Avoid caching
    cache: 'no-store',
  });

  if (!res.ok) {
    return new ChatSDKError('bad_request:api', 'Failed to fetch invoice').toResponse();
  }

  const data = (await res.json()) as any[];
  const invoice = Array.isArray(data) ? data[0] : null;
  if (!invoice) {
    return new ChatSDKError('not_found:api', 'Invoice not found').toResponse();
  }

  const status = String(invoice.status || '').toUpperCase();

  if (status === 'PAID' || status === 'SETTLED') {
    // Determine period end based on planId (simple heuristic: annual vs monthly)
    const next = new Date();
    const planId = sub.planId?.toLowerCase() || '';
    if (planId.includes('annual') || planId.includes('year')) {
      next.setFullYear(next.getFullYear() + 1);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    await updateSubscriptionStatus({
      id: sub.id,
      status: 'active',
      currentPeriodEnd: next,
      providerInvoiceId: invoice.id,
    });
    // Complete referral if this user had a pending referral usage
    try {
      await completeReferralOnSubscription({ referredUserId: sub.userId, subscriptionId: sub.id });
    } catch (e) {
      // Non-blocking: log only
      console.warn('Referral completion failed on subscription activation:', e);
    }
    return Response.json({ ok: true, status: 'active' });
  }

  if (status === 'EXPIRED' || status === 'CANCELED') {
    await updateSubscriptionStatus({ id: sub.id, status: 'expired' });
    return Response.json({ ok: true, status: 'expired' });
  }

  // For PENDING or other statuses, do not change, just report
  return Response.json({ ok: true, status: String(invoice.status || 'PENDING') });
}
