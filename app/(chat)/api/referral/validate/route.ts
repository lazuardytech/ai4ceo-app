import { validateReferralCode } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { validateReferralCodeFormat } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { referralCode } = await request.json();

    // Validate input
    if (!referralCode || typeof referralCode !== 'string') {
      return Response.json({
        valid: false,
        message: 'Referral code is required',
      });
    }

    // Check format
    if (!validateReferralCodeFormat(referralCode)) {
      return Response.json({
        valid: false,
        message: 'Invalid referral code format',
      });
    }

    // Validate against database
    const validation = await validateReferralCode({ referralCode });

    if (!validation.valid) {
      return Response.json({
        valid: false,
        message: 'Referral code not found or inactive',
      });
    }

    return Response.json({
      valid: true,
      message: 'Valid referral code',
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError(
      'bad_request:referral',
      'Failed to validate referral code',
    ).toResponse();
  }
}
