import { getSettings } from '@/lib/db/queries';
import { BillingSubscribeClient } from '@/components/billing-subscribe.client';
import type { Metadata } from 'next';

type Plan = {
  id: string;
  name: string;
  price: number; // in smallest currency unit (e.g., cents)
  currency?: string; // e.g., IDR
  description?: string;
  features?: string[];
  popular?: boolean;
};

function formatPrice(amount: number, currency?: string) {
  // Assume amount in major for display if currency is IDR (no cents)
  if (!currency || currency.toUpperCase() === 'IDR') return `IDR ${amount.toLocaleString()}`;
  return `${currency.toUpperCase()} ${amount / 100}`;
}

export default async function PricingPage() {
  const settings = await getSettings();
  const pricing = (settings?.pricingPlans as any) || {};
  const monthly: Plan[] = Array.isArray(pricing.monthly) ? pricing.monthly : [
    { id: 'basic_monthly', name: 'Basic', price: 49000, currency: 'IDR', description: 'For starters', features: ['Up to 3,000 messages'], popular: false },
    { id: 'premium_monthly', name: 'Premium', price: 99000, currency: 'IDR', description: 'Best for most', features: ['Higher limits', 'Priority support'], popular: true },
  ];
  const annual: Plan[] = Array.isArray(pricing.annual) ? pricing.annual : [
    { id: 'basic_annual', name: 'Basic (Annual)', price: 490000, currency: 'IDR', description: '2 months free', features: ['Up to 36,000 messages'], popular: false },
    { id: 'premium_annual', name: 'Premium (Annual)', price: 990000, currency: 'IDR', description: '2 months free', features: ['Higher limits', 'Priority support'], popular: true },
  ];

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">Choose your plan</h1>
        <p className="text-muted-foreground">Flexible monthly or annual billing.</p>
      </div>

      {/* Toggle hint (static for SSR). If you want client toggle, we can add one later. */}
      <div className="grid md:grid-cols-2 gap-4">
        {monthly.map((p) => (
          <div key={p.id} className={`rounded-xl border p-4 ${p.popular ? 'ring-1 ring-primary' : ''}`}>
            {p.popular && (
              <div className="mb-2 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">Most Popular</div>
            )}
            <div className="flex items-end justify-between">
              <div>
                <div className="text-lg font-medium">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.description || '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold">{formatPrice(p.price, p.currency)}</div>
                <div className="text-xs text-muted-foreground">per month</div>
              </div>
            </div>
            {Array.isArray(p.features) && p.features.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={`${f}`}>• {f}</li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <BillingSubscribeClient planId={p.id} />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-2">Annual Plans</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {annual.map((p) => (
            <div key={p.id} className={`rounded-xl border p-4 ${p.popular ? 'ring-1 ring-primary' : ''}`}>
              {p.popular && (
                <div className="mb-2 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">Best Value</div>
              )}
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-lg font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.description || '—'}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold">{formatPrice(p.price, p.currency)}</div>
                  <div className="text-xs text-muted-foreground">per year</div>
                </div>
              </div>
              {Array.isArray(p.features) && p.features.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={`${f}`}>• {f}</li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <BillingSubscribeClient planId={p.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Pricing',
  openGraph: {
    images: [{ url: '/og?title=Pricing&subtitle=Flexible%20plans%20for%20every%20team&emoji=%F0%9F%92%BC&theme=brand' }],
  },
  twitter: {
    images: [{ url: '/og?title=Pricing&subtitle=Flexible%20plans%20for%20every%20team&emoji=%F0%9F%92%BC&theme=brand' }],
  },
};
