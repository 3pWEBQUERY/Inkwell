'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useOptimistic, useState, useTransition } from 'react';

import { useAnnouncer } from '@/components/providers/announcer';
import { useMe } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { reorderSeries, subscribeSeries } from '@/features/posts/actions';
import { Link, useRouter } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';

import type { Locale, Series } from '@inkwell/shared';

/** Title, description, chapters with reading state. The author reorders chapters by drag and drop (or the arrow buttons). */
export function SeriesView({ series, readIds }: { series: Series; readIds: string[] }) {
  const t = useTranslations('series');
  const me = useMe();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const { announce } = useAnnouncer();
  const [pending, startTransition] = useTransition();
  const [subscribed, setSubscribed] = useOptimistic(series.subscribed);
  const [chapters, setChapters] = useState(series.chapters);
  const [dragging, setDragging] = useState<string | null>(null);
  const isAuthor = me?.pseudonym === series.author.pseudonym;

  const toggle = () => {
    if (!me) return router.push('/sign-in');
    startTransition(async () => {
      setSubscribed(!subscribed);
      await subscribeSeries(series.id, !subscribed);
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= chapters.length || from === to) return;
    const next = chapters.slice();
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setChapters(next);
    startTransition(async () => {
      const result = await reorderSeries(
        series.id,
        next.map((chapter) => chapter.postId),
      );
      if (!result.ok) announce(t('notFound'));
    });
  };

  return (
    <div>
      <p className="text-[13px] text-ink-secondary">{series.author.pseudonym}</p>
      <h1 className="display text-[2rem] md:text-[2.375rem]">{series.title}</h1>
      {series.description ? (
        <p className="mt-2 text-ink-secondary text-pretty">{series.description}</p>
      ) : null}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[13px] text-ink-tertiary">
          {t('chapters', { count: chapters.length })}
        </span>
        {!isAuthor ? (
          <Button
            variant={subscribed ? 'ghost' : 'secondary'}
            size="sm"
            onClick={toggle}
            busy={pending}
            aria-pressed={subscribed}
            title={t('subscribeHint')}
          >
            {subscribed ? <Icon name="check" size={16} /> : <Icon name="bell" size={16} />}
            {subscribed ? t('subscribed') : t('subscribe')}
          </Button>
        ) : null}
      </div>
      {isAuthor ? <p className="mt-4 text-[13px] text-ink-tertiary">{t('reorderHint')}</p> : null}
      <ol className="mt-4 divide-y divide-line">
        {chapters.map((chapter, index) => (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- drop target for drag and drop; keyboard users reorder with the arrow buttons
          <li
            key={chapter.postId}
            draggable={isAuthor}
            onDragStart={() => setDragging(chapter.postId)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!dragging) return;
              move(
                chapters.findIndex((c) => c.postId === dragging),
                index,
              );
              setDragging(null);
            }}
            className="flex items-center gap-3 py-3"
          >
            {isAuthor ? <Icon name="drag" className="cursor-grab text-ink-tertiary" /> : null}
            <Link href={`/posts/${chapter.postId}`} className="min-w-0 flex-1">
              <span className="block font-serif text-lg">
                {index + 1}. {chapter.title}
              </span>
              <span className="text-[13px] text-ink-secondary">
                {formatDate(chapter.createdAt, locale, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {readIds.includes(chapter.postId) ? ` · ${t('readProgress')}` : ''}
              </span>
            </Link>
            {isAuthor ? (
              <span className="flex">
                <button
                  type="button"
                  aria-label={t('moveUp')}
                  onClick={() => move(index, index - 1)}
                  className="touch-target text-ink-tertiary hover:text-ink"
                >
                  <Icon name="arrow-up" size={16} />
                </button>
                <button
                  type="button"
                  aria-label={t('moveDown')}
                  onClick={() => move(index, index + 1)}
                  className="touch-target text-ink-tertiary hover:text-ink"
                >
                  <Icon name="arrow-down" size={16} />
                </button>
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
