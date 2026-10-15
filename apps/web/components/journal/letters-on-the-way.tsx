'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { type Locale } from '@inkwell/shared';

import { Icon } from '@/components/ui/icon';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { isSealed } from '@/lib/letters';

/** Sealed letters still on their way, soonest first. Only their dates are shown. */
export function LettersOnTheWay() {
  const t = useTranslations('journal.letter');
  const locale = useLocale() as Locale;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  const entries = useLiveQuery(() => db().entries.toArray(), []);
  if (now === null || !entries) return null;
  const sealed = entries
    .filter((entry) => isSealed(entry.opensAt, now))
    .sort((a, b) => (a.opensAt ?? '').localeCompare(b.opensAt ?? ''));
  if (sealed.length === 0) return null;

  return (
    <section aria-labelledby="letters-on-the-way" className="mt-8">
      <h2 id="letters-on-the-way" className="label mb-3">
        {t('onTheWay')}
      </h2>
      <ul className="flex flex-col gap-2">
        {sealed.slice(0, 5).map((entry) => (
          <li key={entry.id} className="flex items-start gap-3 text-[0.875rem]">
            <Icon name="envelope" size={15} className="mt-0.5 shrink-0 text-accent-text" />
            <span>
              <span className="block font-medium text-ink">
                {formatDate(entry.opensAt ?? entry.createdAt, locale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="block text-ink-tertiary">
                {t('writtenOn', {
                  date: formatDate(entry.createdAt, locale, { day: 'numeric', month: 'long' }),
                })}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
