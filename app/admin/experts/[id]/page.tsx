import { auth } from '@/app/(auth)/auth';
import { getAgentById, listAgentKnowledge } from '@/lib/db/queries';

export default async function AdminExpertKnowledgePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return (
      <div className="p-6 text-sm text-red-500">Unauthorized: Superadmin only.</div>
    );
  }

  const agent = await getAgentById({ id: params.id });
  if (!agent) {
    return <div className="p-6 text-sm">Agent not found.</div>;
  }
  const { items } = await listAgentKnowledge({ agentId: agent.id, q: null, limit: 200, offset: 0 });

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Knowledge: {agent.name}</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Add Knowledge Item</h2>
        <form method="post" action={`/admin/api/agents/${agent.id}/knowledge`} className="grid gap-2">
          <input className="border rounded px-2 py-1 text-sm" name="title" placeholder="title" required />
          <input className="border rounded px-2 py-1 text-sm" name="tags" placeholder="tags (comma-separated)" />
          <textarea className="border rounded px-2 py-1 text-sm font-mono h-32" name="content" placeholder="content" required />
          <button className="border rounded px-3 py-1 text-sm hover:bg-muted w-fit" type="submit">Add</button>
        </form>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Existing Items</h2>
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="border rounded p-3 space-y-1">
              <div className="text-sm font-medium">{it.title}</div>
              {it.tags ? <div className="text-xs text-muted-foreground">Tags: {it.tags}</div> : null}
              <pre className="text-xs whitespace-pre-wrap">{it.content}</pre>
              <form method="post" action={`/admin/api/agents/knowledge/${it.id}`} className="inline">
                <input type="hidden" name="_method" value="DELETE" />
                <button className="text-red-600 text-xs" type="submit">Delete</button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

