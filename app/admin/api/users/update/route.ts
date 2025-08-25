import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { adminUpdateUser } from '@/lib/db/queries';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: any = {};
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      const form = await request.formData();
      payload = Object.fromEntries(form.entries());
    }

    const userId = String(payload.userId || '');
    if (!userId) return new ChatSDKError('bad_request:api', 'Missing userId').toResponse();

    const update: any = {};
    if (payload.email !== undefined) update.email = String(payload.email || '');
    if (payload.name !== undefined) update.name = String(payload.name || '');
    if (payload.role !== undefined) update.role = String(payload.role || 'user');
    if (payload.onboarded !== undefined) update.onboarded = String(payload.onboarded) === 'true' || payload.onboarded === true;
    if (payload.tour !== undefined) update.tour = String(payload.tour) === 'true' || payload.tour === true;

    const updated = await adminUpdateUser({ userId, ...update });
    return Response.json({ ok: true, user: updated });
  } catch (e) {
    if (e instanceof ChatSDKError) return e.toResponse();
    return new ChatSDKError('bad_request:api', 'Failed to update user').toResponse();
  }
}

