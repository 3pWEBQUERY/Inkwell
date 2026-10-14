'use client';

import { useTranslations } from 'next-intl';
import { useOptimistic, useState, useTransition } from 'react';

import { useAnnouncer } from '@/components/providers/announcer';
import { useMe } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { useErrorMessage } from '@/components/ui/error-text';
import { Icon } from '@/components/ui/icon';
import { joinRoom, setRoomPush } from '@/features/posts/actions';
import { subscribeToPush } from '@/features/pwa/push';
import { useRouter } from '@/i18n/navigation';

import type { RoomView } from '@/features/posts/queries';

/** Name, description, collapsible rules (height animates), join and the bell for push. */
export function RoomHeader({
  room,
  vapidPublicKey,
}: {
  room: RoomView;
  vapidPublicKey: string | null;
}) {
  const t = useTranslations('rooms');
  const common = useTranslations('common');
  const me = useMe();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [joined, setJoined] = useOptimistic(room.joined);
  const [push, setPush] = useOptimistic(room.pushEnabled);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { announce } = useAnnouncer();
  const message = useErrorMessage();

  const toggleJoin = () => {
    if (!me) return router.push('/sign-in');
    startTransition(async () => {
      setJoined(!joined);
      const result = await joinRoom(room.slug, !joined);
      if (!result.ok) announce(message(result.error) ?? '');
      router.refresh();
    });
  };

  const togglePush = () => {
    startTransition(async () => {
      const next = !push;
      if (next) {
        const outcome = await subscribeToPush(vapidPublicKey);
        if (outcome === 'denied') return announce(t('push.denied'));
        if (outcome === 'unsupported') return announce(t('push.iosHint'));
      }
      setPush(next);
      const result = await setRoomPush(room.slug, next);
      if (!result.ok) announce(message(result.error) ?? '');
    });
  };

  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="label mb-2 flex items-center gap-1.5">
            <Icon name={room.kind === 'fiction' ? 'book' : 'leaf'} size={15} />
            {common(`roomKind.${room.kind}`)}
          </p>
          <h1 className="display text-[2rem] md:text-[2.375rem]">{room.name}</h1>
          <p className="mt-2 text-[0.9375rem] text-ink-secondary">{room.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {joined ? (
            <button
              type="button"
              onClick={togglePush}
              aria-pressed={push}
              aria-label={push ? t('push.on') : t('push.off')}
              title={t('push.explain')}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line-strong bg-surface text-ink-secondary state-toggle hover:bg-paper-raised hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
            >
              <Icon name={push ? 'bell' : 'bell-off'} size={18} />
            </button>
          ) : null}
          <Button
            variant={joined ? 'secondary' : 'primary'}
            size="sm"
            onClick={toggleJoin}
            busy={pending}
          >
            {joined ? t('leave') : t('join')}
          </Button>
        </div>
      </div>
      {room.rules ? (
        <div className="mt-5 rounded-lg bg-paper-sunken px-4 xl:hidden">
          <button
            type="button"
            onClick={() => setRulesOpen((open) => !open)}
            aria-expanded={rulesOpen}
            className="flex min-h-11 w-full items-center justify-between gap-1 text-[0.875rem] font-medium text-ink-secondary hover:text-ink"
          >
            {t('rules')}
            <Icon
              name="chevron-down"
              size={16}
              className="transition-transform"
              style={{
                transform: rulesOpen ? 'rotate(180deg)' : undefined,
                transitionDuration: 'var(--motion-base)',
              }}
            />
          </button>
          <div
            className="grid transition-[grid-template-rows]"
            style={{
              gridTemplateRows: rulesOpen ? '1fr' : '0fr',
              transitionDuration: 'var(--motion-base)',
              transitionTimingFunction: 'var(--ease-out)',
            }}
          >
            <p className="overflow-hidden text-[0.9375rem] leading-relaxed text-ink-secondary">
              <span className="block pb-4">{room.rules}</span>
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
