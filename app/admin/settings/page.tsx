import { auth } from '@/app/(auth)/auth';
import { getSettings } from '@/lib/db/queries';

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return (
      <div className="p-6 text-sm text-red-500">Unauthorized: Superadmin only.</div>
    );
  }

  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl p-2 md:p-4 space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <div className="rounded-xl border p-4 text-sm">
        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(settings, null, 2)}</pre>
      </div>
      <div className="rounded-xl border p-4 text-sm">
        <h2 className="font-medium mb-2">Set a setting</h2>
        <form method="post" action="/admin/api/settings">
          <div className="flex flex-col gap-2">
            <input className="border rounded px-2 py-1" name="key" placeholder="key (e.g. regularPromptOverride)" />
            <textarea className="border rounded px-2 py-1" name="value" placeholder='JSON value (e.g. "Be concise")' />
            <button className="border rounded px-3 py-1 hover:bg-muted w-fit" type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
