import { auth } from '@/lib/auth';
import { getSettings } from '@/lib/db/queries';
import { headers } from 'next/headers';

export default async function AdminPromptsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return (
      <div className="p-4 text-sm text-red-500">
        Unauthorized: Admin only.
      </div>
    );
  }

  const settings = await getSettings();
  const regular = settings?.regularPromptOverride ?? '';
  const artifacts = settings?.artifactsPromptOverride ?? '';

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Prompts</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Regular Prompt</h2>
        <form method="post" action="/admin/api/settings" className="space-y-2">
          <input type="hidden" name="key" value="regularPromptOverride" />
          <textarea
            name="value"
            defaultValue={regular}
            className="w-full h-48 border rounded px-2 py-1 text-sm font-mono"
          />
          <button
            className="border rounded px-3 py-1 text-sm hover:bg-muted"
            type="submit"
          >
            Save
          </button>
        </form>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Artifacts Prompt</h2>
        <form method="post" action="/admin/api/settings" className="space-y-2">
          <input type="hidden" name="key" value="artifactsPromptOverride" />
          <textarea
            name="value"
            defaultValue={artifacts}
            className="w-full h-48 border rounded px-2 py-1 text-sm font-mono"
          />
          <button
            className="border rounded px-3 py-1 text-sm hover:bg-muted"
            type="submit"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
