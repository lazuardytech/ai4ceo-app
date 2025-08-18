import { getCurrentUser } from '@/lib/auth-guard';
import { ChatSDKError } from '@/lib/errors';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { chat } from '@/lib/db/schema';
import { and, eq, ilike, desc } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new ChatSDKError('unauthorized:chat').toResponse();

  const { searchParams } = request.nextUrl;
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit') || '10'), 1), 50);

  if (!q) {
    return Response.json({ chats: [] });
  }

  const sql = postgres(process.env.POSTGRES_URL!);
  const db = drizzle(sql);

  try {
    const rows = await db
      .select()
      .from(chat)
      .where(and(eq(chat.userId, user.id), ilike(chat.title, `%${q}%`)))
      .orderBy(desc(chat.createdAt))
      .limit(limit);
    return Response.json({ chats: rows });
  } catch (e) {
    console.error('GET /api/history/search error', e);
    return new ChatSDKError('bad_request:api').toResponse();
  } finally {
    await sql.end({ timeout: 1 });
  }
}

