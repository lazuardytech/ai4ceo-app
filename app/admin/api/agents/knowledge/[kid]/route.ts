import { auth } from '@/lib/auth';
import { deleteAgentKnowledge } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { headers } from 'next/headers';

export async function DELETE(_request: Request, context: { params: Promise<{ kid: string }> }) {
  const params = await context.params;
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const deleted = await deleteAgentKnowledge({ id: params.kid });
  return Response.json(deleted, { status: 200 });
}

export async function POST(request: Request, context: { params: Promise<{ kid: string }> }) {
  const params = await context.params;
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const form = await request.formData();
  const method = (form.get('_method') as string) || 'DELETE';
  if (method.toUpperCase() === 'DELETE') {
    await deleteAgentKnowledge({ id: params.kid });
    const referer = request.headers.get('referer') || '/admin/experts';
    return new Response(null, {
      status: 303,
      headers: { Location: `${referer}${referer.includes('?') ? '&' : '?'}ok=1&msg=${encodeURIComponent('Knowledge deleted')}` },
    });
  }
  return new ChatSDKError('bad_request:api').toResponse();
}
