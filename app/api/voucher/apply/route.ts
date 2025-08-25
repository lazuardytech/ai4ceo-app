import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import {
  validateVoucher,
  applyVoucher,
  createSubscription,
  updateSubscriptionStatus,
  completeReferralOnSubscription,
} from '@/lib/db/queries';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return new ChatSDKError(
        'bad_request:api',
        'Voucher code is required',
      ).toResponse();
    }

    // Validate the voucher
    const validation = await validateVoucher({
      code,
      userId: session.user.id,
    });

    if (!validation.valid) {
      return Response.json(
        { success: false, message: validation.reason },
        { status: 400 },
      );
    }

    const voucher = validation.voucher;
    if (!voucher) {
      return new ChatSDKError(
        'bad_request:api',
        'Voucher not found',
      ).toResponse();
    }

    let subscriptionId: string | undefined;

    // Handle different voucher types
    if (voucher.type === 'free_subscription') {
      // Create a free subscription
      const planId = voucher.planId || 'premium_monthly';
      const duration = voucher.duration || '1_month';

      // Calculate subscription end date based on duration
      const currentPeriodEnd = new Date();
      switch (duration) {
        case '1_month':
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          break;
        case '3_months':
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
          break;
        case '6_months':
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 6);
          break;
        case '1_year':
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
          break;
        default:
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      // Create the subscription
      const subscription = await createSubscription({
        userId: session.user.id,
        planId,
        externalId: `voucher_${voucher.code}_${Date.now()}`,
      });

      // Activate the subscription immediately
      await updateSubscriptionStatus({
        id: subscription.id,
        status: 'active',
        currentPeriodEnd,
      });
      // If user had a pending referral, complete it now as subscription is active
      try {
        await completeReferralOnSubscription({ referredUserId: session.user.id, subscriptionId: subscription.id });
      } catch (e) {
        console.warn('Referral completion failed during voucher activation:', e);
      }

      subscriptionId = subscription.id;
    }

    // Record the voucher usage
    await applyVoucher({
      voucherId: voucher.id,
      userId: session.user.id,
      subscriptionId,
    });

    return Response.json({
      success: true,
      message:
        voucher.type === 'free_subscription'
          ? `Free subscription activated! Valid until ${subscriptionId ? 'subscription period end' : 'N/A'}`
          : `Discount voucher applied! You'll receive ${voucher.discountValue}${voucher.discountType === 'percentage' ? '%' : ' IDR'} off your next subscription.`,
      voucher: {
        code: voucher.code,
        type: voucher.type,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
      },
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError(
      'bad_request:api',
      'Failed to apply voucher',
    ).toResponse();
  }
}
