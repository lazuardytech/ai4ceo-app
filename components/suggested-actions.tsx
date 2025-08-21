'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/lib/types';

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const { data } = useSWR<{ items: { title: string; label: string; action: string }[] }>(
    '/api/suggestions/actions',
    fetcher,
  );
  const suggestedActions = data?.items ?? [
    { title: 'Buat rencana untuk', label: 'masuk pasar baru dengan strategi GTM 90 hari', action: 'Buat rencana GTM 90 hari untuk masuk pasar baru di Indonesia. Sertakan KPI dan analisis risiko.' },
    { title: 'Analisis', label: 'unit ekonomi dan strategi peningkatan margin', action: 'Analisis unit ekonomi perusahaan dan identifikasi cara meningkatkan gross margin di pasar Indonesia.' },
    { title: 'Susun laporan', label: 'board meeting dengan metrik kunci dan risiko strategis', action: 'Susun laporan board meeting bulan ini dengan metrik kunci dan risiko strategis untuk pasar Indonesia.' },
    { title: 'Rancang struktur', label: 'organisasi untuk scaling dari 10 ke 30 orang', action: 'Rancang struktur organisasi untuk scaling dari 10 ke 30 orang dengan peran dan tanggung jawab yang jelas.' },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full truncate text-ellipsis"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              sendMessage({
                role: 'user',
                parts: [{ type: 'text', text: suggestedAction.action }],
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground text-ellipsis truncate w-full">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
