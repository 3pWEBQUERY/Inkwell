import type { LegalDocument } from './types';

export const privacyIt: LegalDocument = {
  title: 'Dichiarazione sulla protezione dei dati',
  updated: '2026-10-13',
  intro:
    'Questa dichiarazione spiega in modo comprensibile quali dati trattiamo, a quale scopo, per quanto tempo e che cosa non facciamo. Si applica secondo la Legge federale svizzera sulla protezione dei dati (LPD) e, nella misura in cui è applicabile, secondo il RGPD.',
  sections: [
    {
      title: 'Titolare del trattamento',
      paragraphs: [
        'Titolare del trattamento è l’azienda indicata nelle note legali, con la persona ivi menzionata. Alle domande sulla protezione dei dati rispondiamo per e-mail all’indirizzo di contatto riportato nelle note legali.',
      ],
    },
    {
      title: 'Che cosa vediamo in chiaro e che cosa no',
      paragraphs: [
        '- Testi privati: non li vediamo mai. Vengono cifrati nel tuo browser con una chiave che si trova solo sul tuo dispositivo. Il server memorizza il testo cifrato, il nonce e una chiave di contenuto cifrata. Nessun titolo, nessuna anteprima, nessun conteggio delle parole.',
        '- Bozze: non lasciano mai il browser. Sono conservate cifrate nel database locale del browser.',
        '- Testi condivisi (in forma anonima o con profilo): li vediamo in chiaro. Devono essere distribuiti e moderati.',
        '- Indirizzo e-mail: lo memorizziamo in chiaro per l’accesso e, in aggiunta, come valore con hash per la ricerca.',
        '- Passkey: memorizziamo solo la chiave pubblica. La chiave privata resta sul tuo dispositivo.',
        '- Pseudonimo, avatar, lingue, impostazioni: in chiaro, fanno parte del profilo.',
        '- Reazioni, voti, commenti, appartenenze alle stanze: in chiaro, sono la funzione stessa.',
        '- Avanzamento di lettura e indice di ricerca: solo nel tuo browser.',
        '- Web push: memorizziamo la sottoscrizione del tuo browser. Il contenuto di un messaggio è cifrato end-to-end secondo RFC 8291; il servizio push del produttore del tuo browser non lo vede.',
      ],
    },
    {
      title: 'Il limite della cifratura nel browser, detto con onestà',
      paragraphs: [
        'La cifratura nel browser protegge dalle fughe di dati dal database, dai backup, dall’hoster e da noi come gestori curiosi. Non protegge da un server compromesso che distribuisce codice JavaScript manipolato, perché il codice lo distribuiamo noi stessi. Per questo adottiamo una Content Security Policy rigorosa con nonce, pubblichiamo l’identificativo di build di ogni versione nel changelog e lavoriamo a un’app nativa con binari firmati e verificabili.',
      ],
    },
    {
      title: 'Anonimo verso gli altri, non verso di noi',
      paragraphs: [
        'I testi condivisi in forma anonima non mostrano all’esterno né pseudonimo né profilo; l’associazione viene rimossa sul server prima che il testo venga distribuito. Internamente l’associazione al tuo account rimane, affinché i blocchi abbiano effetto e gli abusi siano tracciabili.',
      ],
    },
    {
      title: 'Finalità e basi giuridiche',
      paragraphs: [
        '- Fornitura dell’app e del tuo account: esecuzione del contratto.',
        '- Moderazione, blocchi, segnalazioni: interesse legittimo a un esercizio sicuro.',
        '- Notifiche: solo con il tuo consenso, per singola stanza e revocabile in qualsiasi momento.',
        '- Dati di utilizzo aggregati lato server, senza profilazione: interesse legittimo allo sviluppo del servizio.',
      ],
    },
    {
      title: 'Durata di conservazione',
      paragraphs: [
        '- Account e testi: finché non li elimini.',
        '- Testi bruciati: eliminati subito, dai backup entro 30 giorni al massimo.',
        '- Account eliminato: 30 giorni di periodo di revoca, poi eliminazione definitiva, dai backup dopo altri 30 giorni, quindi al più tardi 60 giorni dopo la richiesta.',
        '- Codici di accesso: 24 ore.',
        '- Esportazioni: 24 ore, poi eliminate automaticamente.',
        '- Log del server: 7 giorni, senza indirizzi IP completi oltre questo periodo.',
        '- Segnalazioni e decisioni di moderazione: finché esiste l’account interessato.',
      ],
    },
    {
      title: 'Hosting e destinatari',
      paragraphs: [
        'L’app è in esecuzione su Railway nella regione UE (Amsterdam). Anche lo storage di oggetti per avatar ed esportazioni si trova nell’UE. Gli altri destinatari sono soltanto: Apple per «Accedi con Apple», il nostro servizio di invio e-mail con hosting nell’UE per codici di accesso e comunicazioni, e i servizi push dei produttori di browser. Non ci sono servizi di analytics, reti pubblicitarie né cookie di terzi.',
      ],
    },
    {
      title: 'Cookie e memoria locale',
      paragraphs: [
        '- Cookie di sessione: HttpOnly, Secure, 30 giorni. Necessario per l’accesso.',
        '- Cookie del dispositivo: un identificativo casuale, usato in forma di hash per i limiti di frequenza. Nessun tracciamento tra un sito web e l’altro.',
        '- Cookie della lingua: la lingua che hai scelto.',
        '- Database locale del browser: bozze, la tua chiave, l’indice di ricerca, l’avanzamento di lettura e la coda per le pubblicazioni offline.',
      ],
    },
    {
      title: 'I tuoi diritti',
      paragraphs: [
        'Accesso e portabilità dei dati: esportazione come ZIP nell’app, in qualsiasi momento. Cancellazione: elimina l’account nell’app, senza e-mail al supporto. Rettifica: pseudonimo, e-mail e impostazioni li modifichi tu. Revoca dei consensi: disattiva le notifiche per singola stanza. Reclamo: presso l’Incaricato federale della protezione dei dati e della trasparenza (IFPDT) oppure, per le persone nell’UE, presso l’autorità di controllo competente.',
      ],
    },
    {
      title: 'Che cosa non facciamo',
      paragraphs: [
        'Non vendiamo dati. Non mostriamo pubblicità. Non addestriamo modelli di IA con i tuoi testi, né con quelli privati né con quelli condivisi. Non valutiamo automaticamente i testi condivisi tramite software; le segnalazioni vengono esaminate da persone.',
      ],
    },
  ],
};
