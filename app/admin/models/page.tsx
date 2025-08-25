import { auth } from '@/lib/auth';
import AdminModelsPanel from '@/components/admin/models-panel.client';
import { headers } from 'next/headers';

export default async function AdminModelsPage() {
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

  // Client panel is imported directly; Server Component will render a Client boundary

  return (
    <div className="space-y-4">
      <AdminModelsPanel />
    </div>
  );
}
