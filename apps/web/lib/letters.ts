/** A letter to one's later self stays closed until its opening date. */
export function isSealed(opensAt: string | null | undefined, now: number = Date.now()): boolean {
  return Boolean(opensAt) && new Date(opensAt ?? 0).getTime() > now;
}

/** Letters stay announced on Today for two weeks after they open, until they are read. */
export const LETTER_ANNOUNCE_DAYS = 14;

const READ_KEY = 'inkwell.letters-read';

export function readLetters(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function markLetterRead(id: string): void {
  try {
    const ids = readLetters();
    ids.add(id);
    localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-100)));
  } catch {
    // Storage may be unavailable; the letter simply stays announced.
  }
}
