"use server";

import { db } from '@/lib/db';
import { newsSource } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function toggleFeed(id: string, isActive: boolean) {
  await db.update(newsSource).set({ isActive }).where(eq(newsSource.id, id));
}

export async function addFeed(name: string, url: string) {
  if (!name?.trim() || !url?.trim()) return;
  try {
    await db.insert(newsSource).values({ name: name.trim(), url: url.trim(), isActive: true });
  } catch {
    // ignore duplicates
  }
}

export async function removeFeed(id: string) {
  await db.delete(newsSource).where(eq(newsSource.id, id));
}

