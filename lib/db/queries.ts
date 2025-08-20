import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  ilike,
  or,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  setting,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  subscription,
  type Subscription,
  voucher,
  voucherUsage,
  agent,
  agentKnowledge,
  chatAgent,
  referral,
  referralTransaction,
  referralUsage,
  referralConfig,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';
import { computeHashedEmbedding, cosine } from '@/lib/ai/vector';
import { pineconeConfigured, pineconeDelete, pineconeQuery, pineconeUpsert } from '@/lib/ai/pinecone';
import { auth } from '../auth';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    // return await db
    //   .insert(user)
    //   .values({ email, password: hashedPassword, role: 'user' });
    await auth.api.signUpEmail({
      body: {
        name: email.split('@')[0] || 'User',
        email: email,
        password: password,
        role: 'user',
      }
    })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id),
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function getAgentIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const rows = await db
      .select()
      .from(chatAgent)
      .where(eq(chatAgent.chatId, chatId));
    return rows.map((r) => r.agentId);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat agents');
  }
}

export async function setChatAgents({
  chatId,
  agentIds,
}: { chatId: string; agentIds: string[] }) {
  try {
    await db.delete(chatAgent).where(eq(chatAgent.chatId, chatId));
    if (agentIds.length > 0) {
      await db
        .insert(chatAgent)
        .values(agentIds.map((id) => ({ chatId, agentId: id })));
    }
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to set chat agents');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: { id: string; differenceInHours: number }) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function getMonthlyMessageCountByUserId({
  id,
  month,
  year,
}: {
  id: string;
  month?: number; // 0-11, defaults to current month
  year?: number; // full year (e.g., 2025), defaults to current year
}) {
  try {
    const now = new Date();
    const m = typeof month === 'number' ? month : now.getMonth();
    const y = typeof year === 'number' ? year : now.getFullYear();

    const periodStart = new Date(y, m, 1);
    const nextMonthStart =
      m === 11 ? new Date(y + 1, 0, 1) : new Date(y, m + 1, 1);

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, periodStart),
          lt(message.createdAt, nextMonthStart),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get monthly message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}

// Admin: Users
export async function listUsers({ limit = 50 }: { limit?: number }) {
  try {
    return await db.select().from(user).orderBy(desc(user.id)).limit(limit);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to list users');
  }
}

export async function updateUserRole({
  userId,
  role,
}: {
  userId: string;
  role: 'user' | 'admin';
}) {
  try {
    const [u] = await db
      .update(user)
      .set({ role })
      .where(eq(user.id, userId))
      .returning();
    return u;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update user role',
    );
  }
}

// Admin: Subscriptions
export async function listSubscriptions({ limit = 100 }: { limit?: number }) {
  try {
    return await db
      .select()
      .from(subscription)
      .orderBy(desc(subscription.updatedAt))
      .limit(limit);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to list subscriptions',
    );
  }
}

export async function listUsersPaged({
  q,
  limit = 20,
  offset = 0,
}: {
  q?: string | null;
  limit?: number;
  offset?: number;
}) {
  try {
    const where = q?.trim() ? ilike(user.email, `%${q.trim()}%`) : undefined;

    const [{ count: total }] = await db
      .select({ count: count(user.id) })
      .from(user)
      .where(where as any);

    const items = await db
      .select()
      .from(user)
      .where(where as any)
      .orderBy(desc(user.id))
      .limit(limit)
      .offset(offset);

    return { items, total };
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to list users');
  }
}

export async function listSubscriptionsPaged({
  q,
  limit = 20,
  offset = 0,
}: {
  q?: string | null;
  limit?: number;
  offset?: number;
}) {
  try {
    // join with users to include email and allow search
    const base = db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        updatedAt: subscription.updatedAt,
        userEmail: user.email,
      })
      .from(subscription)
      .innerJoin(user, eq(subscription.userId, user.id));

    const where = q?.trim()
      ? or(
        ilike(user.email, `%${q.trim()}%`),
        ilike(subscription.planId, `%${q.trim()}%`),
      )
      : undefined;

    const [{ count: total }] = await db
      .select({ count: count(subscription.id) })
      .from(subscription)
      .innerJoin(user, eq(subscription.userId, user.id))
      .where(where as any);

    const items = await base
      .where(where as any)
      .orderBy(desc(subscription.updatedAt))
      .limit(limit)
      .offset(offset);

    return { items, total };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to list subscriptions',
    );
  }
}

// TODO: Add token usage tracking when tokenUsage table is implemented
export async function addTokenUsage({
  userId,
  chatId,
  inputTokens,
  outputTokens,
}: {
  userId: string;
  chatId: string;
  inputTokens: number;
  outputTokens: number;
}) {
  // Placeholder - tokenUsage table not yet implemented
  return;
}

export async function getTokenUsageByUserSince({
  userId,
  since,
}: {
  userId: string;
  since: Date;
}) {
  // Placeholder - tokenUsage table not yet implemented
  return 0;
}

// Settings
export async function getSettings() {
  try {
    const rows = await db.select().from(setting);
    const map: Record<string, any> = {};
    for (const r of rows) map[(r as any).key] = (r as any).value;
    return map;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get settings');
  }
}

export async function setSetting({ key, value }: { key: string; value: any }) {
  try {
    const now = new Date();
    // drizzle-orm/postgres-js lacks upsert helper; emulate with raw SQL if needed
    // Using on conflict do update via drizzle API
    // @ts-ignore drizzle upsert API signature
    await db
      .insert(setting)
      .values({ key, value, updatedAt: now })
      .onConflictDoUpdate({
        target: setting.key,
        set: { value, updatedAt: now },
      });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to set setting');
  }
}

// Agents (Experts)
export async function listAgents({
  q,
  isActive,
  limit = 100,
  offset = 0,
}: {
  q?: string | null;
  isActive?: boolean | null;
  limit?: number;
  offset?: number;
}) {
  try {
    const conditions: any[] = [];
    if (q?.trim()) {
      conditions.push(
        or(
          ilike(agent.name, `%${q.trim()}%`),
          ilike(agent.slug, `%${q.trim()}%`),
          ilike(agent.description, `%${q.trim()}%`),
        ),
      );
    }
    if (typeof isActive === 'boolean')
      conditions.push(eq(agent.isActive, isActive));
    const whereCond = conditions.length
      ? (and(...conditions) as any)
      : undefined;
    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(agent)
        .where(whereCond)
        .orderBy(desc(agent.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(agent).where(whereCond),
    ]);
    return { items, total };
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to list agents');
  }
}

export async function getAgentById({ id }: { id: string }) {
  try {
    const [row] = await db
      .select()
      .from(agent)
      .where(eq(agent.id, id))
      .limit(1);
    return row;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get agent');
  }
}

export async function createAgent({
  slug,
  name,
  description,
  icon,
  prePrompt,
  personality,
  isActive = true,
  ragEnabled = true,
}: {
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  prePrompt: string;
  personality: string;
  isActive?: boolean;
  ragEnabled?: boolean;
}) {
  try {
    const now = new Date();
    const [row] = await db
      .insert(agent)
      .values({
        slug,
        name,
        description: description ?? null,
        icon: icon ?? null,
        prePrompt,
        personality,
        isActive,
        ragEnabled,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return row;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create agent');
  }
}

export async function updateAgent({
  id,
  name,
  description,
  icon,
  prePrompt,
  personality,
  isActive,
  ragEnabled,
}: {
  id: string;
  name?: string;
  description?: string | null;
  icon?: string | null;
  prePrompt?: string;
  personality?: string;
  isActive?: boolean;
  ragEnabled?: boolean;
}) {
  try {
    const [row] = await db
      .update(agent)
      .set({
        name: name as any,
        description: (description as any) ?? undefined,
        icon: (icon as any) ?? undefined,
        prePrompt: prePrompt as any,
        personality: personality as any,
        isActive: isActive as any,
        ragEnabled: ragEnabled as any,
        updatedAt: new Date(),
      })
      .where(eq(agent.id, id))
      .returning();
    return row;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update agent');
  }
}

export async function deleteAgent({ id }: { id: string }) {
  try {
    await db.delete(agentKnowledge).where(eq(agentKnowledge.agentId, id));
    const [row] = await db.delete(agent).where(eq(agent.id, id)).returning();
    return row;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete agent');
  }
}

export async function listAgentKnowledge({
  agentId,
  q,
  limit = 100,
  offset = 0,
}: {
  agentId: string;
  q?: string | null;
  limit?: number;
  offset?: number;
}) {
  try {
    const conditions: any[] = [eq(agentKnowledge.agentId, agentId)];
    if (q?.trim()) {
      conditions.push(
        or(
          ilike(agentKnowledge.title, `%${q.trim()}%`),
          ilike(agentKnowledge.content, `%${q.trim()}%`),
          ilike(agentKnowledge.tags, `%${q.trim()}%`),
        ),
      );
    }
    const whereCond = and(...conditions) as any;
    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(agentKnowledge)
        .where(whereCond)
        .orderBy(desc(agentKnowledge.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(agentKnowledge).where(whereCond),
    ]);
    return { items, total };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to list agent knowledge',
    );
  }
}

export async function addAgentKnowledge({
  agentId,
  title,
  content,
  tags,
}: {
  agentId: string;
  title: string;
  content: string;
  tags?: string | null;
}) {
  try {
    const vector = computeHashedEmbedding(`${title}\n${content}`);
    const [row] = await db
      .insert(agentKnowledge)
      .values({ agentId, title, content, tags: tags ?? null, vector })
      .returning();
    // Upsert to Pinecone if configured
    try {
      if (pineconeConfigured()) {
        await pineconeUpsert({
          namespace: agentId,
          vectors: [
            {
              id: row.id,
              values: vector,
              metadata: { title, content, tags: tags ?? null },
            },
          ],
        });
      }
    } catch (e) {
      console.warn('Pinecone upsert failed:', e);
    }
    return row;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to add knowledge');
  }
}

export async function deleteAgentKnowledge({ id }: { id: string }) {
  try {
    const [row] = await db
      .delete(agentKnowledge)
      .where(eq(agentKnowledge.id, id))
      .returning();
    if (row) {
      try {
        if (pineconeConfigured()) {
          await pineconeDelete({ namespace: row.agentId as any, ids: [row.id as any] });
        }
      } catch (e) {
        console.warn('Pinecone delete failed:', e);
      }
    }
    return row;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete knowledge',
    );
  }
}

export async function getActiveAgents() {
  try {
    return await db
      .select()
      .from(agent)
      .where(eq(agent.isActive, true))
      .orderBy(asc(agent.slug));
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get agents');
  }
}

export async function seedDefaultAgentsIfEmpty() {
  const existing = await getActiveAgents();
  if (existing && existing.length > 0) return existing;
  const defaults = [
    {
      slug: 'tech',
      name: 'Tech Expert',
      description:
        'Software, architecture, scalability, devops, product engineering.',
      prePrompt:
        'You are a pragmatic senior technology advisor. Provide clear, actionable guidance with pros/cons and trade-offs. Use concise bullet points and small code snippets when helpful.',
      personality:
        'Direct, calm, and practical. Values clarity, safety, and maintainability.',
    },
    {
      slug: 'law',
      name: 'Law Expert',
      description:
        'Contracts, compliance, privacy, IP, risk flags (not legal advice).',
      prePrompt:
        'You are a legal domain expert. Identify risks, compliance requirements, and contractual considerations. Always include a disclaimer that this is not legal advice.',
      personality:
        'Cautious, methodical, structured. Highlights risk and mitigation.',
    },
    {
      slug: 'tax',
      name: 'Tax Expert',
      description:
        'Tax implications, jurisdictions, reporting, optimization (not tax advice).',
      prePrompt:
        'You are a tax specialist. Outline tax treatments, thresholds, and reporting obligations across typical jurisdictions. Offer scenarios and assumptions. Add a not tax advice disclaimer.',
      personality:
        'Precise, conservative, assumption-driven. Emphasizes compliance.',
    },
    {
      slug: 'hr',
      name: 'Human Resource Expert',
      description: 'Hiring, org design, performance, compensation, policies.',
      prePrompt:
        'You are an HR strategist. Provide practical frameworks, policy considerations, and communication tips. Tailor advice to company size and stage.',
      personality:
        'Empathetic, structured, outcome-oriented. Balances people and process.',
    },
    {
      slug: 'design',
      name: 'Designer Expert',
      description: 'UX/UI, visual design, IA, usability, accessibility.',
      prePrompt:
        'You are a product design expert. Offer user-centered recommendations, quick wireframe ideas, and usability heuristics. Reference accessibility when relevant.',
      personality:
        'Curious, user-first, iterative. Prefers simplicity and clarity.',
    },
  ];
  for (const d of defaults) {
    await createAgent({
      slug: d.slug,
      name: d.name,
      description: d.description,
      prePrompt: d.prePrompt,
      personality: d.personality,
      isActive: true,
      ragEnabled: true,
    });
  }
  return getActiveAgents();
}

export async function retrieveAgentContext({
  agentId,
  query,
  limit = 5,
}: {
  agentId: string;
  query: string;
  limit?: number;
}) {
  try {
    const queryVec = computeHashedEmbedding(query || '');
    if (pineconeConfigured()) {
      try {
        const res = await pineconeQuery({ namespace: agentId, vector: queryVec, topK: limit });
        const items = (res.matches || []).map((m) => ({
          id: m.id,
          agentId,
          title: m.metadata?.title || 'Context',
          content: m.metadata?.content || '',
          tags: m.metadata?.tags || null,
        })) as any[];
        return items;
      } catch (e) {
        console.warn('Pinecone query failed, falling back to local:', e);
      }
    }
    // Fallback to local vector search
    const rows = await db
      .select()
      .from(agentKnowledge)
      .where(eq(agentKnowledge.agentId, agentId))
      .orderBy(desc(agentKnowledge.createdAt))
      .limit(500);
    const ranked = rows
      .map((r: any) => ({
        row: r,
        score: Array.isArray(r.vector)
          ? cosine(queryVec, r.vector as number[])
          : 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.row);
    return ranked as any;
  } catch (error) {
    // soft-fail: no context
    return [];
  }
}

// Subscriptions
export async function createSubscription({
  userId,
  planId,
  externalId,
  providerInvoiceId,
}: {
  userId: string;
  planId: string;
  externalId?: string | null;
  providerInvoiceId?: string | null;
}) {
  try {
    const now = new Date();
    const [record] = await db
      .insert(subscription)
      .values({
        userId,
        planId,
        status: 'pending',
        externalId: externalId ?? null,
        providerInvoiceId: providerInvoiceId ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return record;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create subscription',
    );
  }
}

export async function getActiveSubscriptionByUserId({
  userId,
}: {
  userId: string;
}) {
  try {
    const [sub] = await db
      .select()
      .from(subscription)
      .where(
        and(eq(subscription.userId, userId), eq(subscription.status, 'active')),
      )
      .orderBy(desc(subscription.updatedAt))
      .limit(1);
    return sub;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get active subscription',
    );
  }
}

export async function getSubscriptionByExternalId({
  externalId,
}: {
  externalId: string;
}) {
  try {
    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.externalId, externalId))
      .limit(1);
    return sub;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get subscription',
    );
  }
}

export async function getLatestSubscriptionByUserId({
  userId,
}: {
  userId: string;
}) {
  try {
    const [sub] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .orderBy(desc(subscription.createdAt))
      .limit(1);
    return sub;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get latest subscription',
    );
  }
}

export async function updateSubscriptionStatus({
  id,
  status,
  currentPeriodEnd,
  providerInvoiceId,
}: {
  id: string;
  status: Subscription['status'];
  currentPeriodEnd?: Date | null;
  providerInvoiceId?: string | null;
}) {
  try {
    const [updated] = await db
      .update(subscription)
      .set({
        status,
        currentPeriodEnd: currentPeriodEnd ?? null,
        providerInvoiceId: providerInvoiceId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(subscription.id, id))
      .returning();
    return updated;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update subscription',
    );
  }
}

export async function updateSubscriptionAdmin({
  id,
  planId,
  status,
  currentPeriodEnd,
  externalId,
}: {
  id: string;
  planId?: string;
  status?: Subscription['status'];
  currentPeriodEnd?: Date | null;
  externalId?: string | null;
}) {
  try {
    const patch: any = { updatedAt: new Date() };
    if (planId !== undefined) patch.planId = planId;
    if (status !== undefined) patch.status = status;
    if (currentPeriodEnd !== undefined)
      patch.currentPeriodEnd = currentPeriodEnd;
    if (externalId !== undefined) patch.externalId = externalId;

    const [updated] = await db
      .update(subscription)
      .set(patch)
      .where(eq(subscription.id, id))
      .returning();
    return updated;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update subscription',
    );
  }
}

// Voucher management functions

export async function createVoucher({
  code,
  type,
  discountType,
  discountValue,
  planId,
  duration,
  maxUsages,
  validFrom,
  validUntil,
}: {
  code: string;
  type: 'discount' | 'free_subscription';
  discountType?: 'percentage' | 'fixed';
  discountValue?: string;
  planId?: string;
  duration?: string;
  maxUsages?: string;
  validFrom: Date;
  validUntil?: Date;
}) {
  try {
    const now = new Date();
    const [record] = await db
      .insert(voucher)
      .values({
        code: code.toUpperCase(),
        type,
        discountType: discountType ?? null,
        discountValue: discountValue ?? null,
        planId: planId ?? null,
        duration: duration ?? null,
        maxUsages: maxUsages ?? null,
        validFrom,
        validUntil: validUntil ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return record;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create voucher');
  }
}

export async function getVoucherByCode({
  code,
}: {
  code: string;
}) {
  try {
    const [voucherRecord] = await db
      .select()
      .from(voucher)
      .where(eq(voucher.code, code.toUpperCase()))
      .limit(1);
    return voucherRecord;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get voucher');
  }
}

export async function validateVoucher({
  code,
  userId,
}: {
  code: string;
  userId: string;
}) {
  try {
    const voucherRecord = await getVoucherByCode({ code });

    if (!voucherRecord) {
      return { valid: false, reason: 'Voucher not found' };
    }

    if (!voucherRecord.isActive) {
      return { valid: false, reason: 'Voucher is inactive' };
    }

    const now = new Date();
    if (now < voucherRecord.validFrom) {
      return { valid: false, reason: 'Voucher is not yet valid' };
    }

    if (voucherRecord.validUntil && now > voucherRecord.validUntil) {
      return { valid: false, reason: 'Voucher has expired' };
    }

    if (voucherRecord.maxUsages) {
      const maxUsages = Number.parseInt(voucherRecord.maxUsages);
      const currentUsages = Number.parseInt(voucherRecord.currentUsages);
      if (currentUsages >= maxUsages) {
        return { valid: false, reason: 'Voucher usage limit reached' };
      }
    }

    // Check if user has already used this voucher
    const [existingUsage] = await db
      .select()
      .from(voucherUsage)
      .where(
        and(
          eq(voucherUsage.voucherId, voucherRecord.id),
          eq(voucherUsage.userId, userId),
        ),
      )
      .limit(1);

    if (existingUsage) {
      return { valid: false, reason: 'Voucher already used by this user' };
    }

    return { valid: true, voucher: voucherRecord };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to validate voucher',
    );
  }
}

export async function applyVoucher({
  voucherId,
  userId,
  subscriptionId,
}: {
  voucherId: string;
  userId: string;
  subscriptionId?: string;
}) {
  try {
    const now = new Date();

    // Record voucher usage
    const [usage] = await db
      .insert(voucherUsage)
      .values({
        voucherId,
        userId,
        subscriptionId: subscriptionId ?? null,
        usedAt: now,
        createdAt: now,
      })
      .returning();

    // Update voucher usage count
    await db
      .update(voucher)
      .set({
        currentUsages: (
          Number.parseInt(
            (await getVoucherById({ id: voucherId }))?.currentUsages || '0',
          ) + 1
        ).toString(),
        updatedAt: now,
      })
      .where(eq(voucher.id, voucherId));

    return usage;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to apply voucher');
  }
}

export async function getVoucherById({
  id,
}: {
  id: string;
}) {
  try {
    const [voucherRecord] = await db
      .select()
      .from(voucher)
      .where(eq(voucher.id, id))
      .limit(1);
    return voucherRecord;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get voucher');
  }
}

export async function listVouchersPaged({
  q,
  limit = 20,
  offset = 0,
  type,
  isActive,
}: {
  q?: string | null;
  limit?: number;
  offset?: number;
  type?: 'discount' | 'free_subscription' | null;
  isActive?: boolean | null;
}) {
  try {
    const conditions: any[] = [];
    if (q?.trim()) {
      conditions.push(
        or(
          ilike(voucher.code, `%${q.trim()}%`),
          ilike(voucher.type, `%${q.trim()}%`),
          ilike(voucher.planId, `%${q.trim()}%`),
        ),
      );
    }
    if (type) {
      conditions.push(eq(voucher.type, type));
    }
    if (typeof isActive === 'boolean') {
      conditions.push(eq(voucher.isActive, isActive));
    }

    const whereCond = conditions.length
      ? (and(...conditions) as any)
      : undefined;

    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(voucher)
        .where(whereCond)
        .orderBy(desc(voucher.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(voucher).where(whereCond),
    ]);

    return { items, total };
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to list vouchers');
  }
}

export async function updateVoucher({
  id,
  isActive,
  validUntil,
  maxUsages,
}: {
  id: string;
  isActive?: boolean;
  validUntil?: Date | null;
  maxUsages?: string;
}) {
  try {
    const [updated] = await db
      .update(voucher)
      .set({
        ...(isActive !== undefined && { isActive }),
        ...(validUntil !== undefined && { validUntil }),
        ...(maxUsages !== undefined && { maxUsages }),
        updatedAt: new Date(),
      })
      .where(eq(voucher.id, id))
      .returning();
    return updated;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update voucher');
  }
}

export async function deleteVoucher({
  id,
}: {
  id: string;
}) {
  try {
    // First delete all usage records
    await db.delete(voucherUsage).where(eq(voucherUsage.voucherId, id));

    // Then delete the voucher
    const [deleted] = await db
      .delete(voucher)
      .where(eq(voucher.id, id))
      .returning();

    return deleted;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete voucher');
  }
}

export async function listUsersWithSubscriptionStatus({
  q,
  limit = 20,
  offset = 0,
}: {
  q?: string | null;
  limit?: number;
  offset?: number;
}) {
  try {
    // Left join to include all users, even those without subscriptions
    const base = db
      .select({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        subscriptionId: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        updatedAt: subscription.updatedAt,
      })
      .from(user)
      .leftJoin(
        subscription,
        and(
          eq(user.id, subscription.userId),
          eq(subscription.status, 'active'),
        ),
      );

    const where = q?.trim()
      ? or(
        ilike(user.email, `%${q.trim()}%`),
        ilike(subscription.planId, `%${q.trim()}%`),
      )
      : undefined;

    const [{ count: total }] = await db
      .select({ count: count(user.id) })
      .from(user)
      .leftJoin(
        subscription,
        and(
          eq(user.id, subscription.userId),
          eq(subscription.status, 'active'),
        ),
      )
      .where(where as any);

    const items = await base
      .where(where as any)
      .orderBy(desc(user.email))
      .limit(limit)
      .offset(offset);

    return { items, total };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to list users with subscription status',
    );
  }
}

// Referral System Queries

export async function getUserReferral({ userId }: { userId: string }) {
  try {
    const [userReferral] = await db
      .select()
      .from(referral)
      .where(eq(referral.userId, userId))
      .limit(1);
    return userReferral;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user referral',
    );
  }
}

export async function createReferral({
  userId,
  referralCode,
}: {
  userId: string;
  referralCode: string;
}) {
  try {
    const now = new Date();
    const [newReferral] = await db
      .insert(referral)
      .values({
        userId,
        referralCode,
        bonusBalance: '0',
        totalEarned: '0',
        totalReferrals: '0',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return newReferral;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create referral');
  }
}

export async function updateReferralBalance({
  userId,
  bonusBalance,
  totalEarned,
  totalReferrals,
}: {
  userId: string;
  bonusBalance?: string;
  totalEarned?: string;
  totalReferrals?: string;
}) {
  try {
    const updateData: any = { updatedAt: new Date() };
    if (bonusBalance !== undefined) updateData.bonusBalance = bonusBalance;
    if (totalEarned !== undefined) updateData.totalEarned = totalEarned;
    if (totalReferrals !== undefined)
      updateData.totalReferrals = totalReferrals;

    const [updated] = await db
      .update(referral)
      .set(updateData)
      .where(eq(referral.userId, userId))
      .returning();
    return updated;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update referral balance',
    );
  }
}

export async function getReferralTransactions({
  userId,
  page = 1,
  limit = 10,
}: {
  userId: string;
  page?: number;
  limit?: number;
}) {
  try {
    const offset = (page - 1) * limit;

    // Get user's referral record first
    const userReferral = await getUserReferral({ userId });
    if (!userReferral) {
      return {
        transactions: [],
        pagination: { page, limit, total: 0, hasMore: false },
      };
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count(referralTransaction.id) })
      .from(referralTransaction)
      .where(eq(referralTransaction.referralId, userReferral.id));

    // Get paginated transactions
    const transactions = await db
      .select()
      .from(referralTransaction)
      .where(eq(referralTransaction.referralId, userReferral.id))
      .orderBy(desc(referralTransaction.createdAt))
      .limit(limit)
      .offset(offset);

    const hasMore = offset + transactions.length < total;

    return {
      transactions,
      pagination: { page, limit, total, hasMore },
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get referral transactions',
    );
  }
}

export async function validateReferralCode({
  referralCode,
}: { referralCode: string }) {
  try {
    const [referralRecord] = await db
      .select()
      .from(referral)
      .where(
        and(
          eq(referral.referralCode, referralCode),
          eq(referral.isActive, true),
        ),
      )
      .limit(1);

    return { valid: !!referralRecord, referral: referralRecord };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to validate referral code',
    );
  }
}

export async function applyReferralCode({
  referralCode,
  newUserId,
  bonusAmount,
}: {
  referralCode: string;
  newUserId: string;
  bonusAmount: string;
}) {
  try {
    // Validate referral code and get referrer info
    const validation = await validateReferralCode({ referralCode });
    if (!validation.valid || !validation.referral) {
      throw new ChatSDKError('bad_request:referral', 'Invalid referral code');
    }

    const referrerReferral = validation.referral;

    // Check if user is trying to use their own referral code
    if (referrerReferral.userId === newUserId) {
      throw new ChatSDKError(
        'forbidden:referral',
        'Cannot use your own referral code',
      );
    }

    // Check if this user has already used a referral code
    const [existingUsage] = await db
      .select()
      .from(referralUsage)
      .where(eq(referralUsage.referredUserId, newUserId))
      .limit(1);

    if (existingUsage) {
      throw new ChatSDKError(
        'rate_limit:referral',
        'User has already used a referral code',
      );
    }

    const now = new Date();

    // Create referral usage record
    const [usage] = await db
      .insert(referralUsage)
      .values({
        referralCode,
        referrerId: referrerReferral.userId,
        referredUserId: newUserId,
        bonusAmount,
        status: 'completed',
        createdAt: now,
        completedAt: now,
      })
      .returning();

    // Update referrer's statistics
    const newBonusBalance = (
      Number.parseFloat(referrerReferral.bonusBalance) + Number.parseFloat(bonusAmount)
    ).toString();
    const newTotalEarned = (
      Number.parseFloat(referrerReferral.totalEarned) + Number.parseFloat(bonusAmount)
    ).toString();
    const newTotalReferrals = (
      Number.parseInt(referrerReferral.totalReferrals) + 1
    ).toString();

    await updateReferralBalance({
      userId: referrerReferral.userId,
      bonusBalance: newBonusBalance,
      totalEarned: newTotalEarned,
      totalReferrals: newTotalReferrals,
    });

    // Create transaction record for the bonus earned
    await db.insert(referralTransaction).values({
      referralId: referrerReferral.id,
      type: 'bonus_earned',
      amount: bonusAmount,
      description: 'Referral bonus earned',
      relatedUserId: newUserId,
      createdAt: now,
    });

    // Create transaction record for the referral signup
    await db.insert(referralTransaction).values({
      referralId: referrerReferral.id,
      type: 'referral_signup',
      amount: '0',
      description: 'New user signed up with referral code',
      relatedUserId: newUserId,
      createdAt: now,
    });

    return usage;
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to apply referral code',
    );
  }
}

export async function getReferralConfig() {
  try {
    const [config] = await db
      .select()
      .from(referralConfig)
      .where(eq(referralConfig.isActive, true))
      .orderBy(desc(referralConfig.updatedAt))
      .limit(1);

    // Return default config if none exists
    if (!config) {
      return {
        benefitType: 'bonus_credits' as const,
        benefitValue: '10000',
        planId: null,
        discountPercentage: null,
        validityDays: null,
        isActive: true,
      };
    }

    return config;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get referral config',
    );
  }
}

export async function updateReferralConfig({
  benefitType,
  benefitValue,
  planId,
  discountPercentage,
  validityDays,
}: {
  benefitType: 'free_subscription' | 'discount_percentage' | 'bonus_credits';
  benefitValue: string;
  planId?: string | null;
  discountPercentage?: string | null;
  validityDays?: string | null;
}) {
  try {
    const now = new Date();

    // Deactivate existing configs
    await db
      .update(referralConfig)
      .set({ isActive: false, updatedAt: now })
      .where(eq(referralConfig.isActive, true));

    // Create new config
    const [newConfig] = await db
      .insert(referralConfig)
      .values({
        benefitType,
        benefitValue,
        planId: planId ?? null,
        discountPercentage: discountPercentage ?? null,
        validityDays: validityDays ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return newConfig;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update referral config',
    );
  }
}

export async function checkReferralCodeUniqueness({
  referralCode,
}: { referralCode: string }) {
  try {
    const [existing] = await db
      .select()
      .from(referral)
      .where(eq(referral.referralCode, referralCode))
      .limit(1);

    return !existing; // Return true if code is unique (no existing record found)
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to check referral code uniqueness',
    );
  }
}

export async function findUserRoles({ id }: { id: string }) {
  try {
    const [userRecord] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!userRecord) {
      throw new Error('User not found');
    }
    return userRecord.role;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to find user roles');
  }
}
