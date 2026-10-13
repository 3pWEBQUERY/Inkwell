import { and, eq, inArray, ne } from 'drizzle-orm';

import {
  pushSubscriptions,
  roomMembers,
  seriesSubscriptions,
  users,
  type PostRow,
} from '../db/schema.js';

import type { Database } from '../db/client.js';
import type { PushSender } from '../lib/push.js';
import type { Locale } from '@inkwell/shared';

/**
 * Push messages carry no numbers and no names (PRD 13, microcopy rules).
 * Everything here is opt-in per room or series.
 */
const COPY: Record<
  Locale,
  {
    room: (name: string) => string;
    chapter: (title: string) => string;
    comment: string;
    feedback: string;
  }
> = {
  de: {
    room: (name) => `Ein neuer Text in «${name}».`,
    chapter: (title) => `Ein neues Kapitel in «${title}».`,
    comment: 'Jemand hat auf deinen Text geantwortet.',
    feedback: 'Jemand hat deinen Text gelesen.',
  },
  fr: {
    room: (name) => `Un nouveau texte dans « ${name} ».`,
    chapter: (title) => `Un nouveau chapitre dans « ${title} ».`,
    comment: 'Quelqu’un a répondu à ton texte.',
    feedback: 'Quelqu’un a lu ton texte.',
  },
  it: {
    room: (name) => `Un nuovo testo in «${name}».`,
    chapter: (title) => `Un nuovo capitolo in «${title}».`,
    comment: 'Qualcuno ha risposto al tuo testo.',
    feedback: 'Qualcuno ha letto il tuo testo.',
  },
  en: {
    room: (name) => `A new text in “${name}”.`,
    chapter: (title) => `A new chapter in “${title}”.`,
    comment: 'Someone replied to your text.',
    feedback: 'Someone read your text.',
  },
};

async function sendToUsers(
  db: Database,
  push: PushSender,
  appOrigin: string,
  userIds: string[],
  build: (locale: Locale) => { body: string; url: string; tag: string },
) {
  if (!push.enabled || userIds.length === 0) return;
  const targets = await db
    .select({ sub: pushSubscriptions, locale: users.locale })
    .from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId))
    .where(inArray(pushSubscriptions.userId, userIds));
  for (const { sub, locale } of targets) {
    const message = build(locale);
    const result = await push.send(sub, {
      title: 'Inkwell',
      body: message.body,
      url: `${appOrigin}${message.url}`,
      tag: message.tag,
    });
    if (result === 'gone')
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
  }
}

export async function notifyRoomOnNewPost(
  db: Database,
  push: PushSender,
  appOrigin: string,
  post: PostRow,
  roomName: string,
  roomSlug: string,
) {
  if (!post.roomId) return;
  const members = await db
    .select({ userId: roomMembers.userId })
    .from(roomMembers)
    .where(
      and(
        eq(roomMembers.roomId, post.roomId),
        eq(roomMembers.pushEnabled, true),
        ne(roomMembers.userId, post.authorId),
      ),
    );
  await sendToUsers(
    db,
    push,
    appOrigin,
    members.map((m) => m.userId),
    (locale) => ({
      body: COPY[locale].room(roomName),
      url: `/rooms/${roomSlug}`,
      tag: `room:${post.roomId ?? ''}`,
    }),
  );
}

export async function notifySeriesOnNewChapter(
  db: Database,
  push: PushSender,
  appOrigin: string,
  post: PostRow,
  seriesTitle: string,
) {
  if (!post.seriesId) return;
  const subscribers = await db
    .select({ userId: seriesSubscriptions.userId })
    .from(seriesSubscriptions)
    .where(
      and(
        eq(seriesSubscriptions.seriesId, post.seriesId),
        ne(seriesSubscriptions.userId, post.authorId),
      ),
    );
  await sendToUsers(
    db,
    push,
    appOrigin,
    subscribers.map((s) => s.userId),
    (locale) => ({
      body: COPY[locale].chapter(seriesTitle),
      url: `/posts/${post.id}`,
      tag: `series:${post.seriesId ?? ''}`,
    }),
  );
}

export async function notifyAuthorOnComment(
  db: Database,
  push: PushSender,
  appOrigin: string,
  post: PostRow,
) {
  const [author] = await db
    .select({ settings: users.settings })
    .from(users)
    .where(eq(users.id, post.authorId))
    .limit(1);
  if (!author?.settings.commentNotifications) return;
  await sendToUsers(db, push, appOrigin, [post.authorId], (locale) => ({
    body: COPY[locale].comment,
    url: `/posts/${post.id}`,
    tag: `comment:${post.id}`,
  }));
}
