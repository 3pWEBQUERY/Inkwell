import * as nodemailer from 'nodemailer';

import type { Env } from '../env.js';
import type { Locale } from '@inkwell/shared';
import type { Logger } from 'pino';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
  /** Only populated with E2E_MAILBOX=1 (console transport). */
  lastTo?: (address: string) => Mail | undefined;
}

export function createMailer(env: Env, logger: Logger): Mailer {
  if (env.MAIL_TRANSPORT === 'console') {
    const captured = new Map<string, Mail>();
    const mailer: Mailer = {
      async send(mail) {
        logger.info(
          { to: mail.to, subject: mail.subject, body: mail.text },
          'mail (console transport)',
        );
        if (env.E2E_MAILBOX === '1') captured.set(mail.to.toLowerCase(), mail);
      },
    };
    if (env.E2E_MAILBOX === '1') mailer.lastTo = (address) => captured.get(address.toLowerCase());
    return mailer;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? '' } : undefined,
  });

  return {
    async send(mail) {
      await transporter.sendMail({
        from: env.MAIL_FROM,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
      });
    },
  };
}

const CODE_MAIL: Record<
  Locale,
  { subject: string; body: (code: string, minutes: number) => string }
> = {
  de: {
    subject: 'Dein Anmeldecode',
    body: (code, minutes) =>
      `Dein Code: ${code}\n\nEr gilt ${minutes} Minuten. Wenn du dich nicht angemeldet hast, kannst du diese Mail ignorieren.`,
  },
  fr: {
    subject: 'Ton code de connexion',
    body: (code, minutes) =>
      `Ton code : ${code}\n\nIl est valable ${minutes} minutes. Si tu n’as rien demandé, ignore simplement ce message.`,
  },
  it: {
    subject: 'Il tuo codice di accesso',
    body: (code, minutes) =>
      `Il tuo codice: ${code}\n\nÈ valido per ${minutes} minuti. Se non hai richiesto l’accesso, ignora questo messaggio.`,
  },
  en: {
    subject: 'Your sign-in code',
    body: (code, minutes) =>
      `Your code: ${code}\n\nIt is valid for ${minutes} minutes. If you did not request it, you can ignore this mail.`,
  },
};

export function signInCodeMail(to: string, code: string, minutes: number, locale: Locale): Mail {
  const template = CODE_MAIL[locale];
  return { to, subject: template.subject, text: template.body(code, minutes) };
}

const NOTICE_MAIL: Record<Locale, { subject: string; intro: string }> = {
  de: {
    subject: 'Eine Mitteilung zur Moderation',
    intro: 'Ein Text von dir wurde von der Moderation geprüft.',
  },
  fr: {
    subject: 'Un message de la modération',
    intro: 'Un de tes textes a été examiné par la modération.',
  },
  it: {
    subject: 'Un messaggio dalla moderazione',
    intro: 'Un tuo testo è stato esaminato dalla moderazione.',
  },
  en: { subject: 'A note from moderation', intro: 'One of your texts was reviewed by moderation.' },
};

export function moderationNoticeMail(to: string, note: string, locale: Locale): Mail {
  const template = NOTICE_MAIL[locale];
  return { to, subject: template.subject, text: `${template.intro}\n\n${note}` };
}

const DELETION_MAIL: Record<Locale, { subject: string; body: (date: string) => string }> = {
  de: {
    subject: 'Dein Konto wird gelöscht',
    body: (date) =>
      `Dein Konto wird am ${date} endgültig gelöscht. Bis dahin kannst du die Löschung in den Einstellungen widerrufen.`,
  },
  fr: {
    subject: 'Ton compte va être supprimé',
    body: (date) =>
      `Ton compte sera définitivement supprimé le ${date}. D’ici là, tu peux annuler la suppression dans les réglages.`,
  },
  it: {
    subject: 'Il tuo account verrà eliminato',
    body: (date) =>
      `Il tuo account sarà eliminato definitivamente il ${date}. Fino ad allora puoi annullare l’eliminazione nelle impostazioni.`,
  },
  en: {
    subject: 'Your account will be deleted',
    body: (date) =>
      `Your account will be permanently deleted on ${date}. Until then you can revoke the deletion in settings.`,
  },
};

export function deletionScheduledMail(to: string, date: string, locale: Locale): Mail {
  const template = DELETION_MAIL[locale];
  return { to, subject: template.subject, text: template.body(date) };
}
