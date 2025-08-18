import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { requireAuth } from '@/lib/auth-guard';
import Script from 'next/script';
import { DataStreamProvider } from '@/components/data-stream-provider';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, cookieStore] = await Promise.all([requireAuth(), cookies()]);
  // Read persisted sidebar state written by SidebarProvider (client)
  const cookieVal = cookieStore.get('sidebar_state')?.value;
  // Default: open on desktop (cookie missing), closed only if user explicitly closed
  const defaultOpen = cookieVal === undefined ? true : cookieVal === 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar user={user} />
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}
