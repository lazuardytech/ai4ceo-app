import { auth } from '@/app/(auth)/auth';
import { listUsers } from '@/lib/db/queries';

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'superadmin') {
    return (
      <div className="p-6 text-sm text-red-500">Unauthorized: Superadmin only.</div>
    );
  }

  const users = await listUsers({ limit: 200 });

  return (
    <div className="mx-auto max-w-5xl p-2 md:p-4 space-y-4">
      <h2 className="text-xl font-semibold">Users</h2>
      <p className="text-sm text-muted-foreground">Assign roles to manage access across the app.</p>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left sticky top-0">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={"border-t "+(i%2?"bg-muted/20":"") }>
                <td className="p-2 align-top">{u.id}</td>
                <td className="p-2 align-top">{u.email}</td>
                <td className="p-2 align-top">{(u as any).role}</td>
                <td className="p-2 align-top">
                  <form action={`/admin/api/users/role`} method="post" className="flex gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <select name="role" defaultValue={(u as any).role} className="border rounded px-2 py-1">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="superadmin">superadmin</option>
                    </select>
                    <button className="border rounded px-3 py-1 hover:bg-muted" type="submit">Update</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
