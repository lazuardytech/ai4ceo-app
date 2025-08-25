import RSSParser from 'rss-parser';
import { extract } from '@extractus/article-extractor';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { newsArticle, newsSource, setting, type NewsArticle } from '@/lib/db/schema';
import { generateText } from 'ai';
import { getLanguageModelForId, type ProviderPreference } from '@/lib/ai/providers';

type Curated = {
  summary: string;
  timeline: { date?: string; event: string }[];
  factCheck: { claims: string[]; assessment: string; confidence?: string };
  relatedTitles?: string[];
  category?: string;
  providerUsed?: ProviderPreference;
  modelIdUsed?: string;
};

// Indonesian and Indonesia-related feeds
export const DEFAULT_FEEDS: { name: string; url: string }[] = [
  {
    name: 'NYTimes - Indonesia',
    url: 'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/topic/destination/indonesia/rss.xml',
  },
  { name: 'Antara - Terkini', url: 'https://www.antaranews.com/rss/terkini.xml' },
  { name: 'Antara - Ekonomi Finansial', url: 'https://www.antaranews.com/rss/ekonomi-finansial.xml' },
  { name: 'Antara - Ekonomi Bisnis', url: 'https://www.antaranews.com/rss/ekonomi-bisnis.xml' },
  { name: 'Antara - Ekonomi Bursa', url: 'https://www.antaranews.com/rss/ekonomi-bursa.xml' },
];

const parser = new RSSParser();

function normalizeText(input?: string | null): string | undefined {
  if (!input) return undefined;
  return input.replace(/\s+/g, ' ').trim();
}

function wordOverlapScore(a: string, b: string) {
  const toks = (s: string) => new Set(s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean));
  const A = toks(a);
  const B = toks(b);
  const inter = [...A].filter((w) => B.has(w)).length;
  const denom = Math.sqrt(A.size || 1) * Math.sqrt(B.size || 1);
  return inter / denom;
}

async function upsertSource(name: string, url: string) {
  const existing = await db.select().from(newsSource).where(eq(newsSource.url, url)).limit(1);
  if (existing.length) return existing[0];
  const [inserted] = await db.insert(newsSource).values({ name, url, isActive: true }).returning();
  return inserted;
}

async function getSourcesToUse() {
  // If table is empty, seed defaults once
  const any = await db.select({ id: newsSource.id }).from(newsSource).limit(1);
  if (!any.length) {
    for (const f of DEFAULT_FEEDS) {
      await upsertSource(f.name, f.url);
    }
  }
  const active = await db.select().from(newsSource).where(eq(newsSource.isActive, true));
  return active;
}

async function findExistingArticle(link: string, guid?: string | null) {
  const byLink = await db.select().from(newsArticle).where(eq(newsArticle.link, link)).limit(1);
  if (byLink.length) return byLink[0];
  if (guid) {
    const byGuid = await db.select().from(newsArticle).where(eq(newsArticle.guid, guid)).limit(1);
    if (byGuid.length) return byGuid[0];
  }
  return null;
}

async function curateWithLLM(input: {
  title: string;
  content: string;
  link: string;
  publishedAt?: string;
  sourceName: string;
  candidateRelated?: { title: string; link: string }[];
}): Promise<Curated> {
  const pref = (process.env.NEWS_PROVIDER as ProviderPreference) || 'groq';
  const requestedModelId = process.env.NEWS_MODEL_ID || 'chat-model';
  const tryModelIds = [requestedModelId, 'chat-model-small'];
  const providers: ProviderPreference[] = ((process.env.NEWS_PROVIDERS || pref)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as ProviderPreference[]).filter((v, i, a) => a.indexOf(v) === i);
  const prompt = `You are a news curator for Indonesian news.
Return a strict JSON object with keys: summary, timeline, factCheck, relatedTitles, category.
Rules:
- summary: 3-6 bullet sentences, concise Indonesian summary.
- timeline: chronological array (2-6 items) of {date?: string, event: string}. Use dates mentioned or infer approximate.
- factCheck: {claims: string[], assessment: string, confidence: "low"|"medium"|"high"}. Use only info from the article; note what needs external verification if unclear.
- relatedTitles: pick up to 3 titles from the provided candidate list that appear most related; if none, return an empty array.
- category: one of [politik, ekonomi, bisnis, pasar, teknologi, olahraga, hiburan, kesehatan, sains, internasional, lain-lain].

Article Title: ${input.title}
Source: ${input.sourceName}
Link: ${input.link}
PublishedAt: ${input.publishedAt ?? ''}

Candidate Related:
${(input.candidateRelated ?? []).map((r, i) => `- [${i}] ${r.title}`).join('\n')}

Content:
"""
${input.content.slice(0, 18000)}
"""`;

  let lastErr: any;
  for (const provider of providers) {
    // skip provider if in cooldown
    const pUntil = await getPauseUntilProvider(provider);
    if (pUntil && pUntil > new Date()) continue;
    for (const mid of tryModelIds) {
      try {
        const model = getLanguageModelForId(mid, provider, null);
        const { text } = await generateText({ model, system: 'Respond ONLY with valid JSON.', prompt });
        // Attempt to parse JSON robustly
        let json: any;
        try {
          const trimmed = text.trim().replace(/^[^{\[]+/, '');
          json = JSON.parse(trimmed);
        } catch (e) {
          // Fallback minimal from text
          json = { summary: normalizeText(text) ?? '', timeline: [], factCheck: { claims: [], assessment: '', confidence: 'low' }, relatedTitles: [], category: 'lain-lain' };
        }
        const curated: Curated = {
          summary: typeof json.summary === 'string' ? json.summary : Array.isArray(json.summary) ? json.summary.join(' ') : '',
          timeline: Array.isArray(json.timeline) ? json.timeline.map((t: any) => ({ date: t?.date, event: normalizeText(t?.event) ?? '' })).filter((t: any) => t.event) : [],
          factCheck: {
            claims: Array.isArray(json?.factCheck?.claims) ? json.factCheck.claims.map((c: any) => String(c)) : [],
            assessment: normalizeText(json?.factCheck?.assessment) ?? '',
            confidence: json?.factCheck?.confidence ?? 'low',
          },
          relatedTitles: Array.isArray(json.relatedTitles) ? json.relatedTitles.map((x: any) => String(x)) : [],
          category: typeof json.category === 'string' ? json.category : 'lain-lain',
          providerUsed: provider,
          modelIdUsed: mid,
        };
        return curated;
      } catch (err) {
        lastErr = err;
        // If rate limit for this provider, set provider-specific cooldown and try next provider/model combo
        if (isRateLimitError(err)) {
          const mins = Number(process.env.NEWS_RATE_LIMIT_COOLDOWN_MINUTES || 60);
          const until = new Date(Date.now() + mins * 60_000);
          await setPauseUntilProvider(provider, until);
          continue;
        }
        // Non-rate-limit errors: still try other combos
        continue;
      }
    }
  }
  // Final fallback when all model attempts fail
  // If configured to stop on rate limit, bubble up so caller can stop the run
  if (shouldStopOnRateLimit() && isRateLimitError(lastErr)) {
    throw lastErr;
  }
  return {
    summary: normalizeText(input.content.slice(0, 400)) || input.title,
    timeline: [],
    factCheck: { claims: [], assessment: 'Kurasi otomatis gagal (rate limit/konfigurasi).', confidence: 'low' },
    relatedTitles: [],
    category: 'lain-lain',
  };
}

export async function fetchAndCurateOnce() {
  const results: { inserted: number; skipped: number; pausedUntil?: string; stoppedEarly?: boolean; stoppedAtSource?: string; remainingInCurrentFeed?: number; stoppedByAdmin?: boolean } = { inserted: 0, skipped: 0 };
  const providerStats: Record<string, Record<string, number>> = {};
  const startedAt = new Date();

  // Skip run if we are in cooldown window
  // Stop immediately if admin stopped curation
  const globallyStopped = await getGlobalStopFlag();
  if (globallyStopped) {
    results.stoppedByAdmin = true;
    await recordRun({ startedAt, finishedAt: new Date(), inserted: 0, skipped: 0, stoppedEarly: true, providerStats, stoppedAtSource: 'stopped-by-admin' });
    return results;
  }

  // If all providers are in cooldown, stop immediately
  const providers = ((process.env.NEWS_PROVIDERS || process.env.NEWS_PROVIDER || 'groq')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)) as ProviderPreference[];
  const available = [] as ProviderPreference[];
  for (const p of providers) {
    const u = await getPauseUntilProvider(p);
    if (!u || u <= new Date()) available.push(p);
  }
  if (available.length === 0) {
    const minUntil = await getMinPauseUntil(providers);
    if (minUntil) results.pausedUntil = minUntil.toISOString();
    await recordRun({ startedAt, finishedAt: new Date(), inserted: results.inserted, skipped: results.skipped, stoppedEarly: true, pausedUntil: minUntil ?? undefined, providerStats });
    return results;
  }

  const sources = await getSourcesToUse();
  const maxPerRun = Number(process.env.NEWS_MAX_CURATE_PER_RUN || 30);
  let curatedCount = 0;
  outer: for (const src of sources) {
    const parsed = await parser.parseURL(src.url);
    const items = parsed.items ?? [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      if (curatedCount >= maxPerRun) break outer;
      const link = item.link || item.guid;
      if (!link) continue;
      const exists = await findExistingArticle(link, item.guid);
      if (exists) {
        results.skipped += 1;
        continue;
      }

      // Try extracting full content; fall back to content/summary
      let articleText = '';
      let imageUrl: string | undefined;
      try {
        const extracted = await extract(link);
        articleText = normalizeText(extracted?.content?.toString()) || normalizeText((extracted as any)?.text) || '';
        imageUrl = (extracted as any)?.image || (extracted as any)?.image_url || undefined;
      } catch {
        // ignore
      }
      if (!articleText) {
        articleText = normalizeText(item['content:encoded'] as string) || normalizeText(item.content) || normalizeText(item.summary) || '';
      }
      // Try RSS enclosure/media for image
      const anyItem: any = item as any;
      if (!imageUrl) {
        imageUrl = anyItem?.enclosure?.url || anyItem?.image || anyItem?.thumbnail || anyItem?.media?.url || anyItem?.['media:content']?.url || anyItem?.['media:thumbnail']?.url;
      }

      const title = normalizeText(item.title) || 'Untitled';

      // Build candidate related from recent items
      const recent = await db
        .select({ id: newsArticle.id, title: newsArticle.title, link: newsArticle.link })
        .from(newsArticle)
        .orderBy(desc(newsArticle.createdAt))
        .limit(100);
      const scored = recent
        .map((r) => ({ r, score: wordOverlapScore(title, r.title) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(({ r }) => ({ title: r.title, link: r.link }));

      // Curate via LLM
      let curated: Curated;
      try {
        curated = await curateWithLLM({
          title,
          content: articleText,
          link,
          publishedAt: item.isoDate || item.pubDate,
          sourceName: src.name,
          candidateRelated: scored,
        });
      } catch (e: any) {
        if (isRateLimitError(e)) {
          const mins = Number(process.env.NEWS_RATE_LIMIT_COOLDOWN_MINUTES || 60);
          const until = new Date(Date.now() + mins * 60_000);
          // Only set global pause if all providers are now cooling down
          const providers = ((process.env.NEWS_PROVIDERS || process.env.NEWS_PROVIDER || 'groq')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)) as ProviderPreference[];
          const allPaused = await areAllProvidersPaused(providers, until);
          if (allPaused) {
            results.pausedUntil = until.toISOString();
          }
          results.stoppedEarly = true;
          results.stoppedAtSource = src.name;
          results.remainingInCurrentFeed = Math.max(0, items.length - i - 1);
          break outer; // stop the run on rate limit
        }
        // Other errors: continue with next item
        continue;
      }

      // Map relatedTitles back to links where possible
      const relMap = new Map(scored.map((s) => [s.title, s.link]));
      const relatedLinks = (curated.relatedTitles || [])
        .map((t) => ({ title: t, link: relMap.get(t) }))
        .filter((x) => x.link);

      await db.insert(newsArticle).values({
        sourceId: src.id,
        guid: item.guid ?? null,
        link,
        title,
        author: normalizeText(item.creator as string) || normalizeText(item.author) || undefined,
        publishedAt: item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : undefined,
        imageUrl: imageUrl,
        content: articleText,
        raw: item as any,
        summary: curated.summary,
        timeline: curated.timeline as any,
        factCheck: curated.factCheck as any,
        relatedLinks: relatedLinks as any,
        category: curated.category,
        curatedProvider: curated.providerUsed,
        curatedModelId: curated.modelIdUsed,
        curatedAt: new Date(),
      });

      results.inserted += 1;
      curatedCount += 1;
      // provider stats
      if (curated.providerUsed && curated.modelIdUsed) {
        providerStats[curated.providerUsed] ||= {} as any;
        providerStats[curated.providerUsed]![curated.modelIdUsed] = (providerStats[curated.providerUsed]![curated.modelIdUsed] || 0) + 1;
      }
    }
  }
  await recordRun({ startedAt, finishedAt: new Date(), inserted: results.inserted, skipped: results.skipped, stoppedEarly: Boolean(results.stoppedEarly), pausedUntil: results.pausedUntil ? new Date(results.pausedUntil) : undefined, stoppedAtSource: results.stoppedAtSource, providerStats });
  return results;
}

function isRateLimitError(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || '').toLowerCase();
  if (err?.statusCode === 429) return true;
  if (msg.includes('rate limit')) return true;
  if (err?.code === 'rate_limit_exceeded') return true;
  // ai-sdk RetryError reason
  if (String(err?.reason || '').includes('maxRetriesExceeded') && msg.includes('rate')) return true;
  return false;
}

function shouldStopOnRateLimit(): boolean {
  const v = process.env.NEWS_STOP_ON_RATE_LIMIT;
  return v === undefined ? true : v === '1' || v?.toLowerCase() === 'true';
}

async function getPauseUntil(): Promise<Date | null> {
  const [row] = await db.select().from(setting).where(eq(setting.key, 'newsCurationPauseUntil')).limit(1);
  const iso = (row as any)?.value as string | undefined;
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function setPauseUntil(until: Date): Promise<void> {
  const now = new Date();
  // upsert into Setting
  // @ts-ignore drizzle upsert helper
  await db
    .insert(setting)
    .values({ key: 'newsCurationPauseUntil', value: until.toISOString(), updatedAt: now })
    .onConflictDoUpdate({ target: setting.key, set: { value: until.toISOString(), updatedAt: now } });
}

async function getGlobalStopFlag(): Promise<boolean> {
  const [row] = await db.select().from(setting).where(eq(setting.key, 'newsCurationStopped')).limit(1);
  const val = (row as any)?.value;
  if (val === true || val === 'true' || val === '1') return true;
  return false;
}

export async function setGlobalStopFlag(stopped: boolean): Promise<void> {
  const now = new Date();
  // @ts-ignore drizzle upsert helper
  await db
    .insert(setting)
    .values({ key: 'newsCurationStopped', value: stopped, updatedAt: now })
    .onConflictDoUpdate({ target: setting.key, set: { value: stopped, updatedAt: now } });
}

async function getPauseUntilProvider(p: ProviderPreference): Promise<Date | null> {
  const key = `newsCurationPauseUntil_${p}`;
  const [row] = await db.select().from(setting).where(eq(setting.key, key)).limit(1);
  const iso = (row as any)?.value as string | undefined;
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function setPauseUntilProvider(p: ProviderPreference, until: Date): Promise<void> {
  const key = `newsCurationPauseUntil_${p}`;
  const now = new Date();
  // @ts-ignore drizzle upsert helper
  await db
    .insert(setting)
    .values({ key, value: until.toISOString(), updatedAt: now })
    .onConflictDoUpdate({ target: setting.key, set: { value: until.toISOString(), updatedAt: now } });
}

async function getMinPauseUntil(providers: ProviderPreference[]): Promise<Date | null> {
  let min: Date | null = null;
  for (const p of providers) {
    const d = await getPauseUntilProvider(p);
    if (d && (!min || d < min)) min = d;
  }
  return min;
}

async function areAllProvidersPaused(providers: ProviderPreference[], _until: Date): Promise<boolean> {
  const now = new Date();
  for (const p of providers) {
    const d = await getPauseUntilProvider(p);
    if (!d || d <= now) return false;
  }
  return true;
}

async function recordRun(args: { startedAt: Date; finishedAt: Date; inserted: number; skipped: number; stoppedEarly?: boolean; pausedUntil?: Date; stoppedAtSource?: string; providerStats?: any }) {
  const { newsCurationRun } = await import('@/lib/db/schema');
  await db.insert(newsCurationRun).values({
    startedAt: args.startedAt,
    finishedAt: args.finishedAt,
    inserted: String(args.inserted),
    skipped: String(args.skipped),
    stoppedEarly: Boolean(args.stoppedEarly),
    pausedUntil: args.pausedUntil ?? null,
    stoppedAtSource: args.stoppedAtSource ?? null,
    providerStats: args.providerStats ?? null,
  });
}
