import { getLocale, getTranslations } from 'next-intl/server';

import { LastEntry } from '@/components/journal/last-entry';
import { TodayFeed } from '@/components/rooms/today-feed';
import { Icon } from '@/components/ui/icon';
import { PageHeader, Section } from '@/components/ui/page-header';
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
      <PageHeader title={formatWeekday(new Date(), current)} />

      <Section id="last-entry" label={t('lastEntry')}>
        {last ? (
          <LastEntry entry={last} />
        ) : (
          <Link
            href="/write"
            className="card group flex items-center justify-between gap-4 p-5 outline-none focus-visible:shadow-[var(--focus-ring)]"
          >
            <span className="font-serif text-lg">{t('noEntry')}</span>
            <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-accent px-4 text-[0.9375rem] font-medium text-accent-ink state-toggle group-hover:bg-accent-hover">
              <Icon name="pen" size={17} />
              {t('write')}
            </span>
          </Link>
        )}
      </Section>

      <Section id="new-in-rooms" label={t('newInRooms')}>
        <TodayFeed initial={feed} />
      </Section>
    </div>
  );
}
