'use client';

import { useTranslations } from 'next-intl';
import { useOptimistic, useTransition } from 'react';

import { useMe } from '@/components/providers/session-provider';
import { Icon } from '@/components/ui/icon';
import { vote } from '@/features/posts/actions';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

/** Up and down next to the title; the own state is visible, the sum is not. */
export function Vote({
  postId,
  initial,
  isAuthor,
}: {
  postId: string;
  initial: -1 | 0 | 1;
  isAuthor: boolean;
}) {
  const t = useTranslations('votes');
  const me = useMe();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [value, setValue] = useOptimistic<-1 | 0 | 1, -1 | 0 | 1>(
    initial,
    (_current, next) => next,
  );

  if (isAuthor) return null;

  const cast = (next: -1 | 1) => {
    if (!me) return router.push('/sign-in');
    const target = value === next ? 0 : next;
    startTransition(async () => {
      setValue(target);
      await vote(postId, target);
    });
  };

  return (
    <div
      className="flex h-fit flex-col items-center gap-0.5 rounded-full border border-line bg-surface p-1"
      title={t('hint')}
    >
      <button
        type="button"
        aria-label={t('up')}
        aria-pressed={value === 1}
        onClick={() => cast(1)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full state-toggle pointer-coarse:h-11 pointer-coarse:w-11',
          value === 1
            ? 'bg-accent-soft text-accent-text'
            : 'text-ink-tertiary hover:bg-paper-raised hover:text-ink',
        )}
      >
        <Icon name="arrow-up" size={18} strokeWidth={value === 1 ? 2.25 : 1.5} />
      </button>
      <button
        type="button"
        aria-label={t('down')}
        aria-pressed={value === -1}
        onClick={() => cast(-1)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full state-toggle pointer-coarse:h-11 pointer-coarse:w-11',
          value === -1
            ? 'bg-accent-soft text-accent-text'
            : 'text-ink-tertiary hover:bg-paper-raised hover:text-ink',
        )}
      >
        <Icon name="arrow-down" size={18} strokeWidth={value === -1 ? 2.25 : 1.5} />
      </button>
    </div>
  );
}
