import { auth } from '@/lib/auth';
import { applyReferralCode, getReferralConfig } from '@/lib/db/queries';
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

    // Get current referral configuration to determine bonus amount
    const config = await getReferralConfig();
    let bonusAmount = '0';

    // Calculate bonus amount based on configuration
    switch (config.benefitType) {
      case 'bonus_credits':
        bonusAmount = config.benefitValue;
        break;
      case 'discount_percentage':
        // For discount, we might still give some bonus credits
        bonusAmount = '5000'; // Default bonus for discount type
        break;
      case 'free_subscription':
        // For free subscription, we might give bonus credits too
        bonusAmount = '10000'; // Default bonus for free subscription
        break;
    }

    // Apply the referral code
    const usage = await applyReferralCode({
      referralCode,
      newUserId,
      bonusAmount,
    });

    return Response.json({
      success: true,
      message: 'Referral code applied successfully',
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
