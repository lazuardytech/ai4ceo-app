import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { listVouchersPaged } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
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
