'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="content-width gutter flex min-h-[60dvh] flex-col items-start justify-center gap-4">
      <h1 className="display text-[2rem]">{t('title')}</h1>
      <p className="text-ink-secondary">{t('generic')}</p>
      <Button variant="secondary" onClick={reset}>
        {t('retry')}
      </Button>
    </main>
  );
}
