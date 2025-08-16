import Link from 'next/link';

export default function BillingFailedPage() {
  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Payment Failed</h1>
      <p className="text-sm text-muted-foreground">
        The payment did not complete. You can try again or contact support if
        the issue persists.
      </p>
      <div className="flex gap-4">
        <Link href="/billing" className="underline text-sm">
          Back to Billing
        </Link>
        <Link href="/" className="underline text-sm">
          Home
        </Link>
      </div>
    </div>
  );
}
