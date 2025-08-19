import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function BillingSuccessPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const extParam = searchParams?.ext;
  const externalId = Array.isArray(extParam) ? extParam[0] : extParam;

  let confirmed: { ok: boolean; status?: string; error?: string } | null = null;
  if (externalId) {
    try {
      const res = await fetch(`/api/billing/confirm?ext=${encodeURIComponent(externalId)}`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (res.ok) {
        confirmed = await res.json();
      } else {
        confirmed = { ok: false, error: 'Failed to confirm payment' };
      }
    } catch (e) {
      confirmed = { ok: false, error: 'Failed to confirm payment' };
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Payment Successful</h1>
      {externalId && (
        <p className="text-sm text-muted-foreground">Reference: {externalId}</p>
      )}
      {confirmed?.ok && confirmed.status === 'active' ? (
        <p className="text-sm">Your subscription is now active.</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          We are confirming your payment. If this takes more than a minute,
          please check your billing page.
        </p>
      )}
      <div className="pt-2">
        <Link href="/settings/billing" className="underline text-sm">Go to Billing</Link>
      </div>
    </div>
  );
}
