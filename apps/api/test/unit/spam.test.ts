import { describe, expect, it } from 'vitest';

import {
  fingerprint,
  linkSignals,
  multiAccountSignal,
  repeatSignal,
} from '../../src/services/spam.js';

describe('spam heuristics', () => {
  it('flags texts with several links', () => {
    expect(linkSignals('Besuch https://a.example und https://b.example')).toHaveLength(1);
    expect(linkSignals('Ein Link: https://a.example reicht nicht')).toHaveLength(0);
    expect(linkSignals('Kein Link')).toHaveLength(0);
  });

  it('fingerprints ignore case, punctuation and whitespace', () => {
    expect(fingerprint('Hallo, Welt!  Wie geht es?')).toBe(fingerprint('hallo welt wie geht es'));
  });

  it('flags repeated texts but not short ones', () => {
    const long =
      'Dies ist ein längerer Text, der mehr als vierzig Zeichen hat und sich wiederholt.';
    expect(repeatSignal(long, [fingerprint(long)])).toHaveLength(1);
    expect(repeatSignal(long, [])).toHaveLength(0);
    expect(repeatSignal('kurz', [fingerprint('kurz')])).toHaveLength(0);
  });

  it('flags many accounts on one device', () => {
    expect(multiAccountSignal(2)).toHaveLength(0);
    expect(multiAccountSignal(3)).toHaveLength(1);
  });
});
