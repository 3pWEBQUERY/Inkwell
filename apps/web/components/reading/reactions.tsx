'use client';

import { useTranslations } from 'next-intl';
import { useOptimistic, useTransition } from 'react';

import { useAnnouncer } from '@/components/providers/announcer';
import { useMe } from '@/components/providers/session-provider';
import { Icon, type IconName } from '@/components/ui/icon';
import { toggleReaction } from '@/features/posts/actions';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

import type { ReactionKind } from '@inkwell/shared';

const KINDS: { kind: Exclude<ReactionKind, 'read'>; icon: IconName }[] = [
  { kind: 'felt', icon: 'heart' },
  { kind: 'known', icon: 'hand' },
  { kind: 'thanks', icon: 'leaf' },
];

/** Three silent buttons at the end of a text. Toggle, light haptic, no number, no animation. */
export function Reactions({
  postId,
  initial,
  isAuthor,
}: {
  postId: string;
  initial: ReactionKind[];
  isAuthor: boolean;
}) {
  const t = useTranslations('reactions');
  const me = useMe();
  const router = useRouter();
  const { announce } = useAnnouncer();
  const [, startTransition] = useTransition();
  const [active, setActive] = useOptimistic<ReactionKind[], ReactionKind>(
    initial,
    (current, kind) =>
      current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind],
  );

  if (isAuthor) return null;

  const toggle = (kind: ReactionKind) => {
    if (!me) {
      announce(t('signIn'));
      router.push('/sign-in');
      return;
    }
    const next = !active.includes(kind);
    if ('vibrate' in navigator) navigator.vibrate(8);
    startTransition(async () => {
      setActive(kind);
      await toggleReaction(postId, kind, next);
    });
  };

  return (
    <div
      className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6"
      role="group"
      aria-label={t('felt')}
    >
      {KINDS.map(({ kind, icon }) => {
        const on = active.includes(kind);
        return (
          <button
            key={kind}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(kind)}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm state-toggle',
              on
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-line-strong text-ink-secondary hover:text-ink',
            )}
          >
            <Icon name={icon} size={16} />
            {t(kind)}
          </button>
        );
      })}
    </div>
  );
}
