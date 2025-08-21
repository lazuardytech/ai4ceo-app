export const DEFAULT_CHAT_MODEL: string = 'chat-model-small';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

// Default set used as fallback and for initial UI when no settings exist
export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Core',
    description: 'Basic answer for simple tasks',
  },
  {
    id: 'chat-model-large',
    name: 'Basic',
    description: 'Instant solutions for most tasks',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Thinker',
    description: 'Think deeper, reason smarter',
  },
];
