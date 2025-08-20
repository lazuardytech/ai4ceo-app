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
    <div className="mx-auto max-w-3xl p-2 md:p-4 space-y-6">
      <h2 className="text-xl font-semibold">Models</h2>

      <AdminModelsPanel />
    </div>
  );
}
