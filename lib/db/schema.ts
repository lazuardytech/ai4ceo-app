import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  role: varchar('role', { enum: ['user', 'admin', 'superadmin'] })
    .notNull()
    .default('user'),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

export const subscription = pgTable('Subscription', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  planId: varchar('planId', { length: 64 }).notNull(),
  status: varchar('status', {
    enum: ['pending', 'active', 'canceled', 'expired', 'failed'],
  })
    .notNull()
    .default('pending'),
  externalId: varchar('externalId', { length: 128 }),
  providerInvoiceId: varchar('providerInvoiceId', { length: 128 }),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  currentPeriodEnd: timestamp('currentPeriodEnd'),
});

export type Subscription = InferSelectModel<typeof subscription>;

export const setting = pgTable('Setting', {
  key: varchar('key', { length: 128 }).primaryKey().notNull(),
  value: json('value').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export type Setting = InferSelectModel<typeof setting>;

export const voucher = pgTable('Voucher', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  type: varchar('type', { enum: ['discount', 'free_subscription'] }).notNull(),
  discountType: varchar('discountType', { enum: ['percentage', 'fixed'] }),
  discountValue: varchar('discountValue', { length: 16 }),
  planId: varchar('planId', { length: 64 }),
  duration: varchar('duration', { length: 32 }), // e.g., '1_month', '3_months', '1_year'
  maxUsages: varchar('maxUsages', { length: 16 }),
  currentUsages: varchar('currentUsages', { length: 16 })
    .notNull()
    .default('0'),
  isActive: boolean('isActive').notNull().default(true),
  validFrom: timestamp('validFrom').notNull(),
  validUntil: timestamp('validUntil'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export type Voucher = InferSelectModel<typeof voucher>;

export const voucherUsage = pgTable('VoucherUsage', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  voucherId: uuid('voucherId')
    .notNull()
    .references(() => voucher.id),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  subscriptionId: uuid('subscriptionId').references(() => subscription.id),
  usedAt: timestamp('usedAt').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type VoucherUsage = InferSelectModel<typeof voucherUsage>;
