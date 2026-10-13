import type { LegalDocument } from './types';

export const privacyEn: LegalDocument = {
  title: 'Privacy policy',
  updated: '2026-10-13',
  intro:
    'This policy says in plain language which data we process, why, for how long, and what we do not do. It applies under the Swiss Data Protection Act (FADP) and, where applicable, the GDPR.',
  sections: [
    {
      title: 'Controller',
      paragraphs: [
        'The controller is the company named in the imprint, with the person named there. Questions about data protection reach us by e-mail at the contact address in the imprint.',
      ],
    },
    {
      title: 'What we see in clear text and what we do not',
      paragraphs: [
        '- Private texts: never. They are encrypted in your browser with a key that exists only on your device. The server stores ciphertext, a nonce and a wrapped content key. No title, no preview, no word count.',
        '- Drafts: never leave the browser. They are stored encrypted in the browser’s local database.',
        '- Shared texts (anonymous or with profile): in clear text. They have to be delivered and moderated.',
        '- E-mail address: stored in clear text for sign-in and additionally as a hash for lookup.',
        '- Passkeys: we store only the public key. The private key stays on your device.',
        '- Pseudonym, avatar, languages, settings: in clear text, they are your profile.',
        '- Reactions, votes, comments, room memberships: in clear text, they are the function.',
        '- Reading progress and search index: only in your browser.',
        '- Web push: we store your browser’s subscription. Message contents are end-to-end encrypted under RFC 8291; the push service of your browser vendor cannot read them.',
      ],
    },
    {
      title: 'The limit of encryption in the browser, honestly',
      paragraphs: [
        'Encryption in the browser protects against database leaks, backups, the hosting provider and us as curious operators. It does not protect against a compromised server delivering manipulated JavaScript, because we deliver that code ourselves. Against that we use a strict Content Security Policy with nonces, publish the build identifier of every version in the changelog, and are working on a native app with signed, verifiable binaries.',
      ],
    },
    {
      title: 'Anonymous towards others, not towards us',
      paragraphs: [
        'Anonymously shared texts carry neither pseudonym nor profile towards others; the link to the account is removed on the server before delivery. Internally the link to your account remains, so that suspensions work and abuse can be traced.',
      ],
    },
    {
      title: 'Purposes and legal bases',
      paragraphs: [
        '- Providing the app and your account: performance of a contract.',
        '- Moderation, suspensions, reports: legitimate interest in safe operation.',
        '- Notifications: only with your consent, per room, revocable at any time.',
        '- Server-side aggregated usage numbers without profiling: legitimate interest in developing the product.',
      ],
    },
    {
      title: 'Retention',
      paragraphs: [
        '- Account and texts: until you delete them.',
        '- Burned texts: deleted immediately, from backups after at most 30 days.',
        '- Deleted account: 30-day grace period, then permanent deletion, from backups after a further 30 days, so at most 60 days after the request.',
        '- Sign-in codes: 24 hours.',
        '- Exports: 24 hours, then deleted automatically.',
        '- Server logs: 7 days, with no full IP addresses beyond that.',
        '- Reports and moderation decisions: as long as the affected account exists.',
      ],
    },
    {
      title: 'Hosting and recipients',
      paragraphs: [
        'The app runs on Railway in the EU region (Amsterdam). Object storage for avatars and exports is in the EU as well. The only other recipients are Apple for “Sign in with Apple”, our EU-hosted mail provider for sign-in codes and notices, and the push services of browser vendors. There are no analytics services, no ad networks and no third-party cookies.',
      ],
    },
    {
      title: 'Cookies and local storage',
      paragraphs: [
        '- Session cookie: HttpOnly, Secure, 30 days. Required for sign-in.',
        '- Device cookie: a random identifier used, hashed, for rate limits. No tracking across websites.',
        '- Language cookie: your chosen language.',
        '- The browser’s local database: drafts, your key, the search index, reading progress and the queue for offline publications.',
      ],
    },
    {
      title: 'Your rights',
      paragraphs: [
        'Access and portability: export as a ZIP in the app, at any time. Erasure: delete your account in the app, without e-mailing support. Rectification: you change pseudonym, e-mail and settings yourself. Withdrawal of consent: turn notifications off per room. Complaint: with the Swiss Federal Data Protection and Information Commissioner (FDPIC) or, for people in the EU, with the competent supervisory authority.',
      ],
    },
    {
      title: 'What we do not do',
      paragraphs: [
        'We do not sell data. We do not show ads. We do not train AI models on your texts, neither private nor shared. We do not rate shared texts automatically by software; people review reports.',
      ],
    },
  ],
};
