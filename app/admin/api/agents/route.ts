import { auth } from '@/app/(auth)/auth';
import {
  createAgent,
  listAgents,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const isActiveParam = searchParams.get('isActive');
  const isActive =
    isActiveParam === null ? null : isActiveParam === 'true' ? true : false;
  const limit = Number(searchParams.get('limit') ?? '100');
  const offset = Number(searchParams.get('offset') ?? '0');
  const result = await listAgents({ q, isActive, limit, offset });
  return Response.json(result, { status: 200 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const contentType = request.headers.get('content-type') || '';
  let payload: any = {};
  let isForm = false;
  if (contentType.includes('application/json')) {
    payload = await request.json();
  } else {
    const form = await request.formData();
    payload = Object.fromEntries(form.entries());
    payload.isActive = form.get('isActive') ? true : false;
    payload.ragEnabled = form.get('ragEnabled') ? true : false;
    isForm = true;
  }
  const { slug, name, description, prePrompt, personality, isActive, ragEnabled } = payload ?? {};
  if (!slug || !name || !prePrompt || !personality) {
    return new ChatSDKError('bad_request:api', 'Missing required fields').toResponse();
  }
  const created = await createAgent({
    slug,
    name,
    description: description ?? null,
    prePrompt,
    personality,
    isActive: typeof isActive === 'boolean' ? isActive : true,
    ragEnabled: typeof ragEnabled === 'boolean' ? ragEnabled : true,
  });
  if (isForm) {
    return new Response(null, {
      status: 303,
      headers: { Location: `/admin/experts?ok=1&msg=${encodeURIComponent('Expert created')}` },
    });
  }
  return Response.json(created, { status: 201 });
}
