import { auth } from '@/lib/auth';
import { getReferralTransactions } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return new ChatSDKError(
        'bad_request:referral',
        'Invalid pagination parameters',
      ).toResponse();
    }

    const result = await getReferralTransactions({
      userId: session.user.id,
      page,
      limit,
    });

    // Format transactions for response
    const formattedTransactions = result.transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      createdAt: transaction.createdAt.toISOString(),
    }));

    return Response.json({
      transactions: formattedTransactions,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError(
      'bad_request:referral',
      'Failed to get referral transactions',
    ).toResponse();
  }
}
