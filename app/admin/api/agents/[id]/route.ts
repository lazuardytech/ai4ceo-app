import { auth } from '@/lib/auth';
import { deleteAgent, updateAgent } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { headers } from 'next/headers';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const contentType = request.headers.get('content-type') || '';
  let body: any = {};
  let isForm = false;
  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    const form = await request.formData();
    body = Object.fromEntries(form.entries());
    body.isActive = !!form.get('isActive');
    body.ragEnabled = !!form.get('ragEnabled');
    isForm = true;
  }
  const updated = await updateAgent({ id: params.id, ...body });
  if (isForm) {
    return new Response(null, {
      status: 303,
      headers: { Location: `/admin/experts?ok=1&msg=${encodeURIComponent('Expert updated')}` },
    });
  }
  return Response.json(updated, { status: 200 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const deleted = await deleteAgent({ id: params.id });
  return Response.json(deleted, { status: 200 });
}

// Method override to support HTML forms
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const form = await request.formData();
  const method = (form.get('_method') as string) || 'PUT';
  if (method.toUpperCase() === 'DELETE') {
    await deleteAgent({ id: params.id });
    return new Response(null, {
      status: 303,
      headers: { Location: `/admin/experts?ok=1&msg=${encodeURIComponent('Expert deleted')}` },
    });
  }
  const body: any = Object.fromEntries(form.entries());
  body.isActive = !!form.get('isActive');
  body.ragEnabled = !!form.get('ragEnabled');
  body._method = undefined;
  await updateAgent({ id: params.id, ...body });
  return new Response(null, {
    status: 303,
    headers: { Location: `/admin/experts?ok=1&msg=${encodeURIComponent('Expert updated')}` },
  });
}
