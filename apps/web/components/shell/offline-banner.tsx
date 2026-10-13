'use client';

import { useTranslations } from 'next-intl';

import { useOnline } from '@/components/providers/online-provider';

export function OfflineBanner() {
  const online = useOnline();
  const t = useTranslations('common');
  if (online) return null;
  return (
    <p
      role="status"
      className="border-b border-line bg-paper-raised px-4 py-2 text-center text-[13px] text-ink-secondary"
    >
      {t('offline')}
    </p>
  );
}
