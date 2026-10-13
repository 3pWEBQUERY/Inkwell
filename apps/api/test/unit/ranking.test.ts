import { describe, expect, it } from 'vitest';

import { ageInHours, rankingScore } from '../../src/services/ranking.js';

describe('rankingScore', () => {
  it('decays with age', () => {
    expect(rankingScore(10, 0)).toBeCloseTo(10 / Math.pow(2, 1.5));
    expect(rankingScore(10, 10)).toBeLessThan(rankingScore(10, 0));
    expect(rankingScore(10, 100)).toBeLessThan(rankingScore(10, 10));
  });

  it('prefers more votes at the same age', () => {
    expect(rankingScore(5, 4)).toBeGreaterThan(rankingScore(3, 4));
  });

  it('lets a fresh text with few votes beat an old one with many', () => {
    expect(rankingScore(3, 1)).toBeGreaterThan(rankingScore(20, 72));
  });

  it('handles negative and zero votes', () => {
    expect(rankingScore(0, 5)).toBe(0);
    expect(rankingScore(-4, 5)).toBeLessThan(0);
  });

  it('never uses a negative age', () => {
    expect(rankingScore(1, -5)).toBe(rankingScore(1, 0));
  });

  it('computes age in hours', () => {
    expect(
      ageInHours(new Date('2026-10-13T08:00:00Z'), new Date('2026-10-13T10:30:00Z')),
    ).toBeCloseTo(2.5);
  });
});
