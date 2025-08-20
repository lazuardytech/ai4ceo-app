import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { updateUserRole } from '@/lib/db/queries';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  const form = await request.formData();
  const userId = String(form.get('userId') || '');
  const role = String(form.get('role') || '');
  if (!userId || !['user', 'admin'].includes(role)) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  await updateUserRole({ userId, role: role as any });
  return new Response(null, { status: 204 });
}
