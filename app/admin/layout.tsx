import { requireSuperadmin } from '@/lib/auth-guard';
import { AdminNav } from '@/components/admin-nav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce superadmin using Better Auth session cookie
  const user = await requireSuperadmin();

  const items = [
    { label: 'Overview', href: '/admin' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Subscriptions', href: '/admin/subscriptions' },
    { label: 'Vouchers', href: '/admin/vouchers' },
    { label: 'Referral', href: '/admin/referral' },
    { label: 'Models', href: '/admin/models' },
    { label: 'Experts', href: '/admin/experts' },
    { label: 'Prompts', href: '/admin/prompts' },
    { label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 p-4">
      <aside className="md:sticky md:top-4 h-fit">
        <div className="mb-3">
          <h1 className="text-lg font-semibold">Admin</h1>
          <p className="text-xs text-muted-foreground">Superadmin dashboard</p>
        </div>
        <AdminNav items={items} />
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
