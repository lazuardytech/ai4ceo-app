import { auth } from '@/lib/auth';
import { addAgentKnowledge, listAgentKnowledge } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { headers } from 'next/headers';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = Number(searchParams.get('limit') ?? '100');
  const offset = Number(searchParams.get('offset') ?? '0');
  const result = await listAgentKnowledge({ agentId: params.id, q, limit, offset });
  return Response.json(result, { status: 200 });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const contentType = request.headers.get('content-type') || '';
  let title: string | undefined;
  let content: string | undefined;
  let tags: string | undefined;
  let isForm = false;
  if (contentType.includes('application/json')) {
    const body = await request.json();
    title = body?.title;
    content = body?.content;
    tags = body?.tags;
  } else {
    const form = await request.formData();
    title = (form.get('title') as string) || undefined;
    content = (form.get('content') as string) || undefined;
    tags = (form.get('tags') as string) || undefined;
    isForm = true;
  }
  if (!title || !content) {
    return new ChatSDKError('bad_request:api', 'Missing required fields').toResponse();
  }
  await addAgentKnowledge({ agentId: params.id, title, content, tags });
  if (isForm) {
    return new Response(null, {
      status: 303,
      headers: { Location: `/admin/experts/${params.id}?ok=1&msg=${encodeURIComponent('Knowledge added')}` },
    });
  }
  return Response.json({ ok: true }, { status: 201 });
}
