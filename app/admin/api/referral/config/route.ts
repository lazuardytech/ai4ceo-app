import { auth } from '@/lib/auth';
import { getReferralConfig, updateReferralConfig } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  // Check if user is superadmin
  if (session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  try {
    const config = await getReferralConfig();

    return Response.json({
      benefitType: config.benefitType,
      benefitValue: config.benefitValue,
      planId: config.planId,
      discountPercentage: config.discountPercentage,
      validityDays: config.validityDays,
      isActive: config.isActive,
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError(
      'bad_request:referral',
      'Failed to get referral configuration',
    ).toResponse();
  }
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  // Check if user is superadmin
  if (session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  try {
    const {
      benefitType,
      benefitValue,
      planId,
      discountPercentage,
      validityDays,
    } = await request.json();

    // Validate required fields
    if (!benefitType || !benefitValue) {
      return new ChatSDKError(
        'bad_request:referral',
        'Benefit type and value are required',
      ).toResponse();
    }

    // Validate benefit type
    const validBenefitTypes = [
      'free_subscription',
      'discount_percentage',
      'bonus_credits',
    ];
    if (!validBenefitTypes.includes(benefitType)) {
      return new ChatSDKError(
        'bad_request:referral',
        'Invalid benefit type',
      ).toResponse();
    }

    // Validate specific requirements based on benefit type
    if (benefitType === 'free_subscription' && !planId) {
      return new ChatSDKError(
        'bad_request:referral',
        'Plan ID is required for free subscription benefits',
      ).toResponse();
    }

    if (benefitType === 'discount_percentage' && !discountPercentage) {
      return new ChatSDKError(
        'bad_request:referral',
        'Discount percentage is required for discount benefits',
      ).toResponse();
    }

    // Update configuration
    const updatedConfig = await updateReferralConfig({
      benefitType,
      benefitValue,
      planId: planId || null,
      discountPercentage: discountPercentage || null,
      validityDays: validityDays || null,
    });

    return Response.json({
      success: true,
      message: 'Referral configuration updated successfully',
      config: {
        benefitType: updatedConfig.benefitType,
        benefitValue: updatedConfig.benefitValue,
        planId: updatedConfig.planId,
        discountPercentage: updatedConfig.discountPercentage,
        validityDays: updatedConfig.validityDays,
        isActive: updatedConfig.isActive,
      },
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError(
      'bad_request:referral',
      'Failed to update referral configuration',
    ).toResponse();
  }
}
