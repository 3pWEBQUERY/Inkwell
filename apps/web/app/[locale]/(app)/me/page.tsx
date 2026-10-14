import { getLocale, getTranslations } from 'next-intl/server';

import { AvatarPicker } from '@/components/profile/avatar-picker';
import { FeedbackList } from '@/components/profile/feedback-list';
import { Icon, type IconName } from '@/components/ui/icon';
import { Section } from '@/components/ui/page-header';
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

const GROUP_ICONS: Record<(typeof GROUPS)[number], IconName> = {
  account: 'me',
  security: 'shield',
  writing: 'pen',
  appearance: 'sun',
  notifications: 'bell',
  languages: 'globe',
  blocked: 'hand',
  data: 'download',
  about: 'book',
};

const ROW =
  'flex min-h-12 items-center gap-3 px-4 state-toggle hover:bg-paper-raised/60 md:px-5 outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--color-accent)]';

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
      <header className="mb-10 flex items-center gap-5">
        <AvatarPicker current={me.avatar} userId={me.id} pseudonym={me.pseudonym} />
        <div className="min-w-0">
          <h1 className="display truncate text-[1.875rem] md:text-[2.125rem]">{me.pseudonym}</h1>
          <p className="mt-1 text-[0.875rem] text-ink-secondary">
            {t('memberSince', { date: formatMonthYear(me.createdAt, current) })}
          </p>
        </div>
      </header>

      {notices.length > 0 ? (
        <section
          className="mb-10 rounded-lg border border-warn/30 bg-warn-soft p-5"
          aria-labelledby="notices"
        >
          <h2 id="notices" className="label text-warn">
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

      <Section id="feedback" label={t('feedback')}>
        <p className="-mt-1 mb-3 text-[13px] text-ink-tertiary">{t('feedbackOnlyYou')}</p>
        <FeedbackList items={feedback} />
      </Section>

      <Section id="public-profile" label={t('publicProfile')}>
        <Link href={`/u/${me.pseudonym}`} className={`card ${ROW} py-3`}>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">/@{me.pseudonym}</span>
            <span className="mt-0.5 block text-[13px] text-ink-secondary">{t('profileHint')}</span>
          </span>
          <Icon name="chevron-right" size={18} className="text-ink-tertiary" />
        </Link>
      </Section>

      {series.length > 0 ? (
        <Section id="series" label={t('series')}>
          <ul className="card divide-y divide-line overflow-hidden">
            {series.map((item) => (
              <li key={item.id}>
                <Link href={`/series/${item.id}`} className={ROW}>
                  <Icon name="book" size={18} className="text-ink-tertiary" />
                  <span className="flex-1">{item.title}</span>
                  <Icon name="chevron-right" size={18} className="text-ink-tertiary" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section id="settings" label={t('settings')}>
        <ul className="card divide-y divide-line overflow-hidden">
          {GROUPS.map((group) => (
            <li key={group}>
              <Link href={`/me/settings/${group}`} className={ROW}>
                <Icon name={GROUP_ICONS[group]} size={18} className="text-ink-secondary" />
                <span className="flex-1">{settings(`groups.${group}`)}</span>
                <Icon name="chevron-right" size={18} className="text-ink-tertiary" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
