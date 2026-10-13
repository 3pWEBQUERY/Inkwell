import { getLocale, getTranslations } from 'next-intl/server';

import { LastEntry } from '@/components/journal/last-entry';
import { TodayFeed } from '@/components/rooms/today-feed';
import { getMe } from '@/features/auth/session';
import { getJournal, getTodayFeed } from '@/features/posts/queries';
import { Link, redirect } from '@/i18n/navigation';
import { formatWeekday } from '@/lib/format';

import type { Locale } from '@inkwell/shared';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('today'), robots: { index: false } };
}

/** Start of the day: date, the last own entry, what is new in joined rooms. No streaks, no quote of the day. */
export default async function TodayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const me = await getMe();
  if (!me) redirect({ href: '/sign-in', locale });
  const t = await getTranslations('today');
  const current = (await getLocale()) as Locale;

  const [journal, feed] = await Promise.all([getJournal(), getTodayFeed()]);
  const last = journal.items[0] ?? null;

  return (
    <div>
      <h1 className="font-serif text-3xl">{formatWeekday(new Date(), current)}</h1>

      <section className="mt-8" aria-labelledby="last-entry">
        <h2 id="last-entry" className="text-sm font-medium text-ink-secondary">
          {t('lastEntry')}
        </h2>
        <div className="mt-2">
          {last ? (
            <LastEntry entry={last} />
          ) : (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="font-serif text-lg">{t('noEntry')}</p>
              <Link
                href="/write"
                className="inline-flex h-11 items-center rounded-md bg-accent px-4 font-medium text-accent-ink"
              >
                {t('write')}
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="new-in-rooms">
        <h2 id="new-in-rooms" className="text-sm font-medium text-ink-secondary">
          {t('newInRooms')}
        </h2>
        <TodayFeed initial={feed} />
      </section>
    </div>
  );
}
