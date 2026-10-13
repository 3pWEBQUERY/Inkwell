import { describe, expect, it } from 'vitest';

import { decodeCursor, encodeCursor } from '../../src/lib/cursor.js';
import { describeDevice } from '../../src/lib/device.js';
import { isId, newId } from '../../src/lib/ids.js';

describe('ids', () => {
  it('are 24 chars, url-safe and time-ordered', () => {
    const a = newId(1_000_000);
    const b = newId(2_000_000);
    expect(isId(a)).toBe(true);
    expect(a < b).toBe(true);
    expect(new Set(Array.from({ length: 1000 }, () => newId())).size).toBe(1000);
  });
});

describe('cursors', () => {
  it('round-trip', () => {
    const cursor = { createdAt: new Date('2026-10-13T10:00:00.000Z'), id: 'abc' };
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
    expect(decodeCursor(undefined)).toBeNull();
  });

  it('reject garbage', () => {
    expect(() => decodeCursor('not-a-cursor')).toThrow();
  });
});

describe('describeDevice', () => {
  it('summarises user agents without storing them', () => {
    expect(
      describeDevice(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe('Safari · iPhone');
    expect(
      describeDevice(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36',
      ),
    ).toBe('Chrome · Windows');
    expect(describeDevice(undefined)).toBe('Unknown device');
  });
});
