'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState, useTransition, useOptimistic } from 'react';

import { LOCALES, type Locale, type RoomKind } from '@inkwell/shared';

import { useAnnouncer } from '@/components/providers/announcer';
import { useMe } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { useErrorMessage } from '@/components/ui/error-text';
import { Input } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Segmented } from '@/components/ui/segmented';
import { joinRoom } from '@/features/posts/actions';
import { Link, useRouter } from '@/i18n/navigation';

import type { RoomView } from '@/features/posts/queries';

interface RoomListProps {
  rooms: RoomView[];
  initialKind: RoomKind;
}

/** Rooms of the chosen languages; the kind switch cross-fades, search and language chips filter locally. */
export function RoomList({ rooms, initialKind }: RoomListProps) {
  const t = useTranslations('rooms');
  const common = useTranslations('common');
  const me = useMe();
  const router = useRouter();
  const locale = useLocale() as Locale;
  const [kind, setKind] = useState<RoomKind>(initialKind);
  const [query, setQuery] = useState('');
  const available = useMemo(() => Array.from(new Set(rooms.map((room) => room.locale))), [rooms]);
  const [locales, setLocales] = useState<Locale[]>(() =>
    available.includes(locale) ? [locale] : available,
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rooms.filter(
      (room) =>
        room.kind === kind &&
        locales.includes(room.locale) &&
        (needle === '' ||
          room.name.toLowerCase().includes(needle) ||
          room.description.toLowerCase().includes(needle)),
    );
  }, [rooms, kind, locales, query]);

  return (
    <div>
      <div className="md:max-w-sm">
        <Segmented
          label={t('title')}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'reflection', label: common('roomKind.reflection') },
            { value: 'fiction', label: common('roomKind.fiction') },
          ]}
        />
      </div>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Icon
            name="search"
            size={17}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-tertiary"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            className="h-10 pl-10 pointer-coarse:h-11"
          />
        </div>
        {available.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto">
            {LOCALES.filter((l) => available.includes(l)).map((l) => (
              <Chip
                key={l}
                active={locales.includes(l)}
                onClick={() =>
                  setLocales((current) =>
                    current.includes(l)
                      ? current.length > 1
                        ? current.filter((x) => x !== l)
                        : current
                      : [...current, l],
                  )
                }
              >
                {common(`locales.${l}`)}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>
      <ul key={kind} className="page-enter card mt-5 divide-y divide-line overflow-hidden">
        {visible.map((room) => (
          <RoomRow
            key={room.id}
            room={room}
            signedIn={Boolean(me)}
            onNeedsAccount={() => router.push('/sign-in')}
          />
        ))}
      </ul>
    </div>
  );
}

function RoomRow({
  room,
  signedIn,
  onNeedsAccount,
}: {
  room: RoomView;
  signedIn: boolean;
  onNeedsAccount: () => void;
}) {
  const t = useTranslations('rooms');
  const [pending, startTransition] = useTransition();
  const [joined, setJoined] = useOptimistic(room.joined);
  const { announce } = useAnnouncer();
  const message = useErrorMessage();

  const toggle = () => {
    if (!signedIn) return onNeedsAccount();
    startTransition(async () => {
      setJoined(!joined);
      const result = await joinRoom(room.slug, !joined);
      if (!result.ok) announce(message(result.error) ?? '');
    });
  };

  return (
    <li className="flex items-center gap-4 px-4 py-3.5 state-toggle hover:bg-paper-raised/60 md:px-5">
      <Link
        href={`/rooms/${room.slug}`}
        data-list-item
        className="flex min-w-0 flex-1 items-center gap-4 rounded-md outline-none focus-visible:shadow-[var(--focus-ring)]"
      >
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-tint font-serif text-[1.25rem] leading-none font-medium text-accent-text"
        >
          {room.name.slice(0, 1)}
        </span>
        <span className="min-w-0">
          <span className="block font-medium">{room.name}</span>
          <span className="mt-0.5 block truncate text-[0.875rem] text-ink-secondary">
            {room.description}
          </span>
        </span>
      </Link>
      <Button
        variant={joined ? 'ghost' : 'secondary'}
        size="sm"
        onClick={toggle}
        busy={pending}
        aria-pressed={joined}
        className={joined ? 'text-accent-text' : undefined}
      >
        {joined ? <Icon name="check" size={16} /> : null}
        {joined ? t('joined') : t('join')}
      </Button>
    </li>
  );
}
