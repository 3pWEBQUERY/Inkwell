import { privacyDe } from './privacy.de';
import { privacyEn } from './privacy.en';
import { privacyFr } from './privacy.fr';
import { privacyIt } from './privacy.it';
import { termsDe } from './terms.de';
import { termsEn } from './terms.en';
import { termsFr } from './terms.fr';
import { termsIt } from './terms.it';

import type { LegalDocument } from './types';
import type { Locale } from '@inkwell/shared';

export const PRIVACY: Record<Locale, LegalDocument> = {
  de: privacyDe,
  en: privacyEn,
  fr: privacyFr,
  it: privacyIt,
};
export const TERMS: Record<Locale, LegalDocument> = {
  de: termsDe,
  en: termsEn,
  fr: termsFr,
  it: termsIt,
};
