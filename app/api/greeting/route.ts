import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { getDefaultChatModelId } from '@/lib/ai/models.server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const defaultModelId = await getDefaultChatModelId();
    const model = myProvider.languageModel(defaultModelId);
    const { text } = await generateText({
      model,
      system: [
        'You are a concise copywriter for an executive AI assistant.',
        'Write a short, punchy greeting subtitle for CEOs and business operators.',
        'Keep it under 100 characters, active voice, no emojis, no quotes.',
        'Vary the wording each time; focus on strategy, execution, leverage, clarity, outcomes.',
      ].join(' '),
      prompt: 'Generate a single-line subtitle now.',
    });
    const oneLine = (text || '').split('\n').map((s) => s.trim()).filter(Boolean)[0] || 'What\'s up?';
    return NextResponse.json({ subtitle: oneLine }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ subtitle: 'What\'s up?' }, { status: 200 });
  }
}
