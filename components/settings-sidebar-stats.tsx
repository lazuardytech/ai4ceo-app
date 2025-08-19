'use client';

import { useEffect, useMemo, useState } from 'react';

type UsageResponse = {
  used: number;
  limit: number;
  remaining: number;
  planType: 'standard' | 'premium';
  period: { start: string; end: string; month: number; year: number };
};

export function SettingsSidebarStats(props: {
  initialUsed: number;
  initialLimit: number;
  initialPlan: 'Premium' | 'Free';
}) {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/usage?month=${month}&year=${year}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as UsageResponse;
        if (!cancelled) setData(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const planLabel = useMemo(() => {
    if (!data) return props.initialPlan;
    return data.planType === 'premium' ? 'Premium' : 'Free';
  }, [data, props.initialPlan]);

  const used = data?.used ?? props.initialUsed;
  const limit = data?.limit ?? props.initialLimit;

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
      <div className="rounded-md border p-2">
        <div className="text-xs text-muted-foreground">Plan</div>
        <div className="font-medium">{planLabel}</div>
      </div>
      <div className="rounded-md border p-2">
        <div className="text-xs text-muted-foreground">Usage</div>
        <div className="font-medium">{used}/{limit}</div>
      </div>
    </div>
  );
}

