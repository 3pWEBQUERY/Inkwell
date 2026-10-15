'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { type JournalPost, type Locale } from '@inkwell/shared';

import { Icon } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import { LETTER_ANNOUNCE_DAYS, markLetterRead, readLetters } from '@/lib/letters';

/**
 * A letter written to oneself months ago has opened. It is announced here,
 * quietly, for two weeks or until it is read. Nothing is sent anywhere.
 */
export function ArrivedLetters({ entries }: { entries: JournalPost[] }) {
  const t = useTranslations('today.letter');
  const locale = useLocale() as Locale;
  const [letters, setLetters] = useState<JournalPost[]>([]);

  useEffect(() => {
    const now = Date.now();
    const since = now - LETTER_ANNOUNCE_DAYS * 86_400_000;
    const read = readLetters();
    setLetters(
      entries.filter((entry) => {
        if (!entry.opensAt || read.has(entry.id)) return false;
        const opens = new Date(entry.opensAt).getTime();
        return opens <= now && opens >= since;
      }),
    );
  }, [entries]);

  if (letters.length === 0) return null;

  return (
    <div className="mb-10 flex flex-col gap-3">
      {letters.map((letter) => (
        <Link
          key={letter.id}
          href={`/journal?open=${letter.id}`}
          onClick={() => markLetterRead(letter.id)}
          className="card group flex items-center gap-4 p-5 outline-none focus-visible:shadow-[var(--focus-ring)]"
        >
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-text"
          >
            <Icon name="envelope" size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-[1.1875rem] leading-snug">{t('title')}</span>
            <span className="mt-0.5 block text-[0.875rem] text-ink-secondary">
              {t('body', {
                date: formatDate(letter.createdAt, locale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
              })}
            </span>
          </span>
          <span className="hidden shrink-0 items-center gap-1 text-[0.875rem] font-medium text-accent-text sm:inline-flex">
            {t('open')}
            <Icon name="arrow-right" size={15} />
          </span>
        </Link>
      ))}
    </div>
  );
}
