import { auth } from '@/lib/auth';
import { listAgents } from '@/lib/db/queries';
import { ToastOnQuery } from '@/components/admin/toast-on-query.client';
import { UnsavedGuard } from '@/components/admin/unsaved-guard.client';
import { ExpertsPanel } from '@/components/admin/experts-panel.client';
import { headers } from 'next/headers';

export default async function AdminExpertsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return (
      <div className="p-4 text-sm text-red-500">Unauthorized: Admin only.</div>
    );
  }

  const { items: agents } = await listAgents({ q: null, isActive: null, limit: 100, offset: 0 });

  return (
    <div className="space-y-4">
      <ToastOnQuery />
      <UnsavedGuard selector="form" />
      <ExpertsPanel initialAgents={agents} />
    </div>
  );
}
