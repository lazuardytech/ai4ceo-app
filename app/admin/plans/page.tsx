import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PricingPlansForm } from '@/components/admin/pricing-plans-form.client';

export default async function AdminPlansPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return <div className="p-4 text-sm text-red-500">Unauthorized: Admin only.</div>;
  }

  return (
    <div className="space-y-4">
      <PricingPlansForm />
    </div>
  );
}
