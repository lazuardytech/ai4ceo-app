import { db } from './index';
import { newsArticle } from './schema';
import type { NewsArticle } from './schema';
import { desc } from 'drizzle-orm';

export async function upsertNewsArticle(article: Omit<NewsArticle, 'id'>) {
  return db
    .insert(newsArticle)
    .values(article)
    .onConflictDoUpdate({
      target: newsArticle.url,
      set: {
        title: article.title,
        content: article.content,
        summary: article.summary,
        timeline: article.timeline,
        factCheck: article.factCheck,
        publishedAt: article.publishedAt,
        scrapedAt: article.scrapedAt,
      },
    });
}

export async function getLatestNews(limit = 20) {
  return db
    .select()
    .from(newsArticle)
    .orderBy(desc(newsArticle.publishedAt))
    .limit(limit);
}
