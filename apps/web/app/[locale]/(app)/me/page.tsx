import { getLocale, getTranslations } from 'next-intl/server';

import { AvatarPicker } from '@/components/profile/avatar-picker';
import { FeedbackList } from '@/components/profile/feedback-list';
import { Icon } from '@/components/ui/icon';
import { getMe } from '@/features/auth/session';
import { getFeedback, getNotices, getOwnSeries } from '@/features/posts/queries';
import { Link, redirect } from '@/i18n/navigation';
import { formatDate, formatMonthYear } from '@/lib/format';

import type { Locale } from '@inkwell/shared';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('me');
  return { title: t('title'), robots: { index: false } };
}

const GROUPS = [
  'account',
  'security',
  'writing',
  'appearance',
  'notifications',
  'languages',
  'blocked',
  'data',
  'about',
] as const;

/** Avatar, pseudonym, member since. Feedback, profile preview, series, settings. No numbers in the head. */
export default async function MePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const me = await getMe();
  if (!me) {
    redirect({ href: '/sign-in', locale });
    return null;
  }
  const t = await getTranslations('me');
  const settings = await getTranslations('settings');
  const current = (await getLocale()) as Locale;
  const [feedback, series, notices] = await Promise.all([
    getFeedback().catch(() => []),
    getOwnSeries().catch(() => []),
    getNotices().catch(() => []),
  ]);

  return (
    <div>
      <header className="flex items-center gap-4">
        <AvatarPicker current={me.avatar} userId={me.id} pseudonym={me.pseudonym} />
        <div>
          <h1 className="font-serif text-2xl">{me.pseudonym}</h1>
          <p className="text-[13px] text-ink-secondary">
            {t('memberSince', { date: formatMonthYear(me.createdAt, current) })}
          </p>
        </div>
      </header>

      {notices.length > 0 ? (
        <section
          className="mt-8 rounded-md border border-line bg-paper-raised p-4"
          aria-labelledby="notices"
        >
          <h2 id="notices" className="text-sm font-medium text-ink-secondary">
            {t('notices')}
          </h2>
          <ul className="mt-2 space-y-3">
            {notices.map((notice) => (
              <li key={notice.id} className="text-[15px]">
                <span className="block text-[13px] text-ink-tertiary">
                  {formatDate(notice.createdAt, current)}
                </span>
                {notice.note}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="feedback">
        <h2 id="feedback" className="text-sm font-medium text-ink-secondary">
          {t('feedback')}
        </h2>
        <p className="mt-1 text-[13px] text-ink-tertiary">{t('feedbackOnlyYou')}</p>
        <div className="mt-2">
          <FeedbackList items={feedback} />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="public-profile">
        <h2 id="public-profile" className="text-sm font-medium text-ink-secondary">
          {t('publicProfile')}
        </h2>
        <p className="mt-1 text-[13px] text-ink-tertiary">{t('profileHint')}</p>
        <Link
          href={`/u/${me.pseudonym}`}
          className="mt-2 inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
        >
          /@{me.pseudonym}
          <Icon name="arrow-right" size={16} />
        </Link>
      </section>

      {series.length > 0 ? (
        <section className="mt-8" aria-labelledby="series">
          <h2 id="series" className="text-sm font-medium text-ink-secondary">
            {t('series')}
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {series.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/series/${item.id}`}
                  className="flex min-h-11 items-center justify-between py-2"
                >
                  <span>{item.title}</span>
                  <Icon name="arrow-right" size={16} className="text-ink-tertiary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8" aria-labelledby="settings">
        <h2 id="settings" className="text-sm font-medium text-ink-secondary">
          {t('settings')}
        </h2>
        <ul className="mt-2 divide-y divide-line">
          {GROUPS.map((group) => (
            <li key={group}>
              <Link
                href={`/me/settings/${group}`}
                className="flex min-h-12 items-center justify-between"
              >
                <span>{settings(`groups.${group}`)}</span>
                <Icon name="arrow-right" size={16} className="text-ink-tertiary" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
