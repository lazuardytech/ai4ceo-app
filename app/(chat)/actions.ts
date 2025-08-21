'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
  getSettings,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import {
  resolveModelCandidatesForId,
  type ProviderPreference,
} from '@/lib/ai/providers';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model-small', model);
}

export async function saveSelectedExpertsAsCookie(agentIds: string[]) {
  const cookieStore = await cookies();
  cookieStore.set('selected-experts', JSON.stringify(agentIds ?? []));
}

export async function generateTitleFromUserMessage({
  message,
  providerPreference = 'balance',
}: {
  message: UIMessage;
  providerPreference?: ProviderPreference;
}) {
  const settings = await getSettings();
  const candidates = resolveModelCandidatesForId(
    'title-model',
    null, // OpenRouter disabled
    'groq', // Force Groq
    (settings?.modelOverridesGroq as any) ?? null,
  );
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    try {
      const { text: title } = await generateText({
        model: c.model,
        system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
        prompt: JSON.stringify(message),
      });
      return title;
    } catch (err) {
      if (i === candidates.length - 1) throw err;
    }
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}
