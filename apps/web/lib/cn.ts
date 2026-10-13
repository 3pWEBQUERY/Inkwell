/** Joins class names, dropping falsy values. Small enough that a dependency is not worth it. */
export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}
