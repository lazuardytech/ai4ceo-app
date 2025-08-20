'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { toast } from './toast';
import type { VisibilityType, } from './visibility-selector';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session,
  selectedAgentIds,
  onChangeSelectedAgentIds,
  onChangeModel,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: { user: { type: 'guest' | 'regular' } };
  selectedAgentIds: string[];
  onChangeSelectedAgentIds: (ids: string[]) => void;
  onChangeModel: (id: string) => void;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={async () => {
                try {
                  const res = await fetch('/api/billing/status');
                  if (res.ok) {
                    const data = (await res.json()) as { hasActiveSubscription: boolean };
                    if (!data.hasActiveSubscription) {
                      toast({
                        type: 'error',
                        description: 'You need an active plan to start a new chat.',
                      });
                      // Optionally guide user to billing page
                      router.push('/billing');
                      return;
                    }
                  } else {
                    // If API fails, show a friendly message and do not navigate
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
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-white">New Chat</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <ModelSelector
          session={session}
          selectedModelId={selectedModelId}
          onChange={(id) => onChangeModel(id as string)}
          className="order-1 md:order-2"
        />
      )}

      {/* Expert selection moved to prompt input modal */}

      {/*{!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
          className="order-1 md:order-3"
        />
      )}*/}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
