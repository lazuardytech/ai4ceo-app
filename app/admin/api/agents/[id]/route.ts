import { auth } from '@/app/(auth)/auth';
import { deleteAgent, updateAgent } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const contentType = request.headers.get('content-type') || '';
  let body: any = {};
  if (contentType.includes('application/json')) {
    body = await request.json();
  } else {
    const form = await request.formData();
    body = Object.fromEntries(form.entries());
    body.isActive = form.get('isActive') ? true : false;
    body.ragEnabled = form.get('ragEnabled') ? true : false;
  }
  const updated = await updateAgent({ id: params.id, ...body });
  return Response.json(updated, { status: 200 });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const deleted = await deleteAgent({ id: params.id });
  return Response.json(deleted, { status: 200 });
}

// Method override to support HTML forms
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const form = await request.formData();
  const method = (form.get('_method') as string) || 'PUT';
  if (method.toUpperCase() === 'DELETE') {
    const deleted = await deleteAgent({ id: params.id });
    return Response.json(deleted, { status: 200 });
  }
  const body: any = Object.fromEntries(form.entries());
  body.isActive = form.get('isActive') ? true : false;
  body.ragEnabled = form.get('ragEnabled') ? true : false;
  delete body._method;
  const updated = await updateAgent({ id: params.id, ...body });
  return Response.json(updated, { status: 200 });
}
