import type {
  CommentMode,
  Expiry,
  FlagStatus,
  PostStatus,
  PostType,
  ReactionKind,
  ReportReason,
  RoomKind,
  Visibility,
} from '../constants.js';
import type { Locale } from '../locales.js';

export interface PublicAuthor {
  pseudonym: string;
  avatar: string;
}

export interface RoomSummary {
  id: string;
  slug: string;
  kind: RoomKind;
  locale: Locale;
  name: string;
  description: string;
  rules: string;
  sortDefault: 'new' | 'week' | 'top';
  joined: boolean;
  pushEnabled: boolean;
}

/** A shared text as other members see it. `author` is absent on anonymous texts; the server never sends it. */
export interface FeedPost {
  id: string;
  type: PostType;
  visibility: Exclude<Visibility, 'private'>;
  title: string | null;
  body: string;
  preview: string;
  wordCount: number;
  room: Pick<RoomSummary, 'id' | 'slug' | 'kind' | 'name' | 'locale'>;
  author: PublicAuthor | null;
  createdAt: string;
  editedAt: string | null;
  expiresAt: string | null;
  commentsEnabled: boolean;
  series: { id: string; title: string; chapter: number; chapterCount: number } | null;
  /** Only present for the requesting member. */
  viewer: {
    reactions: ReactionKind[];
    vote: -1 | 0 | 1;
    isAuthor: boolean;
    /** Kept for later by the viewer. Never shown to anyone else. */
    bookmarked: boolean;
  };
}

/** A text as the author sees it in the journal. Private entries carry ciphertext only. */
export interface JournalPost {
  id: string;
  type: PostType;
  visibility: Visibility;
  status: PostStatus;
  title: string | null;
  body: string | null;
  ciphertext: string | null;
  nonce: string | null;
  wrappedKey: string | null;
  roomId: string | null;
  roomSlug: string | null;
  roomName: string | null;
  expiry: Expiry;
  expiresAt: string | null;
  /** Sealed letters only: until then the entry is shown closed. */
  opensAt: string | null;
  commentsEnabled: boolean;
  seriesId: string | null;
  chapter: number | null;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  hasFeedback: boolean;
}

export interface ReactionSummary {
  read: number;
  felt: number;
  known: number;
  thanks: number;
  netVotes: number | null;
  comments: number;
}

export interface CommentView {
  id: string;
  mode: CommentMode;
  body: string;
  worked: string | null;
  unclear: string | null;
  author: PublicAuthor | null;
  isOwn: boolean;
  createdAt: string;
  hidden: boolean;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  chapterCount: number;
  subscribed: boolean;
  author: PublicAuthor;
  chapters: { postId: string; chapter: number; title: string; createdAt: string }[];
}

export interface Me {
  id: string;
  email: string;
  pseudonym: string;
  pseudonymChangedAt: string | null;
  avatar: string;
  locale: Locale;
  roomLocales: Locale[];
  roles: ('member' | 'admin')[];
  createdAt: string;
  deletionScheduledAt: string | null;
  suspendedUntil: string | null;
  suspendedPermanently: boolean;
  settings: UserSettings;
  hasRecoverySetup: boolean;
}

export interface UserSettings {
  defaultVisibility: Visibility;
  defaultExpiry: Expiry;
  fontSize: number;
  editorFont: 'serif' | 'sans';
  theme: 'light' | 'dark' | 'system';
  reduceMotion: 'system' | 'reduce';
  dailyFeedbackDigest: boolean;
  commentNotifications: boolean;
}

export interface SessionView {
  id: string;
  device: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

export interface PasskeyView {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ModerationQueueItem {
  id: string;
  priority: 1 | 2 | 3;
  reason: ReportReason;
  reportCount: number;
  status: FlagStatus;
  targetType: 'post' | 'comment';
  targetId: string;
  preview: string;
  roomName: string | null;
  createdAt: string;
  accountHistory: {
    warnings: number;
    suspensions: number;
    previousFlags: number;
  };
  freeText: string | null;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'expired';
  downloadUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
