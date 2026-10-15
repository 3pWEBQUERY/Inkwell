import { describe, expect, it } from 'vitest';

import { LOCALES } from '../src/locales.js';
import { PROMPT_COUNT, parsePromptIndex, promptIndexOfDay, promptText } from '../src/prompts.js';

describe('writing prompts', () => {
  it('has the same number of prompts in every language, none empty', () => {
    for (const locale of LOCALES) {
      for (let index = 0; index < PROMPT_COUNT; index++) {
        expect(promptText(locale, index).length).toBeGreaterThan(10);
      }
    }
  });

  it('gives everyone the same prompt on the same day and moves on the next day', () => {
    const monday = new Date(2026, 9, 12, 8, 0);
    const mondayEvening = new Date(2026, 9, 12, 23, 30);
    const tuesday = new Date(2026, 9, 13, 0, 5);
    expect(promptIndexOfDay(monday)).toBe(promptIndexOfDay(mondayEvening));
    expect(promptIndexOfDay(tuesday)).toBe((promptIndexOfDay(monday) + 1) % PROMPT_COUNT);
  });

  it('wraps indices and rejects anything that is not a plain index', () => {
    expect(promptText('de', PROMPT_COUNT)).toBe(promptText('de', 0));
    expect(promptText('de', -1)).toBe(promptText('de', PROMPT_COUNT - 1));
    expect(parsePromptIndex('3')).toBe(3);
    expect(parsePromptIndex(String(PROMPT_COUNT))).toBeNull();
    expect(parsePromptIndex('-1')).toBeNull();
    expect(parsePromptIndex('1e2')).toBeNull();
    expect(parsePromptIndex(undefined)).toBeNull();
  });
});
