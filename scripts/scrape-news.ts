
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
  const rssUrl = 'https://rss.detik.com/index.php/detikNews';
  const res = await fetch(rssUrl);
  let xml = await res.text();

  // Tolerate malformed XML (unescaped ampersands, stray whitespace)
  const sanitizeXml = (s: string) =>
    s
      // remove nulls and odd leading garbage lines
      .replace(/\u0000/g, '')
      .replace(/^[^\u0009\u000A\u000D\u0020<][^\n]*$/gm, '')
      // collapse trailing spaces before newlines
      .replace(/[ \t]+\n/g, '\n')
      // escape bare ampersands not part of entities
      .replace(/&(?!#?\w+;)/g, '&amp;');

  xml = sanitizeXml(xml);

  // Parse as XML using Cheerio (supports RSS and Atom)
  const $ = cheerio.load(xml, { xmlMode: true });
  const isAtom = $('feed').length > 0;
  const isRss = $('rss').length > 0 || $('channel').length > 0;

  const items: Array<{ title: string; link: string; isoDate?: string }> = [];

  if (isRss) {
    $('item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('title').first().text().trim();
      // RSS: <link> is usually text; sometimes may have href attribute
      let link =
        $el.find('link').first().text().trim() ||
        ($el.find('link').first().attr('href') || '').trim();
      const isoDateRaw =
        $el.find('pubDate').first().text().trim() ||
        $el.find('dc\\:date').first().text().trim() ||
        '';
      if (title && link) {
        items.push({ title, link, isoDate: isoDateRaw || undefined });
      }
    });
  } else if (isAtom) {
    $('entry').each((_, el) => {
      const $el = $(el);
      const title = $el.find('title').first().text().trim();
      // Atom: <link href="..."> (prefer rel="alternate")
      const linkEl = $el.find('link[rel=alternate]').first().length
        ? $el.find('link[rel=alternate]').first()
        : $el.find('link').first();
      const link =
        (linkEl.attr('href') || linkEl.text() || '').trim();
      const isoDateRaw =
        $el.find('published').first().text().trim() ||
        $el.find('updated').first().text().trim() ||
        '';
      if (title && link) {
        items.push({ title, link, isoDate: isoDateRaw || undefined });
      }
    });
  } else {
    // Fallback: try to handle unknown but RSS/Atom-like structures
    $('item, entry').each((_, el) => {
      const $el = $(el);
      const title = $el.find('title').first().text().trim();
      const linkEl = $el.find('link').first();
      const link =
        (linkEl.attr('href') || linkEl.text() || '').trim();
      const isoDateRaw =
        $el
          .find('pubDate, published, updated, dc\\:date')
          .first()
          .text()
          .trim() || '';
      if (title && link) {
        items.push({ title, link, isoDate: isoDateRaw || undefined });
      }
    });
  }

  for (const item of items) {
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
