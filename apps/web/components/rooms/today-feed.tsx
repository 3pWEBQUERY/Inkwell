'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { refreshToday } from '@/features/posts/today-actions';
import { Link } from '@/i18n/navigation';

import { PostCard } from './post-card';
import { RoomRow } from './room-list';

import type { RoomView } from '@/features/posts/queries';
import type { FeedPost } from '@inkwell/shared';

/**
 * Chronological, at most twenty, ends with "that is all for today". Texts that
 * arrive while reading are not pushed in; a quiet "3 new texts" line appears
 * on top and extends the list on click.
 */
export function TodayFeed({
  initial,
  hasRooms,
  suggestions,
  lastEntryId = null,
}: {
  initial: FeedPost[];
  /** Whether the member has joined any room; without one, rooms to start with are offered. */
  hasRooms: boolean;
  suggestions: RoomView[];
  /** The member's last entry is shown above the feed and owns its shared-element name. */
  lastEntryId?: string | null;
}) {
  const t = useTranslations('today');
  const [items, setItems] = useState(initial);
  const [incoming, setIncoming] = useState<FeedPost[]>([]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      void refreshToday().then((result) => {
        if (!result.ok) return;
        const known = new Set(items.map((post) => post.id));
        const fresh = result.data.filter((post) => !known.has(post.id));
        if (fresh.length > 0) setIncoming(fresh);
      });
    }, 120_000);
    return () => window.clearInterval(interval);
  }, [items]);

  const reveal = () => {
    setItems((current) => [...incoming, ...current].slice(0, 20));
    setIncoming([]);
  };

  if (items.length === 0 && incoming.length === 0 && !hasRooms && suggestions.length > 0) {
    return (
      <div>
        <p className="mb-3 text-[0.9375rem] text-ink-secondary">{t('suggested')}</p>
        <ul className="card divide-y divide-line overflow-hidden">
          {suggestions.map((room) => (
            <RoomRow key={room.id} room={room} signedIn onNeedsAccount={() => undefined} />
          ))}
        </ul>
      </div>
    );
  }

  if (items.length === 0 && incoming.length === 0) {
    return (
      <EmptyState
        action={
          <Link
            href="/rooms"
            className="inline-flex h-10 items-center rounded-md border border-line-strong bg-surface px-4 text-[0.9375rem] font-medium text-ink state-toggle hover:bg-paper-raised"
          >
            {t('browseRooms')}
          </Link>
        }
      >
        {t('nothingNew')}
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {incoming.length > 0 ? (
        <button
          type="button"
          onClick={reveal}
          className="mx-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-accent-soft px-4 text-[0.875rem] font-medium text-accent-text state-toggle hover:bg-accent-tint"
        >
          <Icon name="arrow-up" size={15} />
          {t('newTexts', { count: incoming.length })}
        </button>
      ) : null}
      {items.map((post) => (
        <PostCard key={post.id} post={post} showRoom sharedTransition={post.id !== lastEntryId} />
      ))}
      <p className="pt-6 pb-2 text-center text-[0.875rem] text-ink-tertiary">{t('end')}</p>
    </div>
  );
}
