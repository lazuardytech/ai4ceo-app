import { requireAdmin } from '@/lib/auth-guard';
import { AdminNav } from '@/components/admin-nav';
import Link from 'next/link';
import Image from 'next/image';
import { IconArrowLeft } from '@tabler/icons-react';
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
    { label: 'News Feeds', href: '/admin/news/feeds' },
    { label: 'Models', href: '/admin/models' },
    { label: 'Experts', href: '/admin/experts' },
    { label: 'Prompts', href: '/admin/prompts' },
    { label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <IconArrowLeft size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="hidden sm:inline">Back to Chat</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-xl font-semibold text-muted-foreground">Admin Dashboard</h1>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="lg:sticky lg:top-6 h-fit">
            <div className="rounded-lg border bg-card p-4 mb-4">
              {/* Logo and Mobile Back Button */}
              <div className="flex items-center justify-center w-full">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Image
                    src="/images/logo.svg"
                    alt="AI4CEO Logo"
                    width={24}
                    height={24}
                    className="w-32 h-auto"
                  />
                  <span className="text-lg font-semibold font-serif ml-1">Dashboard</span>
                </Link>
                <div className="flex-1 flex justify-end lg:hidden">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium hover:bg-accent transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m12 19-7-7 7-7" />
                      <path d="M19 12H5" />
                    </svg>
                    Back
                  </Link>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4 mb-4">
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
