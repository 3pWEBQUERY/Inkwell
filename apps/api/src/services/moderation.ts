import { and, asc, desc, eq, gt, inArray, isNull, sql } from 'drizzle-orm';

import {
  LIMITS,
  firstLine,
  type CreateReportInput,
  type FlagStatus,
  type ModerationAction,
  type ModerationQueueItem,
  type ReportReason,
} from '@inkwell/shared';

import {
  comments,
  moderationFlags,
  moderationNotices,
  posts,
  rooms,
  users,
  type FlagRow,
  type UserRow,
} from '../db/schema.js';
import { ApiError } from '../lib/errors.js';
import { newId } from '../lib/ids.js';
import { moderationNoticeMail, type Mailer } from '../lib/mail.js';

import type { Database, DbOrTx } from '../db/client.js';

const PRIORITY_BY_REASON: Record<ReportReason, 1 | 2 | 3> = {
  self_harm_other: 1,
  violence: 2,
  harassment: 2,
  hate: 2,
  sexual: 3,
  spam: 3,
  copyright: 3,
  other: 3,
};

export async function createReport(
  db: Database,
  reporter: UserRow,
  input: CreateReportInput,
): Promise<FlagRow> {
  const authorId = await targetAuthorId(db, input.targetType, input.targetId);
  if (!authorId) throw new ApiError('NOT_FOUND');

  const [flag] = await db
    .insert(moderationFlags)
    .values({
      id: newId(),
      targetType: input.targetType,
      targetId: input.targetId,
      reporterId: reporter.id,
      reason: input.reason,
      freeText: input.freeText?.trim() || null,
      priority: PRIORITY_BY_REASON[input.reason],
    })
    .onConflictDoNothing()
    .returning();
  if (!flag) throw new ApiError('ALREADY_REPORTED');

  await autoHideIfNeeded(db, input.targetType, input.targetId);
  return flag;
}

/** A spam-heuristic hit creates a system flag so the text lands in the queue without deleting anything. */
export async function createSystemFlag(
  db: DbOrTx,
  targetType: 'post' | 'comment',
  targetId: string,
  detail: string,
): Promise<void> {
  const [system] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.pseudonym, 'system'))
    .limit(1);
  if (!system) return;
  await db
    .insert(moderationFlags)
    .values({
      id: newId(),
      targetType,
      targetId,
      reporterId: system.id,
      reason: 'spam',
      freeText: detail,
      priority: 3,
    })
    .onConflictDoNothing();
}

/** Three independent reports within 24 h hide the target until a review happens. */
async function autoHideIfNeeded(
  db: Database,
  targetType: 'post' | 'comment',
  targetId: string,
): Promise<void> {
  const since = new Date(Date.now() - 86_400_000);
  const [row] = await db
    .select({ count: sql<number>`count(distinct ${moderationFlags.reporterId})::int` })
    .from(moderationFlags)
    .where(
      and(
        eq(moderationFlags.targetType, targetType),
        eq(moderationFlags.targetId, targetId),
        gt(moderationFlags.createdAt, since),
        inArray(moderationFlags.status, ['open', 'reviewing']),
      ),
    );
  if ((row?.count ?? 0) < LIMITS.autoHideReportThreshold) return;
  if (targetType === 'post') {
    await db
      .update(posts)
      .set({ status: 'hidden_pending', updatedAt: new Date() })
      .where(and(eq(posts.id, targetId), eq(posts.status, 'visible')));
  } else {
    await db
      .update(comments)
      .set({ hiddenAt: new Date() })
      .where(and(eq(comments.id, targetId), isNull(comments.hiddenAt)));
  }
}

async function targetAuthorId(
  db: DbOrTx,
  targetType: 'post' | 'comment',
  targetId: string,
): Promise<string | null> {
  if (targetType === 'post') {
    const [post] = await db
      .select({ authorId: posts.authorId, visibility: posts.visibility })
      .from(posts)
      .where(and(eq(posts.id, targetId), isNull(posts.deletedAt)))
      .limit(1);
    return post && post.visibility !== 'private' ? post.authorId : null;
  }
  const [comment] = await db
    .select({ authorId: comments.authorId })
    .from(comments)
    .where(and(eq(comments.id, targetId), isNull(comments.deletedAt)))
    .limit(1);
  return comment?.authorId ?? null;
}

export async function queue(
  db: Database,
  status: FlagStatus | undefined,
): Promise<ModerationQueueItem[]> {
  const statuses: FlagStatus[] = status ? [status] : ['open', 'reviewing'];
  const grouped = await db
    .select({
      targetType: moderationFlags.targetType,
      targetId: moderationFlags.targetId,
      priority: sql<number>`min(${moderationFlags.priority})::int`,
      count: sql<number>`count(distinct ${moderationFlags.reporterId})::int`,
      firstAt: sql<Date>`min(${moderationFlags.createdAt})`,
      status: sql<FlagStatus>`min(${moderationFlags.status})`,
    })
    .from(moderationFlags)
    .where(inArray(moderationFlags.status, statuses))
    .groupBy(moderationFlags.targetType, moderationFlags.targetId)
    .orderBy(
      asc(sql`min(${moderationFlags.priority})`),
      asc(sql`min(${moderationFlags.createdAt})`),
    )
    .limit(200);

  const items: ModerationQueueItem[] = [];
  for (const group of grouped) {
    const [flag] = await db
      .select()
      .from(moderationFlags)
      .where(
        and(
          eq(moderationFlags.targetType, group.targetType),
          eq(moderationFlags.targetId, group.targetId),
          inArray(moderationFlags.status, statuses),
        ),
      )
      .orderBy(asc(moderationFlags.priority), asc(moderationFlags.createdAt))
      .limit(1);
    if (!flag) continue;
    const target = await describeTarget(db, group.targetType, group.targetId);
    if (!target) continue;
    const history = await accountHistory(db, target.authorId);
    items.push({
      id: flag.id,
      priority: group.priority as 1 | 2 | 3,
      reason: flag.reason,
      reportCount: group.count,
      status: group.status,
      targetType: group.targetType,
      targetId: group.targetId,
      preview: target.preview,
      roomName: target.roomName,
      createdAt: new Date(group.firstAt).toISOString(),
      accountHistory: history,
      freeText: flag.freeText,
    });
  }
  return items;
}

async function describeTarget(db: DbOrTx, targetType: 'post' | 'comment', targetId: string) {
  if (targetType === 'post') {
    const [row] = await db
      .select({
        authorId: posts.authorId,
        body: posts.body,
        title: posts.title,
        roomName: rooms.name,
      })
      .from(posts)
      .leftJoin(rooms, eq(rooms.id, posts.roomId))
      .where(eq(posts.id, targetId))
      .limit(1);
    if (!row) return null;
    const preview = row.title
      ? `${row.title} — ${firstLine(row.body ?? '', 240)}`
      : firstLine(row.body ?? '', 280);
    return { authorId: row.authorId, preview, roomName: row.roomName };
  }
  const [row] = await db
    .select({ authorId: comments.authorId, body: comments.body, roomName: rooms.name })
    .from(comments)
    .innerJoin(posts, eq(posts.id, comments.postId))
    .leftJoin(rooms, eq(rooms.id, posts.roomId))
    .where(eq(comments.id, targetId))
    .limit(1);
  if (!row) return null;
  return { authorId: row.authorId, preview: firstLine(row.body, 280), roomName: row.roomName };
}

/** Prior warnings and suspensions, never the person's name or e-mail. */
async function accountHistory(db: DbOrTx, userId: string) {
  const [user] = await db
    .select({ warnings: users.warningsCount })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const [suspensions] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(moderationNotices)
    .where(
      and(
        eq(moderationNotices.userId, userId),
        inArray(moderationNotices.action, ['suspend_7d', 'suspend_permanent']),
      ),
    );
  const [previous] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(moderationNotices)
    .where(eq(moderationNotices.userId, userId));
  return {
    warnings: user?.warnings ?? 0,
    suspensions: suspensions?.count ?? 0,
    previousFlags: previous?.count ?? 0,
  };
}

export async function applyAction(
  db: Database,
  mailer: Mailer,
  reviewer: UserRow,
  flagId: string,
  action: ModerationAction,
  note: string | undefined,
): Promise<void> {
  const [flag] = await db
    .select()
    .from(moderationFlags)
    .where(eq(moderationFlags.id, flagId))
    .limit(1);
  if (!flag) throw new ApiError('FLAG_NOT_FOUND');
  if (action !== 'keep' && !note?.trim())
    throw new ApiError('VALIDATION_FAILED', { field: 'note' });

  const authorId = await targetAuthorId(db, flag.targetType, flag.targetId);
  const now = new Date();

  await db.transaction(async (tx) => {
    switch (action) {
      case 'keep':
        if (flag.targetType === 'post') {
          await tx
            .update(posts)
            .set({ status: 'visible', updatedAt: now })
            .where(and(eq(posts.id, flag.targetId), eq(posts.status, 'hidden_pending')));
        } else {
          await tx.update(comments).set({ hiddenAt: null }).where(eq(comments.id, flag.targetId));
        }
        break;
      case 'hide':
        if (flag.targetType === 'post') {
          await tx
            .update(posts)
            .set({ status: 'hidden', updatedAt: now })
            .where(eq(posts.id, flag.targetId));
        } else {
          await tx.update(comments).set({ hiddenAt: now }).where(eq(comments.id, flag.targetId));
        }
        break;
      case 'delete':
        if (flag.targetType === 'post') {
          await tx
            .update(posts)
            .set({ status: 'hidden', deletedAt: now, updatedAt: now })
            .where(eq(posts.id, flag.targetId));
        } else {
          await tx
            .update(comments)
            .set({ deletedAt: now, hiddenAt: now })
            .where(eq(comments.id, flag.targetId));
        }
        break;
      case 'warn':
        if (authorId) {
          await tx
            .update(users)
            .set({ warningsCount: sql`${users.warningsCount} + 1`, updatedAt: now })
            .where(eq(users.id, authorId));
        }
        break;
      case 'suspend_7d':
        if (authorId) {
          await tx
            .update(users)
            .set({ suspendedUntil: new Date(now.getTime() + 7 * 86_400_000), updatedAt: now })
            .where(eq(users.id, authorId));
        }
        break;
      case 'suspend_permanent':
        if (authorId) {
          await tx
            .update(users)
            .set({ suspendedPermanently: true, updatedAt: now })
            .where(eq(users.id, authorId));
        }
        break;
    }

    const resolvedStatus: FlagStatus = action === 'keep' ? 'dismissed' : 'actioned';
    await tx
      .update(moderationFlags)
      .set({
        status: resolvedStatus,
        reviewerId: reviewer.id,
        action,
        note: note ?? null,
        resolvedAt: now,
      })
      .where(
        and(
          eq(moderationFlags.targetType, flag.targetType),
          eq(moderationFlags.targetId, flag.targetId),
          inArray(moderationFlags.status, ['open', 'reviewing']),
        ),
      );

    if (authorId && action !== 'keep' && note) {
      await tx
        .insert(moderationNotices)
        .values({ id: newId(), userId: authorId, flagId: flag.id, action, note });
    }
  });

  if (authorId && action !== 'keep' && note) {
    const [author] = await db
      .select({ email: users.email, locale: users.locale })
      .from(users)
      .where(eq(users.id, authorId))
      .limit(1);
    if (author) await mailer.send(moderationNoticeMail(author.email, note, author.locale));
  }
}

export async function noticesFor(db: Database, userId: string) {
  return db
    .select()
    .from(moderationNotices)
    .where(eq(moderationNotices.userId, userId))
    .orderBy(desc(moderationNotices.createdAt))
    .limit(20);
}
