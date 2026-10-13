export const LOCALES = ['de', 'fr', 'it', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Regions for which crisis helplines are maintained. Never derived from location, only from language/region settings. */
export const REGIONS = ['CH', 'DE', 'AT', 'FR', 'IT', 'UK', 'US'] as const;
export type Region = (typeof REGIONS)[number];

export function isRegion(value: unknown): value is Region {
  return typeof value === 'string' && (REGIONS as readonly string[]).includes(value);
}

/**
 * Picks a region from a BCP 47 language tag. Falls back to the most likely region
 * for the language, and to Switzerland (launch market) when nothing matches.
 */
export function regionFromLanguageTag(tag: string | null | undefined): Region {
  if (!tag) return 'CH';
  const [language = '', region = ''] = tag.replace('_', '-').split('-');
  const upper = region.toUpperCase();
  if (upper === 'GB') return 'UK';
  if (isRegion(upper)) return upper;
  switch (language.toLowerCase()) {
    case 'de':
    case 'fr':
    case 'it':
      return 'CH';
    case 'en':
      return 'UK';
    default:
      return 'CH';
  }
}
