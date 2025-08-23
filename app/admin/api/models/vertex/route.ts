import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== 'admin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION;
  const apiKey = process.env.GOOGLE_VERTEX_API_KEY;

  if (!project || !location) {
    return Response.json(
      {
        models: [
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        ],
        warning: 'GOOGLE_VERTEX_PROJECT or LOCATION not set; using defaults',
      },
      { status: 200 },
    );
  }

  try {
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models`;
    const res = await fetch(url, {
      headers: {
        ...(apiKey ? { 'x-goog-api-key': apiKey } : {}),
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      return Response.json(
        {
          models: [
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          ],
          error: `Failed: ${res.status}`,
        },
        { status: 200 },
      );
    }
    const data = await res.json();
    const models = Array.isArray(data.models)
      ? data.models.map((m: any) => ({
          id: String(m.name?.split('/').pop() || m.id || ''),
          name: String(m.displayName || m.name || ''),
        }))
      : [];
    return Response.json({ models }, { status: 200 });
  } catch (error) {
    return Response.json(
      {
        models: [
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
        ],
        error: 'Failed to query Vertex models',
      },
      { status: 200 },
    );
  }
}

