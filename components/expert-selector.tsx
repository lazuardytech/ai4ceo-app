"use client";

import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
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
  chatId,
  selectedAgentIds,
  onChange,
  onExpertsActivated,
  isReasoningActive = false,
  className,
}: {
  chatId: string;
  selectedAgentIds: string[];
  onChange: (ids: string[]) => void;
  onExpertsActivated?: () => void;
  isReasoningActive?: boolean;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>(selectedAgentIds);
  useEffect(() => {
    setLocalSelected(selectedAgentIds);
  }, [selectedAgentIds.join(',')]);

  const { data } = useSWR<Expert[]>('/api/experts', fetcher);
  const experts = data ?? [];

  const selectedCount = localSelected.length;
  const label = selectedCount > 0 ? `${selectedCount} Experts` : 'General Expert';

  const handleOpenChange = (next: boolean) => {
    if (next && !isReasoningActive) {
      setConfirmOpen(true);
      return;
    }
    setOpen(next);
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger
          asChild
          className={cn(
            'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
            className,
          )}
        >
          <Button
            data-testid="expert-selector"
            variant="outline"
            className={cn('md:px-2 md:h-[34px]', !isReasoningActive && 'opacity-80')}
            aria-disabled={!isReasoningActive}
          >
            {label}
            <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[320px]">
          {experts.map((e) => {
            const checked = localSelected.includes(e.id);
            return (
              <DropdownMenuCheckboxItem
                key={e.id}
              checked={checked}
              onCheckedChange={(next) => {
                const set = new Set(localSelected);
                if (next) set.add(e.id);
                else set.delete(e.id);
                const nextArr = Array.from(set);
                setLocalSelected(nextArr);
                // Persist selection cookie and bubble up
                persistSelection(nextArr);
                onChange(nextArr);
                // Save to server for this chat
                try {
                  fetch(`/api/chat/experts?chatId=${encodeURIComponent(chatId)}`,
                    { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ agentIds: nextArr }) },
                  );
                } catch {}
                // If experts were just activated (transition from none -> some), auto-switch model to Reasoning
                if (!localSelected.length && nextArr.length > 0) {
                  try {
                    document.cookie = `chat-model-small=chat-model-reasoning; Path=/; Max-Age=31536000; SameSite=Lax`;
                  } catch {}
                  onExpertsActivated?.();
                }
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Reasoning Model?</AlertDialogTitle>
            <AlertDialogDescription>
              Experts require the Reasoning model to run. Switch to Reasoning now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                try {
                  document.cookie = `chat-model-small=chat-model-reasoning; Path=/; Max-Age=31536000; SameSite=Lax`;
                } catch {}
                onExpertsActivated?.();
                setConfirmOpen(false);
                setOpen(true);
              }}
            >
              Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
