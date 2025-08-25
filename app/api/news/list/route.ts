import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { newsArticle, newsSource } from '@/lib/db/schema';
import { and, desc, eq, gte, ilike, lt, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = (searchParams.get('category') || '').trim();
  const cursor = searchParams.get('cursor');
  const q = (searchParams.get('q') || '').trim();
  const sourceId = (searchParams.get('sourceId') || '').trim();
  const range = (searchParams.get('range') || '').trim(); // '24h' | '7d' | '30d'
  const limit = Math.min(Number(searchParams.get('limit') || 20), 50);

  const whereClauses: any[] = [];
  if (category && category !== 'semua') {
    whereClauses.push(eq(newsArticle.category, category));
  }
  if (sourceId) {
    whereClauses.push(eq(newsArticle.sourceId, sourceId as any));
  }
  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      whereClauses.push(lt(newsArticle.createdAt, cursorDate));
    }
  }
  if (q) {
    const like = `%${q}%`;
    whereClauses.push(or(ilike(newsArticle.title, like), ilike(newsArticle.summary, like)));
  }
  if (range) {
    const now = new Date();
    let since: Date | null = null;
    if (range === '24h') since = new Date(now.getTime() - 24 * 3600 * 1000);
    else if (range === '7d') since = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    else if (range === '30d') since = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    if (since) whereClauses.push(gte(newsArticle.publishedAt, since as any));
  }

  const rows = await db
    .select({
      id: newsArticle.id,
      title: newsArticle.title,
      link: newsArticle.link,
      imageUrl: newsArticle.imageUrl,
      category: newsArticle.category,
      summary: newsArticle.summary,
      timeline: newsArticle.timeline,
      factCheck: newsArticle.factCheck,
      relatedLinks: newsArticle.relatedLinks,
      publishedAt: newsArticle.publishedAt,
      createdAt: newsArticle.createdAt,
      sourceName: newsSource.name,
    })
    .from(newsArticle)
    .innerJoin(newsSource, eq(newsSource.id, newsArticle.sourceId))
    .where(whereClauses.length ? and(...whereClauses) : undefined as any)
    .orderBy(desc(newsArticle.createdAt))
    .limit(limit);

  const nextCursor = rows.length === limit ? rows[rows.length - 1].createdAt?.toISOString?.() ?? null : null;
  // Serialize dates
  const items = rows.map((r) => ({
    ...r,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
  }));

  return Response.json({ items, nextCursor });
}
