'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useLocale, useTranslations } from 'next-intl';

import { useAnnouncer } from '@/components/providers/announcer';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/format';

import type { Locale } from '@inkwell/shared';

/** Lines kept while reading, newest first. They live in this browser only. */
export function PassageList() {
  const t = useTranslations('journal.lines');
  const common = useTranslations('common');
  const locale = useLocale() as Locale;
  const { announce } = useAnnouncer();
  const passages = useLiveQuery(() => db().passages.orderBy('createdAt').reverse().toArray(), []);

  if (passages === undefined)
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        <SkeletonCard />
      </div>
    );

  if (passages.length === 0) return <EmptyState>{t('empty')}</EmptyState>;

  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-[0.875rem] text-ink-secondary">
        <Icon name="lock" size={14} />
        {t('localOnly')}
      </p>
      <ul className="flex flex-col gap-3">
        {passages.map((passage) => (
          <li key={passage.id} className="card group relative p-5 md:p-6">
            <blockquote className="prose-reading border-l-2 border-accent pl-4 text-[1.125rem] text-pretty">
              {passage.text}
            </blockquote>
            <div className="mt-4 flex items-center justify-between gap-3 text-[13px] text-ink-secondary">
              <Link href={`/posts/${passage.postId}`} className="min-w-0 truncate hover:text-ink">
                <span className="font-medium text-ink">{passage.source}</span>
                {' · '}
                {passage.author ?? common('visibility.anonymous')}
                {' · '}
                {passage.roomName}
              </Link>
              <span className="flex shrink-0 items-center gap-1">
                <time dateTime={new Date(passage.createdAt).toISOString()}>
                  {formatDate(new Date(passage.createdAt), locale, {
                    day: 'numeric',
                    month: 'short',
                  })}
                </time>
                <button
                  type="button"
                  onClick={() =>
                    void db()
                      .passages.delete(passage.id)
                      .then(() => announce(t('removed')))
                  }
                  aria-label={t('remove')}
                  title={t('remove')}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary state-toggle hover:bg-paper-raised hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
                >
                  <Icon name="close" size={15} />
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
