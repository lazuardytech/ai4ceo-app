import { getSettings } from '@/lib/db/queries';
import type { ChatModel } from '@/lib/ai/models';
import { NextResponse } from 'next/server';
import { chatModels as defaultChatModels } from '@/lib/ai/models';

export async function GET() {
  try {
    const settings = await getSettings();
    const enabled = (settings?.enabledChatModelIds as string[] | undefined) ?? null;
    const list: ChatModel[] = enabled && Array.isArray(enabled)
      ? defaultChatModels.filter((m) => enabled.includes(m.id))
      : defaultChatModels;
    return NextResponse.json({ models: list }, { status: 200 });
  } catch {
    return NextResponse.json({ models: defaultChatModels }, { status: 200 });
  }
}
