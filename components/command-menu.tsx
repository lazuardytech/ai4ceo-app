'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { FileIcon, HomeIcon, InvoiceIcon, UserIcon, BoxIcon } from './icons';

type MinimalUserRole = 'user' | 'admin' | 'superadmin';

export function CommandMenu(props: { user?: { role?: MinimalUserRole } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; title: string }>>([]);

  // Toggle by keyboard: Cmd/Ctrl + K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Debounced search
  useEffect(() => {
    let active = true;
    const trimmed = query.trim();
    if (!open) return;
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/history/search?q=${encodeURIComponent(trimmed)}&limit=10`);
        if (!res.ok) throw new Error('Search failed');
        const data = (await res.json()) as { chats: Array<{ id: string; title: string }> };
        if (active) setResults(data.chats ?? []);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 200);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [open, query]);

  const quickLinks = useMemo(
    () => [
      { label: 'New Chat', path: '/', icon: HomeIcon },
      { label: 'Profile', path: '/profile', icon: UserIcon },
      { label: 'Files', path: '/files', icon: FileIcon },
      { label: 'Usage', path: '/usage', icon: BoxIcon },
      { label: 'Billing', path: '/billing', icon: InvoiceIcon },
      { label: 'Referral', path: '/referral', icon: BoxIcon },
      ...(props.user?.role === 'superadmin'
        ? [{ label: 'Admin', path: '/admin', icon: BoxIcon }]
        : []),
    ],
    [props.user?.role],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search chats or type a command..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{loading ? 'Searching…' : 'No results found.'}</CommandEmpty>
          <CommandGroup heading="Quick Links">
            {quickLinks.map((link) => (
              <CommandItem
                key={link.path}
                onSelect={() => router.push(link.path)}
                value={link.label}
              >
                <link.icon size={16} />
                <span>{link.label}</span>
                {link.label === 'New Chat' && (
                  <CommandShortcut>⌘K</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Chats">
            {results.map((c) => (
              <CommandItem key={c.id} value={c.title} onSelect={() => router.push(`/chat/${c.id}`)}>
                <span className="truncate max-w-[24rem]">{c.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
