import { auth } from '@/lib/auth';
import { listAgents } from '@/lib/db/queries';
import { ToastOnQuery } from '@/components/admin/toast-on-query.client';
import { UnsavedGuard } from '@/components/admin/unsaved-guard.client';
import ExpertsPanel from '@/components/admin/experts-panel.client';
import { getSession } from '@/lib/auth-client';
import { headers } from 'next/headers';

export default async function AdminExpertsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return (
      <div className="p-6 text-sm text-red-500">Unauthorized: Superadmin only.</div>
    );
  }

  const { items: agents } = await listAgents({ q: null, isActive: null, limit: 100, offset: 0 });

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <ToastOnQuery />
      <UnsavedGuard selector="form" />
      <h1 className="text-xl font-semibold">Experts</h1>
      <ExpertsPanel initialAgents={agents} />
    </div>
  );
}
