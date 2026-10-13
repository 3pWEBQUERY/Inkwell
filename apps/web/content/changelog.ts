export interface ChangelogEntry {
  version: string;
  date: string;
  /** Build identifier of the deployed bundle, published so the delivered code can be checked. */
  build: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '2026-10-13',
    build: process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev',
    changes: [
      'Landing page with the three promises, how it works, trust, safety and FAQ.',
      'Onboarding with e-mail code, passkeys, minimum age, pseudonym, recovery code and room languages.',
      'Editor as a full-screen overlay with autosave, offline queue and local crisis hint.',
      'Private entries encrypted in the browser; the server stores ciphertext only.',
      'Reflection and fiction rooms with 15 rooms per language, silent reactions, comments with feedback mode and voting.',
      'Journal with local search, visibility narrowing, burning and ZIP export.',
      'Reporting, review queue, suspensions, blocking, account deletion with a 30-day grace period.',
      'Installable as a PWA with an offline shell.',
    ],
  },
];
