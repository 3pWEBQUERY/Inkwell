import type { Region } from './locales.js';

export interface Helpline {
  /** Organisation name as it presents itself. */
  name: string;
  /** Dialable number (what goes into `tel:`). */
  number: string;
  /** Human-formatted number. */
  display: string;
  /** Who this line is for, as a short note key (translated client-side). */
  audience: 'general' | 'youth';
  /** Optional website. */
  url?: string;
}

/**
 * Crisis helplines by region. Maintained by hand, shown by the client only;
 * nothing about a text leaves the browser to decide whether to show them.
 */
export const HELPLINES: Record<Region, readonly Helpline[]> = {
  CH: [
    {
      name: 'Die Dargebotene Hand',
      number: '143',
      display: '143',
      audience: 'general',
      url: 'https://www.143.ch',
    },
    {
      name: 'Pro Juventute',
      number: '147',
      display: '147',
      audience: 'youth',
      url: 'https://www.147.ch',
    },
  ],
  DE: [
    {
      name: 'Telefonseelsorge',
      number: '08001110111',
      display: '0800 111 0 111',
      audience: 'general',
      url: 'https://www.telefonseelsorge.de',
    },
    {
      name: 'Nummer gegen Kummer',
      number: '116111',
      display: '116 111',
      audience: 'youth',
      url: 'https://www.nummergegenkummer.de',
    },
  ],
  AT: [
    {
      name: 'Telefonseelsorge',
      number: '142',
      display: '142',
      audience: 'general',
      url: 'https://www.telefonseelsorge.at',
    },
    {
      name: 'Rat auf Draht',
      number: '147',
      display: '147',
      audience: 'youth',
      url: 'https://www.rataufdraht.at',
    },
  ],
  FR: [
    {
      name: 'Numéro national de prévention du suicide',
      number: '3114',
      display: '3114',
      audience: 'general',
      url: 'https://3114.fr',
    },
    {
      name: 'Fil Santé Jeunes',
      number: '0800235236',
      display: '0800 235 236',
      audience: 'youth',
      url: 'https://www.filsantejeunes.com',
    },
  ],
  IT: [
    {
      name: 'Telefono Amico Italia',
      number: '0223272327',
      display: '02 2327 2327',
      audience: 'general',
      url: 'https://www.telefonoamico.it',
    },
    {
      name: 'Telefono Azzurro',
      number: '19696',
      display: '19696',
      audience: 'youth',
      url: 'https://azzurro.it',
    },
  ],
  UK: [
    {
      name: 'Samaritans',
      number: '116123',
      display: '116 123',
      audience: 'general',
      url: 'https://www.samaritans.org',
    },
    {
      name: 'Childline',
      number: '08001111',
      display: '0800 1111',
      audience: 'youth',
      url: 'https://www.childline.org.uk',
    },
  ],
  US: [
    {
      name: '988 Suicide & Crisis Lifeline',
      number: '988',
      display: '988',
      audience: 'general',
      url: 'https://988lifeline.org',
    },
  ],
};

export function helplinesFor(region: Region): readonly Helpline[] {
  return HELPLINES[region];
}
