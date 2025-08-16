import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from 'ai';
import { auth, type UserType } from '@/app/(auth)/auth';
import { type RequestHints, buildSystemPrompt } from '@/lib/ai/prompts';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  getActiveSubscriptionByUserId,
  getSettings,
} from '@/lib/db/queries';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { resolveModelCandidatesForId } from '@/lib/ai/providers';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { postRequestBodySchema, type PostRequestBody } from './schema';
import { geolocation } from '@vercel/functions';
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from 'resumable-stream';
import { after } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import type { ChatModel } from '@/lib/ai/models';
import type { VisibilityType } from '@/components/visibility-selector';
import { buildExpertSystemPrompt } from '@/lib/ai/experts';
import { getAgentById, retrieveAgentContext, getAgentIdsByChatId, setChatAgents } from '@/lib/db/queries';

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes('REDIS_URL')) {
        console.log(
          ' > Resumable streams are disabled due to missing REDIS_URL',
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel['id'];
      selectedVisibilityType: VisibilityType;
      selectedAgentIds?: string[];
    } = requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError('rate_limit:chat').toResponse();
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message,
      });

      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
      // Persist any selected experts provided by the client on first message
      if (requestBody.selectedAgentIds && requestBody.selectedAgentIds.length > 0) {
        try {
          await setChatAgents({ chatId: id, agentIds: requestBody.selectedAgentIds });
        } catch {}
      }
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const settings = await getSettings();
    const reasoningRequiresSubscription =
      settings?.reasoningRequiresSubscription ?? true;
    if (
      selectedChatModel === 'chat-model-reasoning' &&
      reasoningRequiresSubscription
    ) {
      const active = await getActiveSubscriptionByUserId({
        userId: session.user.id,
      });
      if (!active) return new ChatSDKError('forbidden:auth').toResponse();
    }

    const messagesFromDb = await getMessagesByChatId({ id });
    const uiMessages = [...convertToUIMessages(messagesFromDb), message];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: message.id,
          role: 'user',
          parts: message.parts,
          attachments: [],
          createdAt: new Date(),
        },
      ],
    });

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // Resolve expert selection once upfront (avoid await inside writer)
    let agentIdsLocal = requestBody.selectedAgentIds ?? [];
    if (agentIdsLocal.length === 0) {
      try {
        agentIdsLocal = await getAgentIdsByChatId({ chatId: id });
      } catch {}
    }

    // Preload selected agents and prior assistant snippets for continuity
    let selectedAgents: Array<{ id: string; name: string; slug: string }> = [];
    if (agentIdsLocal && agentIdsLocal.length > 0) {
      const list: Array<{ id: string; name: string; slug: string }> = [];
      for (const aid of agentIdsLocal) {
        const a = await getAgentById({ id: aid });
        if (a) list.push({ id: a.id, name: a.name, slug: a.slug });
      }
      selectedAgents = list;
    }

    function extractText(parts: any[]): string {
      try {
        return parts
          .filter((p: any) => p?.type === 'text' && typeof p.text === 'string')
          .map((p: any) => p.text)
          .join('\n');
      } catch {
        return '';
      }
    }

    const priorByAgent: Record<string, string[]> = {};
    if (selectedAgents.length > 0) {
      for (const a of selectedAgents) {
        priorByAgent[a.id] = [];
      }
      // Walk previous messages and gather last 3 assistant replies per agent
      for (let i = messagesFromDb.length - 1; i >= 0; i--) {
        const m: any = messagesFromDb[i];
        if (m.role === 'assistant' && Array.isArray(m.attachments)) {
          const meta = (m.attachments as any[]).find(
            (att) => att && att.type === 'agentMetadata' && att.agentId,
          );
          if (meta && priorByAgent[meta.agentId]) {
            priorByAgent[meta.agentId].push(extractText(m.parts || []));
            // Limit to last 3
            if (priorByAgent[meta.agentId].length >= 3) {
              // continue scanning others
            }
          }
        }
      }
    }

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Helper to emit a friendly assistant error message into the stream
        const writeError = (title: string, detail: string) => {
          try {
            dataStream.write({
              type: 'data-appendMessage',
              data: JSON.stringify({
                id: generateUUID(),
                role: 'assistant',
                parts: [{ type: 'text', text: `${title}\n\n${detail}` }],
                attachments: [],
                createdAt: new Date(),
                chatId: id,
              }),
              transient: true,
            });
          } catch {}
        };

        // If experts are selected, run each expert sequentially, otherwise general response
        if (agentIdsLocal && agentIdsLocal.length > 0) {
          (async () => {
            for (const agentId of agentIdsLocal) {
              const agent = await getAgentById({ id: agentId });
              if (!agent) continue;
              let userText = '';
              try {
                userText = message.parts
                  .filter((p: any) => p.type === 'text')
                  .map((p: any) => p.text)
                  .join('\n');
              } catch {}

              const kb = await retrieveAgentContext({ agentId, query: userText, limit: 5 });
              const expertSystem = buildExpertSystemPrompt({
                agent,
                baseSystem: buildSystemPrompt({
                  selectedChatModel,
                  requestHints,
                  regularOverride: settings?.regularPromptOverride,
                  artifactsOverride: settings?.artifactsPromptOverride,
                }),
                context: kb,
                previousAssistant: priorByAgent[agentId] ?? [],
              });

              const candidates = resolveModelCandidatesForId(
                selectedChatModel,
                (settings?.modelOverridesOpenRouter as any) ?? (settings?.modelOverrides as any) ?? null,
                requestBody.selectedProviderPreference ?? 'balance',
                (settings?.modelOverridesGroq as any) ?? null,
              );
              let streamed = false;
              for (let i = 0; i < candidates.length; i++) {
                const c = candidates[i];
                try {
                  const result = streamText({
                    model: c.model,
                    system: expertSystem,
                    messages: convertToModelMessages([message]),
                    stopWhen: stepCountIs(5),
                    experimental_activeTools:
                      selectedChatModel === 'chat-model-reasoning'
                        ? []
                        : ['getWeather', 'createDocument', 'updateDocument', 'requestSuggestions'],
                    experimental_transform: smoothStream({ chunking: 'word' }),
                    tools: {
                      getWeather,
                      createDocument: createDocument({ session, dataStream }),
                      updateDocument: updateDocument({ session, dataStream }),
                      requestSuggestions: requestSuggestions({ session, dataStream }),
                    },
                    experimental_telemetry: {
                      isEnabled: isProductionEnvironment,
                      functionId: `stream-text-${agent.slug}-${c.provider}`,
                    },
                  });
                  result.consumeStream();
                  dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));
                  streamed = true;
                  break;
                } catch (err: any) {
                  if (i === candidates.length - 1) {
                    writeError(
                      `[${agent.name}] Provider error`,
                      `All providers failed for this expert. Please try again.\n\nDetails: ${String(
                        err?.message || err,
                      )}`,
                    );
                  }
                }
              }
            }
          })();
          return;
        }
        const baseSystem = buildSystemPrompt({
          selectedChatModel,
          requestHints,
          regularOverride: settings?.regularPromptOverride,
          artifactsOverride: settings?.artifactsPromptOverride,
        });
        const candidates = resolveModelCandidatesForId(
          selectedChatModel,
          (settings?.modelOverridesOpenRouter as any) ?? (settings?.modelOverrides as any) ?? (settings?.defaultProviderPreference ? null : null),
          requestBody.selectedProviderPreference ?? (settings?.defaultProviderPreference as any) ?? 'balance',
          (settings?.modelOverridesGroq as any) ?? null,
        );
        (async () => {
          let streamed = false;
          for (let i = 0; i < candidates.length; i++) {
            const c = candidates[i];
            try {
              const result = streamText({
                model: c.model,
                system: baseSystem,
                messages: convertToModelMessages(uiMessages),
                stopWhen: stepCountIs(5),
                experimental_activeTools:
                  selectedChatModel === 'chat-model-reasoning'
                    ? []
                    : ['getWeather', 'createDocument', 'updateDocument', 'requestSuggestions'],
                experimental_transform: smoothStream({ chunking: 'word' }),
                tools: {
                  getWeather,
                  createDocument: createDocument({ session, dataStream }),
                  updateDocument: updateDocument({ session, dataStream }),
                  requestSuggestions: requestSuggestions({ session, dataStream }),
                },
                experimental_telemetry: {
                  isEnabled: isProductionEnvironment,
                  functionId: `stream-text-${c.provider}`,
                },
              });
              result.consumeStream();
              dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));
              streamed = true;
              break;
            } catch (err: any) {
              if (i === candidates.length - 1) {
                writeError(
                  'Provider error',
                  `All providers failed. Please try again.\n\nDetails: ${String(
                    err?.message || err,
                  )}`,
                );
              }
            }
          }
        })();
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        // Add agent metadata to assistant messages where possible, and persist attachments
        const toSave = messages.map((m) => {
          let attachments: any[] = Array.isArray((m as any).attachments)
            ? ((m as any).attachments as any[])
            : [];
          if (m.role === 'assistant' && selectedAgents.length > 0) {
            const text = extractText((m as any).parts || []);
            const match = selectedAgents.find((a) => text.startsWith(`[${a.name}]`));
            if (match) {
              attachments = [
                ...attachments,
                {
                  type: 'agentMetadata',
                  agentId: match.id,
                  agentName: match.name,
                  agentSlug: match.slug,
                },
              ];
            }
          }
          return {
            id: m.id,
            role: m.role,
            parts: m.parts,
            createdAt: new Date(),
            attachments,
            chatId: id,
          } as any;
        });
        await saveMessages({ messages: toSave });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () =>
          stream.pipeThrough(new JsonToSseTransformStream()),
        ),
      );
    } else {
      return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    console.error('POST /api/chat error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
