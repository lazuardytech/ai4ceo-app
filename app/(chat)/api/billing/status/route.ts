import { getCurrentUser } from '@/lib/auth-guard';
import { getActiveSubscriptionByUserId, getSettings } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new ChatSDKError('unauthorized:auth').toResponse();

  const [active, settings] = await Promise.all([
    getActiveSubscriptionByUserId({ userId: user.id }),
    getSettings(),
  ]);

  const reasoningRequiresSubscription = Boolean(
    settings?.reasoningRequiresSubscription ?? true,
  );

  return Response.json({
    hasActiveSubscription: Boolean(active),
    reasoningRequiresSubscription,
  });
}
