import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { getActiveAgents, seedDefaultAgentsIfEmpty } from '@/lib/db/queries';
import { getSession } from '@/lib/auth-client';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
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
