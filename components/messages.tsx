import { PreviewMessage, ThinkingMessage } from './message';
import { Button } from './ui/button';
import { Greeting } from './greeting';
import { memo, useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Array<Vote> | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  session?: { user: { name?: string | null; email: string } };
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  session,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  useDataStream();

  // Track whether the bottom sentinel is in view (user scrolled to bottom)
  const [isAtBottom, setIsAtBottom] = useState(false);
  const handleViewportEnter = useMemo(
    () =>
      ((...args: any[]) => {
        setIsAtBottom(true);
        // preserve existing behavior from hook callback
        // @ts-expect-error - framer motion passes event args we don't strictly type here
        onViewportEnter?.(...args);
      }) as any,
    [onViewportEnter],
  );
  const handleViewportLeave = useMemo(
    () =>
      ((...args: any[]) => {
        setIsAtBottom(false);
        // @ts-expect-error - see above note
        onViewportLeave?.(...args);
      }) as any,
    [onViewportLeave],
  );

  const baseName = useMemo(() => {
    const n = session?.user?.name?.trim();
    if (n) return n;
    const email = session?.user?.email || '';
    return email ? email.split('@')[0] : 'there';
  }, [session?.user?.name, session?.user?.email]);

  const shouldFetchProfile = Boolean(session && (!session.user.name || !session.user.name.trim()));
  const { data: profile } = useSWR<{ name?: string }>(
    shouldFetchProfile ? '/api/profile' : null,
    fetcher,
  );
  const displayName = (profile?.name?.trim()) || baseName;

  return (
    <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll relative">
      <div
        id="gradient-chat"
        className={
          `bg-linear-to-t from-background to-transparent absolute inset-x-0 bottom-0 z-20 aspect-auto w-full h-52 pointer-events-none select-none transition-opacity duration-300 ${isAtBottom ? 'opacity-0' : 'opacity-100'}`
        }
        aria-hidden="true"
      />

      <div
        ref={messagesContainerRef}
        className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
      >
        {messages.length === 0 && <Greeting name={displayName} />}

        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={status === 'streaming' && messages.length - 1 === index}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
            setMessages={setMessages}
            regenerate={regenerate}
            isReadonly={isReadonly}
            requiresScrollPadding={
              hasSentMessage && index === messages.length - 1
            }
          />
        ))}

        {status === 'submitted' &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

        {status === 'ready' &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && (
            <div className="mx-auto max-w-3xl px-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <p>No response received.</p>
              {!isReadonly && (
                <Button size="sm" variant="outline" onClick={() => regenerate()}>
                  Retry
                </Button>
              )}
            </div>
          )}

        <motion.div
          ref={messagesEndRef}
          className="shrink-0 min-w-[24px] min-h-[24px]"
          onViewportLeave={handleViewportLeave}
          onViewportEnter={handleViewportEnter}
        />
      </div>
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return false;
});
