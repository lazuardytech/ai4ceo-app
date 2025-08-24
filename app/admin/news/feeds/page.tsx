import { db } from '@/lib/db';
import { newsSource } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { toggleFeed, addFeed, removeFeed } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminFeedsPage() {
  const feeds = await db.select().from(newsSource).orderBy(desc(newsSource.createdAt));

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Kelola RSS Feeds</h1>

      <form
        action={async (formData) => {
          'use server';
          await addFeed(String(formData.get('name') || ''), String(formData.get('url') || ''));
        }}
        className="flex gap-2 items-end"
      >
        <div className="flex-1">
          <label className="block text-sm font-medium">Nama</label>
          <input name="name" className="w-full border rounded px-3 py-2" placeholder="Antara - Terkini" />
        </div>
        <div className="flex-[2]">
          <label className="block text-sm font-medium">URL</label>
          <input name="url" className="w-full border rounded px-3 py-2" placeholder="https://.../rss.xml" />
        </div>
        <button className="px-3 py-2 border rounded">Tambah</button>
      </form>

      <div className="space-y-3">
        {feeds.map((f) => (
          <div key={f.id} className="border rounded p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{f.name}</div>
                <a className="text-sm text-blue-600 hover:underline" href={f.url} target="_blank">
                  {f.url}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <form
                  action={async () => {
                    'use server';
                    await toggleFeed(f.id, !f.isActive);
                  }}
                >
                  <button className="px-3 py-2 border rounded" type="submit">
                    {f.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </form>
                <form
                  action={async () => {
                    'use server';
                    await removeFeed(f.id);
                  }}
                >
                  <button className="px-3 py-2 border rounded text-red-600" type="submit">
                    Hapus
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

