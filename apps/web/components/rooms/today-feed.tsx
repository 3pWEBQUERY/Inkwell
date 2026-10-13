'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { refreshToday } from '@/features/posts/today-actions';
import { Link } from '@/i18n/navigation';

import { PostCard } from './post-card';

import type { FeedPost } from '@inkwell/shared';

/**
 * Chronological, at most twenty, ends with "that is all for today". Texts that
 * arrive while reading are not pushed in; a quiet "3 new texts" line appears
 * on top and extends the list on click.
 */
export function TodayFeed({ initial }: { initial: FeedPost[] }) {
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

  if (items.length === 0 && incoming.length === 0) {
    return (
      <EmptyState
        action={
          <Link href="/rooms" className="text-accent underline-offset-4 hover:underline">
            {t('browseRooms')}
          </Link>
        }
      >
        {t('nothingNew')}
      </EmptyState>
    );
  }

  return (
    <div className="mt-2">
      {incoming.length > 0 ? (
        <button
          type="button"
          onClick={reveal}
          className="flex min-h-11 w-full items-center justify-center text-sm text-accent"
        >
          {t('newTexts', { count: incoming.length })}
        </button>
      ) : null}
      {items.map((post) => (
        <PostCard key={post.id} post={post} showRoom />
      ))}
      <p className="py-8 text-center text-sm text-ink-tertiary">{t('end')}</p>
    </div>
  );
}
