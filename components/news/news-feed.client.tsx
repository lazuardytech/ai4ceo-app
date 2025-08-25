"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  imageUrl?: string | null;
  category?: string | null;
  summary?: string | null;
  timeline?: any[] | null;
  factCheck?: any | null;
  relatedLinks?: any[] | null;
  publishedAt?: string | null; // ISO
  createdAt?: string | null; // ISO
  sourceName?: string | null;
};

const CATEGORIES = [
  'semua',
  'politik',
  'ekonomi',
  'bisnis',
  'pasar',
  'teknologi',
  'olahraga',
  'hiburan',
  'kesehatan',
  'sains',
  'internasional',
  'lain-lain',
] as const;

export function NewsFeedClient({
  initialItems,
  initialNextCursor,
  initialCategory,
  initialCompact = false,
  initialQ = '',
  initialSourceId = 'all',
  initialRange = 'all'
}: {
  initialItems: NewsItem[];
  initialNextCursor: string | null;
  initialCategory?: string | null;
  initialCompact?: boolean;
  initialQ?: string;
  initialSourceId?: string;
  initialRange?: 'all' | '24h' | '7d' | '30d';
}) {
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>(initialCategory || 'semua');
  const [compact, setCompact] = useState<boolean>(initialCompact);
  const [q, setQ] = useState<string>(initialQ);
  const [typing, setTyping] = useState(false);
  const [sourceId, setSourceId] = useState<string>(initialSourceId || 'all');
  const [range, setRange] = useState<'all' | '24h' | '7d' | '30d'>(initialRange || 'all');
  const [sources, setSources] = useState<{ id: string; name: string; total: number }[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (category && category !== 'semua') params.set('category', category);
    if (nextCursor) params.set('cursor', nextCursor);
    params.set('limit', '20');
    if (q) params.set('q', q);
    if (sourceId && sourceId !== 'all') params.set('sourceId', sourceId);
    if (range && range !== 'all') params.set('range', range);
    const res = await fetch(`/api/news/list?${params.toString()}`);
    const data = (await res.json()) as { items: NewsItem[]; nextCursor: string | null };
    setItems((prev) => [...prev, ...data.items]);
    setNextCursor(data.nextCursor);
    setLoading(false);
  }, [category, nextCursor, loading]);

  // Re-fetch when category changes
  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category && category !== 'semua') params.set('category', category);
      params.set('limit', '20');
      if (q) params.set('q', q);
      if (sourceId && sourceId !== 'all') params.set('sourceId', sourceId);
      if (range && range !== 'all') params.set('range', range);
      const res = await fetch(`/api/news/list?${params.toString()}`);
      const data = (await res.json()) as { items: NewsItem[]; nextCursor: string | null };
      if (!ignore) {
        setItems(data.items);
        setNextCursor(data.nextCursor);
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [category, q, sourceId, range]);

  // Update URL params for shareable state
  useEffect(() => {
    const url = new URL(window.location.href);
    if (category && category !== 'semua') url.searchParams.set('category', category); else url.searchParams.delete('category');
    if (compact) url.searchParams.set('compact', '1'); else url.searchParams.delete('compact');
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    if (sourceId && sourceId !== 'all') url.searchParams.set('sourceId', sourceId); else url.searchParams.delete('sourceId');
    if (range && range !== 'all') url.searchParams.set('range', range); else url.searchParams.delete('range');
    window.history.replaceState({}, '', url.toString());
  }, [category, compact, q, sourceId, range]);

  // Load sources for filter
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/news/sources');
        const data = (await res.json()) as { items: { id: string; name: string; total: number }[] };
        setSources(data.items || []);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting) fetchMore();
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [fetchMore]);

  const CategoryChips = (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => setCategory(c)}
          className={`px-3 py-1 rounded-full text-xs border ${category === c ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
        >
          {c}
        </button>
      ))}
    </div>
  );

  const Toolbar = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {CategoryChips}
        <select className="px-3 py-1.5 text-sm border rounded" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          <option value="all">Semua sumber</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.total})</option>
          ))}
        </select>
        <select className="px-3 py-1.5 text-sm border rounded" value={range} onChange={(e) => setRange(e.target.value as any)}>
          <option value="all">Semua waktu</option>
          <option value="24h">24 jam</option>
          <option value="7d">7 hari</option>
          <option value="30d">30 hari</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          placeholder="Cari berita…"
          className="px-3 py-1.5 text-sm border rounded w-44 md:w-64"
          value={q}
          onChange={(e) => { setQ(e.target.value); setTyping(true); }}
          onBlur={() => setTyping(false)}
        />
        <button
          className={`px-3 py-1 rounded border text-xs ${compact ? 'bg-gray-900 text-white dark:bg-white dark:text-black' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          onClick={() => setCompact((v) => !v)}
        >
          {compact ? 'Expanded view' : 'Compact view'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {Toolbar}
      <div className="grid grid-cols-1 gap-4">
        {items.map((a) => (
          <article key={a.id} className={`border rounded-lg overflow-hidden bg-white dark:bg-zinc-900 ${compact ? 'p-3' : ''}`}>
            {compact ? (
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imageUrl || '/images/demo-thumbnail.png'} alt="thumbnail" className="w-36 h-24 object-cover rounded" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">{a.category ?? 'lain-lain'}</span>
                    <span>•</span>
                    <span className="truncate">{a.sourceName}</span>
                    {a.publishedAt ? (
                      <>
                        <span>•</span>
                        <time>{new Date(a.publishedAt).toLocaleString()}</time>
                      </>
                    ) : null}
                  </div>
                  <h2 className="mt-1 text-sm font-semibold truncate">
                    <a href={a.link} target="_blank" className="hover:underline">{a.title}</a>
                  </h2>
                  {a.summary ? <p className="mt-1 text-xs text-gray-700 dark:text-gray-300 line-clamp-2">{a.summary}</p> : null}
                </div>
              </div>
            ) : (
              <>
                <div className="w-full aspect-[16/9] bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.imageUrl || '/images/demo-thumbnail.png'} alt="thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">{a.category ?? 'lain-lain'}</span>
                    <span>•</span>
                    <span>{a.sourceName}</span>
                    {a.publishedAt ? (
                      <>
                        <span>•</span>
                        <time>{new Date(a.publishedAt).toLocaleString()}</time>
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
              </>
            )}
          </article>
        ))}
      </div>
      <div ref={sentinelRef} className="h-8" />
      {loading ? <div className="text-center text-sm text-gray-500">Loading…</div> : null}
      {!nextCursor && !loading ? <div className="text-center text-sm text-gray-400">Tidak ada lagi berita.</div> : null}
    </div>
  );
}
