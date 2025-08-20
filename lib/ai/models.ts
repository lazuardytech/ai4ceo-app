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
    name: 'LEAD Core',
    description: 'Basic model for simple tasks',
  },
  {
    id: 'chat-model-large',
    name: 'LEAD Advanced',
    description: 'A more advanced model for complex tasks',
  },
  {
    id: 'chat-model-reasoning',
    name: 'LEAD Thinker',
    description: 'Model that can reason and think better',
  },
];
