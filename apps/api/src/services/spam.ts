/**
 * Server-side spam heuristics for shared texts. Hits go to the review queue;
 * nothing is deleted automatically (PRD 10.5).
 */

const URL_PATTERN = /(https?:\/\/|www\.)[^\s]+/giu;
const DOMAIN_PATTERN = /\b[a-z0-9-]+\.(?:com|net|org|io|ch|de|fr|it|co|app|xyz|shop|info)\b/giu;

export interface SpamSignal {
  kind: 'links' | 'repeat' | 'multi_account';
  detail: string;
}

export function linkSignals(body: string): SpamSignal[] {
  const urls = body.match(URL_PATTERN) ?? [];
  const domains = body.match(DOMAIN_PATTERN) ?? [];
  const count = urls.length + domains.length;
  if (count >= 2) return [{ kind: 'links', detail: `${count} links` }];
  return [];
}

/** Normalised fingerprint for "same text posted again" detection. */
export function fingerprint(body: string): string {
  return body
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, 400);
}

export function repeatSignal(body: string, recentFingerprints: readonly string[]): SpamSignal[] {
  const current = fingerprint(body);
  if (current.length < 40) return [];
  const repeats = recentFingerprints.filter((candidate) => candidate === current).length;
  if (repeats >= 1) return [{ kind: 'repeat', detail: `${repeats + 1} identical texts` }];
  return [];
}

export function multiAccountSignal(accountsOnDevice: number): SpamSignal[] {
  if (accountsOnDevice >= 3)
    return [{ kind: 'multi_account', detail: `${accountsOnDevice} accounts on one device` }];
  return [];
}
