import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { getActiveAgents, seedDefaultAgentsIfEmpty } from '@/lib/db/queries';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }
  await seedDefaultAgentsIfEmpty();
  const agents = await getActiveAgents();
  return Response.json(
    agents.map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description,
    })),
    { status: 200 },
  );
}

