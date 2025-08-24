import { NextRequest } from 'next/server';
import { fetchAndCurateOnce } from '@/lib/news/curator';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const res = await fetchAndCurateOnce();
    return Response.json({ ok: true, ...res });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Optional: add a simple token check using CRON_TOKEN env if provided
  const token = process.env.CRON_TOKEN;
  if (token) {
    const header = req.headers.get('authorization') || '';
    if (header !== `Bearer ${token}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
  try {
    const res = await fetchAndCurateOnce();
    return Response.json({ ok: true, ...res });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

