import { auth } from '@/app/(auth)/auth';
import { getActiveSubscriptionByUserId } from '@/lib/db/queries';
import Link from 'next/link';
import { BillingSubscribeClient } from '@/components/billing-subscribe.client';
import { VoucherApplication } from '@/components/voucher-application';
import { Badge } from '@/components/ui/badge';

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

  const active = await getActiveSubscriptionByUserId({
    userId: session.user.id,
  });

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Subscription Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage your plan, billing, and voucher codes.
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
              <Badge variant="outline">Free User</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              You&apos;re currently using the free tier. Upgrade to premium for
              additional features.
            </p>
          </div>
        )}
      </div>

      {/* Voucher Application */}
      <VoucherApplication refreshOnApplied />

      {/* Subscription Plans */}
      {!active && (
        <div className="rounded-xl border p-4 space-y-3">
          <div>
            <h2 className="font-medium">Premium Monthly</h2>
            <p className="text-sm text-muted-foreground">IDR 99,000 / month</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Unlimited chat messages</li>
              <li>• Priority support</li>
              <li>• Advanced AI models</li>
              <li>• Document processing</li>
            </ul>
          </div>
          <BillingSubscribeClient planId="premium_monthly" />
        </div>
      )}

      {/* Support Information */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          After payment, you will be redirected to a confirmation page. If
          something goes wrong, you can revisit this page to see the updated
          status.
        </p>
        <p>
          Have a voucher code? Use the voucher application form above to apply
          discounts or activate free subscriptions.
        </p>
        <p>
          Need help?{' '}
          <Link className="underline" href="/">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
