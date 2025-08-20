import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { getDefaultChatModelId } from '@/lib/ai/models.server';

export const runtime = 'nodejs';

function fallback() {
  return [
    { title: 'Draft a plan to', label: 'enter a new market', action: 'Draft a 90-day GTM plan to enter a new market. Include KPIs and risks.' },
    { title: 'Analyze our', label: 'unit economics', action: 'Analyze our unit economics and identify levers to improve gross margin.' },
    { title: 'Outline a board', label: 'update structure', action: 'Outline a concise board update for this month with key metrics and risks.' },
    { title: 'Design an org', label: 'structure for scale', action: 'Propose an org structure to scale from 10 to 30 people with roles and responsibilities.' },
  ];
}

export async function GET() {
  try {
    const modelId = await getDefaultChatModelId();
    const model = myProvider.languageModel(modelId);
    const { text } = await generateText({
      model,
      system: [
        'You are a concise executive assistant for CEOs.',
        'Return 4 actionable suggestions tailored to business operators.',
        'Each on its own line in the exact format: title | label | action',
        'title is a short stem; label completes it; action is the full prompt to send.',
        'No numbering, no extra commentary, under 100 chars per line.',
      ].join(' '),
      prompt: 'Generate now.'
    });
    const lines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 4);
    const parsed = lines
      .map((l) => l.split('|').map((s) => s.trim()))
      .filter((arr) => arr.length >= 3)
      .map(([title, label, action]) => ({ title, label, action }));
    const items = parsed.length >= 3 ? parsed : fallback();
    return NextResponse.json({ items }, { status: 200 });
  } catch {
    return NextResponse.json({ items: fallback() }, { status: 200 });
  }
}

