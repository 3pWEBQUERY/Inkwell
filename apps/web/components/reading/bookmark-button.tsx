'use client';

import { useTranslations } from 'next-intl';
import { useOptimistic, useTransition } from 'react';

import { useAnnouncer } from '@/components/providers/announcer';
import { useMe } from '@/components/providers/session-provider';
import { Icon } from '@/components/ui/icon';
import { setBookmark } from '@/features/posts/actions';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

/** Keep a text for later. Private to the reader; nobody else learns about it, the author included. */
export function BookmarkButton({ postId, initial }: { postId: string; initial: boolean }) {
  const t = useTranslations('reading');
  const me = useMe();
  const router = useRouter();
  const { announce } = useAnnouncer();
  const [, startTransition] = useTransition();
  const [kept, setKept] = useOptimistic(initial);

  const toggle = () => {
    if (!me) {
      router.push('/sign-in');
      return;
    }
    const next = !kept;
    startTransition(async () => {
      setKept(next);
      const result = await setBookmark(postId, next);
      if (result.ok) {
        announce(next ? t('bookmarkSaved') : t('bookmarkRemoved'));
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={kept}
      title={t('bookmarkHint')}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-[0.875rem] font-medium state-toggle pointer-coarse:h-11',
        kept
          ? 'border-accent/40 bg-accent-tint text-accent-text'
          : 'border-line-strong bg-surface text-ink-secondary hover:bg-paper-raised hover:text-ink',
      )}
    >
      <Icon name={kept ? 'bookmark-filled' : 'bookmark'} size={16} />
      <span>{kept ? t('bookmarked') : t('bookmark')}</span>
    </button>
  );
}
