import { auth } from '@/app/(auth)/auth';
import { getActiveSubscriptionByUserId } from '@/lib/db/queries';
import Link from 'next/link';
import { BillingSubscribeClient } from '@/components/billing-subscribe.client';

export const experimental_ppr = true;

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="p-6">
        <p className="text-sm">Please sign in to manage your subscription.</p>
      </div>
    );
  }

  const active = await getActiveSubscriptionByUserId({ userId: session.user.id });

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Subscription</h1>
        <p className="text-sm text-muted-foreground">Manage your plan and billing.</p>
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="font-medium">Current Plan</h2>
        {active ? (
          <div className="mt-2 text-sm">
            <p>Status: <span className="font-medium">{active.status}</span></p>
            {active.currentPeriodEnd && (
              <p>Renews: {new Date(active.currentPeriodEnd).toLocaleString()}</p>
            )}
            <p className="mt-2 text-muted-foreground">Plan ID: {active.planId}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No active subscription.</p>
        )}
      </div>

      {!active && (
        <div className="rounded-xl border p-4 space-y-3">
          <div>
            <h2 className="font-medium">Premium Monthly</h2>
            <p className="text-sm text-muted-foreground">IDR 99,000 / month</p>
          </div>
          <BillingSubscribeClient planId="premium_monthly" />
          </div>
      )}

      <div className="text-sm text-muted-foreground">
        <p>
          After payment, you will be redirected to a confirmation page. If something goes wrong,
          you can revisit this page to see the updated status.
        </p>
        <p className="mt-2">
          Need help? <Link className="underline" href="/">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
