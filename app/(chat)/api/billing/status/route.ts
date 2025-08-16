import { auth } from '@/app/(auth)/auth';
import { getActiveSubscriptionByUserId, getSettings } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET() {
  const session = await auth();
  if (!session?.user) return new ChatSDKError('unauthorized:auth').toResponse();

  const [active, settings] = await Promise.all([
    getActiveSubscriptionByUserId({ userId: session.user.id }),
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

