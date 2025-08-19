import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo, useMemo, useState } from 'react';
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
}

function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
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

  return (
    <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll relative">
      <div
        id="gradient-chat"
        className={
          'bg-gradient-to-t from-background to-transparent absolute inset-x-0 bottom-0 z-20 aspect-auto w-full h-52 pointer-events-none select-none transition-opacity duration-300 ' +
          (isAtBottom ? 'opacity-0' : 'opacity-100')
        }
        aria-hidden="true"
      />

      <div
        ref={messagesContainerRef}
        className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
      >
        {messages.length === 0 && <Greeting />}

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
