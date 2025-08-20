import { getSettings } from '@/lib/db/queries';
import type { ChatModel } from '@/lib/ai/models';
import { NextResponse } from 'next/server';
import { chatModels as defaultChatModels } from '@/lib/ai/models';

export async function GET() {
  try {
    const settings = await getSettings();
    const models = (settings?.chatModels as ChatModel[] | undefined) ?? defaultChatModels;
    return NextResponse.json({ models }, { status: 200 });
  } catch {
    return NextResponse.json({ models: defaultChatModels }, { status: 200 });
  }
}

