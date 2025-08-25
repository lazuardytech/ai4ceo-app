import { db } from '@/lib/db';
import { newsSource } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { toggleFeed, addFeed, removeFeed } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const dynamic = 'force-dynamic';

export default async function AdminFeedsPage() {
  const feeds = await db.select().from(newsSource).orderBy(desc(newsSource.createdAt));

  return (
    <div className="space-y-4">
      <form
        action={async (formData) => {
          'use server';
          await addFeed(String(formData.get('name') || ''), String(formData.get('url') || ''));
        }}
        className="flex gap-2 items-end"
      >
        <div className="flex-1">
          {/*<label className="block text-sm font-medium">Nama</label>*/}
          <Input name="name" className="w-full px-3 py-2" placeholder="Name" />
        </div>
        <div className="flex-[2]">
          {/*<label className="block text-sm font-medium">URL</label>*/}
          <Input name="url" className="w-full px-3 py-2" placeholder="RSS URL" />
        </div>
        <Button>Tambah</Button>
      </form>

      <div className="space-y-3">
        {feeds.map((f) => (
          <div key={f.id} className="border rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className='flex flex-col -gap-1'>
                <div className="font-medium">{f.name}</div>
                <a className="text-xs truncate text-ellipsis max-w-md w-max text-blue-600 hover:underline" href={f.url} target="_blank">
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
                  <Button type="submit" variant="outline">
                    {f.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </form>
                <form
                  action={async () => {
                    'use server';
                    await removeFeed(f.id);
                  }}
                >
                  <Button variant="destructive" type="submit">
                    Hapus
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
