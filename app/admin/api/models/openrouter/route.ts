import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'admin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { models: [], warning: 'OPENROUTER_API_KEY is not set' },
      { status: 200 },
    );
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // Edge runtimes may require next options
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json(
        { models: [], error: text || `Failed: ${res.status}` },
        { status: 200 },
      );
    }

    const data = await res.json();
    const models = Array.isArray(data.data)
      ? data.data.map((m: any) => ({
        id: m.id as string,
        name: (m.name as string) || (m.id as string),
        description:
          (m.description as string) || m.pricing?.prompt || '' || '',
        context_length: m.context_length,
        pricing: m.pricing,
        top_provider: m.top_provider,
      }))
      : [];

    return Response.json({ models }, { status: 200 });
  } catch (error) {
    return Response.json(
      { models: [], error: 'Failed to query OpenRouter models' },
      { status: 200 },
    );
  }
}
