import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { schedule } from 'node-cron';
import { upsertNewsArticle } from '@/lib/db/news';

interface TimelineItem {
  date: string;
  text: string;
}

async function fetchArticleContent(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  const articleText = $('article').text() || $('body').text();
  return articleText.trim();
}

function summarize(content: string) {
  const sentences = content.split(/\.\s+/);
  return `${sentences.slice(0, 2).join('. ')}.`;
}

function buildTimeline(publishedAt: Date): TimelineItem[] {
  return [
    {
      date: publishedAt.toISOString(),
      text: 'Article published',
    },
  ];
}

function factCheckPlaceholder() {
  return 'Belum diverifikasi secara otomatis.';
}

export async function scrapeNews() {
  const parser = new Parser();
  const feed = await parser.parseURL(
    'https://rss.detik.com/index.php/detikNews',
  );

  for (const item of feed.items) {
    if (!item.link || !item.title) continue;
    const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
    const content = await fetchArticleContent(item.link);
    const summary = summarize(content);
    const timeline = buildTimeline(publishedAt);
    const factCheck = factCheckPlaceholder();
    await upsertNewsArticle({
      title: item.title,
      url: item.link,
      content,
      summary,
      timeline,
      factCheck,
      publishedAt,
      scrapedAt: new Date(),
    });
  }
}

async function main() {
  await scrapeNews();
  schedule('0 8,12,16 * * *', scrapeNews); // Run 3 times daily
}

main();
