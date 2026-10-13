import type { Locale } from '@inkwell/shared';

export interface LegalSection {
  title: string;
  /** Paragraphs; a paragraph starting with "- " renders as a list item. */
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}

export type LegalDocuments = Record<Locale, LegalDocument>;
