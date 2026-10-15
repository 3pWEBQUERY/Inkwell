'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { Icon } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { db } from '@/lib/db';
import { dayKey, formatMonthYear, localeTag } from '@/lib/format';

import type { Locale } from '@inkwell/shared';

/**
 * A month of the journal at a glance: a dot under every day with at least one
 * entry, never a number. Days link to the journal filtered to that day. The
 * week starts on Monday, as everywhere in the product's languages.
 */
export function ReviewCalendar({ selected }: { selected: string | null }) {
  const t = useTranslations('journal.review');
  const locale = useLocale() as Locale;
  const [cursor, setCursor] = useState<{ year: number; month: number } | null>(null);
  const [todayKey, setTodayKey] = useState<string | null>(null);

  useEffect(() => {
    const now = selected ? new Date(`${selected}T12:00:00`) : new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setTodayKey(dayKey(new Date()));
  }, [selected]);

  const entries = useLiveQuery(() => db().entries.toArray(), []);
  const written = useMemo(
    () => new Set((entries ?? []).map((entry) => dayKey(entry.createdAt))),
    [entries],
  );

  const weekdays = useMemo(() => {
    const format = new Intl.DateTimeFormat(localeTag(locale), { weekday: 'narrow' });
    // 2024-01-01 was a Monday.
    return Array.from({ length: 7 }, (_, index) => format.format(new Date(2024, 0, 1 + index)));
  }, [locale]);

  if (!cursor) return <div className="h-[296px]" aria-hidden />;

  const first = new Date(cursor.year, cursor.month, 1);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta: number) =>
    setCursor((current) => {
      if (!current) return current;
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  const isCurrentMonth = todayKey?.startsWith(dayKey(first).slice(0, 7)) ?? false;

  return (
    <section aria-labelledby="review-title" className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="review-title" className="text-[0.9375rem] font-semibold tracking-[-0.01em]">
          {formatMonthYear(first, locale)}
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label={t('previousMonth')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-secondary state-toggle hover:bg-paper-raised hover:text-ink"
          >
            <Icon name="chevron-left" size={16} />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={t('nextMonth')}
            disabled={isCurrentMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-secondary state-toggle hover:bg-paper-raised hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent"
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center" role="grid" aria-label={t('title')}>
        {weekdays.map((weekday, index) => (
          <span
            key={`${weekday}-${String(index)}`}
            aria-hidden
            className="pb-1 text-[11px] font-medium text-ink-tertiary"
          >
            {weekday}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${String(index)}`} aria-hidden />;
          const key = dayKey(new Date(cursor.year, cursor.month, day));
          const has = written.has(key);
          const isToday = key === todayKey;
          const isSelected = key === selected;
          const inner = (
            <>
              <span>{day}</span>
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 h-1 w-1 rounded-full',
                  has ? (isSelected ? 'bg-accent-ink' : 'bg-accent') : 'bg-transparent',
                )}
              />
            </>
          );
          const base =
            'mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-md text-[0.8125rem] tabular-nums';
          return has ? (
            <Link
              key={key}
              href={`/journal?day=${key}`}
              aria-label={`${t('written')}: ${key}`}
              aria-current={isSelected ? 'date' : undefined}
              className={cn(
                base,
                'font-medium state-toggle',
                isSelected ? 'bg-accent text-accent-ink' : 'text-ink hover:bg-paper-raised',
                isToday && !isSelected && 'shadow-[inset_0_0_0_1px_var(--color-line-strong)]',
              )}
            >
              {inner}
            </Link>
          ) : (
            <span
              key={key}
              className={cn(
                base,
                'text-ink-tertiary',
                isToday && 'shadow-[inset_0_0_0_1px_var(--color-line-strong)]',
              )}
            >
              {inner}
            </span>
          );
        })}
      </div>
    </section>
  );
}
