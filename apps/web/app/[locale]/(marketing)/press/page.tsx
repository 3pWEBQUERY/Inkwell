import { getTranslations } from 'next-intl/server';

import { site } from '@/lib/site';

import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t('press') };
}

export default async function PressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  const m = await getTranslations({ locale, namespace: 'marketing' });
  const facts = [
    m('hero.subtitle'),
    m('promises.noPressure.body'),
    m('promises.noAlgorithm.body'),
    m('promises.noReaders.body'),
    m('pricing.body'),
    m('install.native'),
  ];
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl">{t('press')}</h1>
      <p className="mt-4 text-ink-secondary">{t('pressIntro')}</p>
      <h2 className="mt-10 font-serif text-2xl">{t('pressFacts')}</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-secondary">
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      <h2 className="mt-10 font-serif text-2xl">{t('pressContact')}</h2>
      <p className="mt-3">
        <a
          href={`mailto:${site.pressEmail}`}
          className="text-accent underline-offset-4 hover:underline"
        >
          {site.pressEmail}
        </a>
      </p>
    </article>
  );
}
