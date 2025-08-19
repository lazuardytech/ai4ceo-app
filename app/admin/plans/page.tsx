import { auth } from '@/lib/auth';
import { getSettings } from '@/lib/db/queries';
import { getSession } from '@/lib/auth-client';
import { headers } from 'next/headers';

export default async function AdminPlansPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return <div className="p-6 text-sm text-red-500">Unauthorized: Superadmin only.</div>;
  }

  const settings = await getSettings();
  const existing = settings?.pricingPlans ? JSON.stringify(settings.pricingPlans, null, 2) : `{
  "monthly": [
    { "id": "basic_monthly", "name": "Basic", "price": 49000, "currency": "IDR", "description": "For starters", "features": ["Up to 3,000 messages"], "popular": false },
    { "id": "premium_monthly", "name": "Premium", "price": 99000, "currency": "IDR", "description": "Best for most", "features": ["Higher limits", "Priority support"], "popular": true }
  ],
  "annual": [
    { "id": "basic_annual", "name": "Basic (Annual)", "price": 490000, "currency": "IDR", "description": "2 months free", "features": ["Up to 36,000 messages"], "popular": false },
    { "id": "premium_annual", "name": "Premium (Annual)", "price": 990000, "currency": "IDR", "description": "2 months free", "features": ["Higher limits", "Priority support"], "popular": true }
  ]
}`;

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Pricing Plans</h1>
      <p className="text-sm text-muted-foreground">Edit the pricing plans used on the Pricing and Billing pages.</p>
      <form method="post" action="/admin/api/settings" className="space-y-2">
        <input type="hidden" name="key" value="pricingPlans" />
        <textarea name="value" defaultValue={existing} className="w-full h-80 font-mono text-sm border rounded p-2" />
        <div>
          <button type="submit" className="border rounded px-3 py-1 text-sm hover:bg-muted">Save</button>
        </div>
      </form>
      <div className="text-xs text-muted-foreground">
        Tip: Plans require fields: id, name, price, currency (optional), description (optional), features (array), popular (boolean).
      </div>
    </div>
  );
}

