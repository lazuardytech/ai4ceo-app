import Link from 'next/link';

export default function BillingFailedPage() {
  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <h1 className="text-xl font-semibold">Payment Failed or Canceled</h1>
      <p className="text-sm text-muted-foreground">
        Your payment did not complete. You can try again from the pricing page or contact support if you need help.
      </p>
      <div className="pt-2 space-x-4">
        <Link href="/pricing" className="underline text-sm">Back to Pricing</Link>
        <Link href="/settings/billing" className="underline text-sm">Go to Billing</Link>
      </div>
    </div>
  );
}
