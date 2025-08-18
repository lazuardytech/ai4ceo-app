import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { validateVoucher } from '@/lib/db/queries';
import { getSession } from '@/lib/auth-client';
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
        {
          valid: false,
          message: validation.reason,
        },
        { status: 200 },
      );
    }

    const voucher = validation.voucher;
    if (!voucher) {
      return Response.json(
        { valid: false, message: 'Voucher not found' },
        { status: 200 },
      );
    }

    return Response.json({
      valid: true,
      voucher: {
        code: voucher.code,
        type: voucher.type,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        planId: voucher.planId,
        duration: voucher.duration,
        description:
          voucher.type === 'free_subscription'
            ? `Free ${voucher.planId || 'premium'} subscription for ${voucher.duration || '1 month'}`
            : `${voucher.discountValue}${voucher.discountType === 'percentage' ? '%' : ' IDR'} discount on your next subscription`,
      },
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError(
      'bad_request:api',
      'Failed to validate voucher',
    ).toResponse();
  }
}
