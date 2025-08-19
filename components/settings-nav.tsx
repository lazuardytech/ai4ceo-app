'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserIcon, FileIcon, InvoiceIcon, InfoIcon, ChartIcon } from '@/components/icons';

const nav = [
  { href: '/settings/profile', label: 'Profile', Icon: UserIcon },
  { href: '/settings/usage', label: 'Usage', Icon: ChartIcon },
  { href: '/settings/billing', label: 'Billing', Icon: InvoiceIcon },
  { href: '/settings/files', label: 'Files', Icon: FileIcon },
  { href: '/settings/referral', label: 'Referral', Icon: InfoIcon },
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="rounded-xl border p-2">
      <ul className="grid gap-1">
        {nav.map((n) => {
          const active = pathname === n.href;
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block px-3 py-2 rounded-md hover:bg-accent',
                  active && 'bg-accent text-accent-foreground',
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <n.Icon size={16} />
                  {n.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
