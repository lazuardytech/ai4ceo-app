'use client';
import { usePathname, useRouter } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { toast } from './toast';
import Image from 'next/image';

export type MinimalUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: 'user' | 'admin' | 'superadmin';
};

export function AppSidebar({ user }: { user: MinimalUser | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  // Hide sidebar during onboarding flow
  if (pathname === '/onboarding') return null;

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <Image src="/images/logo.svg" width={100} height={50} alt="Logo" />
              {/*<span className="text-lg font-semibold p-2 hover:bg-muted rounded-md cursor-pointer"></span>*/}
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={async () => {
                    setOpenMobile(false);
                    try {
                      const res = await fetch('/api/billing/status');
                      if (res.ok) {
                        const data = (await res.json()) as { hasActiveSubscription: boolean };
                        if (!data.hasActiveSubscription) {
                          toast({
                            type: 'error',
                            description: 'You need an active plan to start a new chat.',
                          });
                          router.push('/billing');
                          return;
                        }
                      } else {
                        toast({ type: 'error', description: 'Unable to verify plan status.' });
                        return;
                      }
                    } catch {
                      toast({ type: 'error', description: 'Unable to verify plan status.' });
                      return;
                    }
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className='p-2'>
          <Link
            href="/profile"
            onClick={() => setOpenMobile(false)}
            className="flex items-center rounded-md p-2 text-sm hover:bg-muted"
          >
            Profile
          </Link>
          <Link
            href="/files"
            onClick={() => setOpenMobile(false)}
            className="flex items-center rounded-md p-2 text-sm hover:bg-muted"
          >
            Files
          </Link>
          <Link
            href="/usage"
            onClick={() => setOpenMobile(false)}
            className="flex items-center rounded-md p-2 text-sm hover:bg-muted"
          >
            Usage
          </Link>
          <Link
            href="/billing"
            onClick={() => setOpenMobile(false)}
            className="flex items-center rounded-md p-2 text-sm hover:bg-muted"
          >
            Billing
          </Link>
          <Link
            href="/referral"
            onClick={() => setOpenMobile(false)}
            className="flex items-center rounded-md p-2 text-sm hover:bg-muted"
          >
            Referral
          </Link>
          {user?.role === 'superadmin' && (
            <Link
              href="/admin"
              onClick={() => setOpenMobile(false)}
              className="flex items-center rounded-md p-2 text-sm hover:bg-muted"
            >
              Admin
            </Link>
          )}
        </SidebarMenu>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
