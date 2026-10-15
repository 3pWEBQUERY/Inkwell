import { and, asc, eq, isNull } from 'drizzle-orm';
import { strToU8, zipSync, type Zippable } from 'fflate';

import { LIMITS } from '@inkwell/shared';

import { comments, exports, posts, reactions, rooms, users, type UserRow } from '../db/schema.js';
import { ApiError } from '../lib/errors.js';
import { newId } from '../lib/ids.js';

import type { Database } from '../db/client.js';
import type { Storage } from '../lib/storage.js';

/**
 * Builds the server-side half of the data export: shared texts as Markdown with
 * YAML front matter in one folder per year, plus profile, reactions and comments
 * as JSON. Private entries are decrypted and added in the browser; the server
 * never sees their plaintext.
 */
export async function requestExport(db: Database, user: UserRow): Promise<string> {
  const [active] = await db
    .select({ id: exports.id })
    .from(exports)
    .where(and(eq(exports.userId, user.id), eq(exports.status, 'processing')))
    .limit(1);
  if (active) throw new ApiError('EXPORT_IN_PROGRESS');
  const id = newId();
  await db.insert(exports).values({ id, userId: user.id, status: 'pending' });
  return id;
}

export async function buildExportArchive(db: Database, user: UserRow): Promise<Uint8Array> {
  const rows = await db
    .select({ post: posts, roomName: rooms.name, roomSlug: rooms.slug })
    .from(posts)
    .leftJoin(rooms, eq(rooms.id, posts.roomId))
    .where(and(eq(posts.authorId, user.id), isNull(posts.deletedAt)))
    .orderBy(asc(posts.createdAt));

  const files: Zippable = {};

  for (const { post, roomName, roomSlug } of rows) {
    const year = String(post.createdAt.getUTCFullYear());
    const date = post.createdAt.toISOString().slice(0, 10);
    const slug =
      (post.title ?? post.id)
        .toLowerCase()
        .replace(/[^a-z0-9]+/gu, '-')
        .replace(/^-|-$/gu, '')
        .slice(0, 60) || post.id;
    const name = `${year}/${date}-${slug}.md`;
    if (post.visibility === 'private') {
      // Only a stub: the browser replaces it with the decrypted entry.
      files[`${year}/${date}-${post.id}.private.json`] = strToU8(
        JSON.stringify(
          {
            id: post.id,
            createdAt: post.createdAt.toISOString(),
            opensAt: post.opensAt?.toISOString() ?? null,
            ciphertext: post.ciphertext,
            nonce: post.nonce,
            wrappedKey: post.wrappedKey,
          },
          null,
          2,
        ),
      );
      continue;
    }
    const frontMatter = [
      '---',
      `id: ${post.id}`,
      `type: ${post.type}`,
      `visibility: ${post.visibility}`,
      `created: ${post.createdAt.toISOString()}`,
      post.editedAt ? `edited: ${post.editedAt.toISOString()}` : null,
      roomName ? `room: "${roomName.replace(/"/g, '\\"')}"` : null,
      roomSlug ? `room_slug: ${roomSlug}` : null,
      post.title ? `title: "${post.title.replace(/"/g, '\\"')}"` : null,
      post.expiresAt ? `expires: ${post.expiresAt.toISOString()}` : null,
      `status: ${post.status}`,
      '---',
      '',
    ]
      .filter((line): line is string => line !== null)
      .join('\n');
    files[name] = strToU8(`${frontMatter}${post.body ?? ''}\n`);
  }

  const reactionRows = await db
    .select({ postId: reactions.postId, kind: reactions.kind, createdAt: reactions.createdAt })
    .from(reactions)
    .innerJoin(posts, eq(posts.id, reactions.postId))
    .where(eq(posts.authorId, user.id));
  const commentRows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      body: comments.body,
      mode: comments.mode,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(and(eq(comments.authorId, user.id), isNull(comments.deletedAt)));

  files['profile.json'] = strToU8(
    JSON.stringify(
      {
        pseudonym: user.pseudonym,
        email: user.email,
        locale: user.locale,
        roomLocales: user.roomLocales,
        createdAt: user.createdAt.toISOString(),
        settings: user.settings,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  files['reactions.json'] = strToU8(JSON.stringify(reactionRows, null, 2));
  files['comments.json'] = strToU8(JSON.stringify(commentRows, null, 2));
  files['README.txt'] = strToU8(
    'Shared texts are in one folder per year as Markdown with YAML front matter.\n' +
      'Files ending in .private.json are encrypted entries; the app replaces them with decrypted Markdown while you download.\n',
  );

  return zipSync(files, { level: 6 });
}

export async function processPendingExports(db: Database, storage: Storage): Promise<number> {
  const pending = await db.select().from(exports).where(eq(exports.status, 'pending')).limit(10);
  let processed = 0;
  for (const job of pending) {
    await db
      .update(exports)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(exports.id, job.id));
    try {
      const [user] = await db.select().from(users).where(eq(users.id, job.userId)).limit(1);
      if (!user) throw new Error('user missing');
      const archive = await buildExportArchive(db, user);
      const key = `exports/${job.userId}/${job.id}.zip`;
      await storage.put(key, archive, 'application/zip');
      await db
        .update(exports)
        .set({
          status: 'ready',
          s3Key: key,
          expiresAt: new Date(Date.now() + LIMITS.exportLinkHours * 3_600_000),
          updatedAt: new Date(),
        })
        .where(eq(exports.id, job.id));
      processed += 1;
    } catch (error) {
      await db
        .update(exports)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'unknown',
          updatedAt: new Date(),
        })
        .where(eq(exports.id, job.id));
    }
  }
  return processed;
}

export async function expireExports(
  db: Database,
  storage: Storage,
  now = new Date(),
): Promise<number> {
  const stale = await db.select().from(exports).where(eq(exports.status, 'ready'));
  let count = 0;
  for (const job of stale) {
    if (job.expiresAt && job.expiresAt.getTime() <= now.getTime()) {
      if (job.s3Key) await storage.remove(job.s3Key);
      await db
        .update(exports)
        .set({ status: 'expired', updatedAt: now })
        .where(eq(exports.id, job.id));
      count += 1;
    }
  }
  return count;
}
