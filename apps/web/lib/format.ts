import type { Locale } from '@inkwell/shared';

const LOCALE_TAGS: Record<Locale, string> = { de: 'de-CH', fr: 'fr-CH', it: 'it-CH', en: 'en-GB' };

export function localeTag(locale: Locale): string {
  return LOCALE_TAGS[locale];
}

export function formatDate(
  value: string | Date,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(
    localeTag(locale),
    options ?? { day: 'numeric', month: 'long', year: 'numeric' },
  ).format(date);
}

export function formatMonthYear(value: string | Date, locale: Locale): string {
  return formatDate(value, locale, { month: 'long', year: 'numeric' });
}

export function formatWeekday(value: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value);
}

/** Buckets for relative time; the sentence itself comes from the message catalog. */
export function relativeBucket(
  value: string | Date,
  now: Date = new Date(),
): { key: 'justNow' | 'minutes' | 'hours' | 'days'; count: number } {
  const date = typeof value === 'string' ? new Date(value) : value;
  const diffMinutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  if (diffMinutes < 1) return { key: 'justNow', count: 0 };
  if (diffMinutes < 60) return { key: 'minutes', count: diffMinutes };
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return { key: 'hours', count: diffHours };
  return { key: 'days', count: Math.round(diffHours / 24) };
}

export function monthKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
