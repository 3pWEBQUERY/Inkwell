import type { LegalDocument } from './types';

export const termsEn: LegalDocument = {
  title: 'Terms of use',
  updated: '2026-10-13',
  intro:
    'Short and without fine print. These terms apply to using Inkwell in the browser and as an installed web app.',
  sections: [
    {
      title: 'Account',
      paragraphs: [
        'You need an account to write, share, react and comment. Reading works without one. The minimum age is 16. An account belongs to one person; multiple accounts to evade suspensions are not allowed.',
      ],
    },
    {
      title: 'Your texts are yours',
      paragraphs: [
        'You keep all rights to your texts. For shared texts you grant us only the right to display them in the app for as long as you keep them shared. We do not use your texts for advertising or for training AI models.',
      ],
    },
    {
      title: 'What is not allowed',
      paragraphs: [
        '- Harassment, hate, threats, calls for violence.',
        '- Sexual content involving minors; sexual content without consent of the people depicted.',
        '- Spam, advertising, links to commercial offers.',
        '- Texts that make other people identifiable without their consent.',
        '- Copyright infringement.',
        '- Machine-generated texts in story rooms.',
      ],
    },
    {
      title: 'Moderation',
      paragraphs: [
        'Shared texts and comments can be reported. People review reports. Possible consequences: hiding, deletion, warning, 7-day suspension, permanent suspension. Every measure is communicated to you with a reason. Suspended accounts can still read and export. Private entries always remain accessible.',
      ],
    },
    {
      title: 'Availability and liability',
      paragraphs: [
        'We work for stable operation but do not guarantee uninterrupted availability. For private entries: without your recovery code we cannot restore them; we have no key. Liability is limited to intent and gross negligence as far as the law allows.',
      ],
    },
    {
      title: 'Price',
      paragraphs: [
        'Use is free at launch. A later optional membership will be announced before it is introduced; the core stays free.',
      ],
    },
    {
      title: 'Termination',
      paragraphs: [
        'You can delete your account in the app at any time, with a 30-day grace period. We may suspend or end accounts for severe or repeated violations; export remains possible.',
      ],
    },
    {
      title: 'Changes and law',
      paragraphs: [
        'We announce changes to these terms in the app and in the changelog. Swiss law applies; the place of jurisdiction is the operator’s seat unless a mandatory venue takes precedence.',
      ],
    },
  ],
};
