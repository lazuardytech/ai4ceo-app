import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { groq } from '@ai-sdk/groq';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? customProvider({
    languageModels: {
      'chat-model-small': chatModel,
      'chat-model-large': chatModel,
      'chat-model-reasoning': reasoningModel,
      'title-model': titleModel,
      'artifact-model': artifactModel,
    },
  })
  : customProvider({
    languageModels: {
      // 'chat-model': openrouter.chat('grok-2-vision-1212'),
      // 'chat-model-reasoning': wrapLanguageModel({
      //   model: openrouter.chat('grok-3-mini-beta'),
      //   middleware: extractReasoningMiddleware({ tagName: 'think' }),
      // }),

      'title-model': openrouter.chat('meta-llama/llama-3.2-3b-instruct:free'),
      'artifact-model': openrouter.chat('moonshotai/kimi-k2:free'),
      'chat-model-small': openrouter.chat('moonshotai/kimi-k2:free'),
      'chat-model-large': openrouter.chat('moonshotai/kimi-k2:free'),
      'chat-model-reasoning': wrapLanguageModel({
        model: openrouter.chat('deepseek/deepseek-r1:free'),
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      }),

      // 'title-model': groq('llama-3.1-8b-instant'),
      // 'artifact-model': groq('llama-3.1-8b-instant'),
      // 'block-model': groq('mixtral-8x7b-32768'),
      // 'chat-model-small': groq('openai/gpt-oss-20b'),
      // 'chat-model-large': groq('openai/gpt-oss-20b'),
      // 'chat-model-reasoning': wrapLanguageModel({
      //   model: groq('openai/gpt-oss-120b'),
      //   middleware: extractReasoningMiddleware({ tagName: 'think' }),
      // }),
    },
    // imageModels: {
    //   'small-model': xai.imageModel('grok-2-image'),
    // },
  });
