"use server";

import { db } from '@/lib/db';
import { setting } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { setGlobalStopFlag } from '@/lib/news/curator';
import { headers } from 'next/headers';

export async function clearNewsCurationPause() {
  await db.delete(setting).where(eq(setting.key, 'newsCurationPauseUntil'));
}

export async function clearNewsProviderPause(formData: FormData) {
  const provider = String(formData.get('provider') || '').trim();
  if (!provider) return;
  const key = `newsCurationPauseUntil_${provider}`;
  await db.delete(setting).where(eq(setting.key, key));
}

export async function stopCuration() {
  await setGlobalStopFlag(true);
}

export async function resumeCuration() {
  // Clear the global stop flag and any global/provider pause keys so runs can start immediately
  await setGlobalStopFlag(false);
  // Clear global pause window
  await db.delete(setting).where(eq(setting.key, 'newsCurationPauseUntil'));
  // Clear provider-specific cooldowns
  const providers = (process.env.NEWS_PROVIDERS || process.env.NEWS_PROVIDER || 'groq')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const p of providers) {
    const key = `newsCurationPauseUntil_${p}`;
    await db.delete(setting).where(eq(setting.key, key));
  }
  // Kick off a run immediately
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
    const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
    const base = (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || `${proto}://${host}`);
    const url = `${base}/api/cron/curate-news`;
    const token = process.env.CRON_TOKEN;
    await fetch(url, {
      method: token ? 'POST' : 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    });
  } catch { /* ignore */ }
}

export async function restartCurationNow() {
  // Clear global and provider pause windows, keep current stop flag as is
  await db.delete(setting).where(eq(setting.key, 'newsCurationPauseUntil'));
  const providers = (process.env.NEWS_PROVIDERS || process.env.NEWS_PROVIDER || 'groq')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const p of providers) {
    const key = `newsCurationPauseUntil_${p}`;
    await db.delete(setting).where(eq(setting.key, key));
  }
  // Trigger a run immediately
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
    const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
    const base = (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || `${proto}://${host}`);
    const url = `${base}/api/cron/curate-news`;
    const token = process.env.CRON_TOKEN;
    await fetch(url, {
      method: token ? 'POST' : 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: 'no-store',
    });
  } catch { /* ignore */ }
}
