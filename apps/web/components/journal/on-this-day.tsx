'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';

import { firstLine, type Locale } from '@inkwell/shared';

import { Icon } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { db, type EntryRecord } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { isSealed } from '@/lib/letters';

const VISIBILITY_ICON = { private: 'lock', anonymous: 'mask', public: 'globe' } as const;

interface Memory {
  entry: EntryRecord;
  months: number;
}

/** Entries written on this calendar day in earlier months or years, newest first. */
function memoriesFor(entries: EntryRecord[], today: Date): Memory[] {
  const result: Memory[] = [];
  for (const entry of entries) {
    if (isSealed(entry.opensAt)) continue;
    const created = new Date(entry.createdAt);
    if (created.getDate() !== today.getDate()) continue;
    const months =
      (today.getFullYear() - created.getFullYear()) * 12 + (today.getMonth() - created.getMonth());
    if (months < 1) continue;
    result.push({ entry, months });
  }
  return result.sort((a, b) => a.months - b.months).slice(0, 3);
}

/**
 * "On this day": what the author wrote on the same day of the month, a month
 * or a year ago. Read from the local journal, so private entries show their
 * first line only in this browser. Renders nothing in compact mode when there
 * is nothing to show.
 */
export function OnThisDay({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('journal.review');
  const common = useTranslations('common');
  const auth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const headingId = useId();
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  const entries = useLiveQuery(() => db().entries.toArray(), []);
  if (!today || !entries) return null;
  const memories = memoriesFor(entries, today);
  if (memories.length === 0 && compact) return null;

  return (
    <section aria-labelledby={headingId} className={cn(!compact && 'mt-8')}>
      <h2 id={headingId} className="label mb-3">
        {t('onThisDay')}
      </h2>
      {memories.length === 0 ? (
        <p className="text-[0.875rem] leading-relaxed text-ink-tertiary">{t('nothingYet')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {memories.map(({ entry, months }) => {
            const line = entry.locked
              ? auth('unlock.locked')
              : (entry.title ?? firstLine(entry.body ?? '', 120));
            const href =
              entry.visibility === 'private' ? `/journal?open=${entry.id}` : `/posts/${entry.id}`;
            return (
              <li key={entry.id}>
                <Link
                  href={href}
                  className="card block p-4 outline-none focus-visible:shadow-[var(--focus-ring)]"
                >
                  <span className="flex items-center gap-2 text-[12px] font-medium text-ink-secondary">
                    <Icon name={VISIBILITY_ICON[entry.visibility]} size={13} />
                    {months % 12 === 0
                      ? t('yearsAgo', { count: months / 12 })
                      : t('monthsAgo', { count: months })}
                    <span aria-hidden>·</span>
                    <time dateTime={entry.createdAt} className="font-normal">
                      {formatDate(entry.createdAt, locale, { day: 'numeric', month: 'short' })}
                    </time>
                  </span>
                  <span
                    className={cn(
                      'mt-1.5 block line-clamp-2',
                      entry.locked
                        ? 'text-[0.875rem] text-ink-tertiary'
                        : 'font-serif text-[1rem] leading-snug',
                    )}
                  >
                    {line || '…'}
                  </span>
                  <span className="sr-only">{common(`visibility.${entry.visibility}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
