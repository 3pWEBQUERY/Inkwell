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
  return { title: t('imprint') };
}

/**
 * Operator, responsible person and address come from the environment, so the
 * page shows real facts or an explicit gap, never invented ones.
 */
export default async function ImprintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  const addressLines = site.address.split('\n').filter(Boolean);
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl">{t('imprint')}</h1>
      <dl className="mt-10 grid gap-6 text-ink-secondary">
        <div>
          <dt className="text-sm text-ink-tertiary">{site.name}</dt>
          <dd className="text-ink">{site.operatorName || '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-tertiary">{t('contact')}</dt>
          <dd>
            <a
              href={`mailto:${site.contactEmail}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              {site.contactEmail}
            </a>
          </dd>
        </div>
        {site.responsiblePerson ? (
          <div>
            <dt className="text-sm text-ink-tertiary">
              Verantwortlich · Responsable · Responsabile · Responsible
            </dt>
            <dd className="text-ink">{site.responsiblePerson}</dd>
          </div>
        ) : null}
        {addressLines.length > 0 ? (
          <div>
            <dt className="text-sm text-ink-tertiary">Adresse · Indirizzo · Address</dt>
            <dd className="text-ink">
              {addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-sm text-ink-tertiary">Hosting</dt>
          <dd>Railway, {site.hostingRegion}</dd>
        </div>
      </dl>
    </article>
  );
}
