import { getCurrentUser } from '@/lib/auth-guard';
import { getActiveAgents } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new ChatSDKError('unauthorized:auth').toResponse();
  const agents = await getActiveAgents();
  // public fields only
  return Response.json(
    agents.map((a) => ({ id: a.id, slug: a.slug, name: a.name, description: a.description, icon: (a as any).icon || null })),
  );
}
