import { getCurrentUser } from '@/lib/auth-guard';
import { ChatSDKError } from '@/lib/errors';
import { chat } from '@/lib/db/schema';
import { and, eq, ilike, desc, } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new ChatSDKError('unauthorized:chat').toResponse();

  const { searchParams } = request.nextUrl;
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit') || '10'), 1), 50);

  if (!q) {
    return Response.json({ chats: [] });
  }

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
  }
}
