import { db } from '@/lib/db';
import { newsArticle, newsSource } from '@/lib/db/schema';
import { and, count, desc, eq, gte, isNotNull } from 'drizzle-orm';
import { NewsFeedClient, type NewsItem } from '@/components/news/news-feed.client';

export const dynamic = 'force-dynamic';

export default async function NewsPage({ searchParams }: { searchParams?: Promise<{ category?: string; compact?: string; q?: string; sourceId?: string; range?: 'all' | '24h' | '7d' | '30d' }> }) {
  const sp = (await searchParams) || {};
  const category = (sp.category || '').trim();
  const compact = sp.compact === '1';
  const q = (sp.q || '').trim();
  const sourceId = (sp.sourceId || '').trim();
  const range = (sp.range as any) || 'all';
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
    .where(category && category !== 'semua' ? eq(newsArticle.category, category) : undefined as any)
    .orderBy(desc(newsArticle.createdAt))
    .limit(20);

  // Top News: prefer items with images and latest publishedAt
  const topNews = await db
    .select({
      id: newsArticle.id,
      title: newsArticle.title,
      link: newsArticle.link,
      imageUrl: newsArticle.imageUrl,
      sourceName: newsSource.name,
      publishedAt: newsArticle.publishedAt,
      category: newsArticle.category,
    })
    .from(newsArticle)
    .innerJoin(newsSource, eq(newsSource.id, newsArticle.sourceId))
    .where(isNotNull(newsArticle.imageUrl))
    .orderBy(desc(newsArticle.publishedAt), desc(newsArticle.createdAt))
    .limit(6);

  // Top This Week: last 7 days with images
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const topThisWeek = await db
    .select({
      id: newsArticle.id,
      title: newsArticle.title,
      link: newsArticle.link,
      imageUrl: newsArticle.imageUrl,
      sourceName: newsSource.name,
      publishedAt: newsArticle.publishedAt,
      category: newsArticle.category,
    })
    .from(newsArticle)
    .innerJoin(newsSource, eq(newsSource.id, newsArticle.sourceId))
    .where(and(isNotNull(newsArticle.imageUrl), gte(newsArticle.publishedAt, sevenDaysAgo as any)))
    .orderBy(desc(newsArticle.publishedAt), desc(newsArticle.createdAt))
    .limit(6);

  // Category list with counts
  const categoryCounts = await db
    .select({ category: newsArticle.category, total: count(newsArticle.id) })
    .from(newsArticle)
    .where(isNotNull(newsArticle.category))
    .groupBy(newsArticle.category)
    .orderBy(desc(count(newsArticle.id)))
    .limit(20);

  const initialItems: NewsItem[] = (rows as any[]).map((r) => ({
    ...r,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
  }));

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Kurasi Berita</h1>
      <p className="text-sm text-gray-500">Ringkasan, timeline, fact check, dan kategori dari beberapa sumber Indonesia.</p>

      {/* Top News */}
      {topNews.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Top News</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topNews.map((t) => (
              <a key={t.id} href={t.link} target="_blank" className="group border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                <div className="w-full aspect-[16/9] bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.imageUrl || '/images/demo-thumbnail.png'} alt="top" className="w-full h-full object-cover group-hover:opacity-90 transition" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">{t.category ?? 'lain-lain'}</span>
                    <span>•</span>
                    <span className="truncate">{t.sourceName}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold line-clamp-2">{t.title}</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {topThisWeek.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Top This Week</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topThisWeek.map((t) => (
              <a key={t.id} href={t.link} target="_blank" className="group border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                <div className="w-full aspect-[4/3] bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.imageUrl || '/images/demo-thumbnail.png'} alt="top-week" className="w-full h-full object-cover group-hover:opacity-90 transition" />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">{t.category ?? 'lain-lain'}</span>
                    <span>•</span>
                    <span className="truncate">{t.sourceName}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold line-clamp-2">{t.title}</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* Category List */}
      {categoryCounts.length ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Kategori</h3>
          <div className="flex flex-wrap gap-2">
            {categoryCounts.map((c) => (
              <a key={String(c.category)} href={`/news?category=${encodeURIComponent(String(c.category))}`} className="px-3 py-1 rounded-full text-xs border hover:bg-gray-100 dark:hover:bg-zinc-800">
                {String(c.category)} <span className="text-gray-500">({c.total})</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <NewsFeedClient
        initialItems={initialItems}
        initialNextCursor={initialItems.length ? initialItems[initialItems.length - 1].createdAt || null : null}
        initialCategory={category || 'semua'}
        initialCompact={compact}
        initialQ={q}
        initialSourceId={sourceId || 'all'}
        initialRange={range}
      />
    </div>
  );
}
