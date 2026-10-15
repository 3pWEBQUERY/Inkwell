import 'server-only';

import { api } from '@/lib/api-client';
import { ApiClientError } from '@/lib/api-errors';

import type {
  CommentView,
  CursorPage,
  ExportJob,
  FeedPost,
  FeedSort,
  JournalPost,
  ModerationQueueItem,
  PasskeyView,
  ReactionSummary,
  RoomSummary,
  Series,
  SessionView,
} from '@inkwell/shared';

export type RoomView = RoomSummary & { showHelplines: boolean };

export async function getRooms(
  locales: string[],
  kind?: 'reflection' | 'fiction',
): Promise<RoomView[]> {
  const params = new URLSearchParams({ locale: locales.join(',') });
  if (kind) params.set('kind', kind);
  const { items } = await api<{ items: RoomView[] }>(`/rooms?${params.toString()}`);
  return items;
}

export async function getRoom(slug: string): Promise<RoomView | null> {
  try {
    return await api<RoomView>(`/rooms/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  }
}

export async function getRoomFeed(
  slug: string,
  options: { cursor?: string; sort?: FeedSort } = {},
): Promise<CursorPage<FeedPost>> {
  const params = new URLSearchParams();
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.sort) params.set('sort', options.sort);
  const query = params.toString();
  return api<CursorPage<FeedPost>>(
    `/rooms/${encodeURIComponent(slug)}/posts${query ? `?${query}` : ''}`,
  );
}

export async function getTodayFeed(): Promise<FeedPost[]> {
  const { items } = await api<{ items: FeedPost[] }>('/me/today');
  return items;
}

export async function getBookmarks(): Promise<FeedPost[]> {
  const { items } = await api<{ items: FeedPost[] }>('/me/bookmarks');
  return items;
}

export async function getJournal(
  options: { cursor?: string; since?: string } = {},
): Promise<CursorPage<JournalPost>> {
  const params = new URLSearchParams();
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.since) params.set('since', options.since);
  const query = params.toString();
  return api<CursorPage<JournalPost>>(`/me/posts${query ? `?${query}` : ''}`);
}

export async function getPost(id: string): Promise<FeedPost | null> {
  try {
    return await api<FeedPost>(`/posts/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  }
}

export async function getComments(postId: string): Promise<CommentView[]> {
  const { items } = await api<{ items: CommentView[] }>(
    `/posts/${encodeURIComponent(postId)}/comments`,
  );
  return items;
}

export interface FeedbackLine {
  postId: string;
  title: string | null;
  preview: string;
  visibility: 'anonymous' | 'public';
  createdAt: string;
  summary: ReactionSummary;
}

export async function getFeedback(): Promise<FeedbackLine[]> {
  const { items } = await api<{ items: FeedbackLine[] }>('/me/feedback');
  return items;
}

export interface ProfileView {
  pseudonym: string;
  avatar: string;
  memberSince: string;
  posts: FeedPost[];
}

export async function getProfile(pseudonym: string): Promise<ProfileView | null> {
  try {
    return await api<ProfileView>(`/me/profile/${encodeURIComponent(pseudonym)}`);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  }
}

export async function getSeries(id: string): Promise<Series | null> {
  try {
    return await api<Series>(`/series/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  }
}

export interface OwnSeries {
  id: string;
  title: string;
  description: string;
  chapterCount: number;
}

export async function getOwnSeries(): Promise<OwnSeries[]> {
  const { items } = await api<{ items: OwnSeries[] }>('/series/mine');
  return items;
}

export async function getSessions(): Promise<SessionView[]> {
  const { items } = await api<{ items: SessionView[] }>('/me/sessions');
  return items;
}

export async function getPasskeys(): Promise<PasskeyView[]> {
  const { items } = await api<{ items: PasskeyView[] }>('/me/passkeys');
  return items;
}

export interface BlockedEntry {
  id: string;
  pseudonym: string;
  createdAt: string;
}

export async function getBlocks(): Promise<BlockedEntry[]> {
  const { items } = await api<{ items: BlockedEntry[] }>('/me/blocks');
  return items;
}

export interface ModerationNotice {
  id: string;
  action: string;
  note: string;
  createdAt: string;
  readAt: string | null;
}

export async function getNotices(): Promise<ModerationNotice[]> {
  const { items } = await api<{ items: ModerationNotice[] }>('/me/notices');
  return items;
}

export async function getLatestExport(): Promise<ExportJob | null> {
  return api<ExportJob | null>('/me/export/latest');
}

export async function getModerationQueue(): Promise<ModerationQueueItem[]> {
  const { items } = await api<{ items: ModerationQueueItem[] }>('/admin/queue');
  return items;
}

export async function getVapidPublicKey(): Promise<string | null> {
  const { publicKey } = await api<{ publicKey: string | null }>('/me/push/vapid');
  return publicKey;
}
