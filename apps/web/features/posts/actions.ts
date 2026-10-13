'use server';

/*
 * Every read in this app is `no-store`, so there is no data cache to invalidate.
 * Components refresh the router after a mutation (`router.refresh()`), which
 * also keeps server actions free of revalidation inside intercepted overlays.
 */

import {
  createCommentSchema,
  createPostSchema,
  createReportSchema,
  createSeriesSchema,
  reactionKindSchema,
  updateMeSchema,
  updatePostSchema,
  voteSchema,
  type FeedPost,
  type Me,
} from '@inkwell/shared';

import { api } from '@/lib/api-client';
import { failure, type ActionResult } from '@/lib/api-errors';

export async function createPost(
  input: unknown,
): Promise<ActionResult<{ id: string; createdAt: string; post: FeedPost | null }>> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };
  try {
    const data = await api<{ id: string; createdAt: string; post: FeedPost | null }>('/posts', {
      method: 'POST',
      body: parsed.data,
    });
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function updatePost(id: string, input: unknown): Promise<ActionResult> {
  const parsed = updatePostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };
  try {
    await api(`/posts/${encodeURIComponent(id)}`, { method: 'PATCH', body: parsed.data });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function burnPost(id: string): Promise<ActionResult> {
  try {
    await api(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function toggleReaction(
  postId: string,
  kind: string,
  active: boolean,
): Promise<ActionResult> {
  const parsed = reactionKindSchema.safeParse(kind);
  if (!parsed.success) return { ok: false, error: 'REACTION_KIND_INVALID' };
  try {
    await api(`/posts/${encodeURIComponent(postId)}/reactions/${parsed.data}`, {
      method: active ? 'PUT' : 'DELETE',
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function markRead(postId: string): Promise<ActionResult> {
  try {
    await api(`/posts/${encodeURIComponent(postId)}/reactions/read`, { method: 'PUT' });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function vote(
  postId: string,
  value: -1 | 0 | 1,
): Promise<ActionResult<{ vote: number }>> {
  const parsed = voteSchema.safeParse({ value });
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };
  try {
    const data = await api<{ vote: number }>(`/posts/${encodeURIComponent(postId)}/vote`, {
      method: 'PUT',
      body: parsed.data,
    });
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function createComment(
  postId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'FEEDBACK_FIELDS_REQUIRED' };
  try {
    const data = await api<{ id: string }>(`/posts/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: parsed.data,
    });
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function removeComment(postId: string, commentId: string): Promise<ActionResult> {
  try {
    await api(`/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function joinRoom(slug: string, join: boolean): Promise<ActionResult> {
  try {
    await api(`/rooms/${encodeURIComponent(slug)}/${join ? 'join' : 'leave'}`, { method: 'POST' });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function setRoomPush(slug: string, enabled: boolean): Promise<ActionResult> {
  try {
    await api(`/rooms/${encodeURIComponent(slug)}/push`, { method: 'PUT', body: { enabled } });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function reportContent(input: unknown): Promise<ActionResult<{ priority: number }>> {
  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'REPORT_REASON_INVALID' };
  try {
    const data = await api<{ id: string; priority: number }>('/reports', {
      method: 'POST',
      body: parsed.data,
    });
    return { ok: true, data: { priority: data.priority } };
  } catch (error) {
    return failure(error);
  }
}

export async function blockFrom(
  targetType: 'post' | 'comment' | 'pseudonym',
  targetId: string,
): Promise<ActionResult> {
  try {
    await api('/me/blocks', { method: 'POST', body: { targetType, targetId } });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function unblock(userId: string): Promise<ActionResult> {
  try {
    await api(`/me/blocks/${encodeURIComponent(userId)}`, { method: 'DELETE' });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function updateMe(input: unknown): Promise<ActionResult<Me>> {
  const parsed = updateMeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };
  try {
    const me = await api<Me>('/me', { method: 'PATCH', body: parsed.data });
    return { ok: true, data: me };
  } catch (error) {
    return failure(error);
  }
}

export async function createSeries(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createSeriesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'VALIDATION_FAILED' };
  try {
    const data = await api<{ id: string }>('/series', { method: 'POST', body: parsed.data });
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function reorderSeries(seriesId: string, postIds: string[]): Promise<ActionResult> {
  try {
    await api(`/series/${encodeURIComponent(seriesId)}/order`, {
      method: 'PUT',
      body: { postIds },
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function subscribeSeries(
  seriesId: string,
  subscribed: boolean,
): Promise<ActionResult> {
  try {
    await api(`/series/${encodeURIComponent(seriesId)}/subscription`, {
      method: 'PUT',
      body: { subscribed },
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function requestExport(): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await api<{ id: string }>('/me/export', { method: 'POST' });
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function pollExport(
  id: string,
): Promise<ActionResult<{ status: string; downloadUrl: string | null }>> {
  try {
    const data = await api<{ status: string; downloadUrl: string | null }>(
      `/me/export/${encodeURIComponent(id)}`,
    );
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function scheduleDeletion(): Promise<ActionResult<{ scheduledFor: string }>> {
  try {
    const data = await api<{ scheduledFor: string }>('/me', { method: 'DELETE' });
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function revokeDeletion(): Promise<ActionResult> {
  try {
    await api('/me/deletion/revoke', { method: 'POST' });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function revokeSession(id: string): Promise<ActionResult> {
  try {
    await api(`/me/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function renamePasskey(id: string, name: string): Promise<ActionResult> {
  try {
    await api(`/me/passkeys/${encodeURIComponent(id)}`, { method: 'PATCH', body: { name } });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function removePasskey(id: string): Promise<ActionResult> {
  try {
    await api(`/me/passkeys/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function requestEmailChange(email: string): Promise<ActionResult> {
  try {
    await api('/me/email/change', { method: 'POST', body: { email } });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function confirmEmailChange(email: string, code: string): Promise<ActionResult> {
  try {
    await api('/me/email/confirm', { method: 'POST', body: { email, code } });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ avatar: string }>> {
  try {
    const data = await api<{ avatar: string }>('/me/avatar', { method: 'POST', raw: formData });
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function savePushSubscription(subscription: unknown): Promise<ActionResult> {
  try {
    await api('/me/push', { method: 'POST', body: subscription });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  try {
    await api('/me/push', { method: 'DELETE', body: { endpoint } });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function applyModerationAction(
  flagId: string,
  action: string,
  note: string,
): Promise<ActionResult> {
  try {
    await api(`/admin/flags/${encodeURIComponent(flagId)}/action`, {
      method: 'POST',
      body: { action, note: note || undefined },
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(error);
  }
}
