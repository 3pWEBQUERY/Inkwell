'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';

import { RESUME_FROM, RESUME_UNTIL } from '@/components/reading/read-tracker';
import { Link } from '@/i18n/navigation';
import { db } from '@/lib/db';

const RECENT_DAYS = 30;

/**
 * Texts begun and not finished, from this browser's own reading positions.
 * Nothing about it is sent anywhere, and nothing is ranked: newest first.
 */
export function ContinueReading({ className = 'mt-8' }: { className?: string }) {
  const t = useTranslations('today.continue');
  const headingId = useId();
  const [since, setSince] = useState<number | null>(null);
  useEffect(() => setSince(Date.now() - RECENT_DAYS * 86_400_000), []);
  const begun = useLiveQuery(
    () =>
      since === null
        ? []
        : db()
            .readProgress.where('updatedAt')
            .above(since)
            .reverse()
            .filter(
              (record) =>
                record.ratio >= RESUME_FROM && record.ratio < RESUME_UNTIL && Boolean(record.line),
            )
            .limit(3)
            .toArray(),
    [since],
  );
  if (!begun || begun.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="label mb-3">
        {t('title')}
      </h2>
      <ul className="flex flex-col gap-1">
        {begun.map((record) => (
          <li key={record.postId}>
            <Link
              href={`/posts/${record.postId}`}
              className="-mx-2 block rounded-md px-2 py-2 state-toggle hover:bg-paper-raised"
            >
              <span className="block truncate font-serif text-[0.9375rem] text-ink">
                {record.title ?? record.line}
              </span>
              <span className="mt-1 flex items-center gap-2 text-[12px] text-ink-tertiary">
                <span className="truncate">{record.roomName}</span>
                <span
                  aria-hidden
                  className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-paper-sunken"
                >
                  <span
                    className="block h-full rounded-full bg-accent/70"
                    style={{ width: `${String(Math.round(record.ratio * 100))}%` }}
                  />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
