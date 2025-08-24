import type {
  CoreAssistantMessage,
  CoreToolMessage,
  UIMessage,
  UIMessagePart,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DBMessage, Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';
import { formatISO } from 'date-fns';
import { createId } from '@paralleldrive/cuid2';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateCUID(): string {
  return createId();
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents || index < 0 || index >= documents.length) {
    return new Date();
  }

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => {
    // Extract agent metadata from attachments if present
    let agentId: string | undefined;
    let agentName: string | undefined;
    let agentSlug: string | undefined;
    try {
      const atts = (message.attachments as any[]) || [];
      const meta = atts.find((a) => a && a.type === 'agentMetadata');
      if (meta) {
        agentId = meta.agentId;
        agentName = meta.agentName;
        agentSlug = meta.agentSlug;
      }
    } catch { }

    return {
      id: message.id,
      role: message.role as 'user' | 'assistant' | 'system',
      parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
      metadata: {
        createdAt: formatISO(message.createdAt),
        agentId,
        agentName,
        agentSlug,
      },
    };
  });
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

// Referral Code Generation Utilities

export function generateReferralCode(length = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters[Math.floor(Math.random() * characters.length)];
  }

  return result;
}

export function validateReferralCodeFormat(code: string): boolean {
  // Check if code matches expected format: 6-12 alphanumeric characters
  const regex = /^[A-Z0-9]{6,12}$/;
  return regex.test(code);
}

export async function generateUniqueReferralCode(
  checkUniqueness: (code: string) => Promise<boolean>,
  maxRetries = 10,
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateReferralCode(8);
    const isUnique = await checkUniqueness(code);
    if (isUnique) {
      return code;
    }
  }

  throw new Error(
    'Failed to generate unique referral code after maximum retries',
  );
}
