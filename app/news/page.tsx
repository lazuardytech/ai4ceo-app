import { db } from '@/lib/db';
import { newsArticle, newsSource } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NewsPage() {
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
    .orderBy(desc(newsArticle.createdAt))
    .limit(50);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Kurasi Berita</h1>
      <p className="text-sm text-gray-500">Ringkasan, timeline, fact check, dan kategori dari beberapa sumber Indonesia.</p>
      <div className="grid grid-cols-1 gap-4">
        {rows.map((a) => (
          <article key={a.id} className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
            {a.imageUrl ? (
              <div className="w-full aspect-[16/9] bg-gray-100">
                {/* use plain img to avoid remotePatterns hassle */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imageUrl} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ) : null}
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">{a.category ?? 'lain-lain'}</span>
                <span>•</span>
                <span>{a.sourceName}</span>
                {a.publishedAt ? (
                  <>
                    <span>•</span>
                    <time dateTime={a.publishedAt.toISOString()}>{new Date(a.publishedAt).toLocaleString()}</time>
                  </>
                ) : null}
              </div>
              <h2 className="mt-2 text-lg font-semibold">
                <a href={a.link} target="_blank" className="hover:underline">{a.title}</a>
              </h2>
              {a.summary ? <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{a.summary}</p> : null}

              {Array.isArray(a.timeline) && a.timeline.length ? (
                <div className="mt-3">
                  <div className="text-sm font-medium">Timeline</div>
                  <ul className="mt-1 text-sm space-y-1">
                    {a.timeline.map((t: any, idx: number) => (
                      <li key={idx} className="flex gap-2 items-start">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
                        <div>
                          {t?.date ? <span className="text-gray-500">[{t.date}] </span> : null}
                          <span>{t?.event}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {a.factCheck ? (
                <div className="mt-3">
                  <div className="text-sm font-medium">Fact Check</div>
                  {Array.isArray((a as any).factCheck?.claims) && (a as any).factCheck.claims.length ? (
                    <ul className="mt-1 text-sm space-y-1">
                      {(a as any).factCheck.claims.map((c: any, idx: number) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {(a as any).factCheck?.assessment ? (
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{(a as any).factCheck.assessment}</p>
                  ) : null}
                </div>
              ) : null}

              {Array.isArray(a.relatedLinks) && a.relatedLinks.length ? (
                <div className="mt-3">
                  <div className="text-sm font-medium">Berita Terkait</div>
                  <ul className="mt-1 text-sm space-y-1">
                    {(a.relatedLinks as any[]).map((r: any, idx: number) => (
                      <li key={idx}>
                        <a href={r.link} target="_blank" className="hover:underline">
                          {r.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4">
                <Link href={a.link} target="_blank" className="text-sm text-blue-600 hover:underline">Baca selengkapnya →</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
