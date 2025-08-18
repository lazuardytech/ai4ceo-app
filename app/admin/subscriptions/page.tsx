import { auth } from '@/lib/auth';

import { AdminSubscriptionsPanel } from '@/components/admin/subscriptions-panel.client';
import { getSession } from '@/lib/auth-client';
import { headers } from 'next/headers';

export default async function AdminSubscriptionsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return (
      <div className="p-6 text-sm text-red-500">
        Unauthorized: Superadmin only.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-2 md:p-4 space-y-4">
      <h2 className="text-xl font-semibold">User Subscriptions</h2>
      <p className="text-sm text-muted-foreground">
        View all users and their subscription status, including free users.
      </p>
      <AdminSubscriptionsPanel />
    </div>
  );
}
