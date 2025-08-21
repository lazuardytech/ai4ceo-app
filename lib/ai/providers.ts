import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGroq } from '@ai-sdk/groq';

// Load balancing disabled - keeping OpenRouter for future use
// const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
// });

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});


import { getSettings } from '@/lib/db/queries';

export const myProvider = customProvider({
  languageModels: {
    // Using Groq only - OpenRouter disabled for now
    'title-model': groq('openai/gpt-oss-20b'),
    'artifact-model': groq('moonshotai/kimi-k2-instruct'),
    'chat-model': groq('openai/gpt-oss-20b'),
    'chat-model-small': groq('openai/gpt-oss-20b'),
    'chat-model-large': groq('openai/gpt-oss-120b'),
    'chat-model-reasoning': wrapLanguageModel({
      model: groq('moonshotai/kimi-k2-instruct'),
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
  // Using Groq only - OpenRouter mapping kept for reference
  // const openrouterMap: Record<string, string> = {
  //   'chat-model': 'moonshotai/kimi-k2:free',
  //   'chat-model-small': 'moonshotai/kimi-k2:free',
  //   'chat-model-large': 'moonshotai/kimi-k2:free',
  //   'chat-model-reasoning': 'deepseek/deepseek-r1:free',
  //   'title-model': 'meta-llama/llama-3.2-3b-instruct:free',
  //   'artifact-model': 'moonshotai/kimi-k2:free',
  // };

  // Groq model mapping
  const groqMap: Record<string, string> = {
    'chat-model': 'openai/gpt-oss-20b',
    'chat-model-small': 'openai/gpt-oss-20b',
    'chat-model-large': 'openai/gpt-oss-120b',
    'chat-model-reasoning': 'moonshotai/kimi-k2-instruct',
    'title-model': 'openai/gpt-oss-20b',
    'artifact-model': 'moonshotai/kimi-k2-instruct',
  };

  const overrideId = overrides?.[id];
  const modelId = overrideId?.trim() || groqMap[id] || groqMap['chat-model'];

  if (id === 'chat-model-reasoning') {
    return wrapLanguageModel({
      model: groq(modelId),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  return groq(modelId);
}

// Convenience helper that reads settings to resolve overrides dynamically at runtime.
// Prefer this in server code when you don't already have settings handy.
export async function getDynamicLanguageModelForId(id: string) {
  try {
    const settings = await getSettings();
    // Use Groq overrides only
    const overrides = (settings?.modelOverridesGroq ?? null) as Record<
      string,
      string
    > | null;
    return getLanguageModelForId(id, overrides);
  } catch {
    // Fallback to defaults if settings retrieval fails
    return getLanguageModelForId(id, null);
  }
}

// Load balancing disabled - using Groq only
// OpenRouter code kept for future restoration
export type ProviderPreference = 'balance' | 'groq' | 'openrouter';

export function resolveModelCandidatesForId(
  id: string,
  openrouterOverrides?: Record<string, string> | null,
  preference: ProviderPreference = 'groq', // Force Groq
  groqOverrides?: Record<string, string> | null,
) {
  // OpenRouter mapping kept for reference
  // const openrouterMap: Record<string, string> = {
  //   'chat-model': 'moonshotai/kimi-k2:free',
  //   'chat-model-small': 'moonshotai/kimi-k2:free',
  //   'chat-model-large': 'moonshotai/kimi-k2:free',
  //   'chat-model-reasoning': 'deepseek/deepseek-r1:free',
  //   'title-model': 'meta-llama/llama-3.2-3b-instruct:free',
  //   'artifact-model': 'moonshotai/kimi-k2:free',
  // };

  // Groq model mapping
  const groqMap: Record<string, string> = {
    'chat-model': 'openai/gpt-oss-20b',
    'chat-model-small': 'openai/gpt-oss-20b',
    'chat-model-large': 'openai/gpt-oss-120b',
    'chat-model-reasoning': 'moonshotai/kimi-k2-instruct',
    'title-model': 'openai/gpt-oss-20b',
    'artifact-model': 'moonshotai/kimi-k2-instruct',
  };

  const groqEnabled = Boolean(process.env.GROQ_API_KEY);

  const makeGroqCandidate = () => {
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
  };

  // Force Groq only - ignore preference parameter
  if (!groqEnabled) {
    throw new Error('Groq API key not configured');
  }

  return [makeGroqCandidate()];

  // Original load balancing code kept for future restoration:
  /*
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

  let providers: Array<'openrouter' | 'groq'> = ['openrouter'];
  if (preference === 'openrouter') {
    providers = ['openrouter'];
  } else if (preference === 'groq') {
    providers = groqEnabled ? ['groq'] : ['openrouter'];
  } else {
    const order = Math.random() < 0.5 ? ['openrouter', 'groq'] : ['groq', 'openrouter'];
    providers = groqEnabled ? (order as Array<'openrouter' | 'groq'>) : ['openrouter'];
  }
  return providers.map((p) => makeCandidate(p as any));
  */
}
