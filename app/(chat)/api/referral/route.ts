import { auth } from '@/lib/auth';
import { getSession } from '@/lib/auth-client';
import {
  getUserReferral,
  createReferral,
  checkReferralCodeUniqueness,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { generateUniqueReferralCode } from '@/lib/utils';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  try {
    let userReferral = await getUserReferral({ userId: session.user.id });

    // If user doesn't have a referral record, create one
    if (!userReferral) {
      const referralCode = await generateUniqueReferralCode(
        async (code: string) =>
          await checkReferralCodeUniqueness({ referralCode: code }),
      );

      userReferral = await createReferral({
        userId: session.user.id,
        referralCode,
      });
    }

    return Response.json({
      referralCode: userReferral.referralCode,
      bonusBalance: userReferral.bonusBalance,
      totalEarned: userReferral.totalEarned,
      totalReferrals: userReferral.totalReferrals,
      isActive: userReferral.isActive,
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError(
      'bad_request:referral',
      'Failed to get referral data',
    ).toResponse();
  }
}
