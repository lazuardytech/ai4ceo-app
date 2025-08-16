import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

import { artifactModel, chatModel, reasoningModel, titleModel } from './models.test';
import { isTestEnvironment } from '../constants';
import { getSettings } from '@/lib/db/queries';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-small': chatModel,
        'chat-model-large': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        // These are safe defaults; runtime code should prefer getLanguageModelForId or getDynamicLanguageModelForId
        'title-model': openrouter.chat('meta-llama/llama-3.2-3b-instruct:free'),
        'artifact-model': openrouter.chat('moonshotai/kimi-k2:free'),
        'chat-model': openrouter.chat('moonshotai/kimi-k2:free'),
        'chat-model-small': openrouter.chat('moonshotai/kimi-k2:free'),
        'chat-model-large': openrouter.chat('moonshotai/kimi-k2:free'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openrouter.chat('deepseek/deepseek-r1:free'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
      },
      // imageModels: {
      //   'small-model': xai.imageModel('grok-2-image'),
      // },
    });

export function getLanguageModelForId(
  id: string,
  overrides?: Record<string, string> | null,
) {
  if (isTestEnvironment) {
    if (id === 'chat-model-reasoning') return reasoningModel;
    if (id === 'title-model') return titleModel;
    if (id === 'artifact-model') return artifactModel;
    return chatModel;
  }

  // Default OpenRouter model mapping, used as fallback when overrides are missing
  const map: Record<string, string> = {
    'chat-model': 'moonshotai/kimi-k2:free',
    'chat-model-small': 'moonshotai/kimi-k2:free',
    'chat-model-large': 'moonshotai/kimi-k2:free',
    'chat-model-reasoning': 'deepseek/deepseek-r1:free',
    'title-model': 'meta-llama/llama-3.2-3b-instruct:free',
    'artifact-model': 'moonshotai/kimi-k2:free',
  };

  const overrideId = overrides?.[id];
  const modelId = (overrideId?.trim()) || map[id] || map['chat-model'];

  if (id === 'chat-model-reasoning') {
    return wrapLanguageModel({
      model: openrouter.chat(modelId),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  return openrouter.chat(modelId);
}

// Convenience helper that reads settings to resolve overrides dynamically at runtime.
// Prefer this in server code when you don't already have settings handy.
export async function getDynamicLanguageModelForId(id: string) {
  if (isTestEnvironment) {
    return getLanguageModelForId(id, null);
  }
  try {
    const settings = await getSettings();
    const overrides = (settings?.modelOverrides ?? null) as Record<string, string> | null;
    return getLanguageModelForId(id, overrides);
  } catch {
    // Fallback to defaults if settings retrieval fails
    return getLanguageModelForId(id, null);
  }
}
