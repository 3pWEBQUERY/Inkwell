import { and, eq, isNotNull, lte } from 'drizzle-orm';

import { posts } from '../db/schema.js';

import type { Database } from '../db/client.js';

/**
 * Expired texts leave the room but stay in the author's journal. The body is
 * kept; only the status changes, so the author can still read and export it.
 */
export async function expirePosts(db: Database, now: Date = new Date()): Promise<number> {
  const rows = await db
    .update(posts)
    .set({ status: 'expired', updatedAt: now })
    .where(and(isNotNull(posts.expiresAt), lte(posts.expiresAt, now), eq(posts.status, 'visible')))
    .returning({ id: posts.id });
  return rows.length;
}
