import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  try {
    const body = await request.json();
    const email = String(body?.email || '');
    if (!email) return new ChatSDKError('bad_request:api', 'Missing email').toResponse();

    const baseURL = process.env.APP_BASE_URL || '';
    const redirectTo = `${baseURL || ''}/reset-password`;

    await auth.api.requestPasswordReset({
      body: { email, redirectTo },
    });

    return Response.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (e) {
    if (e instanceof ChatSDKError) return e.toResponse();
    return new ChatSDKError('bad_request:api', 'Failed to request reset').toResponse();
  }
}
