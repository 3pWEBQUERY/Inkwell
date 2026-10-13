/**
 * Operator facts shown on the landing page, in the imprint and in mails.
 * Legal entity and address are open questions in the PRD (section 14); they are
 * read from the environment so the build does not carry placeholder prose.
 */
export const site = {
  name: 'Inkwell',
  /** Legal entity, e.g. "Beispiel GmbH". */
  operatorName: process.env.NEXT_PUBLIC_OPERATOR_NAME ?? '',
  /** Person responsible for content and data protection. */
  responsiblePerson: process.env.NEXT_PUBLIC_RESPONSIBLE_PERSON ?? '',
  /** Postal address, lines separated by `\n`. */
  address: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS ?? '',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hallo@inkwell.example',
  pressEmail: process.env.NEXT_PUBLIC_PRESS_EMAIL ?? 'presse@inkwell.example',
  hostingRegion: 'EU (Amsterdam)',
  repository: process.env.NEXT_PUBLIC_REPOSITORY_URL ?? '',
} as const;

export function hasOperatorDetails(): boolean {
  return site.operatorName.length > 0 && site.address.length > 0;
}
