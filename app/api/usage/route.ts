import { getCurrentUser } from '@/lib/auth-guard';
import {
  getActiveSubscriptionByUserId,
  getMonthlyMessageCountByUserId,
  getSettings,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  try {
    const url = new URL(request.url);
    const monthParam = url.searchParams.get('month'); // optional: 1-12 or 0-11
    const yearParam = url.searchParams.get('year'); // optional: full year (e.g. 2025)

    const now = new Date();
    let monthIdx: number | undefined = undefined;
    let yearNum: number | undefined = undefined;

    if (monthParam !== null) {
      const m = Number(monthParam);
      if (!Number.isNaN(m)) {
        // Accept 1-12 (convert to 0-11) or 0-11 directly
        monthIdx = m >= 1 && m <= 12 ? m - 1 : m;
      }
    }
    if (yearParam !== null) {
      const y = Number(yearParam);
      if (!Number.isNaN(y)) {
        yearNum = y;
      }
    }

    const month = typeof monthIdx === 'number' ? monthIdx : now.getMonth();
    const year = typeof yearNum === 'number' ? yearNum : now.getFullYear();

    const [settings, active] = await Promise.all([
      getSettings(),
      getActiveSubscriptionByUserId({ userId: user.id }),
    ]);

    // Limits (admin-configurable via settings: messageLimits)
    const msgLimits = (settings?.messageLimits as any) || {};
    const standardMonthly = Number(
      (msgLimits && (msgLimits.standardMonthly as any)) ?? 1000,
    );
    const premiumMonthly = Number(
      (msgLimits && (msgLimits.premiumMonthly as any)) ?? 150,
    );

    const isPremium = Boolean(active);
    const limit = isPremium ? premiumMonthly : standardMonthly;

    const used = await getMonthlyMessageCountByUserId({
      id: user.id,
      month,
      year,
    });

    const periodStart = new Date(year, month, 1);
    const periodEnd = month === 11 ? new Date(year + 1, 0, 1) : new Date(year, month + 1, 1);

    return Response.json({
      used,
      limit,
      remaining: Math.max(0, limit - used),
      planType: isPremium ? 'premium' : 'standard',
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        month: month + 1, // 1-12 for UI friendliness
        year,
      },
    });
  } catch (error) {
    console.error('GET /api/usage error:', error);
    return new ChatSDKError('bad_request:api').toResponse();
  }
}
