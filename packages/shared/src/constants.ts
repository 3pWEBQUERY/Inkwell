/** Product limits and rules. The server enforces them; the client mirrors them for inline hints. */
export const LIMITS = {
  /** Minimum length of a shared text (characters, trimmed). */
  sharedPostMinChars: 20,
  /** Maximum length of a thought. */
  thoughtMaxChars: 10_000,
  /** Maximum length of a story chapter. */
  storyMaxChars: 60_000,
  titleMaxChars: 120,
  commentMaxChars: 2_000,
  reportFreeTextMaxChars: 500,
  seriesDescriptionMaxChars: 500,
  pseudonymMin: 3,
  pseudonymMax: 24,
  /** Days a pseudonym is locked after a change. */
  pseudonymChangeLockDays: 30,
  /** Minutes a thought can be edited after publishing. */
  editWindowMinutes: 15,
  /** Published texts per author per 24 hours. */
  publishPerDay: 20,
  /** Comments per author per hour. */
  commentsPerHour: 60,
  /** Independent reports within 24 h that hide a text pending review. */
  autoHideReportThreshold: 3,
  /** Days before a soft-deleted account is purged. */
  accountDeletionGraceDays: 30,
  /** Hours an export download link stays valid. */
  exportLinkHours: 24,
  /** Avatar upload limit in bytes. */
  avatarMaxBytes: 2 * 1024 * 1024,
  avatarSizePx: 512,
  /** Word count above which the completion panel pre-selects "story". */
  storyWordThreshold: 400,
  /** Minimum age to register. */
  minAge: 16,
  /** Page size for room feeds. */
  feedPageSize: 20,
  /** Max items on /today. */
  todayMaxItems: 20,
  /** Kept texts shown in the journal; older ones stay stored but out of view. */
  bookmarksMax: 200,
  /** Session lifetime in days. */
  sessionDays: 30,
  /** Magic-code lifetime in minutes. */
  magicCodeMinutes: 10,
} as const;

export const PSEUDONYM_PATTERN = /^[a-z0-9]+(?:\.[a-z0-9]+)*$/;

export const POST_TYPES = ['thought', 'story'] as const;
export type PostType = (typeof POST_TYPES)[number];

export const VISIBILITIES = ['private', 'anonymous', 'public'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const ROOM_KINDS = ['reflection', 'fiction'] as const;
export type RoomKind = (typeof ROOM_KINDS)[number];

export const EXPIRIES = ['none', '24h', '7d'] as const;
export type Expiry = (typeof EXPIRIES)[number];

export const EXPIRY_HOURS: Record<Expiry, number | null> = {
  none: null,
  '24h': 24,
  '7d': 24 * 7,
};

export const REACTION_KINDS = ['read', 'felt', 'known', 'thanks'] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

export const COMMENT_MODES = ['reply', 'feedback'] as const;
export type CommentMode = (typeof COMMENT_MODES)[number];

export const FEED_SORTS = ['new', 'week', 'top'] as const;
export type FeedSort = (typeof FEED_SORTS)[number];

export const REPORT_REASONS = [
  'harassment',
  'hate',
  'spam',
  'sexual',
  'violence',
  'self_harm_other',
  'copyright',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const FLAG_STATUSES = ['open', 'reviewing', 'actioned', 'dismissed'] as const;
export type FlagStatus = (typeof FLAG_STATUSES)[number];

export const MODERATION_ACTIONS = [
  'keep',
  'hide',
  'delete',
  'warn',
  'suspend_7d',
  'suspend_permanent',
] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export const POST_STATUSES = ['visible', 'hidden_pending', 'hidden', 'expired'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

/**
 * Visibility can only be narrowed, never widened. A private text can never
 * "accidentally" become public.
 */
export const VISIBILITY_RANK: Record<Visibility, number> = {
  private: 0,
  anonymous: 1,
  public: 2,
};

export function canChangeVisibility(from: Visibility, to: Visibility): boolean {
  return VISIBILITY_RANK[to] <= VISIBILITY_RANK[from];
}
