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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Provide a minimal static list as fallback
    return Response.json(
      {
        models: [
          { id: 'llama3-8b-8192', name: 'Groq Llama3 8B' },
          { id: 'llama3-70b-8192', name: 'Groq Llama3 70B' },
        ],
        warning: 'GROQ_API_KEY is not set; using defaults',
      },
      { status: 200 },
    );
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      return Response.json(
        {
          models: [
            { id: 'llama3-8b-8192', name: 'Groq Llama3 8B' },
            { id: 'llama3-70b-8192', name: 'Groq Llama3 70B' },
          ],
          error: `Failed: ${res.status}`,
        },
        { status: 200 },
      );
    }
    const data = await res.json();
    const models = Array.isArray(data.data)
      ? data.data.map((m: any) => ({ id: String(m.id), name: String(m.id) }))
      : [];
    return Response.json({ models }, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        models: [
          { id: 'llama3-8b-8192', name: 'Groq Llama3 8B' },
          { id: 'llama3-70b-8192', name: 'Groq Llama3 70B' },
        ],
        error: 'Failed to query Groq models',
      },
      { status: 200 },
    );
  }
}
