'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { firstLine, hoursUntil, type JournalPost, type Locale } from '@inkwell/shared';

import { useAnnouncer } from '@/components/providers/announcer';
import { useCryptoState } from '@/components/providers/crypto-provider';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Confirm } from '@/components/ui/confirm';
import { EmptyState } from '@/components/ui/empty-state';
import { useErrorMessage } from '@/components/ui/error-text';
import { Input } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { Overlay } from '@/components/ui/overlay';
import { burnPost, updatePost } from '@/features/posts/actions';
import { pruneJournal, syncJournal } from '@/features/posts/journal-sync';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { db, type EntryRecord } from '@/lib/db';
import { formatDate, formatMonthYear, monthKey } from '@/lib/format';

import { ExportButton } from './export-button';
import { PrivateEntryView } from './private-entry-view';

type Filter = 'all' | 'private' | 'anonymous' | 'public' | 'story' | 'expiring';

const FILTERS: Filter[] = ['all', 'private', 'anonymous', 'public', 'story', 'expiring'];
const VISIBILITY_ICON: Record<EntryRecord['visibility'], IconName> = {
  private: 'lock',
  anonymous: 'mask',
  public: 'globe',
};

interface JournalListProps {
  initial: JournalPost[];
  focusSearch: boolean;
  openId: string | null;
}

/**
 * All own texts, grouped by month, searched locally in IndexedDB (including
 * decrypted private entries). Filters animate the list; burn and narrow live
 * behind each row.
 */
export function JournalList({ initial, focusSearch, openId }: JournalListProps) {
  const t = useTranslations('journal');
  const common = useTranslations('common');
  const auth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const crypto = useCryptoState();
  const router = useRouter();
  const { announce } = useAnnouncer();
  const message = useErrorMessage();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [burnTarget, setBurnTarget] = useState<EntryRecord | null>(null);
  const [narrowTarget, setNarrowTarget] = useState<EntryRecord | null>(null);
  const [openEntry, setOpenEntry] = useState<string | null>(openId);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (crypto.hasKey === null) return;
    void (async () => {
      await syncJournal(initial, crypto.hasKey === true);
      await pruneJournal(new Set(initial.map((item) => item.id)));
    })();
  }, [initial, crypto.hasKey]);

  const liveEntries = useLiveQuery(() => db().entries.orderBy('createdAt').reverse().toArray(), []);
  const entries = useMemo(() => liveEntries ?? [], [liveEntries]);
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), [filter, liveEntries]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const soon = now + 48 * 3_600_000;
    return entries.filter((entry) => {
      if (filter === 'story' && entry.type !== 'story') return false;
      if (
        filter === 'expiring' &&
        (!entry.expiresAt ||
          new Date(entry.expiresAt).getTime() > soon ||
          entry.status !== 'visible')
      )
        return false;
      if (
        (filter === 'private' || filter === 'anonymous' || filter === 'public') &&
        entry.visibility !== filter
      )
        return false;
      return needle === '' || entry.searchText.includes(needle);
    });
  }, [entries, filter, query, now]);

  const groups = useMemo(() => {
    const map = new Map<string, EntryRecord[]>();
    for (const entry of visible) {
      const key = monthKey(entry.createdAt);
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return Array.from(map.entries());
  }, [visible]);

  const burn = () => {
    if (!burnTarget) return;
    const target = burnTarget;
    startTransition(async () => {
      const result = await burnPost(target.id);
      setBurnTarget(null);
      if (!result.ok) return announce(message(result.error) ?? '');
      await db().entries.delete(target.id);
      announce(t('burn.done'));
    });
  };

  const narrow = (to: 'anonymous' | 'private') => {
    if (!narrowTarget) return;
    const target = narrowTarget;
    startTransition(async () => {
      let input: Record<string, unknown> = { visibility: to };
      if (to === 'private') {
        if (!crypto.hasKey || !target.body) return announce(auth('unlock.locked'));
        const { cryptoClient } = await import('@/features/crypto/client');
        const payload = target.title ? `# ${target.title}\n\n${target.body}` : target.body;
        input = { visibility: 'private', ...(await cryptoClient.encrypt(payload)) };
      }
      const result = await updatePost(target.id, input);
      setNarrowTarget(null);
      if (!result.ok) return announce(message(result.error) ?? '');
      await db().entries.update(target.id, {
        visibility: to,
        roomName: to === 'private' ? null : target.roomName,
        roomSlug: to === 'private' ? null : target.roomSlug,
      });
      announce(t('narrow.done'));
      router.refresh();
    });
  };

  const opened = openEntry ? entries.find((entry) => entry.id === openEntry) : null;

  return (
    <div>
      <div className="relative">
        <Icon
          name="search"
          size={18}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-tertiary"
        />
        <Input
          type="search"
          autoFocus={focusSearch}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className="pl-10"
        />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((option) => (
          <Chip key={option} active={filter === option} onClick={() => setFilter(option)}>
            {t(`filters.${option}`)}
          </Chip>
        ))}
      </div>

      {entries.length === 0 ? (
        <EmptyState>{t('empty')}</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState>{t('noResults')}</EmptyState>
      ) : (
        <div key={`${filter}-${query}`} className="page-enter mt-4">
          {groups.map(([month, items]) => (
            <section key={month} className="mb-6">
              <h2 className="sticky top-0 bg-paper py-2 text-sm font-medium text-ink-secondary">
                {formatMonthYear(items[0]?.createdAt ?? month, locale)}
              </h2>
              <ul className="divide-y divide-line">
                {items.map((entry) => (
                  <JournalRow
                    key={entry.id}
                    entry={entry}
                    locale={locale}
                    onOpen={() =>
                      entry.visibility === 'private'
                        ? setOpenEntry(entry.id)
                        : router.push(`/posts/${entry.id}`)
                    }
                    onBurn={() => setBurnTarget(entry)}
                    onNarrow={() => setNarrowTarget(entry)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="mt-8 border-t border-line pt-6">
        <ExportButton />
      </div>

      <Confirm
        open={burnTarget !== null}
        title={t('burn.title')}
        body={t('burn.body')}
        confirmLabel={t('burn.confirm')}
        cancelLabel={common('cancel')}
        closeLabel={common('close')}
        danger
        busy={pending}
        onConfirm={burn}
        onCancel={() => setBurnTarget(null)}
      />

      <Overlay
        open={narrowTarget !== null}
        onClose={() => setNarrowTarget(null)}
        title={t('narrow.title')}
        closeLabel={common('close')}
      >
        <p className="text-ink-secondary">{t('narrow.body')}</p>
        <div className="mt-4 flex flex-col gap-2">
          {narrowTarget?.visibility === 'public' && narrowTarget.type !== 'story' ? (
            <Button variant="secondary" onClick={() => narrow('anonymous')} busy={pending}>
              {t('narrow.toAnonymous')}
            </Button>
          ) : null}
          {narrowTarget?.visibility !== 'private' ? (
            <Button variant="secondary" onClick={() => narrow('private')} busy={pending}>
              {t('narrow.toPrivate')}
            </Button>
          ) : null}
        </div>
      </Overlay>

      <Overlay
        open={opened !== null && opened !== undefined}
        onClose={() => setOpenEntry(null)}
        kind="sheet"
        closeLabel={common('close')}
        title={opened?.title ?? formatDate(opened?.createdAt ?? new Date(), locale)}
      >
        {opened ? <PrivateEntryView entry={opened} onClosed={() => setOpenEntry(null)} /> : null}
      </Overlay>
    </div>
  );
}

function JournalRow({
  entry,
  locale,
  onOpen,
  onBurn,
  onNarrow,
}: {
  entry: EntryRecord;
  locale: Locale;
  onOpen: () => void;
  onBurn: () => void;
  onNarrow: () => void;
}) {
  const t = useTranslations('journal');
  const common = useTranslations('common');
  const auth = useTranslations('auth');
  const expiresIn = hoursUntil(entry.expiresAt);
  const preview = entry.locked
    ? auth('unlock.locked')
    : (entry.title ?? firstLine(entry.body ?? '', 160));
  return (
    <li className="group flex items-start gap-3 py-4">
      <button
        type="button"
        data-list-item
        onClick={onOpen}
        className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:shadow-[var(--focus-ring)]"
      >
        <span
          className={cn(
            'prose-reading block line-clamp-2 text-[1.0625rem]',
            entry.locked && 'text-ink-tertiary',
          )}
          style={{ viewTransitionName: `post-line-${entry.id}` }}
        >
          {preview || '…'}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-ink-secondary">
          <Icon
            name={VISIBILITY_ICON[entry.visibility]}
            size={14}
            label={common(`visibility.${entry.visibility}`)}
          />
          <time dateTime={entry.createdAt}>
            {formatDate(entry.createdAt, locale, { day: 'numeric', month: 'short' })}
          </time>
          {entry.roomName ? <span>· {entry.roomName}</span> : null}
          {entry.status === 'expired' ? <span>· {t('status.expired')}</span> : null}
          {entry.status === 'hidden' || entry.status === 'hidden_pending' ? (
            <span>· {t('status.hidden')}</span>
          ) : null}
          {expiresIn !== null && entry.status === 'visible' ? (
            <span>· {common('expiresIn', { hours: expiresIn })}</span>
          ) : null}
          {entry.hasFeedback ? (
            <span
              aria-label={t('actions.visibility')}
              className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
            />
          ) : null}
        </span>
      </button>
      <div className="flex shrink-0 gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        {entry.visibility !== 'private' ? (
          <button
            type="button"
            onClick={onNarrow}
            aria-label={t('actions.visibility')}
            title={t('actions.visibility')}
            className="touch-target flex items-center justify-center rounded-md text-ink-secondary hover:text-ink"
          >
            <Icon name="eye" size={18} />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onBurn}
          aria-label={t('actions.burn')}
          title={t('actions.burn')}
          className="touch-target flex items-center justify-center rounded-md text-ink-secondary hover:text-warn"
        >
          <Icon name="flame" size={18} />
        </button>
      </div>
      {entry.visibility !== 'private' ? (
        <Link href={`/posts/${entry.id}`} className="sr-only">
          {preview}
        </Link>
      ) : null}
    </li>
  );
}
