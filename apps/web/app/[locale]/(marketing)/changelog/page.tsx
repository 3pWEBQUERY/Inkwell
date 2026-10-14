import { getTranslations } from 'next-intl/server';

import { CHANGELOG } from '@/content/changelog';
import { formatDate } from '@/lib/format';

import type { Locale } from '@inkwell/shared';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('changelog') };
}

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return (
    <article className="mx-auto w-full max-w-3xl px-5 pt-16 pb-24 md:px-8 md:pt-24">
      <h1 className="display text-[2.5rem] md:text-[3.25rem]">{t('changelog')}</h1>
      <p className="mt-4 text-ink-secondary">{t('changelogIntro')}</p>
      <ol className="mt-10 space-y-10">
        {CHANGELOG.map((entry) => (
          <li key={entry.version}>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="font-serif text-[1.625rem] font-medium tracking-[-0.015em]">
                {entry.version}
              </h2>
              <span className="text-sm text-ink-tertiary">
                {formatDate(entry.date, locale as Locale)}
              </span>
              <code className="text-xs text-ink-tertiary">build {entry.build}</code>
            </div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-secondary">
              {entry.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </article>
  );
}
