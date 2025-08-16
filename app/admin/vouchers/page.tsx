import { auth } from '@/app/(auth)/auth';
import { AdminVouchersPanel } from '@/components/admin/vouchers-panel.client';

export default async function AdminVouchersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return (
      <div className="p-6 text-sm text-red-500">
        Unauthorized: Superadmin only.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-2 md:p-4 space-y-4">
      <h2 className="text-xl font-semibold">Voucher Management</h2>
      <p className="text-sm text-muted-foreground">
        Create and manage discount codes and free subscription vouchers.
      </p>
      <AdminVouchersPanel />
    </div>
  );
}
