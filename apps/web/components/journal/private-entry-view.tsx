'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { renderMarkdown, type Locale } from '@inkwell/shared';

import { useMe } from '@/components/providers/session-provider';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import { isSealed, markLetterRead } from '@/lib/letters';

import type { EntryRecord } from '@/lib/db';

/** A private entry, decrypted locally, read in the same typography as everything else. */
export function PrivateEntryView({
  entry,
  onClosed,
}: {
  entry: EntryRecord;
  onClosed: () => void;
}) {
  const t = useTranslations('reading');
  const auth = useTranslations('auth');
  const journal = useTranslations('journal');
  const locale = useLocale() as Locale;
  const me = useMe();
  const sealed = isSealed(entry.opensAt);
  useEffect(() => {
    if (entry.opensAt && !sealed) markLetterRead(entry.id);
  }, [entry.id, entry.opensAt, sealed]);
  if (sealed)
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-tint text-accent-text">
          <Icon name="envelope" size={22} />
        </span>
        <p className="font-serif text-[1.25rem]">
          {journal('letter.sealedUntil', {
            date: formatDate(entry.opensAt ?? entry.createdAt, locale, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          })}
        </p>
        <p className="max-w-sm text-[0.9375rem] text-ink-secondary">
          {journal('letter.sealedBody', {
            date: formatDate(entry.createdAt, locale, { day: 'numeric', month: 'long' }),
          })}
        </p>
      </div>
    );
  if (entry.locked || entry.body === null)
    return <p className="text-ink-secondary">{auth('unlock.locked')}</p>;
  return (
    <div>
      <div
        className={`prose-reading ${me?.settings.editorFont === 'sans' ? 'sans' : ''}`}
        style={{ fontSize: `${me?.settings.fontSize ?? 19}px` }}
        // The renderer escapes everything; only p, br, strong, em, blockquote and hr are emitted.
        dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.body) }}
      />
      {entry.opensAt ? (
        <p className="mt-6 text-[13px] text-ink-secondary">
          {journal('letter.writtenOn', {
            date: formatDate(entry.createdAt, locale, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          })}
        </p>
      ) : null}
      <div className="mt-6">
        <Link href={`/write?editPrivate=${entry.id}`} onClick={onClosed}>
          <Button variant="secondary" size="sm">
            {t('edit')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
