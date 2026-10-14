import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import type { UserSettings } from '@inkwell/shared';

const timestampTz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const roomKindEnum = pgEnum('room_kind', ['reflection', 'fiction']);
export const feedSortEnum = pgEnum('feed_sort', ['new', 'week', 'top']);
export const postTypeEnum = pgEnum('post_type', ['thought', 'story']);
export const visibilityEnum = pgEnum('visibility', ['private', 'anonymous', 'public']);
export const postStatusEnum = pgEnum('post_status', [
  'visible',
  'hidden_pending',
  'hidden',
  'expired',
]);
export const expiryEnum = pgEnum('expiry', ['none', '24h', '7d']);
export const reactionKindEnum = pgEnum('reaction_kind', ['read', 'felt', 'known', 'thanks']);
export const commentModeEnum = pgEnum('comment_mode', ['reply', 'feedback']);
export const flagTargetEnum = pgEnum('flag_target', ['post', 'comment']);
export const flagStatusEnum = pgEnum('flag_status', ['open', 'reviewing', 'actioned', 'dismissed']);
export const reportReasonEnum = pgEnum('report_reason', [
  'harassment',
  'hate',
  'spam',
  'sexual',
  'violence',
  'self_harm_other',
  'copyright',
  'other',
]);
export const moderationActionEnum = pgEnum('moderation_action', [
  'keep',
  'hide',
  'delete',
  'warn',
  'suspend_7d',
  'suspend_permanent',
]);
export const exportStatusEnum = pgEnum('export_status', [
  'pending',
  'processing',
  'ready',
  'failed',
  'expired',
]);
export const codePurposeEnum = pgEnum('code_purpose', ['login', 'change_email']);
export const localeEnum = pgEnum('locale', ['de', 'fr', 'it', 'en']);

export const users = pgTable(
  'users',
  {
    id: text().primaryKey(),
    email: text().notNull(),
    emailHash: text().notNull(),
    appleSub: text(),
    /** scrypt hash; null for accounts that sign in with codes or passkeys only. */
    passwordHash: text('password_hash'),
    pseudonym: text().notNull(),
    pseudonymChangedAt: timestampTz('pseudonym_changed_at'),
    avatar: text().notNull().default('shape:leaf-1'),
    locale: localeEnum().notNull().default('de'),
    roomLocales: text()
      .array()
      .notNull()
      .default(sql`'{de}'::text[]`),
    roles: text()
      .array()
      .notNull()
      .default(sql`'{member}'::text[]`),
    settings: jsonb().$type<UserSettings>().notNull(),
    ageConfirmedAt: timestampTz('age_confirmed_at'),
    onboardingCompletedAt: timestampTz('onboarding_completed_at'),
    recoverySetupAt: timestampTz('recovery_setup_at'),
    warningsCount: integer().notNull().default(0),
    suspendedUntil: timestampTz('suspended_until'),
    suspendedPermanently: boolean().notNull().default(false),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
    updatedAt: timestampTz('updated_at').notNull().defaultNow(),
    deletedAt: timestampTz('deleted_at'),
    purgeAfter: timestampTz('purge_after'),
  },
  (table) => [
    uniqueIndex('users_email_hash_idx').on(table.emailHash),
    uniqueIndex('users_pseudonym_idx').on(table.pseudonym),
    uniqueIndex('users_apple_sub_idx').on(table.appleSub),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text().notNull(),
    device: text().notNull().default(''),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
    lastSeenAt: timestampTz('last_seen_at').notNull().defaultNow(),
    expiresAt: timestampTz('expires_at').notNull(),
    revokedAt: timestampTz('revoked_at'),
  },
  (table) => [
    uniqueIndex('sessions_token_hash_idx').on(table.tokenHash),
    index('sessions_user_idx').on(table.userId),
  ],
);

export const emailCodes = pgTable(
  'email_codes',
  {
    id: text().primaryKey(),
    emailHash: text().notNull(),
    email: text().notNull(),
    codeHash: text().notNull(),
    purpose: codePurposeEnum().notNull().default('login'),
    userId: text().references(() => users.id, { onDelete: 'cascade' }),
    attempts: integer().notNull().default(0),
    expiresAt: timestampTz('expires_at').notNull(),
    consumedAt: timestampTz('consumed_at'),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
  },
  (table) => [index('email_codes_email_hash_idx').on(table.emailHash, table.createdAt)],
);

export const passkeys = pgTable(
  'passkeys',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    publicKey: text().notNull(),
    counter: integer().notNull().default(0),
    transports: text()
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    deviceType: text().notNull().default('singleDevice'),
    backedUp: boolean().notNull().default(false),
    name: text().notNull(),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
    lastUsedAt: timestampTz('last_used_at'),
  },
  (table) => [index('passkeys_user_idx').on(table.userId)],
);

export const webauthnChallenges = pgTable('webauthn_challenges', {
  id: text().primaryKey(),
  challenge: text().notNull(),
  intent: text().notNull(),
  userId: text().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestampTz('expires_at').notNull(),
});

export const rooms = pgTable(
  'rooms',
  {
    id: text().primaryKey(),
    slug: text().notNull(),
    kind: roomKindEnum().notNull(),
    locale: localeEnum().notNull(),
    name: text().notNull(),
    description: text().notNull(),
    rules: text().notNull().default(''),
    sortDefault: feedSortEnum().notNull().default('new'),
    position: integer().notNull().default(0),
    showHelplines: boolean().notNull().default(false),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('rooms_slug_idx').on(table.slug),
    index('rooms_locale_kind_idx').on(table.locale, table.kind),
  ],
);

export const roomMembers = pgTable(
  'room_members',
  {
    roomId: text()
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pushEnabled: boolean().notNull().default(false),
    joinedAt: timestampTz('joined_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.userId] }),
    index('room_members_user_idx').on(table.userId),
  ],
);

export const series = pgTable(
  'series',
  {
    id: text().primaryKey(),
    authorId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text().notNull(),
    description: text().notNull().default(''),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
  },
  (table) => [index('series_author_idx').on(table.authorId)],
);

export const posts = pgTable(
  'posts',
  {
    id: text().primaryKey(),
    authorId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roomId: text().references(() => rooms.id, { onDelete: 'set null' }),
    type: postTypeEnum().notNull(),
    visibility: visibilityEnum().notNull(),
    status: postStatusEnum().notNull().default('visible'),
    title: text(),
    /** Plaintext Markdown subset. NULL for private entries. */
    body: text(),
    /** Base64url AES-256-GCM ciphertext. NULL for shared entries. */
    ciphertext: text(),
    nonce: text(),
    wrappedKey: text(),
    wordCount: integer().notNull().default(0),
    expiry: expiryEnum().notNull().default('none'),
    expiresAt: timestampTz('expires_at'),
    commentsEnabled: boolean().notNull().default(false),
    seriesId: text().references(() => series.id, { onDelete: 'set null' }),
    chapter: integer(),
    clientId: text(),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
    updatedAt: timestampTz('updated_at').notNull().defaultNow(),
    editedAt: timestampTz('edited_at'),
    deletedAt: timestampTz('deleted_at'),
  },
  (table) => [
    index('posts_room_feed_idx').on(table.roomId, table.createdAt, table.id),
    index('posts_author_idx').on(table.authorId, table.updatedAt),
    index('posts_expires_idx').on(table.expiresAt),
    index('posts_series_idx').on(table.seriesId, table.chapter),
    uniqueIndex('posts_client_id_idx').on(table.authorId, table.clientId),
  ],
);

export const postScores = pgTable('post_scores', {
  postId: text()
    .primaryKey()
    .references(() => posts.id, { onDelete: 'cascade' }),
  score: real().notNull().default(0),
  netVotes: integer().notNull().default(0),
  computedAt: timestampTz('computed_at').notNull().defaultNow(),
});

export const reactions = pgTable(
  'reactions',
  {
    postId: text()
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: reactionKindEnum().notNull(),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.userId, table.kind] })],
);

export const votes = pgTable(
  'votes',
  {
    postId: text()
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    value: smallint().notNull(),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
    updatedAt: timestampTz('updated_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.userId] })],
);

export const comments = pgTable(
  'comments',
  {
    id: text().primaryKey(),
    postId: text()
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    mode: commentModeEnum().notNull(),
    body: text().notNull(),
    worked: text(),
    unclear: text(),
    hiddenAt: timestampTz('hidden_at'),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
    deletedAt: timestampTz('deleted_at'),
  },
  (table) => [index('comments_post_idx').on(table.postId, table.createdAt)],
);

export const seriesSubscriptions = pgTable(
  'series_subscriptions',
  {
    seriesId: text()
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.seriesId, table.userId] })],
);

export const moderationFlags = pgTable(
  'moderation_flags',
  {
    id: text().primaryKey(),
    targetType: flagTargetEnum().notNull(),
    targetId: text().notNull(),
    reporterId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: reportReasonEnum().notNull(),
    freeText: text(),
    /** 1 = self-harm of another person, 2 = violence/harassment/hate, 3 = everything else. */
    priority: smallint().notNull().default(3),
    status: flagStatusEnum().notNull().default('open'),
    reviewerId: text().references(() => users.id, { onDelete: 'set null' }),
    action: moderationActionEnum(),
    note: text(),
    resolvedAt: timestampTz('resolved_at'),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('moderation_flags_unique_report_idx').on(
      table.targetType,
      table.targetId,
      table.reporterId,
    ),
    index('moderation_flags_queue_idx').on(table.status, table.priority, table.createdAt),
    index('moderation_flags_target_idx').on(table.targetType, table.targetId),
  ],
);

/** A plain-language message to the affected person after a moderation action. */
export const moderationNotices = pgTable(
  'moderation_notices',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    flagId: text().references(() => moderationFlags.id, { onDelete: 'set null' }),
    action: moderationActionEnum().notNull(),
    note: text().notNull(),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
    readAt: timestampTz('read_at'),
  },
  (table) => [index('moderation_notices_user_idx').on(table.userId, table.createdAt)],
);

export const blocks = pgTable(
  'blocks',
  {
    blockerId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockedId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.blockerId, table.blockedId] }),
    index('blocks_blocked_idx').on(table.blockedId),
  ],
);

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text().notNull(),
    p256dh: text().notNull(),
    auth: text().notNull(),
    platform: text().notNull().default('web'),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('push_subscriptions_endpoint_idx').on(table.endpoint),
    index('push_subscriptions_user_idx').on(table.userId),
  ],
);

export const exports = pgTable(
  'exports',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: exportStatusEnum().notNull().default('pending'),
    s3Key: text(),
    error: text(),
    expiresAt: timestampTz('expires_at'),
    createdAt: timestampTz('created_at').notNull().defaultNow(),
    updatedAt: timestampTz('updated_at').notNull().defaultNow(),
  },
  (table) => [index('exports_user_idx').on(table.userId, table.createdAt)],
);

/** Fixed-window counters for rate limits; Postgres is enough for the start. */
export const rateLimits = pgTable(
  'rate_limits',
  {
    key: text().notNull(),
    windowStart: timestampTz('window_start').notNull(),
    count: integer().notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.key, table.windowStart] })],
);

/** Daily aggregates for the success metrics in the PRD, without any per-person profile. */
export const dailyMetrics = pgTable(
  'daily_metrics',
  {
    day: text().notNull(),
    metric: text().notNull(),
    value: real().notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.day, table.metric] })],
);

export type UserRow = typeof users.$inferSelect;
export type PostRow = typeof posts.$inferSelect;
export type RoomRow = typeof rooms.$inferSelect;
export type CommentRow = typeof comments.$inferSelect;
export type FlagRow = typeof moderationFlags.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
