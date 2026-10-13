'use client';

import { db } from '@/lib/db';

import { createPost } from '../posts/actions';

import type { CreatePostInput } from '@inkwell/shared';

const MAX_ATTEMPTS = 8;

export async function enqueuePublish(payload: CreatePostInput): Promise<string> {
  const id = crypto.randomUUID();
  await db().queue.add({
    id,
    kind: 'createPost',
    payload,
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
  });
  await requestBackgroundSync();
  return id;
}

export async function pendingCount(): Promise<number> {
  return db().queue.count();
}

/**
 * Sends queued publications in order. `clientId` on each payload makes the
 * server call idempotent, so a lost response never creates a duplicate.
 */
export async function flushQueue(): Promise<{ sent: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { sent: 0, failed: 0 };
  const items = await db().queue.orderBy('createdAt').toArray();
  let sent = 0;
  let failed = 0;
  for (const item of items) {
    const result = await createPost(item.payload);
    if (result.ok) {
      await db().queue.delete(item.id);
      sent += 1;
      continue;
    }
    // Validation failures will never succeed; drop them so they do not block the queue.
    const permanent = result.error !== 'INTERNAL' && result.error !== 'RATE_LIMITED';
    if (permanent || item.attempts + 1 >= MAX_ATTEMPTS) {
      await db().queue.delete(item.id);
    } else {
      await db().queue.update(item.id, { attempts: item.attempts + 1, lastError: result.error });
    }
    failed += 1;
  }
  return { sent, failed };
}

async function requestBackgroundSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sync = (
      registration as ServiceWorkerRegistration & {
        sync?: { register(tag: string): Promise<void> };
      }
    ).sync;
    if (sync) await sync.register('publish-queue');
  } catch {
    // Background Sync is optional; the online listener covers the rest.
  }
}
