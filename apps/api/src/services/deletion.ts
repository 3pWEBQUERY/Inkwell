import { and, eq, isNotNull, lte } from 'drizzle-orm';

import { LIMITS } from '@inkwell/shared';

import { sessions, users, type UserRow } from '../db/schema.js';
import { deletionScheduledMail, type Mailer } from '../lib/mail.js';

import type { Database } from '../db/client.js';

/** Step one: soft delete with a 30-day grace period; every session is revoked. */
export async function scheduleDeletion(
  db: Database,
  mailer: Mailer,
  user: UserRow,
  now = new Date(),
): Promise<Date> {
  const purgeAfter = new Date(now.getTime() + LIMITS.accountDeletionGraceDays * 86_400_000);
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ deletedAt: now, purgeAfter, updatedAt: now })
      .where(eq(users.id, user.id));
    await tx.update(sessions).set({ revokedAt: now }).where(eq(sessions.userId, user.id));
  });
  await mailer.send(
    deletionScheduledMail(user.email, purgeAfter.toISOString().slice(0, 10), user.locale),
  );
  return purgeAfter;
}

export async function revokeDeletion(db: Database, user: UserRow, now = new Date()): Promise<void> {
  await db
    .update(users)
    .set({ deletedAt: null, purgeAfter: null, updatedAt: now })
    .where(eq(users.id, user.id));
}

/** Step two, run by cron: hard delete after the grace period. Cascades remove everything. */
export async function purgeDeletedAccounts(db: Database, now = new Date()): Promise<number> {
  const rows = await db
    .delete(users)
    .where(and(isNotNull(users.deletedAt), isNotNull(users.purgeAfter), lte(users.purgeAfter, now)))
    .returning({ id: users.id });
  return rows.length;
}
