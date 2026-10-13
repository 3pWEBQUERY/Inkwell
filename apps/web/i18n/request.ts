import { locale as rootLocale } from 'next/root-params';
import { hasLocale, type AbstractIntlMessages } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

/** The locale comes from the `[locale]` root segment (Next root params); no per-page plumbing needed. */
export default getRequestConfig(async () => {
  const requested = await rootLocale();
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: ((await import(`../messages/${locale}.json`)) as { default: AbstractIntlMessages })
      .default,
    timeZone: 'Europe/Zurich',
    now: new Date(),
  };
});
