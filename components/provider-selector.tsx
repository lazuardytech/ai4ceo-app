"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from './icons';

type ProviderPreference = 'balance' | 'groq' | 'openrouter';

function persistPreference(pref: ProviderPreference) {
  try {
    document.cookie = `provider-pref=${pref}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {}
}

export function ProviderSelector({
  value,
  onChange,
  className,
}: {
  value: ProviderPreference;
  onChange: (pref: ProviderPreference) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<ProviderPreference>(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const labelMap: Record<ProviderPreference, string> = {
    balance: 'Load Balance',
    groq: 'Groq Only',
    openrouter: 'OpenRouter Only',
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button variant="outline" className="md:px-2 md:h-[34px]">
          {labelMap[local]}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {(['balance', 'groq', 'openrouter'] as ProviderPreference[]).map((pref) => (
          <DropdownMenuItem
            key={pref}
            onSelect={() => {
              setLocal(pref);
              persistPreference(pref);
              onChange(pref);
            }}
          >
            {labelMap[pref]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

