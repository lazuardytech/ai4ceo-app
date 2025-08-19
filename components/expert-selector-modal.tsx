"use client";

import useSWR from 'swr';
import { type JSX, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn, fetcher } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { BotIcon, BoxIcon, FileIcon, InfoIcon, HomeIcon, GPSIcon, PencilEditIcon } from '@/components/icons';

type Expert = { id: string; slug: string; name: string; description?: string | null; icon?: string | null };

function persistSelection(ids: string[]) {
  try {
    const value = encodeURIComponent(JSON.stringify(ids ?? []));
    document.cookie = `selected-experts=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch { }
}

export function ExpertSelectorModal({
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
} & Omit<React.ComponentProps<typeof Button>, 'onChange'>) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>(selectedAgentIds);

  useEffect(() => {
    setLocalSelected(selectedAgentIds);
  }, [selectedAgentIds]);

  const { data } = useSWR<Expert[]>('/api/experts', fetcher);
  const experts = data ?? [];

  const IconMap: Record<string, JSX.Element> = {
    bot: <BotIcon />,
    box: <BoxIcon size={16} />,
    file: <FileIcon />,
    info: <InfoIcon />,
    home: <HomeIcon size={16} />,
    gps: <GPSIcon size={16} />,
    pencil: <PencilEditIcon />,
  };

  const handleOpenChange = (next: boolean) => {
    if (next && !isReasoningActive) {
      setConfirmOpen(true);
      return;
    }
    setOpen(next);
  };

  const toggleExpert = (id: string) => {
    const set = new Set(localSelected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    const nextArr = Array.from(set);
    setLocalSelected(nextArr);
    persistSelection(nextArr);
    onChange(nextArr);
    // Save to server for this chat
    try {
      fetch(`/api/chat/experts?chatId=${encodeURIComponent(chatId)}`,
        { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ agentIds: nextArr }) },
      );
    } catch { }
    if (!selectedAgentIds.length && nextArr.length > 0) {
      try {
        document.cookie = `chat-model-small=chat-model-reasoning; Path=/; Max-Age=31536000; SameSite=Lax`;
      } catch { }
      onExpertsActivated?.();
    }
  };

  const selectedCount = localSelected.length;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn('rounded-full !px-4 p-[7px] h-fit', className, !isReasoningActive && 'opacity-80')}
            aria-disabled={!isReasoningActive}
          >
            {selectedCount > 0 ? `${selectedCount} Experts` : 'Experts'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Select Experts</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {experts.map((e) => {
              const checked = localSelected.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggleExpert(e.id)}
                  data-active={checked}
                  className={cn(
                    'rounded-md border p-3 text-left transition-colors flex gap-3',
                    'hover:border-foreground/40 hover:bg-accent/40',
                    'data-[active=true]:border-foreground data-[active=true]:bg-accent/60',
                  )}
                >
                  <div className="mt-0.5 text-foreground">
                    {e.icon && IconMap[e.icon] ? IconMap[e.icon] : <BotIcon />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">{e.name}</div>
                      <Badge variant="outline" className="text-[10px] uppercase">{e.slug}</Badge>
                    </div>
                    {e.description ? (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</div>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter className="justify-between">
            <div className="text-xs text-muted-foreground">
              {selectedCount > 0 ? `${selectedCount} selected` : 'No experts selected'}
            </div>
            {selectedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLocalSelected([]);
                  persistSelection([]);
                  onChange([]);
                  try {
                    fetch(`/api/chat/experts?chatId=${encodeURIComponent(chatId)}`,
                      { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ agentIds: [] }) },
                    );
                  } catch { }
                }}
              >
                Clear all
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                } catch { }
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
