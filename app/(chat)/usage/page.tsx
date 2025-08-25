'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type UsageResponse = {
  used: number;
  limit: number;
  remaining: number;
  planType: 'standard' | 'premium';
  period: {
    start: string; // ISO
    end: string; // ISO
    month: number; // 1-12
    year: number;
  };
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function UsagePage() {
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [year, setYear] = useState<number>(now.getFullYear());
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchUsage = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await fetch(`/api/usage?month=${month}&year=${year}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? `Failed to fetch usage (${res.status})`);
      }
      setData(json as UsageResponse);
    } catch (err: any) {
      setData(null);
      toast.error(err?.message ?? 'Failed to fetch usage');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsage({ silent: true });
    setRefreshing(false);
  }, [fetchUsage]);

  const percent = useMemo(() => {
    const used = data?.used ?? 0;
    const limit = data?.limit ?? 0;
    if (!limit || limit <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
  }, [data?.used, data?.limit]);

  const periodLabel = useMemo(() => {
    if (!data?.period) return '';
    return `${monthNames[(data.period.month - 1) % 12]} ${data.period.year}`;
  }, [data?.period]);

  const planBadge = useMemo(() => {
    if (!data?.planType) return null;
    if (data.planType === 'premium') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-xs font-medium">
          Premium plan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-muted text-foreground/70 px-2 py-0.5 text-xs font-medium">
        Standard plan
      </span>
    );
  }, [data?.planType]);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    // Allow a 5-year window around the current year
    const range: number[] = [];
    for (let y = current - 2; y <= current + 2; y++) range.push(y);
    return range;
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/*<div className="space-y-2">
        <h1 className="text-2xl font-semibold">Usage</h1>
        <p className="text-sm text-muted-foreground">
          Track your monthly message usage and plan limits.
        </p>
      </div>*/}

      <div className="rounded-lg border bg-card text-card-foreground">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Monthly Usage</div>
            {planBadge}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-8 rounded-md border bg-background px-2 text-sm"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-md border bg-background px-2 text-sm"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              className="h-8 px-3"
              disabled={loading || refreshing}
              onClick={onRefresh}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-2 w-full bg-muted rounded" />
              <div className="flex items-center justify-between text-sm">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ) : data ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{periodLabel}</div>
                <div className="text-sm">
                  <span className="font-medium">{data.used.toLocaleString()}</span> /{' '}
                  <span className="text-muted-foreground">{data.limit.toLocaleString()}</span> messages
                </div>
              </div>

              <Progress value={percent} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Used</div>
                  <div className="text-base font-medium">
                    {data.used.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Remaining</div>
                  <div className="text-base font-medium">
                    {data.remaining.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Limit</div>
                  <div className="text-base font-medium">
                    {data.limit.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                Usage resets monthly on the 1st day. If you need higher limits, consider upgrading
                or contact support.
              </div>
            </>
          ) : (
            <div className="text-sm text-destructive">
              Failed to load usage. Please try refreshing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
