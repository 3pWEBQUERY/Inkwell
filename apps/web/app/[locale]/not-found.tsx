import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('errors');
  return (
    <main className="content-width gutter flex min-h-dvh flex-col items-start justify-center gap-4">
      <h1 className="font-serif text-3xl">{t('notFound')}</h1>
      <Link href="/" className="text-accent underline-offset-4 hover:underline">
        {t('goHome')}
      </Link>
    </main>
  );
}
