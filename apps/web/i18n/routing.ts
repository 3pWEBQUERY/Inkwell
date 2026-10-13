import { defineRouting } from 'next-intl/routing';

import { DEFAULT_LOCALE, LOCALES } from '@inkwell/shared';

/**
 * German (launch market) has no prefix; other languages use `/fr`, `/it`, `/en`.
 * The first visit is redirected according to `Accept-Language`.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
  localeCookie: {
    name: 'inkwell_locale',
    maxAge: 60 * 60 * 24 * 365,
  },
});

export type AppLocale = (typeof routing.locales)[number];
