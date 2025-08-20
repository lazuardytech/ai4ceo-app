import { z } from 'zod';

const textPartSchema = z.object({
  type: z.enum(['text']),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(['file']),
  mediaType: z.enum(['image/jpeg', 'image/png']),
  name: z.string().min(1).max(100),
  url: z.string().url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

export const postRequestBodySchema = z.object({
  id: z.string().cuid2(),
  message: z.object({
    id: z.string().cuid2(),
    role: z.enum(['user']),
    parts: z.array(partSchema),
  }),
  selectedChatModel: z.enum([
    'chat-model-small',
    'chat-model-large',
    'chat-model-reasoning',
  ]),
  selectedVisibilityType: z.enum(['public', 'private']),
  selectedAgentIds: z.array(z.string().cuid2()).optional().default([]),
  selectedProviderPreference: z
    .enum(['balance', 'groq', 'openrouter'])
    .optional()
    .default('balance'),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
