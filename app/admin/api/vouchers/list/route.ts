import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { listVouchersPaged } from '@/lib/db/queries';
import { headers } from 'next/headers';

export async function GET(request: Request) {
  "use server"
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = Math.min(100, Number(searchParams.get('limit') || 20));
  const offset = Math.max(0, Number(searchParams.get('offset') || 0));

  const typeParam = searchParams.get('type');
  const statusParam = searchParams.get('status');
  const type =
    typeParam === 'discount' || typeParam === 'free_subscription'
      ? typeParam
      : null;
  const isActive =
    statusParam === 'active' ? true : statusParam === 'inactive' ? false : null;

  const data = await listVouchersPaged({ q, limit, offset, type, isActive });
  return Response.json(data, { status: 200 });
}
