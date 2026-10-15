'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { countWords, firstLine } from '@inkwell/shared';

import { useAnnouncer } from '@/components/providers/announcer';
import { useCryptoState } from '@/components/providers/crypto-provider';
import { Confirm } from '@/components/ui/confirm';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { SkeletonCard } from '@/components/ui/skeleton';
import { cryptoClient } from '@/features/crypto/client';
import { splitTitle } from '@/features/posts/journal-sync';
import { Link } from '@/i18n/navigation';
import { db, type DraftRecord } from '@/lib/db';
import { relativeBucket } from '@/lib/format';

interface Preview {
  line: string;
  words: number;
}

/**
 * Unfinished texts. They live only in this browser, encrypted; the list
 * decrypts them here to show where each one begins.
 */
export function DraftList() {
  const t = useTranslations('journal.drafts');
  const common = useTranslations('common');
  const auth = useTranslations('auth');
  const crypto = useCryptoState();
  const { announce } = useAnnouncer();
  const drafts = useLiveQuery(() => db().drafts.orderBy('updatedAt').reverse().toArray(), []);
  const [previews, setPreviews] = useState<Record<string, Preview | null>>({});
  const [target, setTarget] = useState<DraftRecord | null>(null);

  useEffect(() => {
    if (!drafts || crypto.hasKey !== true) return;
    let cancelled = false;
    void (async () => {
      const next: Record<string, Preview | null> = {};
      for (const draft of drafts) {
        try {
          const plain = await cryptoClient.decrypt(draft);
          const { title, body } = splitTitle(plain);
          next[draft.id] = { line: title ?? firstLine(body, 140), words: countWords(body) };
        } catch {
          next[draft.id] = null;
        }
      }
      if (!cancelled) setPreviews(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [drafts, crypto.hasKey]);

  const remove = async () => {
    if (!target) return;
    await db().drafts.delete(target.id);
    setTarget(null);
    announce(t('removed'));
  };

  if (drafts === undefined)
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        <SkeletonCard />
      </div>
    );

  if (drafts.length === 0)
    return (
      <EmptyState
        action={
          <Link
            href="/write"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-[0.9375rem] font-medium text-accent-ink state-toggle hover:bg-accent-hover"
          >
            <Icon name="pen" size={16} />
            {t('write')}
          </Link>
        }
      >
        {t('empty')}
      </EmptyState>
    );

  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-[0.875rem] text-ink-secondary">
        <Icon name="lock" size={14} />
        {t('localOnly')}
      </p>
      <ul className="card divide-y divide-line overflow-hidden">
        {drafts.map((draft) => {
          const preview = previews[draft.id];
          const relative = relativeBucket(new Date(draft.updatedAt));
          return (
            <li key={draft.id} className="group flex items-center gap-3 px-4 py-4 md:px-5">
              <Link
                href={`/write?draft=${draft.id}`}
                data-list-item
                className="min-w-0 flex-1 rounded-md outline-none focus-visible:shadow-[var(--focus-ring)]"
              >
                <span className="prose-reading block line-clamp-2 text-[1.0625rem]">
                  {preview === undefined
                    ? '…'
                    : preview === null
                      ? auth('unlock.locked')
                      : preview.line || '…'}
                </span>
                <span className="mt-1.5 block text-[13px] text-ink-secondary">
                  {t('edited', {
                    when: common(`relative.${relative.key}`, { count: relative.count }),
                  })}
                  {preview ? ` · ${t('words', { count: preview.words })}` : ''}
                </span>
              </Link>
              <Link
                href={`/write?draft=${draft.id}`}
                tabIndex={-1}
                aria-hidden
                className="hidden h-9 items-center rounded-md px-3 text-[0.875rem] font-medium text-accent-text state-toggle hover:bg-accent-tint md:inline-flex"
              >
                {t('continue')}
              </Link>
              <button
                type="button"
                onClick={() => setTarget(draft)}
                aria-label={t('remove')}
                title={t('remove')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-secondary state-toggle hover:bg-warn-soft hover:text-warn pointer-coarse:h-11 pointer-coarse:w-11"
              >
                <Icon name="close" size={17} />
              </button>
            </li>
          );
        })}
      </ul>
      <Confirm
        open={target !== null}
        title={t('removeTitle')}
        body={t('removeBody')}
        confirmLabel={t('remove')}
        cancelLabel={common('cancel')}
        closeLabel={common('close')}
        danger
        onConfirm={() => void remove()}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
