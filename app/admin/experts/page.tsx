import { auth } from '@/lib/auth';
import { listAgents } from '@/lib/db/queries';
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
import { getSession } from '@/lib/auth-client';
import { headers } from 'next/headers';

export default async function AdminExpertsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return (
      <div className="p-6 text-sm text-red-500">Unauthorized: Superadmin only.</div>
    );
  }

  const { items: agents } = await listAgents({ q: null, isActive: null, limit: 100, offset: 0 });

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <ToastOnQuery />
      <UnsavedGuard selector="form" />
      <h1 className="text-xl font-semibold">Experts</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Create Expert</h2>
        <form id="create-expert-form" method="post" action="/admin/api/agents" className="grid gap-2">
          <input className="border rounded px-2 py-1 text-sm" name="slug" placeholder="slug (e.g., tech)" required />
          <input className="border rounded px-2 py-1 text-sm" name="name" placeholder="name" required />
          <input className="border rounded px-2 py-1 text-sm" name="description" placeholder="description" />
          <textarea className="border rounded px-2 py-1 text-sm font-mono h-24" name="prePrompt" placeholder="pre-prompt" required />
          <textarea className="border rounded px-2 py-1 text-sm font-mono h-20" name="personality" placeholder="personality" required />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked /> Active</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ragEnabled" defaultChecked /> RAG Enabled</label>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="border rounded px-3 py-1 text-sm hover:bg-muted w-fit" type="button">Create</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create expert?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will create a new expert with the provided configuration.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => (document.getElementById('create-expert-form') as HTMLFormElement)?.requestSubmit()}>
                  Create
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-medium">Existing Experts</h2>
        <div className="space-y-4">
          {agents.map((a) => (
            <div key={a.id} className="border rounded p-3 space-y-2">
              <div className="text-sm font-medium">{a.name} <span className="text-muted-foreground">({a.slug})</span></div>
              <div className="text-xs text-muted-foreground">{a.description}</div>
              <form id={`update-expert-${a.id}`} method="post" action={`/admin/api/agents/${a.id}`} className="grid gap-2">
                <input type="hidden" name="_method" value="PUT" />
                <input className="border rounded px-2 py-1 text-sm" name="name" defaultValue={a.name} />
                <input className="border rounded px-2 py-1 text-sm" name="description" defaultValue={a.description ?? ''} />
                <textarea className="border rounded px-2 py-1 text-sm font-mono h-20" name="prePrompt" defaultValue={a.prePrompt} />
                <textarea className="border rounded px-2 py-1 text-sm font-mono h-20" name="personality" defaultValue={a.personality} />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={a.isActive} /> Active</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ragEnabled" defaultChecked={a.ragEnabled} /> RAG Enabled</label>
                </div>
                <div className="flex gap-2 items-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button type="button" className="border rounded px-3 py-1 text-sm hover:bg-muted">
                        Save
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Save changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will update the expert configuration.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => (document.getElementById(`update-expert-${a.id}`) as HTMLFormElement)?.requestSubmit()}>
                          Save
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <a href={`/admin/experts/${a.id}`} className="border rounded px-3 py-1 text-sm hover:bg-muted">Manage Knowledge</a>
                </div>
              </form>
              <form id={`delete-expert-${a.id}`} method="post" action={`/admin/api/agents/${a.id}`} className="inline">
                <input type="hidden" name="_method" value="DELETE" />
              </form>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-red-600 text-sm" type="button">Delete</button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete expert?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => (document.getElementById(`delete-expert-${a.id}`) as HTMLFormElement)?.requestSubmit()}>
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
