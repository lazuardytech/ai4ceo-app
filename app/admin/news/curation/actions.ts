"use server";

import { db } from '@/lib/db';
import { setting } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { setGlobalStopFlag } from '@/lib/news/curator';

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
  await setGlobalStopFlag(false);
}
