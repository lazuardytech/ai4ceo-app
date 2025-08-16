'use client';

import { useState } from 'react';

export function BillingSubscribeClient({ planId = 'premium_monthly' }: { planId?: string }) {
  const [loading, setLoading] = useState(false);

  const subscribe = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to create invoice');
      }
      const data = await res.json();
      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        throw new Error('Missing invoice URL');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
      onClick={subscribe}
      disabled={loading}
    >
      {loading ? 'Redirecting…' : 'Subscribe'}
    </button>
  );
}

