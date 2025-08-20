import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { PricingPlansForm } from '@/components/admin/pricing-plans-form.client';

export default async function AdminPlansPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return <div className="p-6 text-sm text-red-500">Unauthorized: Admin only.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Pricing Plans</h1>
      <p className="text-sm text-muted-foreground">Manage the plans shown on the Pricing and Billing pages.</p>
      <PricingPlansForm />
    </div>
  );
}
