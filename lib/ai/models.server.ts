import { getSettings } from '@/lib/db/queries';
import { chatModels as defaults, DEFAULT_CHAT_MODEL, type ChatModel } from './models';

export async function getChatModels(): Promise<ChatModel[]> {
  try {
    const settings = await getSettings();
    const list = (settings?.chatModels as ChatModel[] | undefined) ?? defaults;
    if (Array.isArray(list) && list.length > 0) return list;
    return defaults;
  } catch {
    return defaults;
  }
}

export async function getDefaultChatModelId(): Promise<string> {
  try {
    const settings = await getSettings();
    const configured = settings?.defaultChatModelId as string | undefined;
    const enabled = (settings?.enabledChatModelIds as string[] | undefined) ?? null;
    if (configured && typeof configured === 'string') return configured;
    if (enabled && Array.isArray(enabled) && enabled.length > 0) return enabled[0];
    return defaults[0]?.id || DEFAULT_CHAT_MODEL;
  } catch {
    return DEFAULT_CHAT_MODEL;
  }
}
