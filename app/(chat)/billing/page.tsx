import { getCurrentUser } from '@/lib/auth-guard';
import { getActiveSubscriptionByUserId, getSettings } from '@/lib/db/queries';
import Link from 'next/link';
import { VoucherApplication } from '@/components/voucher-application';
import { Badge } from '@/components/ui/badge';

export default async function BillingPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-sm">Please sign in to manage your subscription.</p>
      </div>
    );
  }

  const [active, settings] = await Promise.all([
    getActiveSubscriptionByUserId({ userId: user.id }),
    getSettings(),
  ]);

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Your Subscription</h1>
        <p className="text-sm text-muted-foreground">
          Manage your plan, billing, and vouchers.
        </p>
      </div>

      {/* Current Subscription Status */}
      <div className="rounded-xl border p-4">
        <h2 className="font-medium mb-3">Current Plan</h2>
        {active ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Status:</span>
              <Badge
                variant={active.status === 'active' ? 'default' : 'secondary'}
                className={active.status === 'active' ? 'bg-green-600' : ''}
              >
                {active.status}
              </Badge>
            </div>
            <div className="text-sm">
              <p>
                <span className="font-medium">Plan:</span> {active.planId}
              </p>
              {active.currentPeriodEnd && (
                <p>
                  <span className="font-medium">
                    {active.status === 'active' ? 'Renews' : 'Expires'}:
                  </span>{' '}
                  {new Date(active.currentPeriodEnd).toLocaleString()}
                </p>
              )}
              {active.externalId && (
                <p className="text-muted-foreground mt-1">
                  <span className="font-medium">Subscription ID:</span>{' '}
                  {active.externalId}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Status:</span>
              <Badge variant="outline">Free plan</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              You&apos;re on the free plan. Upgrade to Premium for higher limits, priority support, and advanced features.
            </p>
          </div>
        )}
      </div>

      {/* Voucher Application */}
      <VoucherApplication refreshOnApplied />

      {!active && (
        <div className="rounded-xl border p-4 space-y-2">
          <div className="text-sm">Looking for plans?</div>
          <Link className="underline text-sm" href="/pricing">View Pricing</Link>
        </div>
      )}

      {/* Support Information */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          After payment, you`&apos;`ll be redirected to a confirmation page.
          You can revisit this page anytime to see your updated subscription
          status.
        </p>
        <p>
          Have a voucher? Enter it above to redeem discounts or activate free
          subscriptions.
        </p>
        <p>
          Need help?{' '}
          <Link className="underline" href="/">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
