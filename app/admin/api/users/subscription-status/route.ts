import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { listUsersWithSubscriptionStatus } from '@/lib/db/queries';
import { getSession } from '@/lib/auth-client';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = Math.min(100, Number(searchParams.get('limit') || 20));
  const offset = Math.max(0, Number(searchParams.get('offset') || 0));

  const data = await listUsersWithSubscriptionStatus({ q, limit, offset });
  return Response.json(data, { status: 200 });
}
