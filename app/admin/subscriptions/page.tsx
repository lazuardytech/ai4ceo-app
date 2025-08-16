import { auth } from '@/app/(auth)/auth';
import { listSubscriptions } from '@/lib/db/queries';

export default async function AdminSubscriptionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return (
      <div className="p-6 text-sm text-red-500">Unauthorized: Superadmin only.</div>
    );
  }

  const subs = await listSubscriptions({ limit: 200 });

  return (
    <div className="mx-auto max-w-5xl p-2 md:p-4 space-y-4">
      <h2 className="text-xl font-semibold">Subscriptions</h2>
      <p className="text-sm text-muted-foreground">Recent subscription activity.</p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left sticky top-0">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">User</th>
              <th className="p-2">Plan</th>
              <th className="p-2">Status</th>
              <th className="p-2">Current Period End</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s, i) => (
              <tr key={s.id} className={"border-t "+(i%2?"bg-muted/20":"") }>
                <td className="p-2 align-top">{s.id}</td>
                <td className="p-2 align-top">{s.userId}</td>
                <td className="p-2 align-top">{s.planId}</td>
                <td className="p-2 align-top">{s.status}</td>
                <td className="p-2 align-top">{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
