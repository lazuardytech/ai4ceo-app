'use client';

import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import { toast } from './toast';
import { LoaderIcon } from './icons';
import { authClient } from '@/lib/auth-client';
import type { MinimalUser } from './app-sidebar';

export function SidebarUserNav({ user }: { user: MinimalUser }) {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isPending ? (
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10 justify-between">
                <div className="flex flex-row gap-2">
                  <div className="size-6 bg-zinc-500/30 rounded-full animate-pulse" />
                  <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                data-testid="user-nav-button"
                className="border data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-12"
              >
                <Image
                  src={(data?.user?.image as string) || (user as any).image || `https://avatar.vercel.sh/${user.email}`}
                  alt={(data?.user?.name as string) ?? (user as any).name ?? (user?.email ?? 'User Avatar')}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div className='flex flex-col w-full'>
                  {data?.user?.name &&
                    <span data-testid="user-name" className="truncate">
                      {(user as any)?.name}
                    </span>
                  }
                  <span data-testid="user-email" className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            {/*<DropdownMenuLabel className="text-xs">
              Signed in as {data?.user?.email ?? user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />*/}
            {/*<DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => router.push('/settings/profile')}
            >
              Settings
            </DropdownMenuItem>*/}
            {/*<DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/settings/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/settings/usage')}>
              Usage
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/settings/billing')}>
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/settings/files')}>
              Files
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/settings/referral')}>
              Referral
            </DropdownMenuItem>*/}
            {/*<DropdownMenuSeparator />*/}
            <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className="cursor-pointer"
              onSelect={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
            >
              {`Toggle ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (isPending) {
                    toast({
                      type: 'error',
                      description:
                        'Checking authentication status, please try again!',
                    });

                    return;
                  }

                  authClient.signOut().then(() => {
                    router.push('/');
                    router.refresh();
                  });
                }}
              >
                Sign out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
