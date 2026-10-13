import { eq, or } from 'drizzle-orm';

import { blocks } from '../db/schema.js';

import type { DbOrTx } from '../db/client.js';

/**
 * Blocking is mutual: neither person sees the other's texts or comments.
 * Returns every user id hidden from `userId`.
 */
export async function hiddenUserIds(db: DbOrTx, userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await db
    .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
    .from(blocks)
    .where(or(eq(blocks.blockerId, userId), eq(blocks.blockedId, userId)));
  const hidden = new Set<string>();
  for (const row of rows) hidden.add(row.blockerId === userId ? row.blockedId : row.blockerId);
  return hidden;
}
