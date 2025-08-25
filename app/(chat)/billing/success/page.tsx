"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type ConfirmRes = { ok: boolean; status?: string; error?: string };

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const ext = searchParams.get('ext');
  const [confirmed, setConfirmed] = useState<ConfirmRes | null>(null);

  const externalId = useMemo(() => (ext ? String(ext) : ''), [ext]);

  useEffect(() => {
    let ignore = false;
    async function confirm() {
      if (!externalId) return;
      try {
        const res = await fetch(`/api/billing/confirm?ext=${encodeURIComponent(externalId)}`, { cache: 'no-store' });
        const data = (await res.json()) as ConfirmRes;
        if (!ignore) setConfirmed(res.ok ? data : { ok: false, error: 'Failed to confirm payment' });
      } catch {
        if (!ignore) setConfirmed({ ok: false, error: 'Failed to confirm payment' });
      }
    }
    confirm();
    return () => {
      ignore = true;
    };
  }, [externalId]);

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
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
