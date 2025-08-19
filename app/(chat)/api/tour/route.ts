import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { user as userTable } from '@/lib/db/schema';
import { ChatSDKError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth-guard';

export const runtime = 'nodejs';

function getDb() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error('POSTGRES_URL is not configured.');
  const sql = postgres(url);
  const db = drizzle(sql);
  return { db, sql };
}

export async function PATCH(request: Request) {
  const me = await getCurrentUser();
  if (!me) return new ChatSDKError('unauthorized:auth').toResponse();

  let body: { tour?: boolean } = {};
  try {
    body = (await request.json()) as { tour?: boolean };
  } catch {
    return new ChatSDKError('bad_request:api', 'Invalid JSON').toResponse();
  }

  const tour = Boolean(body.tour);
  try {
    const { db } = getDb();
    await db.update(userTable).set({ tour }).where(eq(userTable.id, me.id));
    return NextResponse.json({ tour });
  } catch (e) {
    console.error('PATCH /api/tour error:', e);
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

