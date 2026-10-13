import { describe, expect, it } from 'vitest';

import { canChangeVisibility, PSEUDONYM_PATTERN } from '../src/constants.js';
import { HTTP_STATUS_BY_CODE, ERROR_CODES, isApiErrorBody } from '../src/error-codes.js';
import { regionFromLanguageTag } from '../src/locales.js';
import { suggestPseudonym } from '../src/pseudonym.js';
import { expiresAtFor, hoursUntil, isWithinEditWindow } from '../src/time.js';

describe('visibility transitions', () => {
  it('only narrows', () => {
    expect(canChangeVisibility('public', 'private')).toBe(true);
    expect(canChangeVisibility('public', 'anonymous')).toBe(true);
    expect(canChangeVisibility('anonymous', 'private')).toBe(true);
    expect(canChangeVisibility('private', 'anonymous')).toBe(false);
    expect(canChangeVisibility('private', 'public')).toBe(false);
    expect(canChangeVisibility('anonymous', 'public')).toBe(false);
    expect(canChangeVisibility('public', 'public')).toBe(true);
  });
});

describe('error codes', () => {
  it('every code has a status', () => {
    for (const code of ERROR_CODES) expect(HTTP_STATUS_BY_CODE[code]).toBeGreaterThanOrEqual(400);
  });

  it('recognises error bodies', () => {
    expect(isApiErrorBody({ error: 'POST_TOO_SHORT' })).toBe(true);
    expect(isApiErrorBody({ error: 'Something went wrong' })).toBe(false);
    expect(isApiErrorBody(null)).toBe(false);
  });
});

describe('regions', () => {
  it('maps language tags to maintained regions', () => {
    expect(regionFromLanguageTag('de-CH')).toBe('CH');
    expect(regionFromLanguageTag('de-DE')).toBe('DE');
    expect(regionFromLanguageTag('en-GB')).toBe('UK');
    expect(regionFromLanguageTag('en-US')).toBe('US');
    expect(regionFromLanguageTag('fr')).toBe('CH');
    expect(regionFromLanguageTag('es-ES')).toBe('CH');
    expect(regionFromLanguageTag(undefined)).toBe('CH');
  });
});

describe('pseudonym suggestions', () => {
  it('produce valid pseudonyms', () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 50; i += 1) {
      const suggestion = suggestPseudonym('de', random);
      expect(suggestion).toMatch(PSEUDONYM_PATTERN);
      expect(suggestion.length).toBeLessThanOrEqual(24);
    }
  });
});

describe('time helpers', () => {
  const now = new Date('2026-10-13T10:00:00Z');

  it('computes expiry dates', () => {
    expect(expiresAtFor('none', now)).toBeNull();
    expect(expiresAtFor('24h', now)?.toISOString()).toBe('2026-10-14T10:00:00.000Z');
    expect(expiresAtFor('7d', now)?.toISOString()).toBe('2026-10-20T10:00:00.000Z');
  });

  it('counts hours until expiry without going negative', () => {
    expect(hoursUntil('2026-10-14T05:30:00Z', now)).toBe(20);
    expect(hoursUntil('2026-10-13T09:00:00Z', now)).toBe(0);
    expect(hoursUntil(null, now)).toBeNull();
  });

  it('checks the edit window', () => {
    expect(isWithinEditWindow('2026-10-13T09:50:00Z', 15, now)).toBe(true);
    expect(isWithinEditWindow('2026-10-13T09:40:00Z', 15, now)).toBe(false);
  });
});
