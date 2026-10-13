'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { LOCALES, type Locale } from '@inkwell/shared';

import { usePathname, useRouter } from '@/i18n/navigation';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-ink-secondary">
      <span className={compact ? 'sr-only' : ''}>{t('language')}</span>
      <select
        value={locale}
        disabled={pending}
        aria-label={t('language')}
        onChange={(event) => {
          const next = event.target.value as Locale;
          startTransition(() => router.replace(pathname, { locale: next }));
        }}
        className="h-9 rounded-md border border-line-strong bg-paper px-2 text-ink"
      >
        {LOCALES.map((option) => (
          <option key={option} value={option}>
            {t(`locales.${option}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
