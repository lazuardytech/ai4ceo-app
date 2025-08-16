"use client";

import useSWR from 'swr';
import { useOptimistic, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, fetcher } from '@/lib/utils';
import { ChevronDownIcon } from './icons';
// Persist selection locally via cookie so the server page can prefill on reload
function persistSelection(ids: string[]) {
  try {
    const value = encodeURIComponent(JSON.stringify(ids ?? []));
    document.cookie = `selected-experts=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {}
}

type Expert = { id: string; slug: string; name: string; description?: string | null };

export function ExpertSelector({
  selectedAgentIds,
  onChange,
  className,
}: {
  selectedAgentIds: string[];
  onChange: (ids: string[]) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticSelected, setOptimisticSelected] = useOptimistic(
    selectedAgentIds,
  );

  const { data } = useSWR<Expert[]>('/api/experts', fetcher);
  const experts = data ?? [];

  const selectedCount = optimisticSelected.length;
  const label = selectedCount > 0 ? `${selectedCount} Experts` : 'General Expert';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button data-testid="expert-selector" variant="outline" className="md:px-2 md:h-[34px]">
          {label}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[320px]">
        {experts.map((e) => {
          const checked = optimisticSelected.includes(e.id);
          return (
            <DropdownMenuCheckboxItem
              key={e.id}
              checked={checked}
              onCheckedChange={(next) => {
                const set = new Set(optimisticSelected);
                if (next) set.add(e.id);
                else set.delete(e.id);
                const nextArr = Array.from(set);
                setOptimisticSelected(nextArr);
                // Persist selection cookie and bubble up
                persistSelection(nextArr);
                onChange(nextArr);
              }}
            >
              <div className="flex flex-col items-start">
                <div>{e.name}</div>
                {e.description ? (
                  <div className="text-xs text-muted-foreground">{e.description}</div>
                ) : null}
              </div>
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
