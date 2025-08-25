import { db } from '@/lib/db';
import { newsArticle, newsSource } from '@/lib/db/schema';
import { count, desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sources = await db
    .select({
      id: newsSource.id,
      name: newsSource.name,
      url: newsSource.url,
      isActive: newsSource.isActive,
      total: count(newsArticle.id),
    })
    .from(newsSource)
    .leftJoin(newsArticle, eq(newsArticle.sourceId, newsSource.id))
    .where(eq(newsSource.isActive, true))
    .groupBy(newsSource.id)
    .orderBy(desc(count(newsArticle.id)) as any);

  return Response.json({ items: sources });
}

