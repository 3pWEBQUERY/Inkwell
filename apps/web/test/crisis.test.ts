import { describe, expect, it } from 'vitest';

import { detectCrisis } from '@/features/crisis/patterns';

describe('detectCrisis', () => {
  it('notices explicit statements', () => {
    expect(detectCrisis('Ich will nicht mehr leben. Es ist alles zu viel.', 'de')).toBe(true);
    expect(detectCrisis('Manchmal denke ich, alle wären besser dran ohne mich.', 'de')).toBe(true);
    expect(detectCrisis("I don't want to live anymore", 'en')).toBe(true);
    expect(detectCrisis('Je ne veux plus vivre', 'fr')).toBe(true);
    expect(detectCrisis('Non voglio più vivere', 'it')).toBe(true);
  });

  it('leaves sad or literary writing alone', () => {
    expect(
      detectCrisis(
        'Heute war ein schwerer Tag. Ich bin müde und traurig, aber ich schreibe es auf.',
        'de',
      ),
    ).toBe(false);
    expect(detectCrisis('The protagonist dies at the end of the story.', 'en')).toBe(false);
    expect(detectCrisis('Der Winter fühlt sich endlos an.', 'de')).toBe(false);
  });

  it('ignores very short input', () => {
    expect(detectCrisis('tot', 'de')).toBe(false);
  });
});
