import { requireAuth } from '@/lib/auth-guard';
import type { Metadata } from 'next';
import { getActiveSubscriptionByUserId, getMonthlyMessageCountByUserId, getSettings } from '@/lib/db/queries';
import Link from 'next/link';
import { SettingsNav } from '@/components/settings-nav';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SettingsSidebarHeader } from '@/components/settings-sidebar-header';
import { SettingsSidebarStats } from '@/components/settings-sidebar-stats';
import { IconArrowLeft } from '@tabler/icons-react';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const [active, settings] = await Promise.all([
    getActiveSubscriptionByUserId({ userId: user.id }),
    getSettings(),
  ]);
  const msgLimits = (settings?.messageLimits as any) || {};
  const standardMonthly = Number((msgLimits && (msgLimits.standardMonthly as any)) ?? 1000);
  const premiumMonthly = Number((msgLimits && (msgLimits.premiumMonthly as any)) ?? 150);
  const isPremium = Boolean(active);
  const monthlyLimit = isPremium ? premiumMonthly : standardMonthly;
  const used = await getMonthlyMessageCountByUserId({ id: user.id });

  return (
    <SidebarProvider>
      <div data-settings-root className="mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-start">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="gap-1.5 h-8 inline-flex items-center rounded-md px-3 text-sm hover:bg-muted">
            <IconArrowLeft size={12} /> Back to Chat
          </Link>
          {/*<h1 className="text-2xl font-semibold">Settings</h1>*/}
        </div>
        <div className="grid gap-6 md:grid-cols-[16rem_minmax(0,800px)]">
          <aside className="space-y-4 md:sticky md:top-4 h-fit w-64">
            <div>
              <SettingsSidebarHeader
                initialId={user.id}
                initialEmail={user.email}
                initialName={user.name}
                initialImage={(user as any).image || null}
              />
              <SettingsSidebarStats
                initialUsed={used}
                initialLimit={monthlyLimit}
                initialPlan={isPremium ? 'Premium' : 'Free'}
              />
            </div>
            <SettingsNav />
          </aside>
          <main className="min-w-0 w-[800px]">{children}</main>
        </div>
        {/* Hide chat sidebar toggle inside settings pages */}
        <style
          // Scoped to settings root only
          dangerouslySetInnerHTML={{
            __html:
              '[data-settings-root] [data-testid="sidebar-toggle-button"]{display:none !important}',
          }}
        />
      </div>
    </SidebarProvider>
  );
}

export const metadata: Metadata = {
  title: 'Settings',
  openGraph: {
    images: [{ url: '/og?title=Settings&subtitle=Manage%20account%20and%20preferences&emoji=%E2%9A%99%EF%B8%8F&theme=brand' }],
  },
  twitter: {
    images: [{ url: '/og?title=Settings&subtitle=Manage%20account%20and%20preferences&emoji=%E2%9A%99%EF%B8%8F&theme=brand' }],
  },
};
