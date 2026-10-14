import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('errors');
  return (
    <main className="content-width gutter flex min-h-dvh flex-col items-start justify-center gap-6">
      <p className="font-serif text-[1.25rem] text-ink-tertiary tabular-nums">404</p>
      <h1 className="display text-[2.5rem] md:text-[3rem]">{t('notFound')}</h1>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-md bg-accent px-5 font-medium text-accent-ink state-toggle hover:bg-accent-hover"
      >
        {t('goHome')}
      </Link>
    </main>
  );
}
