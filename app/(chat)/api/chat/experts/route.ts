import { auth } from '@/app/(auth)/auth';
import { getAgentIdsByChatId, getChatById, setChatAgents } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return new ChatSDKError('unauthorized:chat').toResponse();
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');
  if (!chatId) return new ChatSDKError('bad_request:api').toResponse();
  const chat = await getChatById({ id: chatId });
  if (!chat) {
    // If chat doesn't exist yet, return empty selection gracefully.
    return Response.json({ agentIds: [] }, { status: 200 });
  }
  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }
  const ids = await getAgentIdsByChatId({ chatId });
  return Response.json({ agentIds: ids }, { status: 200 });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) return new ChatSDKError('unauthorized:chat').toResponse();
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');
  if (!chatId) return new ChatSDKError('bad_request:api').toResponse();
  const chat = await getChatById({ id: chatId });
  if (!chat) {
    // Chat not created yet (first message not sent). Accept selection but don't persist.
    return Response.json({ ok: true, persisted: false }, { status: 200 });
  }
  if (chat.userId !== session.user.id) return new ChatSDKError('forbidden:chat').toResponse();
  let body: any = {};
  try {
    body = await request.json();
  } catch {}
  const agentIds: string[] = Array.isArray(body?.agentIds) ? body.agentIds : [];
  await setChatAgents({ chatId, agentIds });
  return Response.json({ ok: true, persisted: true }, { status: 200 });
}
