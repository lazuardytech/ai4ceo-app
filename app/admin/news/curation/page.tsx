import { db } from '@/lib/db';
import { newsCurationRun, setting } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { clearNewsCurationPause, clearNewsProviderPause, stopCuration, resumeCuration, restartCurationNow } from './actions';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function NewsCurationAdminPage() {
  const [row] = await db.select().from(setting).where(eq(setting.key, 'newsCurationPauseUntil')).limit(1);
  const iso = (row as any)?.value as string | undefined;
  const pausedUntil = iso ? new Date(iso) : null;
  const now = new Date();
  const isActive = pausedUntil ? pausedUntil > now : false;

  const [stRow] = await db.select().from(setting).where(eq(setting.key, 'newsCurationStopped')).limit(1);
  const stoppedVal = (stRow as any)?.value;
  const isStopped = stoppedVal === true || stoppedVal === 'true' || stoppedVal === '1';

  const runs = await db
    .select()
    .from(newsCurationRun)
    .orderBy(desc(newsCurationRun.startedAt))
    .limit(10);

  const providers = (process.env.NEWS_PROVIDERS || process.env.NEWS_PROVIDER || 'groq')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const providerStates = await Promise.all(
    providers.map(async (p) => {
      const key = `newsCurationPauseUntil_${p}`;
      const [prow] = await db.select().from(setting).where(eq(setting.key, key)).limit(1);
      const piso = (prow as any)?.value as string | undefined;
      const pdate = piso ? new Date(piso) : null;
      const active = pdate ? pdate > new Date() : false;
      return { provider: p, pausedUntil: pdate, isActive: active };
    }),
  );

  return (
    <div className="space-y-4">
      <div>
        <div>
          <div className="rounded-lg border bg-background p-4 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">Paused Until</div>
              <div className="text-muted-foreground text-sm mt-1">
                {pausedUntil ? pausedUntil.toLocaleString() : 'Not paused'}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Status: {isActive ? 'Cooling down (curation disabled)' : 'Active (curation allowed)'}
              </div>
            </div>
            <div className='flex gap-2'>
              <form action={clearNewsCurationPause}>
                <Button variant="outline">Clear Pause</Button>
              </form>
              <form
                action={async () => {
                  'use server';
                  const h = await headers();
                  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
                  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
                  const base = (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || `${proto}://${host}`);
                  const url = `${base}/api/cron/curate-news`;
                  const token = process.env.CRON_TOKEN;
                  try {
                    await fetch(url, {
                      method: token ? 'POST' : 'GET',
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                      cache: 'no-store',
                    });
                  } catch {
                    // ignore fetch failure here, UI shows last runs regardless
                  }
                  revalidatePath('/admin/news/curation');
                }}
              >
                <Button>Run Now</Button>
              </form>
              <div className="flex gap-2">
                {isStopped ? (
                  <form action={resumeCuration}>
                    <Button className='bg-green-600 hover:bg-green-700'>Start Curation</Button>
                  </form>
                ) : (
                  <form action={stopCuration}>
                    <Button>Stop Curation</Button>
                  </form>
                )}
                {!isStopped && (
                  <form action={restartCurationNow}>
                    <Button variant="secondary">Restart Now</Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/*<div className="mt-6 text-xs text-muted-foreground">
          Env overrides:
          <ul className="list-disc list-inside">
            <li><code>NEWS_STOP_ON_RATE_LIMIT</code> (default: true)</li>
            <li><code>NEWS_RATE_LIMIT_COOLDOWN_MINUTES</code> (default: 60)</li>
            <li><code>NEWS_MAX_CURATE_PER_RUN</code> (default: 30)</li>
            <li><code>NEWS_PROVIDERS</code> (e.g., <code>groq,vertex</code>)</li>
            <li><code>NEWS_MODEL_ID</code> (e.g., <code>chat-model</code>)</li>
            <li><code>newsCurationStopped</code> (Setting key) — controlled via Stop/Resume Buttons</li>
          </ul>
        </div>*/}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-lg font-semibold mb-4">Last Runs</h3>
        <div className="space-y-3">
          {runs.map((r) => (
            <div key={r.id} className="rounded border bg-background p-3 text-sm">
              <div className="flex flex-wrap gap-2 items-center">
                <div><span className="text-gray-500">Started:</span> {r.startedAt?.toLocaleString?.() || String(r.startedAt)}</div>
                <div><span className="text-gray-500">Finished:</span> {r.finishedAt ? (r.finishedAt as any as Date).toLocaleString?.() : '-'}</div>
                <div><span className="text-gray-500">Inserted:</span> {r.inserted}</div>
                <div><span className="text-gray-500">Skipped:</span> {r.skipped}</div>
                {r.stoppedEarly ? <div className="text-amber-600">Stopped early</div> : null}
                {r.pausedUntil ? <div><span className="text-gray-500">Paused until:</span> {(r.pausedUntil as any as Date).toLocaleString?.()}</div> : null}
                {r.stoppedAtSource ? <div><span className="text-gray-500">At feed:</span> {r.stoppedAtSource}</div> : null}
              </div>
              {r.providerStats ? (
                <div className="mt-2">
                  <div className="text-gray-500">Provider usage:</div>
                  <pre className="mt-1 p-2 bg-muted rounded overflow-auto text-xs">{JSON.stringify(r.providerStats, null, 2)}</pre>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providerStates.map((ps) => (
          <div key={ps.provider} className="rounded-lg border bg-background p-4 text-sm">
            <div className="font-medium">{ps.provider.toUpperCase()}</div>
            <div className="text-muted-foreground mt-1">
              Paused Until: {ps.pausedUntil ? ps.pausedUntil.toLocaleString() : 'Not paused'}
            </div>
            <div className="text-xs mt-1">
              Status: {ps.isActive ? 'Cooling down' : 'Active'}
            </div>
            <form action={clearNewsProviderPause} className="mt-3">
              <input type="hidden" name="provider" value={ps.provider} />
              <Button>Clear {ps.provider}</Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
