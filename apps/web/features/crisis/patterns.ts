import type { Locale } from '@inkwell/shared';

/**
 * Deterministic crisis signals per language: a word list plus a few sentence
 * patterns. Checked locally while typing; nothing leaves the browser and
 * nothing is stored. Conservative by design: it should notice explicit
 * statements of wanting to die or to hurt oneself, not sad writing.
 */
export interface CrisisPatternSet {
  phrases: string[];
  patterns: RegExp[];
}

export const CRISIS_PATTERNS: Record<Locale, CrisisPatternSet> = {
  de: {
    phrases: [
      'ich will nicht mehr leben',
      'ich möchte nicht mehr leben',
      'ich will sterben',
      'ich möchte sterben',
      'ich will mich umbringen',
      'ich bringe mich um',
      'mich umbringen',
      'mir das leben nehmen',
      'ich will tot sein',
      'ich wäre lieber tot',
      'es wäre besser ohne mich',
      'alle wären besser dran ohne mich',
      'keinen ausweg mehr',
      'ich halte das nicht mehr aus',
      'ich kann nicht mehr',
      'ich schneide mich',
      'mich selbst verletzen',
      'suizid',
      'selbstmord',
    ],
    patterns: [
      /\b(will|möchte|wollte)\s+(nicht\s+mehr\s+)?(leben|sterben|tot sein)\b/iu,
      /\b(mir|mich)\s+(das\s+leben\s+nehmen|umbringen|töten)\b/iu,
      /\bwenn\s+ich\s+(morgen\s+)?nicht\s+mehr\s+(da|hier)\s+(bin|wäre)\b/iu,
    ],
  },
  fr: {
    phrases: [
      'je ne veux plus vivre',
      'je veux mourir',
      'je voudrais mourir',
      'je vais me tuer',
      'me suicider',
      'mettre fin à mes jours',
      'je préférerais être mort',
      'je préférerais être morte',
      'tout le monde irait mieux sans moi',
      'je n’en peux plus',
      'je me fais du mal',
      'je me coupe',
      'suicide',
    ],
    patterns: [
      /\bje\s+(ne\s+)?veux\s+(plus\s+)?(vivre|mourir)\b/iu,
      /\b(me\s+tuer|me\s+suicider|en\s+finir)\b/iu,
      /\bsi\s+je\s+n[’']étais\s+plus\s+là\b/iu,
    ],
  },
  it: {
    phrases: [
      'non voglio più vivere',
      'voglio morire',
      'vorrei morire',
      'voglio uccidermi',
      'mi ammazzo',
      'farla finita',
      'togliermi la vita',
      'preferirei essere morto',
      'preferirei essere morta',
      'starebbero tutti meglio senza di me',
      'non ce la faccio più',
      'mi faccio del male',
      'mi taglio',
      'suicidio',
    ],
    patterns: [
      /\b(non\s+)?voglio\s+(più\s+)?(vivere|morire)\b/iu,
      /\b(uccidermi|ammazzarmi|farla\s+finita|togliermi\s+la\s+vita)\b/iu,
      /\bse\s+non\s+ci\s+fossi\s+più\b/iu,
    ],
  },
  en: {
    phrases: [
      'i want to die',
      'i do not want to live',
      "i don't want to live",
      'i want to kill myself',
      'kill myself',
      'end my life',
      'take my own life',
      'i would rather be dead',
      'better off without me',
      'no way out',
      "i can't go on",
      'i cannot go on',
      'i cut myself',
      'hurt myself',
      'suicide',
      'suicidal',
    ],
    patterns: [
      /\bi\s+(don'?t|do\s+not)\s+want\s+to\s+(live|be\s+here|wake\s+up)\b/iu,
      /\b(kill|hurt|cut)\s+myself\b/iu,
      /\bif\s+i\s+(was|were)n'?t\s+(here|around)\s+(anymore|tomorrow)\b/iu,
    ],
  },
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[’`´]/gu, "'").replace(/\s+/gu, ' ');
}

/** True when the text contains an explicit crisis signal for the given language. */
export function detectCrisis(text: string, locale: Locale): boolean {
  const set = CRISIS_PATTERNS[locale];
  const normalized = normalize(text);
  if (normalized.length < 8) return false;
  if (set.phrases.some((phrase) => normalized.includes(normalize(phrase)))) return true;
  return set.patterns.some((pattern) => pattern.test(normalized));
}
