import { getCurrentUser } from '@/lib/auth-guard';
import { getActiveSubscriptionByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new ChatSDKError('unauthorized:auth').toResponse();

  const active = await getActiveSubscriptionByUserId({ userId: user.id });

  return Response.json({
    hasActiveSubscription: Boolean(active),
  });
}
