import { and, eq, isNull, sql } from 'drizzle-orm';

import { postScores, posts, rooms, votes } from '../db/schema.js';

import type { Database } from '../db/client.js';

/**
 * Fiction ranking: net votes with time decay,
 * score = net / (ageHours + 2) ^ 1.5. Materialised hourly, read by "This week" and "Top".
 */
export function rankingScore(netVotes: number, ageHours: number): number {
  const age = Math.max(0, ageHours);
  return netVotes / Math.pow(age + 2, 1.5);
}

export function ageInHours(createdAt: Date, now: Date = new Date()): number {
  return (now.getTime() - createdAt.getTime()) / 3_600_000;
}

/** Recomputes scores for every visible post in a fiction room. */
export async function materializeScores(db: Database, now: Date = new Date()): Promise<number> {
  const rows = await db
    .select({
      id: posts.id,
      createdAt: posts.createdAt,
      net: sql<number>`coalesce(sum(${votes.value}), 0)::int`,
    })
    .from(posts)
    .innerJoin(rooms, eq(rooms.id, posts.roomId))
    .leftJoin(votes, eq(votes.postId, posts.id))
    .where(and(eq(rooms.kind, 'fiction'), eq(posts.status, 'visible'), isNull(posts.deletedAt)))
    .groupBy(posts.id, posts.createdAt);

  if (rows.length === 0) return 0;

  await db.transaction(async (tx) => {
    for (const row of rows) {
      const score = rankingScore(row.net, ageInHours(row.createdAt, now));
      await tx
        .insert(postScores)
        .values({ postId: row.id, score, netVotes: row.net, computedAt: now })
        .onConflictDoUpdate({
          target: postScores.postId,
          set: { score, netVotes: row.net, computedAt: now },
        });
    }
  });

  return rows.length;
}
