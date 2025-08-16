import { auth } from '@/app/(auth)/auth';
import { getSettings } from '@/lib/db/queries';

export default async function AdminModelsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return (
      <div className="p-6 text-sm text-red-500">
        Unauthorized: Superadmin only.
      </div>
    );
  }

  const settings = await getSettings();
  const requires = Boolean(settings?.reasoningRequiresSubscription ?? true);
  const overrides = settings?.modelOverrides
    ? JSON.stringify(settings.modelOverrides, null, 2)
    : '';

  return (
    <div className="mx-auto max-w-3xl p-2 md:p-4 space-y-6">
      <h2 className="text-xl font-semibold">Models</h2>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Gating</h2>
        <form method="post" action="/admin/api/settings" className="space-y-2">
          <input
            type="hidden"
            name="key"
            value="reasoningRequiresSubscription"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="value"
              value="true"
              defaultChecked={requires}
            />
            Require active subscription for reasoning model
          </label>
          <button
            className="border rounded px-3 py-1 text-sm hover:bg-muted"
            type="submit"
          >
            Save
          </button>
        </form>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Provider Overrides</h2>
        <p className="text-sm text-muted-foreground">
          Optional JSON mapping to override underlying provider model IDs.
        </p>
        <pre className="text-xs bg-muted/50 p-2 rounded">
          {
            '{\n  "chat-model": "provider/model-id",\n  "chat-model-reasoning": "provider/reasoning-id"\n}'
          }
        </pre>
        <form method="post" action="/admin/api/settings" className="space-y-2">
          <input type="hidden" name="key" value="modelOverrides" />
          <textarea
            name="value"
            defaultValue={overrides}
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
