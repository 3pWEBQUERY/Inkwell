import { getLocale, getTranslations } from 'next-intl/server';

import {
  hoursUntil,
  readingMinutes,
  renderMarkdown,
  type CommentView,
  type FeedPost,
  type Locale,
} from '@inkwell/shared';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import { formatDate, relativeBucket } from '@/lib/format';

import { Comments } from './comments';
import { Helplines } from './helplines';
import { PostMenu } from './post-menu';
import { Reactions } from './reactions';
import { ReadTracker } from './read-tracker';
import { Vote } from './vote';

interface ReadingViewProps {
  post: FeedPost;
  comments: CommentView[];
  editorFont: 'serif' | 'sans';
  fontSize: number;
  showHelplines: boolean;
  chapterNav: { previous: string | null; next: string | null } | null;
}

/** A book page: text, author, date, and at the end the silent reactions. No bar with counters. */
export async function ReadingView({
  post,
  comments,
  editorFont,
  fontSize,
  showHelplines,
  chapterNav,
}: ReadingViewProps) {
  const t = await getTranslations('reading');
  const common = await getTranslations('common');
  const locale = (await getLocale()) as Locale;
  const relative = relativeBucket(post.createdAt);
  const expiresIn = hoursUntil(post.expiresAt);
  const html = renderMarkdown(post.body);

  return (
    <article>
      <ReadTracker postId={post.id} isAuthor={post.viewer.isAuthor} />
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 text-[13px] text-ink-secondary">
          <Link href={`/rooms/${post.room.slug}`} className="hover:text-ink">
            {post.room.name}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {post.author ? (
              <Link
                href={`/u/${post.author.pseudonym}`}
                className="flex items-center gap-1.5 hover:text-ink"
              >
                <Avatar avatar={post.author.avatar} size={18} />
                {post.author.pseudonym}
              </Link>
            ) : (
              <span className="flex items-center gap-1.5">
                <Icon name="mask" size={14} />
                {t('byAnonymous')}
              </span>
            )}
            <span aria-hidden>·</span>
            <time dateTime={post.createdAt} title={formatDate(post.createdAt, locale)}>
              {relative.key === 'justNow'
                ? common('relative.justNow')
                : common(`relative.${relative.key}`, { count: relative.count })}
            </time>
            {post.editedAt ? <span>· {common('edited')}</span> : null}
            {expiresIn !== null ? <span>· {common('expiresIn', { hours: expiresIn })}</span> : null}
          </div>
        </div>
        <PostMenu post={post} />
      </header>

      <div className="mt-8 flex gap-4">
        {post.room.kind === 'fiction' ? (
          <Vote postId={post.id} initial={post.viewer.vote} isAuthor={post.viewer.isAuthor} />
        ) : null}
        <div className="min-w-0 flex-1">
          {post.title ? (
            <h1
              className="font-serif text-3xl font-semibold text-balance"
              style={{ viewTransitionName: `post-title-${post.id}` }}
            >
              {post.title}
            </h1>
          ) : null}
          {post.series ? (
            <p className="mt-2 text-[13px] text-ink-secondary">
              <Link href={`/series/${post.series.id}`} className="hover:text-ink">
                {post.series.title}
              </Link>
              {' · '}
              {t('chapterOf', { chapter: post.series.chapter, total: post.series.chapterCount })}
            </p>
          ) : null}
          {post.type === 'story' ? (
            <p className="mt-1 text-[13px] text-ink-tertiary">
              {common('words', { count: post.wordCount })} ·{' '}
              {common('readingTime', { minutes: readingMinutes(post.body) })}
            </p>
          ) : null}
          <div
            className={`prose-reading mt-6 ${editorFont === 'sans' ? 'sans' : ''}`}
            style={{
              fontSize: `${fontSize}px`,
              viewTransitionName: post.title ? undefined : `post-line-${post.id}`,
            }}
            // Rendered from the Markdown subset; the renderer escapes everything and emits only p, br, strong, em, blockquote, hr.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {chapterNav ? (
        <nav
          className="mt-8 flex justify-between text-sm"
          aria-label={t('chapterOf', {
            chapter: post.series?.chapter ?? 1,
            total: post.series?.chapterCount ?? 1,
          })}
        >
          {chapterNav.previous ? (
            <Link
              href={`/posts/${chapterNav.previous}`}
              className="inline-flex items-center gap-1 text-accent hover:underline"
            >
              <Icon name="arrow-left" size={16} />
              {t('previousChapter')}
            </Link>
          ) : (
            <span />
          )}
          {chapterNav.next ? (
            <Link
              href={`/posts/${chapterNav.next}`}
              className="inline-flex items-center gap-1 text-accent hover:underline"
            >
              {t('nextChapter')}
              <Icon name="arrow-right" size={16} />
            </Link>
          ) : null}
        </nav>
      ) : null}

      <Reactions postId={post.id} initial={post.viewer.reactions} isAuthor={post.viewer.isAuthor} />
      {post.commentsEnabled || post.viewer.isAuthor || comments.length > 0 ? (
        <Comments post={post} comments={comments} />
      ) : null}
      {showHelplines ? <Helplines /> : null}
    </article>
  );
}
