'use client';

import { useLocale, useTranslations } from 'next-intl';

import { hoursUntil, type FeedPost, type Locale } from '@inkwell/shared';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { relativeBucket } from '@/lib/format';

interface PostCardProps {
  post: FeedPost;
  showRoom?: boolean;
  highlight?: boolean;
  /**
   * Carries the shared-element name into the reading view. A view-transition
   * name must be unique on the page, so a card whose text is already shown
   * elsewhere (Today's last entry) leaves it off.
   */
  sharedTransition?: boolean;
}

/**
 * A card in a list: room, first line (three lines at most), pseudonym or
 * "anonymous", relative time. No counters anywhere. The first line carries the
 * shared-element name so it travels into the reading view.
 */
export function PostCard({
  post,
  showRoom = false,
  highlight = false,
  sharedTransition = true,
}: PostCardProps) {
  const t = useTranslations('common');
  const rooms = useTranslations('rooms');
  const locale = useLocale() as Locale;
  const relative = relativeBucket(post.createdAt);
  const expiresIn = hoursUntil(post.expiresAt);

  return (
    <article className={cn('rounded-lg', highlight && 'just-published')}>
      <Link
        href={`/posts/${post.id}`}
        data-list-item
        className="card block p-5 outline-none focus-visible:shadow-[var(--focus-ring)] md:px-6"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-secondary">
          {post.author ? (
            <span className="flex items-center gap-2 font-medium text-ink">
              <Avatar avatar={post.author.avatar} size={22} />
              {post.author.pseudonym}
            </span>
          ) : (
            <span className="flex items-center gap-2 font-medium text-ink">
              <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-paper-sunken text-ink-secondary">
                <Icon name="mask" size={13} />
              </span>
              {t('anonymous')}
            </span>
          )}
          {showRoom ? (
            <>
              <span aria-hidden>·</span>
              <span>{post.room.name}</span>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <time dateTime={post.createdAt}>
            {relative.key === 'justNow'
              ? t('relative.justNow')
              : t(`relative.${relative.key}`, { count: relative.count })}
          </time>
          {expiresIn !== null ? (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <Icon name="clock" size={14} />
                {t('expiresIn', { hours: expiresIn })}
              </span>
            </>
          ) : null}
        </div>
        {post.title ? (
          <h3
            className="mt-3 font-serif text-[1.375rem] leading-snug font-semibold tracking-[-0.01em]"
            style={sharedTransition ? { viewTransitionName: `post-title-${post.id}` } : undefined}
          >
            {post.title}
          </h3>
        ) : null}
        <p
          className={cn(
            'prose-reading mt-3 line-clamp-3 text-[1.125rem]',
            post.title && 'mt-1.5 text-ink-secondary',
          )}
          style={
            post.title || !sharedTransition
              ? undefined
              : { viewTransitionName: `post-line-${post.id}` }
          }
        >
          {post.preview}
        </p>
        {post.type === 'story' ? (
          <p className="mt-3 text-[13px] text-ink-tertiary">
            {t('words', { count: post.wordCount })}
            {post.series
              ? ` · ${post.series.title}, ${rooms('chapter', { chapter: post.series.chapter })}`
              : ''}
          </p>
        ) : null}
        <span className="sr-only">{locale}</span>
      </Link>
    </article>
  );
}
