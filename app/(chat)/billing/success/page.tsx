import Link from 'next/link';

export default function BillingSuccessPage() {
  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Payment Successful</h1>
      <p className="text-sm text-muted-foreground">
        Thank you! Your payment was successful. Your subscription will be
        activated shortly.
      </p>
      <Link href="/billing" className="underline text-sm">
        Go to Billing
      </Link>
    </div>
  );
}
