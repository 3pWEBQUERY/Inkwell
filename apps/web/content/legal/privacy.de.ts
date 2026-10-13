import type { LegalDocument } from './types';

export const privacyDe: LegalDocument = {
  title: 'Datenschutzerklärung',
  updated: '2026-10-13',
  intro:
    'Diese Erklärung sagt in verständlicher Sprache, welche Daten wir verarbeiten, wozu, wie lange, und was wir nicht tun. Sie gilt nach dem Schweizer Datenschutzgesetz (DSG) und, soweit anwendbar, nach der DSGVO.',
  sections: [
    {
      title: 'Verantwortliche Stelle',
      paragraphs: [
        'Verantwortlich ist die im Impressum genannte Firma mit der dort genannten Person. Fragen zum Datenschutz beantworten wir per Mail an die Kontaktadresse im Impressum.',
      ],
    },
    {
      title: 'Was wir im Klartext sehen und was nicht',
      paragraphs: [
        '- Private Texte: sehen wir nie. Sie werden in deinem Browser mit einem Schlüssel verschlüsselt, der nur auf deinem Gerät liegt. Der Server speichert Chiffrat, Nonce und einen verschlüsselten Inhaltsschlüssel. Keinen Titel, keine Vorschau, keine Wortzahl.',
        '- Entwürfe: verlassen den Browser nie. Sie liegen verschlüsselt in der lokalen Datenbank des Browsers.',
        '- Geteilte Texte (anonym oder mit Profil): sehen wir im Klartext. Sie müssen ausgeliefert und moderiert werden.',
        '- E-Mail-Adresse: speichern wir im Klartext für die Anmeldung und zusätzlich als gehashten Wert für die Suche.',
        '- Passkeys: wir speichern nur den öffentlichen Schlüssel. Der private Schlüssel bleibt auf deinem Gerät.',
        '- Pseudonym, Avatar, Sprachen, Einstellungen: im Klartext, sie gehören zum Profil.',
        '- Reaktionen, Stimmen, Kommentare, Raum-Mitgliedschaften: im Klartext, sie sind die Funktion.',
        '- Lesefortschritt und Suchindex: nur in deinem Browser.',
        '- Web-Push: wir speichern die Subscription deines Browsers. Der Inhalt einer Nachricht ist nach RFC 8291 Ende-zu-Ende verschlüsselt; der Push-Dienst deines Browser-Herstellers sieht ihn nicht.',
      ],
    },
    {
      title: 'Die Grenze der Verschlüsselung im Browser, ehrlich',
      paragraphs: [
        'Die Verschlüsselung im Browser schützt gegen Datenbank-Lecks, gegen Backups, gegen den Hoster und gegen uns als neugierige Betreiber. Sie schützt nicht gegen einen kompromittierten Server, der manipulierten JavaScript-Code ausliefert, denn den Code liefern wir selbst aus. Dagegen setzen wir eine strikte Content Security Policy mit Nonces, veröffentlichen die Build-Kennung jeder Version im Changelog und arbeiten an einer nativen App mit signierten, prüfbaren Binaries.',
      ],
    },
    {
      title: 'Anonym gegenüber anderen, nicht gegenüber uns',
      paragraphs: [
        'Anonym geteilte Texte tragen nach aussen weder Pseudonym noch Profil; die Zuordnung wird auf dem Server entfernt, bevor der Text ausgeliefert wird. Intern bleibt die Zuordnung zu deinem Konto bestehen, damit Sperren wirken und Missbrauch nachverfolgbar ist.',
      ],
    },
    {
      title: 'Zwecke und Rechtsgrundlagen',
      paragraphs: [
        '- Bereitstellung der App und deines Kontos: Vertragserfüllung.',
        '- Moderation, Sperren, Meldungen: berechtigtes Interesse am sicheren Betrieb.',
        '- Benachrichtigungen: nur mit deiner Einwilligung, pro Raum und jederzeit widerrufbar.',
        '- Serverseitig aggregierte Nutzungszahlen ohne Profilbildung: berechtigtes Interesse an der Weiterentwicklung.',
      ],
    },
    {
      title: 'Speicherdauer',
      paragraphs: [
        '- Konto und Texte: bis du sie löschst.',
        '- Verbrannte Texte: sofort gelöscht, aus Backups nach spätestens 30 Tagen.',
        '- Gelöschtes Konto: 30 Tage Widerrufsfrist, dann endgültige Löschung, aus Backups nach weiteren 30 Tagen, also spätestens 60 Tage nach dem Antrag.',
        '- Anmeldecodes: 24 Stunden.',
        '- Exporte: 24 Stunden, dann automatisch gelöscht.',
        '- Server-Logs: 7 Tage, ohne vollständige IP-Adressen über diesen Zeitraum hinaus.',
        '- Meldungen und Moderationsentscheide: so lange das betroffene Konto besteht.',
      ],
    },
    {
      title: 'Hosting und Empfänger',
      paragraphs: [
        'Die App läuft auf Railway in der Region EU (Amsterdam). Objektspeicher für Avatare und Exporte liegt ebenfalls in der EU. Weitere Empfänger sind nur: Apple für «Mit Apple anmelden», unser Mailversand mit EU-Hosting für Anmeldecodes und Mitteilungen, und die Push-Dienste der Browser-Hersteller. Es gibt keine Analytics-Dienste, keine Werbenetzwerke und keine Cookies von Dritten.',
      ],
    },
    {
      title: 'Cookies und lokaler Speicher',
      paragraphs: [
        '- Sitzungs-Cookie: HttpOnly, Secure, 30 Tage. Nötig für die Anmeldung.',
        '- Geräte-Cookie: eine zufällige Kennung, die gehasht für Rate-Limits verwendet wird. Keine Nachverfolgung über Websites hinweg.',
        '- Sprach-Cookie: deine gewählte Sprache.',
        '- Lokale Datenbank des Browsers: Entwürfe, dein Schlüssel, der Suchindex, der Lesefortschritt und die Warteschlange für Offline-Veröffentlichungen.',
      ],
    },
    {
      title: 'Deine Rechte',
      paragraphs: [
        'Auskunft und Datenübertragung: Export als ZIP in der App, jederzeit. Löschung: Konto löschen in der App, ohne Mail an den Support. Berichtigung: Pseudonym, E-Mail und Einstellungen änderst du selbst. Widerruf von Einwilligungen: Benachrichtigungen pro Raum abschalten. Beschwerde: beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) oder, für Personen in der EU, bei der zuständigen Aufsichtsbehörde.',
      ],
    },
    {
      title: 'Was wir nicht tun',
      paragraphs: [
        'Wir verkaufen keine Daten. Wir zeigen keine Werbung. Wir trainieren keine KI-Modelle mit deinen Texten, weder mit privaten noch mit geteilten. Wir bewerten geteilte Texte nicht automatisch durch Software; Meldungen prüfen Menschen.',
      ],
    },
  ],
};
