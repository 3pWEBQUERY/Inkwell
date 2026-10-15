import { and, asc, desc, eq, gt, inArray, isNull, lt, or, sql } from 'drizzle-orm';

import {
  LIMITS,
  canChangeVisibility,
  countChars,
  countWords,
  expiresAtFor,
  firstLine,
  isWithinEditWindow,
  type CreatePostInput,
  type CursorPage,
  type FeedPost,
  type FeedSort,
  type JournalPost,
  type ReactionKind,
  type ReactionSummary,
  type UpdatePostInput,
} from '@inkwell/shared';

import {
  bookmarks,
  comments,
  postScores,
  posts,
  reactions,
  roomMembers,
  rooms,
  series,
  users,
  votes,
  type PostRow,
  type RoomRow,
  type UserRow,
} from '../db/schema.js';
import { decodeCursor, encodeCursor } from '../lib/cursor.js';
import { ApiError } from '../lib/errors.js';
import { newId } from '../lib/ids.js';

import { hiddenUserIds } from './blocks.js';
import { fingerprint, linkSignals, repeatSignal, type SpamSignal } from './spam.js';

import type { Database, DbOrTx } from '../db/client.js';

export interface CreatedPost {
  post: PostRow;
  spamSignals: SpamSignal[];
}

export async function createPost(
  db: Database,
  author: UserRow,
  input: CreatePostInput,
): Promise<CreatedPost> {
  const now = new Date();

  if (input.visibility === 'private') {
    const [post] = await db
      .insert(posts)
      .values({
        id: newId(),
        authorId: author.id,
        type: input.type,
        visibility: 'private',
        ciphertext: input.ciphertext,
        nonce: input.nonce,
        wrappedKey: input.wrappedKey,
        clientId: input.clientId ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: [posts.authorId, posts.clientId] })
      .returning();
    if (!post) {
      const existing = await findByClientId(db, author.id, input.clientId);
      if (existing) return { post: existing, spamSignals: [] };
      throw new ApiError('CONFLICT');
    }
    return { post, spamSignals: [] };
  }

  const body = input.body.trim();
  validateSharedBody(input.type, body, input.title);

  const room = await requireRoom(db, input.roomId);
  if (room.kind === 'fiction' && input.visibility === 'anonymous')
    throw new ApiError('ANON_NOT_ALLOWED_IN_ROOM');
  if (room.kind === 'fiction' && input.type !== 'story')
    throw new ApiError('VALIDATION_FAILED', { field: 'type' });
  if (room.kind === 'reflection' && input.type === 'story')
    throw new ApiError('VALIDATION_FAILED', { field: 'type' });
  await requireMembership(db, room.id, author.id);

  let chapter: number | null = null;
  if (input.seriesId) {
    if (input.type !== 'story' || input.visibility !== 'public')
      throw new ApiError('VALIDATION_FAILED', { field: 'seriesId' });
    const [owned] = await db.select().from(series).where(eq(series.id, input.seriesId)).limit(1);
    if (!owned) throw new ApiError('SERIES_NOT_FOUND');
    if (owned.authorId !== author.id) throw new ApiError('SERIES_NOT_OWNED');
    const [last] = await db
      .select({ chapter: posts.chapter })
      .from(posts)
      .where(and(eq(posts.seriesId, input.seriesId), isNull(posts.deletedAt)))
      .orderBy(desc(posts.chapter))
      .limit(1);
    chapter = (last?.chapter ?? 0) + 1;
  }

  const recent = await db
    .select({ body: posts.body })
    .from(posts)
    .where(
      and(
        eq(posts.authorId, author.id),
        gt(posts.createdAt, new Date(now.getTime() - 86_400_000)),
        isNull(posts.deletedAt),
      ),
    )
    .limit(50);
  const spamSignals = [
    ...linkSignals(body),
    ...repeatSignal(
      body,
      recent.map((row) => (row.body ? fingerprint(row.body) : '')),
    ),
  ];

  const [post] = await db
    .insert(posts)
    .values({
      id: newId(),
      authorId: author.id,
      roomId: room.id,
      type: input.type,
      visibility: input.visibility,
      title: input.type === 'story' ? input.title : (input.title ?? null),
      body,
      wordCount: countWords(body),
      expiry: input.expiry,
      expiresAt: expiresAtFor(input.expiry, now),
      commentsEnabled: input.commentsEnabled ?? input.visibility === 'public',
      seriesId: input.seriesId,
      chapter,
      clientId: input.clientId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: [posts.authorId, posts.clientId] })
    .returning();

  if (!post) {
    const existing = await findByClientId(db, author.id, input.clientId);
    if (existing) return { post: existing, spamSignals: [] };
    throw new ApiError('CONFLICT');
  }
  return { post, spamSignals };
}

async function findByClientId(
  db: DbOrTx,
  authorId: string,
  clientId: string | undefined,
): Promise<PostRow | null> {
  if (!clientId) return null;
  const [row] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.authorId, authorId), eq(posts.clientId, clientId)))
    .limit(1);
  return row ?? null;
}

export function validateSharedBody(
  type: 'thought' | 'story',
  body: string,
  title: string | null | undefined,
): void {
  const chars = countChars(body);
  if (chars < LIMITS.sharedPostMinChars)
    throw new ApiError('POST_TOO_SHORT', { min: LIMITS.sharedPostMinChars });
  const max = type === 'story' ? LIMITS.storyMaxChars : LIMITS.thoughtMaxChars;
  if (chars > max) throw new ApiError('POST_TOO_LONG', { max });
  if (type === 'story' && !title?.trim()) throw new ApiError('TITLE_REQUIRED');
  if (title && title.length > LIMITS.titleMaxChars)
    throw new ApiError('TITLE_TOO_LONG', { max: LIMITS.titleMaxChars });
}

export async function requireRoom(db: DbOrTx, roomId: string): Promise<RoomRow> {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) throw new ApiError('ROOM_NOT_FOUND');
  return room;
}

export async function requireRoomBySlug(db: DbOrTx, slug: string): Promise<RoomRow> {
  const [room] = await db.select().from(rooms).where(eq(rooms.slug, slug)).limit(1);
  if (!room) throw new ApiError('ROOM_NOT_FOUND');
  return room;
}

async function requireMembership(db: DbOrTx, roomId: string, userId: string): Promise<void> {
  const [member] = await db
    .select({ userId: roomMembers.userId })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .limit(1);
  if (!member) throw new ApiError('ROOM_NOT_JOINED');
}

export async function requireOwnPost(db: DbOrTx, postId: string, userId: string): Promise<PostRow> {
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);
  if (post?.authorId !== userId) throw new ApiError('POST_NOT_FOUND');
  return post;
}

export async function updatePost(
  db: Database,
  author: UserRow,
  postId: string,
  input: UpdatePostInput,
): Promise<PostRow> {
  const post = await requireOwnPost(db, postId, author.id);
  const now = new Date();
  const patch: Partial<typeof posts.$inferInsert> = { updatedAt: now };

  if (input.visibility && input.visibility !== post.visibility) {
    if (!canChangeVisibility(post.visibility, input.visibility))
      throw new ApiError('VISIBILITY_CANNOT_EXPAND');
    patch.visibility = input.visibility;
    if (input.visibility === 'private') {
      if (!input.ciphertext || !input.nonce || !input.wrappedKey)
        throw new ApiError('CIPHERTEXT_REQUIRED');
      Object.assign(patch, {
        ciphertext: input.ciphertext,
        nonce: input.nonce,
        wrappedKey: input.wrappedKey,
        body: null,
        title: null,
        roomId: null,
        expiry: 'none',
        expiresAt: null,
        commentsEnabled: false,
        seriesId: null,
        chapter: null,
        status: 'visible',
      });
    }
    if (input.visibility === 'anonymous' && post.visibility === 'public') {
      if (post.type === 'story') throw new ApiError('ANON_NOT_ALLOWED_IN_ROOM');
      patch.seriesId = null;
      patch.chapter = null;
    }
  }

  const editingContent = input.body !== undefined || input.title !== undefined;
  if (editingContent) {
    if (post.visibility === 'private') {
      // Private entries are edited by uploading a fresh ciphertext triple.
      if (input.body !== undefined) throw new ApiError('PLAINTEXT_NOT_ALLOWED');
    } else {
      const editable =
        post.type === 'story' || isWithinEditWindow(post.createdAt, LIMITS.editWindowMinutes, now);
      if (!editable) throw new ApiError('EDIT_WINDOW_CLOSED');
      const body = (input.body ?? post.body ?? '').trim();
      const title = input.title === undefined ? post.title : input.title;
      validateSharedBody(post.type, body, title);
      patch.body = body;
      patch.title = title;
      patch.wordCount = countWords(body);
      patch.editedAt = now;
    }
  }

  if (
    post.visibility === 'private' &&
    input.ciphertext &&
    input.nonce &&
    input.wrappedKey &&
    !input.visibility
  ) {
    Object.assign(patch, {
      ciphertext: input.ciphertext,
      nonce: input.nonce,
      wrappedKey: input.wrappedKey,
      editedAt: now,
    });
  }

  if (input.commentsEnabled !== undefined) patch.commentsEnabled = input.commentsEnabled;

  const [updated] = await db.update(posts).set(patch).where(eq(posts.id, post.id)).returning();
  if (!updated) throw new ApiError('POST_NOT_FOUND');
  return updated;
}

/** Burning is a hard delete: reactions, votes and comments cascade. Backups expire after 30 days. */
export async function burnPost(db: Database, author: UserRow, postId: string): Promise<void> {
  const post = await requireOwnPost(db, postId, author.id);
  await db.delete(posts).where(eq(posts.id, post.id));
}

export interface Viewer {
  userId: string | null;
  hidden: Set<string>;
}

export async function viewerFor(db: DbOrTx, userId: string | null): Promise<Viewer> {
  return { userId, hidden: await hiddenUserIds(db, userId) };
}

interface FeedRow {
  post: PostRow;
  room: RoomRow;
  authorPseudonym: string;
  authorAvatar: string;
  seriesTitle: string | null;
}

export async function roomFeed(
  db: Database,
  room: RoomRow,
  viewer: Viewer,
  options: { cursor?: string | undefined; sort?: FeedSort | undefined },
): Promise<CursorPage<FeedPost>> {
  const sort: FeedSort = room.kind === 'fiction' ? (options.sort ?? room.sortDefault) : 'new';
  const pageSize = LIMITS.feedPageSize;
  const cursor = decodeCursor(options.cursor);
  const now = new Date();

  const base = db
    .select({
      post: posts,
      room: rooms,
      authorPseudonym: users.pseudonym,
      authorAvatar: users.avatar,
      seriesTitle: series.title,
    })
    .from(posts)
    .innerJoin(rooms, eq(rooms.id, posts.roomId))
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(series, eq(series.id, posts.seriesId))
    .$dynamic();

  const visibleWhere = [
    eq(posts.roomId, room.id),
    eq(posts.status, 'visible'),
    isNull(posts.deletedAt),
    isNull(users.deletedAt),
    or(isNull(posts.expiresAt), gt(posts.expiresAt, now)),
  ];

  let rows: FeedRow[];

  if (sort === 'new') {
    const where = cursor
      ? and(
          ...visibleWhere,
          or(
            lt(posts.createdAt, cursor.createdAt),
            and(eq(posts.createdAt, cursor.createdAt), lt(posts.id, cursor.id)),
          ),
        )
      : and(...visibleWhere);
    rows = await base
      .where(where)
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(pageSize + 1);
  } else {
    const offset = cursor ? Number.parseInt(cursor.id, 10) || 0 : 0;
    const windowWhere =
      sort === 'week' ? [gt(posts.createdAt, new Date(now.getTime() - 7 * 86_400_000))] : [];
    rows = await base
      .leftJoin(postScores, eq(postScores.postId, posts.id))
      .where(and(...visibleWhere, ...windowWhere))
      .orderBy(desc(sql`coalesce(${postScores.score}, 0)`), desc(posts.createdAt))
      .limit(pageSize + 1)
      .offset(offset);
    const filtered = rows.filter((row) => !viewer.hidden.has(row.post.authorId)).slice(0, pageSize);
    const hasMore = rows.length > pageSize;
    const items = await decorate(db, filtered, viewer);
    return {
      items,
      nextCursor: hasMore ? encodeCursor({ createdAt: now, id: String(offset + pageSize) }) : null,
    };
  }

  const hasMore = rows.length > pageSize;
  const page = rows.slice(0, pageSize).filter((row) => !viewer.hidden.has(row.post.authorId));
  const last = rows[pageSize - 1];
  const items = await decorate(db, page, viewer);
  return {
    items,
    nextCursor:
      hasMore && last ? encodeCursor({ createdAt: last.post.createdAt, id: last.post.id }) : null,
  };
}

/** Newest texts across the rooms a member has joined, for /today. */
export async function todayFeed(db: Database, viewer: Viewer, userId: string): Promise<FeedPost[]> {
  const now = new Date();
  const rows = await db
    .select({
      post: posts,
      room: rooms,
      authorPseudonym: users.pseudonym,
      authorAvatar: users.avatar,
      seriesTitle: series.title,
    })
    .from(posts)
    .innerJoin(rooms, eq(rooms.id, posts.roomId))
    .innerJoin(roomMembers, and(eq(roomMembers.roomId, rooms.id), eq(roomMembers.userId, userId)))
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(series, eq(series.id, posts.seriesId))
    .where(
      and(
        eq(posts.status, 'visible'),
        isNull(posts.deletedAt),
        isNull(users.deletedAt),
        or(isNull(posts.expiresAt), gt(posts.expiresAt, now)),
        gt(posts.createdAt, new Date(now.getTime() - 7 * 86_400_000)),
      ),
    )
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(LIMITS.todayMaxItems * 2);
  const page = rows
    .filter((row) => !viewer.hidden.has(row.post.authorId))
    .slice(0, LIMITS.todayMaxItems);
  return decorate(db, page, viewer);
}

export async function findFeedPost(
  db: Database,
  postId: string,
  viewer: Viewer,
): Promise<FeedPost | null> {
  const now = new Date();
  const [row] = await db
    .select({
      post: posts,
      room: rooms,
      authorPseudonym: users.pseudonym,
      authorAvatar: users.avatar,
      seriesTitle: series.title,
    })
    .from(posts)
    .innerJoin(rooms, eq(rooms.id, posts.roomId))
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(series, eq(series.id, posts.seriesId))
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt), isNull(users.deletedAt)))
    .limit(1);
  if (!row) return null;
  if (row.post.visibility === 'private') return null;
  const isAuthor = row.post.authorId === viewer.userId;
  const live = row.post.status === 'visible' && (!row.post.expiresAt || row.post.expiresAt > now);
  if (!live && !isAuthor) return null;
  if (viewer.hidden.has(row.post.authorId)) return null;
  const [item] = await decorate(db, [row], viewer);
  return item ?? null;
}

/** Public profile: texts shared with pseudonym, newest first. */
export async function profilePosts(
  db: Database,
  author: UserRow,
  viewer: Viewer,
): Promise<FeedPost[]> {
  const now = new Date();
  const rows = await db
    .select({
      post: posts,
      room: rooms,
      authorPseudonym: users.pseudonym,
      authorAvatar: users.avatar,
      seriesTitle: series.title,
    })
    .from(posts)
    .innerJoin(rooms, eq(rooms.id, posts.roomId))
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(series, eq(series.id, posts.seriesId))
    .where(
      and(
        eq(posts.authorId, author.id),
        eq(posts.visibility, 'public'),
        eq(posts.status, 'visible'),
        isNull(posts.deletedAt),
        or(isNull(posts.expiresAt), gt(posts.expiresAt, now)),
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(100);
  return decorate(db, rows, viewer);
}

async function decorate(db: DbOrTx, rows: FeedRow[], viewer: Viewer): Promise<FeedPost[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.post.id);

  const viewerReactions = viewer.userId
    ? await db
        .select({ postId: reactions.postId, kind: reactions.kind })
        .from(reactions)
        .where(and(inArray(reactions.postId, ids), eq(reactions.userId, viewer.userId)))
    : [];
  const viewerBookmarks = viewer.userId
    ? await db
        .select({ postId: bookmarks.postId })
        .from(bookmarks)
        .where(and(inArray(bookmarks.postId, ids), eq(bookmarks.userId, viewer.userId)))
    : [];
  const viewerVotes = viewer.userId
    ? await db
        .select({ postId: votes.postId, value: votes.value })
        .from(votes)
        .where(and(inArray(votes.postId, ids), eq(votes.userId, viewer.userId)))
    : [];

  const seriesIds = Array.from(
    new Set(rows.map((row) => row.post.seriesId).filter((id): id is string => Boolean(id))),
  );
  const chapterCounts = seriesIds.length
    ? await db
        .select({ seriesId: posts.seriesId, count: sql<number>`count(*)::int` })
        .from(posts)
        .where(
          and(
            inArray(posts.seriesId, seriesIds),
            isNull(posts.deletedAt),
            eq(posts.status, 'visible'),
          ),
        )
        .groupBy(posts.seriesId)
    : [];
  const countBySeries = new Map(chapterCounts.map((row) => [row.seriesId ?? '', row.count]));

  return rows.map((row) => {
    const { post, room } = row;
    const anonymous = post.visibility === 'anonymous';
    const body = post.body ?? '';
    return {
      id: post.id,
      type: post.type,
      visibility: anonymous ? 'anonymous' : 'public',
      title: post.title,
      body,
      preview: firstLine(body, 200),
      wordCount: post.wordCount,
      room: { id: room.id, slug: room.slug, kind: room.kind, name: room.name, locale: room.locale },
      // Anonymous texts carry no author; the field is removed here, never only hidden in the client.
      author: anonymous ? null : { pseudonym: row.authorPseudonym, avatar: row.authorAvatar },
      createdAt: post.createdAt.toISOString(),
      editedAt: post.editedAt?.toISOString() ?? null,
      expiresAt: post.expiresAt?.toISOString() ?? null,
      commentsEnabled: post.commentsEnabled,
      series:
        post.seriesId && row.seriesTitle
          ? {
              id: post.seriesId,
              title: row.seriesTitle,
              chapter: post.chapter ?? 1,
              chapterCount: countBySeries.get(post.seriesId) ?? 1,
            }
          : null,
      viewer: {
        reactions: viewerReactions.filter((r) => r.postId === post.id).map((r) => r.kind),
        vote: (viewerVotes.find((v) => v.postId === post.id)?.value ?? 0) as -1 | 0 | 1,
        isAuthor: post.authorId === viewer.userId,
        bookmarked: viewerBookmarks.some((b) => b.postId === post.id),
      },
    };
  });
}

/** The reader's kept texts, newest kept first. Texts that are gone, hidden or expired drop out silently. */
export async function bookmarkedPosts(
  db: Database,
  viewer: Viewer,
  userId: string,
): Promise<FeedPost[]> {
  const now = new Date();
  const rows = await db
    .select({
      post: posts,
      room: rooms,
      authorPseudonym: users.pseudonym,
      authorAvatar: users.avatar,
      seriesTitle: series.title,
    })
    .from(bookmarks)
    .innerJoin(posts, eq(posts.id, bookmarks.postId))
    .innerJoin(rooms, eq(rooms.id, posts.roomId))
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(series, eq(series.id, posts.seriesId))
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(posts.status, 'visible'),
        isNull(posts.deletedAt),
        isNull(users.deletedAt),
        or(isNull(posts.expiresAt), gt(posts.expiresAt, now)),
      ),
    )
    .orderBy(desc(bookmarks.createdAt))
    .limit(LIMITS.bookmarksMax);
  return decorate(
    db,
    rows.filter((row) => !viewer.hidden.has(row.post.authorId)),
    viewer,
  );
}

export async function journal(
  db: Database,
  userId: string,
  options: { cursor?: string | undefined; since?: string | undefined },
): Promise<CursorPage<JournalPost>> {
  const pageSize = 100;
  const cursor = decodeCursor(options.cursor);
  const conditions = [eq(posts.authorId, userId), isNull(posts.deletedAt)];
  if (options.since) conditions.push(gt(posts.updatedAt, new Date(options.since)));
  if (cursor) {
    conditions.push(
      or(
        lt(posts.createdAt, cursor.createdAt),
        and(eq(posts.createdAt, cursor.createdAt), lt(posts.id, cursor.id)),
      ) ?? sql`true`,
    );
  }

  const rows = await db
    .select({ post: posts, roomSlug: rooms.slug, roomName: rooms.name })
    .from(posts)
    .leftJoin(rooms, eq(rooms.id, posts.roomId))
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(pageSize + 1);

  const page = rows.slice(0, pageSize);
  const ids = page.map((row) => row.post.id);
  const feedbackRows = ids.length
    ? await db
        .select({ postId: reactions.postId })
        .from(reactions)
        .where(and(inArray(reactions.postId, ids), sql`${reactions.kind} <> 'read'`))
        .groupBy(reactions.postId)
    : [];
  const withFeedback = new Set(feedbackRows.map((row) => row.postId));

  const items: JournalPost[] = page.map(({ post, roomSlug, roomName }) => ({
    id: post.id,
    type: post.type,
    visibility: post.visibility,
    status: post.status,
    title: post.title,
    body: post.body,
    ciphertext: post.ciphertext,
    nonce: post.nonce,
    wrappedKey: post.wrappedKey,
    roomId: post.roomId,
    roomSlug,
    roomName,
    expiry: post.expiry,
    expiresAt: post.expiresAt?.toISOString() ?? null,
    commentsEnabled: post.commentsEnabled,
    seriesId: post.seriesId,
    chapter: post.chapter,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    editedAt: post.editedAt?.toISOString() ?? null,
    hasFeedback: withFeedback.has(post.id),
  }));

  const last = page[page.length - 1];
  return {
    items,
    nextCursor:
      rows.length > pageSize && last
        ? encodeCursor({ createdAt: last.post.createdAt, id: last.post.id })
        : null,
  };
}

/** Aggregated, nameless feedback for the author only. */
export async function reactionSummary(db: Database, post: PostRow): Promise<ReactionSummary> {
  const counts = await db
    .select({ kind: reactions.kind, count: sql<number>`count(*)::int` })
    .from(reactions)
    .where(eq(reactions.postId, post.id))
    .groupBy(reactions.kind);
  const by = (kind: ReactionKind) => counts.find((row) => row.kind === kind)?.count ?? 0;

  const [commentCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(and(eq(comments.postId, post.id), isNull(comments.deletedAt)));

  let netVotes: number | null = null;
  if (post.roomId) {
    const [room] = await db
      .select({ kind: rooms.kind })
      .from(rooms)
      .where(eq(rooms.id, post.roomId))
      .limit(1);
    if (room?.kind === 'fiction') {
      const [sum] = await db
        .select({ net: sql<number>`coalesce(sum(${votes.value}), 0)::int` })
        .from(votes)
        .where(eq(votes.postId, post.id));
      netVotes = sum?.net ?? 0;
    }
  }

  return {
    read: by('read'),
    felt: by('felt'),
    known: by('known'),
    thanks: by('thanks'),
    netVotes,
    comments: commentCount?.count ?? 0,
  };
}

export async function roomsForUser(
  db: DbOrTx,
  userId: string | null,
  locales: string[],
  kind?: 'reflection' | 'fiction',
) {
  const conditions = [inArray(rooms.locale, locales as ('de' | 'fr' | 'it' | 'en')[])];
  if (kind) conditions.push(eq(rooms.kind, kind));
  const rows = await db
    .select({ room: rooms, joined: roomMembers.userId, pushEnabled: roomMembers.pushEnabled })
    .from(rooms)
    .leftJoin(
      roomMembers,
      and(eq(roomMembers.roomId, rooms.id), userId ? eq(roomMembers.userId, userId) : sql`false`),
    )
    .where(and(...conditions))
    .orderBy(asc(rooms.locale), asc(rooms.kind), asc(rooms.position));
  return rows.map(({ room, joined, pushEnabled }) => ({
    id: room.id,
    slug: room.slug,
    kind: room.kind,
    locale: room.locale,
    name: room.name,
    description: room.description,
    rules: room.rules,
    sortDefault: room.sortDefault,
    joined: Boolean(joined),
    pushEnabled: Boolean(pushEnabled),
    showHelplines: room.showHelplines,
  }));
}
