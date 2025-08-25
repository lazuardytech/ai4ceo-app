import { auth } from '@/lib/auth';

import { AdminSubscriptionsPanel } from '@/components/admin/subscriptions-panel.client';
import { headers } from 'next/headers';

export default async function AdminSubscriptionsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return (
      <div className="p-4 text-sm text-red-500">
        Unauthorized: Admin only.
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-4">
      <AdminSubscriptionsPanel />
    </div>
  );
}
