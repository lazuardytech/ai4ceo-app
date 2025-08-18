import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGroq } from '@ai-sdk/groq';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});


import { getSettings } from '@/lib/db/queries';

export const myProvider = customProvider({
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
  const modelId = overrideId?.trim() || map[id] || map['chat-model'];

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

  try {
    const settings = await getSettings();
    const overrides = (settings?.modelOverrides ?? null) as Record<
      string,
      string
    > | null;
    return getLanguageModelForId(id, overrides);
  } catch {
    // Fallback to defaults if settings retrieval fails
    return getLanguageModelForId(id, null);
  }
}

// Balanced provider selection across OpenRouter and Groq with simple random order.
// Returns candidates so callers can try in order and fallback on error.
export type ProviderPreference = 'balance' | 'groq' | 'openrouter';

export function resolveModelCandidatesForId(
  id: string,
  openrouterOverrides?: Record<string, string> | null,
  preference: ProviderPreference = 'balance',
  groqOverrides?: Record<string, string> | null,
) {
  // Map of logical ids to provider-specific ids
  const openrouterMap: Record<string, string> = {
    'chat-model': 'moonshotai/kimi-k2:free',
    'chat-model-small': 'moonshotai/kimi-k2:free',
    'chat-model-large': 'moonshotai/kimi-k2:free',
    'chat-model-reasoning': 'deepseek/deepseek-r1:free',
    'title-model': 'meta-llama/llama-3.2-3b-instruct:free',
    'artifact-model': 'moonshotai/kimi-k2:free',
  };

  // Groq model mapping; adjust to your account availability
  const groqMap: Record<string, string> = {
    'chat-model': 'llama3-8b-8192',
    'chat-model-small': 'llama3-8b-8192',
    'chat-model-large': 'llama3-70b-8192',
    'chat-model-reasoning': 'llama3-70b-8192',
    'title-model': 'llama3-8b-8192',
    'artifact-model': 'llama3-8b-8192',
  };

  const groqEnabled = Boolean(process.env.GROQ_API_KEY);

  const makeCandidate = (provider: 'openrouter' | 'groq') => {
    if (provider === 'openrouter') {
      const modelId = openrouterOverrides?.[id]?.trim() || openrouterMap[id] || openrouterMap['chat-model'];
      if (id === 'chat-model-reasoning') {
        return {
          provider: 'openrouter' as const,
          modelId,
          model: wrapLanguageModel({
            model: openrouter.chat(modelId),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
          }),
        };
      }
      return { provider: 'openrouter' as const, modelId, model: openrouter.chat(modelId) };
    } else {
      const modelId = groqOverrides?.[id]?.trim() || groqMap[id] || groqMap['chat-model'];
      if (id === 'chat-model-reasoning') {
        return {
          provider: 'groq' as const,
          modelId,
          model: wrapLanguageModel({
            model: groq(modelId),
            middleware: extractReasoningMiddleware({ tagName: 'think' }),
          }),
        };
      }
      return { provider: 'groq' as const, modelId, model: groq(modelId) };
    }
  };

  // Choose providers based on preference
  let providers: Array<'openrouter' | 'groq'> = ['openrouter'];
  if (preference === 'openrouter') {
    providers = ['openrouter'];
  } else if (preference === 'groq') {
    providers = groqEnabled ? ['groq'] : ['openrouter'];
  } else {
    // balance
    const order = Math.random() < 0.5 ? ['openrouter', 'groq'] : ['groq', 'openrouter'];
    providers = groqEnabled ? (order as Array<'openrouter' | 'groq'>) : ['openrouter'];
  }
  return providers.map((p) => makeCandidate(p as any));
}
