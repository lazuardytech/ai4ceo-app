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
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type { VisibilityType } from '@/components/visibility-selector';
import { ChatSDKError } from '../errors';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
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
    return await db
      .insert(user)
      .values({ email, password: hashedPassword, role: 'user' });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db
      .insert(user)
      .values({ email, password, role: 'user' })
      .returning({
        id: user.id,
        email: user.email,
      });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
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
  role: 'user' | 'admin' | 'superadmin';
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
