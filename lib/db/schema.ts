import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  text,
  primaryKey,
  foreignKey,
  boolean,
} from 'drizzle-orm/pg-core';
import { cuid2 } from 'drizzle-cuid2/postgres';

export const user = pgTable('User', {
  id: cuid2('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 128 }),
  image: text('image'),
  bio: text('bio'),
  timezone: varchar('timezone', { length: 64 }),
  locale: varchar('locale', { length: 16 }),
  onboarded: boolean('onboarded').notNull().default(false),
  role: varchar('role', { enum: ['user', 'admin', 'superadmin'] })
    .notNull()
    .default('user'),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type User = InferSelectModel<typeof user>;

export const session = pgTable("Session", {
  id: cuid2("id").primaryKey().notNull().defaultRandom(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: cuid2("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export type Session = InferSelectModel<typeof session>;

export const account = pgTable("Account", {
  id: cuid2("id").primaryKey().notNull().defaultRandom(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: cuid2("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export type Account = InferSelectModel<typeof account>;

export const verification = pgTable("Verification", {
  id: cuid2("id").primaryKey().notNull().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export type Verification = InferSelectModel<typeof verification>;

export const chat = pgTable('Chat', {
  id: cuid2('id').defaultRandom().primaryKey(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: cuid2('userId')
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
  id: cuid2('id').defaultRandom().primaryKey(),
  chatId: cuid2('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: cuid2('id').defaultRandom().primaryKey(),
  chatId: cuid2('chatId')
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
    chatId: cuid2('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: cuid2('messageId')
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
    chatId: cuid2('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: cuid2('messageId')
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
    id: cuid2('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: cuid2('userId')
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
    id: cuid2('id').notNull().defaultRandom(),
    documentId: cuid2('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: cuid2('userId')
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
    id: cuid2('id').notNull().defaultRandom(),
    chatId: cuid2('chatId').notNull(),
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

// Experts / Agents
export const agent = pgTable('Agent', {
  id: cuid2('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull(),
  name: varchar('name', { length: 64 }).notNull(),
  description: text('description'),
  prePrompt: text('prePrompt').notNull(),
  personality: text('personality').notNull(),
  isActive: boolean('isActive').notNull().default(true),
  ragEnabled: boolean('ragEnabled').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Agent = InferSelectModel<typeof agent>;

export const agentKnowledge = pgTable(
  'AgentKnowledge',
  {
    id: cuid2('id').notNull().defaultRandom(),
    agentId: cuid2('agentId')
      .notNull()
      .references(() => agent.id),
    title: varchar('title', { length: 128 }).notNull(),
    content: text('content').notNull(),
    tags: text('tags'), // optional comma-separated tags
    vector: json('vector'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
  }),
);

export type AgentKnowledge = InferSelectModel<typeof agentKnowledge>;

export const chatAgent = pgTable(
  'ChatAgent',
  {
    chatId: cuid2('chatId')
      .notNull()
      .references(() => chat.id),
    agentId: cuid2('agentId')
      .notNull()
      .references(() => agent.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.agentId] }),
  }),
);

export type ChatAgent = InferSelectModel<typeof chatAgent>;

export const subscription = pgTable('Subscription', {
  id: cuid2('id').defaultRandom().primaryKey(),
  userId: cuid2('userId')
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
  id: cuid2('id').defaultRandom().primaryKey(),
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
  id: cuid2('id').defaultRandom().primaryKey(),
  voucherId: cuid2('voucherId')
    .notNull()
    .references(() => voucher.id),
  userId: cuid2('userId')
    .notNull()
    .references(() => user.id),
  subscriptionId: cuid2('subscriptionId').references(() => subscription.id),
  usedAt: timestamp('usedAt').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type VoucherUsage = InferSelectModel<typeof voucherUsage>;

export const userFile = pgTable('UserFile', {
  id: cuid2('id').defaultRandom().primaryKey(),
  userId: cuid2('userId')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  url: text('url').notNull(),
  contentType: varchar('contentType', { length: 128 }),
  size: varchar('size', { length: 32 }),
  storagePath: text('storagePath'),
  isDeleted: boolean('isDeleted').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type UserFile = InferSelectModel<typeof userFile>;

// Referral System Tables
export const referral = pgTable('Referral', {
  id: cuid2('id').defaultRandom().primaryKey(),
  userId: cuid2('userId')
    .notNull()
    .references(() => user.id),
  referralCode: varchar('referralCode', { length: 32 }).notNull().unique(),
  bonusBalance: varchar('bonusBalance', { length: 16 }).notNull().default('0'),
  totalEarned: varchar('totalEarned', { length: 16 }).notNull().default('0'),
  totalReferrals: varchar('totalReferrals', { length: 16 })
    .notNull()
    .default('0'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Referral = InferSelectModel<typeof referral>;

export const referralTransaction = pgTable('ReferralTransaction', {
  id: cuid2('id').defaultRandom().primaryKey(),
  referralId: cuid2('referralId')
    .notNull()
    .references(() => referral.id),
  type: varchar('type', {
    enum: ['bonus_earned', 'bonus_used', 'referral_signup'],
  }).notNull(),
  amount: varchar('amount', { length: 16 }).notNull(),
  description: text('description').notNull(),
  relatedUserId: cuid2('relatedUserId').references(() => user.id), // The referred user
  subscriptionId: cuid2('subscriptionId').references(() => subscription.id), // If related to subscription
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type ReferralTransaction = InferSelectModel<typeof referralTransaction>;

export const referralUsage = pgTable('ReferralUsage', {
  id: cuid2('id').defaultRandom().primaryKey(),
  referralCode: varchar('referralCode', { length: 32 }).notNull(),
  referrerId: cuid2('referrerId')
    .notNull()
    .references(() => user.id),
  referredUserId: cuid2('referredUserId')
    .notNull()
    .references(() => user.id),
  bonusAmount: varchar('bonusAmount', { length: 16 }).notNull(),
  status: varchar('status', { enum: ['pending', 'completed', 'cancelled'] })
    .notNull()
    .default('pending'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  completedAt: timestamp('completedAt'),
});

export type ReferralUsage = InferSelectModel<typeof referralUsage>;

export const referralConfig = pgTable('ReferralConfig', {
  id: cuid2('id').defaultRandom().primaryKey(),
  benefitType: varchar('benefitType', {
    enum: ['free_subscription', 'discount_percentage', 'bonus_credits'],
  })
    .notNull()
    .default('bonus_credits'),
  benefitValue: varchar('benefitValue', { length: 16 }).notNull(), // Amount, percentage, or plan duration
  planId: varchar('planId', { length: 64 }), // For free subscription benefits
  discountPercentage: varchar('discountPercentage', { length: 8 }), // For discount benefits
  validityDays: varchar('validityDays', { length: 8 }), // How long the benefit is valid
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type ReferralConfig = InferSelectModel<typeof referralConfig>;
