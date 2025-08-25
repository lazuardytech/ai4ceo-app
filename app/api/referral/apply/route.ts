import { auth } from '@/lib/auth';
import { reserveReferralUsage } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { validateReferralCodeFormat } from '@/lib/utils';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  try {
    const { referralCode, newUserId } = await request.json();

    // Validate input
    if (!referralCode || typeof referralCode !== 'string') {
      return new ChatSDKError(
        'bad_request:referral',
        'Referral code is required',
      ).toResponse();
    }

    if (!newUserId || typeof newUserId !== 'string') {
      return new ChatSDKError(
        'bad_request:referral',
        'New user ID is required',
      ).toResponse();
    }

    // Check format
    if (!validateReferralCodeFormat(referralCode)) {
      return new ChatSDKError(
        'bad_request:referral',
        'Invalid referral code format',
      ).toResponse();
    }

    // Reserve the referral usage; benefits will be awarded on subscription
    const usage = await reserveReferralUsage({
      referralCode,
      newUserId,
    });

    return Response.json({
      success: true,
      message: 'Referral code saved. Benefits apply on subscription.',
      usage: {
        id: usage.id,
        bonusAmount: usage.bonusAmount,
        status: usage.status,
      },
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError(
      'bad_request:referral',
      'Failed to apply referral code',
    ).toResponse();
  }
}
