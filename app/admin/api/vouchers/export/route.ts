import { auth } from '@/lib/auth';
import { getSession } from '@/lib/auth-client';
import { listVouchersPaged } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { headers } from 'next/headers';

function toCsvValue(v: any) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const typeParam = searchParams.get('type');
  const statusParam = searchParams.get('status');
  const type =
    typeParam === 'discount' || typeParam === 'free_subscription'
      ? typeParam
      : null;
  const isActive =
    statusParam === 'active' ? true : statusParam === 'inactive' ? false : null;

  // Export up to 10k rows for current filters
  const { items } = await listVouchersPaged({
    q,
    type,
    isActive,
    limit: 10000,
    offset: 0,
  });

  const customHeaders = [
    'id',
    'code',
    'type',
    'discountType',
    'discountValue',
    'planId',
    'duration',
    'maxUsages',
    'currentUsages',
    'isActive',
    'validFrom',
    'validUntil',
    'createdAt',
    'updatedAt',
  ];
  const rows = items.map((v) => [
    v.id,
    v.code,
    v.type,
    v.discountType ?? '',
    v.discountValue ?? '',
    v.planId ?? '',
    v.duration ?? '',
    v.maxUsages ?? '',
    v.currentUsages,
    v.isActive,
    v.validFrom?.toISOString?.() ?? v.validFrom,
    v.validUntil
      ? ((v.validUntil as any)?.toISOString?.() ?? v.validUntil)
      : '',
    (v as any).createdAt?.toISOString?.() ?? (v as any).createdAt,
    (v as any).updatedAt?.toISOString?.() ?? (v as any).updatedAt,
  ]);

  const csv = [customHeaders, ...rows]
    .map((row) => row.map(toCsvValue).join(','))
    .join('\n');

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="vouchers.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
