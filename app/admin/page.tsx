import { auth } from '@/app/(auth)/auth';
import { listUsers, listSubscriptions } from '@/lib/db/queries';

export const experimental_ppr = true;

export default async function AdminHomePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return (
      <div className="p-6 text-sm text-red-500">Unauthorized: Superadmin only.</div>
    );
  }

  const [users, subs] = await Promise.all([
    listUsers({ limit: 100 }),
    listSubscriptions({ limit: 100 }),
  ]);

  return (
    <div className="mx-auto max-w-5xl p-2 md:p-4 space-y-6">
      <h2 className="text-xl font-semibold">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Users</div>
          <div className="text-2xl font-semibold">{users.length}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Subscriptions</div>
          <div className="text-2xl font-semibold">{subs.length}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Role</div>
          <div className="text-2xl font-semibold">{session.user.role}</div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Use the navigation on the left to access all admin panels.
      </p>
    </div>
  );
}
