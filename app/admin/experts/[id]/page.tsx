import { auth } from '@/lib/auth';
import { getAgentById, listAgentKnowledge } from '@/lib/db/queries';
import { ToastOnQuery } from '@/components/admin/toast-on-query.client';
import { UnsavedGuard } from '@/components/admin/unsaved-guard.client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { headers } from 'next/headers';

export default async function AdminExpertKnowledgePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return (
      <div className="p-4 text-sm text-red-500">Unauthorized: Admin only.</div>
    );
  }

  const agent = await getAgentById({ id: params.id });
  if (!agent) {
    return <div className="p-4 text-sm">Agent not found.</div>;
  }
  const { items } = await listAgentKnowledge({ agentId: agent.id, q: null, limit: 200, offset: 0 });

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <ToastOnQuery />
      <UnsavedGuard selector="form" />
      <h1 className="text-xl font-semibold">Knowledge: {agent.name}</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Ingest Document</h2>
        <form id="upload-knowledge-form" method="post" action={`/admin/api/agents/${agent.id}/knowledge/upload`} encType="multipart/form-data" className="grid gap-2">
          <input className="border rounded px-2 py-1 text-sm" name="tags" placeholder="tags (comma-separated)" />
          <input className="border rounded px-2 py-1 text-sm" name="file" type="file" accept=".txt, .pdf, text/plain, application/pdf" required />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="border rounded px-3 py-1 text-sm hover:bg-muted w-fit" type="button">Upload</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ingest document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will chunk the document and add it to this expert&apos;s knowledge. Pinecone index will be updated if configured.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => (document.getElementById('upload-knowledge-form') as HTMLFormElement | null)?.requestSubmit()}>
                  Upload
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="text-xs text-muted-foreground">Allowed: .txt, .pdf</div>
        </form>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Add Knowledge Item</h2>
        <form id="add-knowledge-form" method="post" action={`/admin/api/agents/${agent.id}/knowledge`} className="grid gap-2">
          <input className="border rounded px-2 py-1 text-sm" name="title" placeholder="title" required />
          <input className="border rounded px-2 py-1 text-sm" name="tags" placeholder="tags (comma-separated)" />
          <textarea className="border rounded px-2 py-1 text-sm font-mono h-32" name="content" placeholder="content" required />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="border rounded px-3 py-1 text-sm hover:bg-muted w-fit" type="button">Add</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Add knowledge item?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will add a new knowledge entry for this expert.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => (document.getElementById('add-knowledge-form') as HTMLFormElement)?.requestSubmit()}>
                  Add
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              <form id={`delete-knowledge-${it.id}`} method="post" action={`/admin/api/agents/knowledge/${it.id}`} className="inline">
                <input type="hidden" name="_method" value="DELETE" />
              </form>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-red-600 text-xs" type="button">Delete</button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete knowledge item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => (document.getElementById(`delete-knowledge-${it.id}`) as HTMLFormElement)?.requestSubmit()}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
