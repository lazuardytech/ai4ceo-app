import { requireAdmin } from '@/lib/auth-guard';
import { AdminNav } from '@/components/admin-nav';
import type { Metadata } from 'next';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforce admin using Better Auth session cookie
  const user = await requireAdmin();

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="rounded-lg border bg-card p-4 mb-4">
              <div className="mb-4">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage your AI4CEO platform</p>
              </div>
              <AdminNav items={items} />
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm">
                <div className="font-medium">Logged in as</div>
                <div className="text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground mt-1">Role: {user.role}</div>
              </div>
            </div>
          </aside>
          <main className="min-w-0 space-y-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Admin',
  openGraph: {
    images: [{ url: '/og?title=Admin&subtitle=Admin%20dashboard&emoji=%F0%9F%9B%A0%EF%B8%8F&theme=black' }],
  },
  twitter: {
    images: [{ url: '/og?title=Admin&subtitle=Admin%20dashboard&emoji=%F0%9F%9B%A0%EF%B8%8F&theme=black' }],
  },
};
