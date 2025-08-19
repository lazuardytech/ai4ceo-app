import { auth } from '@/lib/auth';
import { ChatSDKError } from '@/lib/errors';
import { getSettings, setSetting } from '@/lib/db/queries';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const settings = await getSettings();
  return Response.json(settings);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }
  const form = await request.formData();
  const key = String(form.get('key') || '');
  const raw = String(form.get('value') || '');
  if (!key) return new ChatSDKError('bad_request:api').toResponse();
  let value: any = raw;
  try {
    value = JSON.parse(raw);
  } catch {
    // keep as string if not JSON
  }
  await setSetting({ key, value });
  return new Response(null, { status: 204 });
}
