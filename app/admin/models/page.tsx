import { auth } from '@/lib/auth';
import AdminModelsPanel from '@/components/admin/models-panel.client';
import { headers } from 'next/headers';

export default async function AdminModelsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return (
      <div className="p-6 text-sm text-red-500">
        Unauthorized: Admin only.
      </div>
    );
  }

  // Client panel is imported directly; Server Component will render a Client boundary

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">AI Model Configuration</h2>
          <p className="text-muted-foreground">Configure and manage AI models for your platform</p>
        </div>
        <AdminModelsPanel />
      </div>
    </div>
  );
}
