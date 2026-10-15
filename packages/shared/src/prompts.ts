import type { Locale } from './locales.js';

/**
 * Writing prompts: an optional way in when the page is empty. Never required,
 * never tracked, never personalised. Everyone writing in a language sees the
 * same prompt on the same day; switching to another one stays in the browser.
 */
const PROMPTS: Record<Locale, readonly string[]> = {
  de: [
    'Was hast du heute nicht gesagt?',
    'Welcher Moment von heute soll nicht verloren gehen?',
    'Was trägst du gerade mit dir herum, das niemand sieht?',
    'Beschreib den Raum, in dem du sitzt, so, dass man ihn riechen kann.',
    'Wem würdest du gern etwas zurückgeben, und was?',
    'Was hat dich diese Woche überrascht?',
    'Woran merkst du, dass du müde bist?',
    'Schreib einen Brief an dich vor fünf Jahren. Du musst ihn nicht abschicken.',
    'Was schiebst du gerade vor dir her, und warum eigentlich?',
    'Welches Geräusch gehört für dich zu deiner Kindheit?',
    'Was würdest du tun, wenn heute niemand etwas von dir erwartet?',
    'Erzähl von einer Begegnung, die kürzer war als eine Minute.',
    'Was ist gerade schwer, und was ist trotzdem leicht?',
    'Welche Frage stellst du dir in letzter Zeit öfter?',
    'Schreib über einen Ort, an den du nicht zurückkehren kannst.',
    'Was hat heute gutgetan, auch wenn es klein war?',
    'Wovor hast du weniger Angst als früher?',
    'Beginne mit dem Satz: «Eigentlich wollte ich nur …»',
    'Was willst du loslassen, bevor die Woche zu Ende ist?',
    'Wer hat dich zuletzt verstanden, ohne dass du viel erklären musstest?',
    'Schreib eine Szene, in der jemand auf einen Zug wartet.',
    'Was weisst du heute, das du vor einem Jahr noch nicht wusstest?',
    'Welcher Gegenstand in deiner Nähe hat eine Geschichte?',
    'Was möchtest du dir selbst verzeihen?',
    'Beschreib das Wetter in dir, nicht draussen.',
    'Erzähl von einem Abend, der anders kam als geplant.',
    'Was fehlt dir gerade, und was fehlt dir gar nicht?',
    'Schreib über jemanden, den du nur vom Sehen kennst.',
    'Wofür bist du heute dankbar, ohne dass es gross sein muss?',
    'Was würdest du schreiben, wenn du sicher wärst, dass niemand mitliest?',
  ],
  fr: [
    'Qu’est-ce que tu n’as pas dit aujourd’hui ?',
    'Quel moment d’aujourd’hui ne doit pas se perdre ?',
    'Qu’est-ce que tu portes en ce moment sans que personne ne le voie ?',
    'Décris la pièce où tu es assis·e, au point qu’on puisse la sentir.',
    'À qui aimerais-tu rendre quelque chose, et quoi ?',
    'Qu’est-ce qui t’a surpris·e cette semaine ?',
    'À quoi remarques-tu que tu es fatigué·e ?',
    'Écris une lettre à toi d’il y a cinq ans. Tu n’es pas obligé·e de l’envoyer.',
    'Qu’est-ce que tu repousses en ce moment, et pourquoi au juste ?',
    'Quel bruit appartient pour toi à ton enfance ?',
    'Que ferais-tu si personne n’attendait rien de toi aujourd’hui ?',
    'Raconte une rencontre qui a duré moins d’une minute.',
    'Qu’est-ce qui est lourd en ce moment, et qu’est-ce qui reste léger malgré tout ?',
    'Quelle question te poses-tu plus souvent ces derniers temps ?',
    'Écris sur un lieu où tu ne peux pas retourner.',
    'Qu’est-ce qui t’a fait du bien aujourd’hui, même si c’était petit ?',
    'De quoi as-tu moins peur qu’avant ?',
    'Commence par la phrase : « En fait, je voulais juste … »',
    'Qu’aimerais-tu laisser partir avant la fin de la semaine ?',
    'Qui t’a compris·e récemment sans que tu doives beaucoup expliquer ?',
    'Écris une scène où quelqu’un attend un train.',
    'Que sais-tu aujourd’hui que tu ne savais pas il y a un an ?',
    'Quel objet près de toi a une histoire ?',
    'Que voudrais-tu te pardonner ?',
    'Décris le temps qu’il fait en toi, pas dehors.',
    'Raconte une soirée qui ne s’est pas passée comme prévu.',
    'Qu’est-ce qui te manque en ce moment, et qu’est-ce qui ne te manque pas du tout ?',
    'Écris sur quelqu’un que tu ne connais que de vue.',
    'De quoi es-tu reconnaissant·e aujourd’hui, sans que ce soit grand ?',
    'Qu’écrirais-tu si tu étais sûr·e que personne ne lit par-dessus ton épaule ?',
  ],
  it: [
    'Che cosa non hai detto oggi?',
    'Quale momento di oggi non deve andare perso?',
    'Che cosa porti con te in questo periodo, senza che nessuno lo veda?',
    'Descrivi la stanza in cui ti trovi, in modo che se ne senta l’odore.',
    'A chi vorresti restituire qualcosa, e che cosa?',
    'Che cosa ti ha sorpreso questa settimana?',
    'Da che cosa ti accorgi di essere stanco o stanca?',
    'Scrivi una lettera a te di cinque anni fa. Non devi spedirla.',
    'Che cosa stai rimandando, e perché in fondo?',
    'Quale suono appartiene per te alla tua infanzia?',
    'Che cosa faresti se oggi nessuno si aspettasse niente da te?',
    'Racconta un incontro durato meno di un minuto.',
    'Che cosa è pesante adesso, e che cosa resta leggero lo stesso?',
    'Quale domanda ti fai più spesso ultimamente?',
    'Scrivi di un luogo in cui non puoi tornare.',
    'Che cosa ti ha fatto bene oggi, anche se era piccolo?',
    'Di che cosa hai meno paura di prima?',
    'Comincia con la frase: «In realtà volevo soltanto …»',
    'Che cosa vuoi lasciar andare prima che finisca la settimana?',
    'Chi ti ha capito di recente senza che tu dovessi spiegare molto?',
    'Scrivi una scena in cui qualcuno aspetta un treno.',
    'Che cosa sai oggi che un anno fa non sapevi?',
    'Quale oggetto vicino a te ha una storia?',
    'Che cosa vorresti perdonarti?',
    'Descrivi il tempo che fa dentro di te, non fuori.',
    'Racconta una sera andata diversamente dal previsto.',
    'Che cosa ti manca adesso, e che cosa non ti manca affatto?',
    'Scrivi di qualcuno che conosci solo di vista.',
    'Per che cosa provi gratitudine oggi, anche se non è niente di grande?',
    'Che cosa scriveresti se avessi la certezza che nessuno legge?',
  ],
  en: [
    'What did you leave unsaid today?',
    'Which moment from today should not get lost?',
    'What are you carrying around right now that nobody sees?',
    'Describe the room you are sitting in so well that someone could smell it.',
    'Who would you like to give something back to, and what?',
    'What surprised you this week?',
    'How do you notice that you are tired?',
    'Write a letter to yourself five years ago. You do not have to send it.',
    'What are you putting off at the moment, and why, really?',
    'Which sound belongs to your childhood?',
    'What would you do if nobody expected anything of you today?',
    'Tell of an encounter that lasted less than a minute.',
    'What is heavy right now, and what is still light anyway?',
    'Which question have you been asking yourself more often lately?',
    'Write about a place you cannot go back to.',
    'What did you good today, even if it was small?',
    'What are you less afraid of than you used to be?',
    'Begin with the sentence: “All I really wanted was …”',
    'What do you want to let go of before the week is over?',
    'Who understood you recently without you having to explain much?',
    'Write a scene in which someone is waiting for a train.',
    'What do you know today that you did not know a year ago?',
    'Which object near you has a story?',
    'What would you like to forgive yourself for?',
    'Describe the weather inside you, not outside.',
    'Tell of an evening that turned out differently than planned.',
    'What are you missing right now, and what do you not miss at all?',
    'Write about someone you only know by sight.',
    'What are you grateful for today, without it having to be big?',
    'What would you write if you were sure nobody was reading along?',
  ],
};

export const PROMPT_COUNT = PROMPTS.de.length;

/** Days since 1 January 2024, in the reader's local calendar. */
function dayNumber(date: Date): number {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((local - Date.UTC(2024, 0, 1)) / 86_400_000);
}

/** The prompt everyone writing in this language sees today. */
export function promptIndexOfDay(date: Date = new Date()): number {
  const n = dayNumber(date) % PROMPT_COUNT;
  return n < 0 ? n + PROMPT_COUNT : n;
}

export function promptText(locale: Locale, index: number): string {
  const list = PROMPTS[locale];
  const safe = ((Math.trunc(index) % list.length) + list.length) % list.length;
  return list[safe] ?? list[0] ?? '';
}

/** Parses `?prompt=` without trusting it: anything that is not a valid index means no prompt. */
export function parsePromptIndex(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined || !/^\d{1,3}$/.test(raw)) return null;
  const value = Number.parseInt(raw, 10);
  return value >= 0 && value < PROMPT_COUNT ? value : null;
}
