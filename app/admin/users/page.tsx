import { auth } from '@/lib/auth';

import { AdminUsersPanel } from '@/components/admin/users-panel.client';
import { getSession } from '@/lib/auth-client';
import { headers } from 'next/headers';

export default async function AdminUsersPage() {
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
      <h2 className="text-xl font-semibold">Users</h2>
      <p className="text-sm text-muted-foreground">
        Assign roles to manage access across the app.
      </p>
      <AdminUsersPanel />
    </div>
  );
}
