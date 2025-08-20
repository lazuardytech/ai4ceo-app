'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

import { IconUserScan, IconGauge, IconFiles, IconReceiptDollar, IconReplaceUser } from '@tabler/icons-react';

const nav = [
  { href: '/settings/profile', label: 'Profile', Icon: IconUserScan },
  { href: '/settings/usage', label: 'Usage', Icon: IconGauge },
  { href: '/settings/billing', label: 'Billing', Icon: IconReceiptDollar },
  { href: '/settings/files', label: 'Files', Icon: IconFiles },
  { href: '/settings/referral', label: 'Referral', Icon: IconReplaceUser },
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav>
      <ul className="grid gap-1">
        {nav.map((n) => {
          const active = pathname === n.href;
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block px-3 py-2 rounded-md hover:bg-accent text-sm font-medium transition-colors text-muted-foreground',
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
