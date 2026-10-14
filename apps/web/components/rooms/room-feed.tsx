'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { loadRoomPage } from '@/features/posts/feed-actions';

import { PostCard } from './post-card';

import type { CursorPage, FeedPost, FeedSort, RoomKind } from '@inkwell/shared';

interface RoomFeedProps {
  slug: string;
  kind: RoomKind;
  initialSort: FeedSort;
  initialPage: CursorPage<FeedPost>;
  highlightId?: string | undefined;
}

/** Twenty per page, "load more" at the end, never automatic; fiction rooms get the sort switch. */
export function RoomFeed({ slug, kind, initialSort, initialPage, highlightId }: RoomFeedProps) {
  const t = useTranslations('rooms');
  const common = useTranslations('common');
  const [sort, setSort] = useState<FeedSort>(initialSort);
  const [pages, setPages] = useState<Record<FeedSort, CursorPage<FeedPost> | null>>({
    new: null,
    week: null,
    top: null,
    [initialSort]: initialPage,
  });
  const [pending, startTransition] = useTransition();
  const page = pages[sort];

  // A refreshed server render (after publishing) replaces the first page of the initial sort.
  useEffect(() => {
    setPages((current) => ({ ...current, [initialSort]: initialPage }));
  }, [initialPage, initialSort]);

  const load = (nextSort: FeedSort, cursor: string | null) => {
    startTransition(async () => {
      const result = await loadRoomPage(slug, nextSort, cursor ?? undefined);
      if (!result.ok) return;
      setPages((current) => {
        const previous = cursor ? current[nextSort] : null;
        return {
          ...current,
          [nextSort]: {
            items: [...(previous?.items ?? []), ...result.data.items],
            nextCursor: result.data.nextCursor,
          },
        };
      });
    });
  };

  const changeSort = (next: FeedSort) => {
    setSort(next);
    if (!pages[next]) load(next, null);
  };

  return (
    <section>
      {kind === 'fiction' ? (
        <div className="mb-5 md:max-w-md">
          <Segmented
            label={t('sort.new')}
            value={sort}
            onChange={changeSort}
            options={[
              { value: 'new', label: t('sort.new') },
              { value: 'week', label: t('sort.week') },
              { value: 'top', label: t('sort.top') },
            ]}
          />
        </div>
      ) : null}
      {page === null ? null : page.items.length === 0 ? (
        <EmptyState>{t('empty')}</EmptyState>
      ) : (
        <div key={sort} className="page-enter flex flex-col gap-3">
          {page.items.map((post) => (
            <PostCard key={post.id} post={post} highlight={post.id === highlightId} />
          ))}
          <div className="pt-6 pb-2 text-center text-[0.875rem] text-ink-tertiary">
            {page.nextCursor ? (
              <Button
                variant="secondary"
                size="sm"
                busy={pending}
                onClick={() => load(sort, page.nextCursor)}
              >
                {common('loadMore')}
              </Button>
            ) : (
              t('end')
            )}
          </div>
        </div>
      )}
    </section>
  );
}
