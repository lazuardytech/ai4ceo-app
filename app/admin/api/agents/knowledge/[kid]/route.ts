import { auth } from '@/app/(auth)/auth';
import { deleteAgentKnowledge } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function DELETE(_request: Request, context: { params: Promise<{ kid: string }> }) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const deleted = await deleteAgentKnowledge({ id: params.kid });
  return Response.json(deleted, { status: 200 });
}

export async function POST(request: Request, context: { params: Promise<{ kid: string }> }) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const form = await request.formData();
  const method = (form.get('_method') as string) || 'DELETE';
  if (method.toUpperCase() === 'DELETE') {
    const deleted = await deleteAgentKnowledge({ id: params.kid });
    return Response.json(deleted, { status: 200 });
  }
  return new ChatSDKError('bad_request:api').toResponse();
}
