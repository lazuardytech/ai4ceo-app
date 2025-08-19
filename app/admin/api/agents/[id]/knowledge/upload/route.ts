import { auth } from '@/lib/auth';
import { addAgentKnowledge } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { headers } from 'next/headers';

async function fileToText(file: File): Promise<string> {
  const type = (file as any).type || '';
  const name = (file as any).name || '';
  if (type.includes('text') || name.endsWith('.txt')) {
    return await file.text();
  }
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    try {
      // Try dynamic import if pdf-parse is available in runtime
      // @ts-ignore
      const pdfParse = (await import('pdf-parse')).default as any;
      const buf = Buffer.from(await file.arrayBuffer());
      const data = await pdfParse(buf);
      return String(data.text || '');
    } catch (_e) {
      throw new Error('PDF parsing not available. Install pdf-parse to enable.');
    }
  }
  throw new Error('Unsupported file type. Allowed: .txt, .pdf');
}

function chunkText(input: string, chunkSize = 1200, overlap = 150): string[] {
  const text = input.replace(/\r\n/g, '\n');
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(text.length, i + chunkSize);
    chunks.push(text.slice(i, end));
    if (end === text.length) break;
    i = end - overlap;
  }
  return chunks.filter((c) => c.trim().length > 0);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await auth.api.getSession({
    headers: await headers()
  })
  if (!session?.user || session.user.role !== 'superadmin') {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return new ChatSDKError('bad_request:api', 'Expected multipart/form-data').toResponse();
  }

  const form = await request.formData();
  const file = form.get('file') as File | null;
  const tags = (form.get('tags') as string) || '';
  if (!file) {
    return new ChatSDKError('bad_request:api', 'Missing file').toResponse();
  }
  try {
    const text = await fileToText(file);
    const chunks = chunkText(text);
    const baseTitle = (file as any).name || 'Document';
    for (let idx = 0; idx < chunks.length; idx++) {
      const title = `${baseTitle} (part ${idx + 1}/${chunks.length})`;
      await addAgentKnowledge({ agentId: params.id, title, content: chunks[idx], tags });
    }
    const referer = request.headers.get('referer') || `/admin/experts/${params.id}`;
    return new Response(null, {
      status: 303,
      headers: { Location: `${referer}${referer.includes('?') ? '&' : '?'}ok=1&msg=${encodeURIComponent('Document ingested')}` },
    });
  } catch (e: any) {
    return new ChatSDKError('bad_request:api', e?.message || 'Failed to process file').toResponse();
  }
}

