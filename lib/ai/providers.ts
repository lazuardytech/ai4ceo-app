import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createVertex } from '@ai-sdk/google-vertex';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const vertex = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT,
  location: process.env.GOOGLE_VERTEX_LOCATION,
  headers: process.env.GOOGLE_VERTEX_API_KEY
    ? { 'x-goog-api-key': process.env.GOOGLE_VERTEX_API_KEY }
    : undefined,
});

// NOTE: getSettings is only needed dynamically to avoid importing server-only in scripts

export const myProvider = customProvider({
  languageModels: {
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
export type ProviderPreference = 'groq' | 'vertex';

const groqMap: Record<string, string> = {
  'chat-model': 'openai/gpt-oss-20b',
  'chat-model-small': 'openai/gpt-oss-20b',
  'chat-model-large': 'openai/gpt-oss-120b',
  'chat-model-reasoning': 'moonshotai/kimi-k2-instruct',
  'title-model': 'openai/gpt-oss-20b',
  'artifact-model': 'moonshotai/kimi-k2-instruct',
};

const vertexMap: Record<string, string> = {
  'chat-model': 'gemini-1.5-flash',
  'chat-model-small': 'gemini-1.5-flash',
  'chat-model-large': 'gemini-1.5-pro',
  'chat-model-reasoning': 'gemini-1.5-pro',
  'title-model': 'gemini-1.5-flash',
  'artifact-model': 'gemini-1.5-pro',
};

export function getLanguageModelForId(
  id: string,
  provider: ProviderPreference,
  overrides?: Record<string, string> | null,
) {
  const map = provider === 'vertex' ? vertexMap : groqMap;
  const modelId = overrides?.[id]?.trim() || map[id] || map['chat-model'];

  const model = provider === 'vertex' ? vertex(modelId) : groq(modelId);

  if (id === 'chat-model-reasoning') {
    return wrapLanguageModel({
      model,
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  return model;
}

export async function getDynamicLanguageModelForId(id: string) {
  try {
    const { getSettings } = await import('@/lib/db/queries');
    const settings = await getSettings();
    const pref = (settings?.defaultProviderPreference as ProviderPreference) ?? 'groq';
    const groqOverrides = (settings?.modelOverridesGroq ?? null) as Record<string, string> | null;
    const vertexOverrides = (settings?.modelOverridesVertex ?? null) as Record<string, string> | null;
    const overrides = pref === 'groq' ? groqOverrides : vertexOverrides;
    return getLanguageModelForId(id, pref, overrides);
  } catch {
    return getLanguageModelForId(id, 'groq', null);
  }
}

export function resolveModelCandidatesForId(
  id: string,
  preference: ProviderPreference = 'groq',
  groqOverrides?: Record<string, string> | null,
  vertexOverrides?: Record<string, string> | null,
) {
  const groqEnabled = Boolean(process.env.GROQ_API_KEY);
  const vertexEnabled = Boolean(
    process.env.GOOGLE_VERTEX_PROJECT && process.env.GOOGLE_VERTEX_LOCATION,
  );

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

  const makeVertexCandidate = () => {
    const modelId = vertexOverrides?.[id]?.trim() || vertexMap[id] || vertexMap['chat-model'];
    if (id === 'chat-model-reasoning') {
      return {
        provider: 'vertex' as const,
        modelId,
        model: wrapLanguageModel({
          model: vertex(modelId),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
      };
    }
    return { provider: 'vertex' as const, modelId, model: vertex(modelId) };
  };

  if (preference === 'vertex') {
    if (vertexEnabled) return [makeVertexCandidate()];
    if (groqEnabled) return [makeGroqCandidate()];
  } else {
    if (groqEnabled) return [makeGroqCandidate()];
    if (vertexEnabled) return [makeVertexCandidate()];
  }

  throw new Error('No AI provider configured');
}
