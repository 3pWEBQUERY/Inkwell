import { getTranslations } from 'next-intl/server';

/** Served by the service worker when a page is not cached and the network is away. */
export default async function OfflinePage() {
  const t = await getTranslations('legal.offline');
  return (
    <div className="py-10">
      <h1 className="font-serif text-3xl">{t('title')}</h1>
      <p className="mt-3 text-ink-secondary">{t('body')}</p>
    </div>
  );
}
