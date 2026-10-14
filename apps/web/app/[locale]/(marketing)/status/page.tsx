import { getTranslations } from 'next-intl/server';

import { serverEnv } from '@/env';
import { formatDate } from '@/lib/format';

import type { Locale } from '@inkwell/shared';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('status') };
}

/** A plain status page fed by the API readiness probe; no third-party status widget. */
export default async function StatusPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  let apiOk = false;
  try {
    const response = await fetch(`${serverEnv().API_URL}/health/ready`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    apiOk = response.ok;
  } catch {
    apiOk = false;
  }
  const now = new Date();
  return (
    <article className="mx-auto w-full max-w-3xl px-5 pt-16 pb-24 md:px-8 md:pt-24">
      <h1 className="display text-[2.5rem] md:text-[3.25rem]">{t('status')}</h1>
      <p className="mt-6 flex items-center gap-3 text-lg">
        <span
          aria-hidden
          className={`inline-block h-2.5 w-2.5 rounded-full ring-4 ${apiOk ? 'bg-accent ring-accent-soft' : 'bg-warn ring-warn-soft'}`}
        />
        {apiOk ? t('statusOk') : t('statusDegraded', { component: 'API' })}
      </p>
      <p className="mt-3 text-sm text-ink-tertiary">
        {t('statusChecked', {
          date: formatDate(now, locale as Locale, { dateStyle: 'medium', timeStyle: 'short' }),
        })}
      </p>
    </article>
  );
}
