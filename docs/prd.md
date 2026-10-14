# PRD – Plattform für Gedanken & Geschichten (Arbeitstitel: Inkwell)

Oct 13, 2026 · @Alexander

## 1. Zusammenfassung & Vision

Das Produkt ist ein ruhiger Ort zum Schreiben: Gedanken, Tagebuch, Kurzgeschichten. Jeder Text beginnt privat; Teilen ist eine bewusste Entscheidung danach, nicht der Zweck des Schreibens.

**Einzeiler:** Schreib dir alles von der Seele. Teile es, wenn du willst. Oder lass es los.

**Was es ist**

- Ein Schreibheft mit optionaler Öffentlichkeit, nicht ein Feed mit optionalem Schreiben.
- Zwei Raumtypen: Gedanken-Räume ohne Ranking und Voting, Geschichten-Räume mit Voting und Feedback.
- Eine Web-Applikation (Next.js, aktuelle Version, App Router), installierbar als PWA auf Handy und Desktop. Jede Navigation findet innerhalb derselben Seite statt: kein Neuladen, kein weisser Zwischenbildschirm, die Oberfläche bleibt stehen und nur der Inhalt wechselt animiert.
- Eine native iOS-App (SwiftUI) ist geplant, aber nicht Teil dieses Releases (siehe Roadmap, Abschnitt 15).

**Was es nicht ist**

- Kein Instagram-Ersatz: keine Fotos als Kern, keine Follower-Zahlen, kein Reichweiten-Wettbewerb.
- Kein Therapie-Angebot: die App kann zuhören, ersetzt aber keine professionelle Hilfe und sagt das auch.
- Kein KI-Schreibassistent: der Editor schlägt keine Sätze vor und bewertet keine Texte.

**Positionierung 2026**

Soziale Plattformen optimieren auf Aufmerksamkeit, und ein wachsender Teil der Inhalte ist maschinell erzeugt. Dieses Produkt verkauft das Gegenteil: menschliche Texte, kein Engagement-Algorithmus, keine Zahlen, die Druck erzeugen. Das ist das Versprechen auf der Startseite und muss in jeder Funktion eingelöst werden.

**Warum Web zuerst:** eine URL erreicht alle Geräte, braucht keinen App-Store-Review, erlaubt tägliche Releases und macht Lesen ohne Installation möglich. Der Preis: Ende-zu-Ende-Verschlüsselung im Browser ist schwächer als in einer nativen App (Abschnitt 11 erklärt die Grenze ehrlich). Die native iOS-App schliesst diese Lücke später.

**Name:** Arbeitstitel «Inkwell» (Codename im Repo). Der Produktname ist offen, siehe Abschnitt 15.

**Markt:** Start in der Schweiz (DE/FR/IT), dann DACH, dann EN/ES. Die App ist von Tag 1 mehrsprachig gebaut, die Community-Räume sind pro Sprache getrennt.

## 2. Produktprinzipien

Diese sieben Regeln entscheiden jede Feature-Frage. Ein Feature, das eine Regel bricht, wird nicht gebaut.

| #   | Prinzip                     | Konkret                                                                                                       | Was dadurch nicht gebaut wird                                                       |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Schreiben zuerst            | Jeder Text entsteht privat. Sichtbarkeit wird erst beim Abschluss gewählt.                                    | Kein «Was gibt's Neues?»-Feld oben im Feed.                                         |
| 2   | Keine öffentlichen Zahlen   | Keine Like-Zähler, keine Follower-Zahl, keine Aufrufe am Text. Reaktionen sieht nur die Autorin.              | Keine Rankings nach Beliebtheit in Gedanken-Räumen.                                 |
| 3   | Kein Engagement-Algorithmus | Feeds sind chronologisch oder nach Raum-Regeln sortiert. Kein personalisiertes Ranking.                       | Keine Push-Nachrichten à la «Du hast 3 neue Likes».                                 |
| 4   | Loslassen ist eine Funktion | Texte können nach 24 h oder 7 Tagen verfallen oder sofort «verbrannt» werden.                                 | Kein Archiv-Zwang; Verbrennen ist endgültig und wird so angekündigt.                |
| 5   | Ruhe ist Standard           | Kommentare bei anonymen Gedanken standardmässig aus. Push nur für Dinge, die die Person selbst abonniert hat. | Keine Streaks, keine Badges, keine Erinnerungen «Du hast 3 Tage nicht geschrieben». |
| 6   | Privat heisst privat        | Private Einträge werden auf dem Gerät verschlüsselt. Der Server sieht keinen Klartext.                        | Keine serverseitige Suche über private Texte; Suche läuft lokal.                    |
| 7   | Sicherheit vor Reichweite   | Moderation, Krisenhinweise und Sperren sind Teil des MVP, nicht Phase 2.                                      | Kein öffentlicher Start ohne funktionierende Review-Queue.                          |

## 3. Zielgruppen & Personas

Die Kernzielgruppe sind Menschen zwischen 16 und 45, die schreiben, um zu verarbeiten, und denen bestehende Plattformen dafür zu laut sind. Fiction-Schreibende sind die zweite Gruppe und bringen die öffentliche Energie.

| Persona                       | Alter / Situation                 | Was sie will                                                                    | Was sie nicht will                                   | Primärer Raumtyp              |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------- |
| Lena, «die Verarbeiterin»     | 27, Pflegefachfrau, Schichtdienst | Nach dem Dienst 10 Minuten abladen, manchmal wissen, dass jemand es gelesen hat | Ratschläge, Follower, Benachrichtigungen             | Gedanken (anonym)             |
| Noah, «der Tagebuchschreiber» | 34, Entwickler                    | Ein verlässliches Heft, das in zehn Jahren noch da ist, Export jederzeit        | Dass irgendjemand mitliest, auch nicht der Betreiber | Privat                        |
| Mira, «die Erzählerin»        | 19, Studentin                     | Kurzgeschichten veröffentlichen, ehrliches Feedback, eine Leserschaft aufbauen  | Toxische Kommentare, Spam                            | Geschichten (Profil)          |
| Jonas, «der Mitleser»         | 41, Lehrer                        | Abends lesen, was andere bewegt, ohne selbst zu schreiben                       | Clickbait, Endlos-Scrollen                           | Gedanken, Geschichten (Leser) |

Altersgrenze: 16 Jahre (Mindestalter beim Onboarding abgefragt, kein harter Altersnachweis im MVP). Unter 16 wird die Registrierung abgelehnt; Inhalte sind nicht auf Minderjährige ausgerichtet.

## 4. Kernkonzepte & Datenmodell

Fünf Begriffe tragen das ganze Produkt: Text, Sichtbarkeit, Raum, Reaktion, Verfall. Alles andere leitet sich ab.

**Text (post)** – die Einheit, die geschrieben wird. Ein Text hat einen Typ (`thought` für Gedanken/Tagebuch, `story` für Fiction), einen Inhalt in Markdown-Untermenge (Absätze, Kursiv, Fett, Zitat, Trennlinie; keine Bilder im MVP) und optional einen Titel. Stories haben zusätzlich Kapitelnummer und Serienzugehörigkeit.

**Sichtbarkeit (visibility)** – wird beim Abschluss gewählt, kann später nur eingeschränkt, nicht erweitert werden (von `public` zu `private` ja, umgekehrt nein; das verhindert, dass ein als privat geschriebener Text «aus Versehen» öffentlich wird).

| Wert        | Wer sieht es                          | Verschlüsselung                           | Autor sichtbar               | Kommentare                 |
| ----------- | ------------------------------------- | ----------------------------------------- | ---------------------------- | -------------------------- |
| `private`   | Nur die Person selbst                 | Ende-zu-Ende, Schlüssel nur auf dem Gerät | –                            | –                          |
| `anonymous` | Mitglieder des gewählten Raums        | Serverseitig at rest                      | Nein, nicht einmal Pseudonym | Standard aus, einschaltbar |
| `public`    | Mitglieder des Raums + Profilbesucher | Serverseitig at rest                      | Ja, mit Pseudonym            | Standard an, abschaltbar   |

**Raum (room)** – ein thematischer Ort, in dem Texte erscheinen. Zwei Arten mit unterschiedlichen Regeln, serverseitig erzwungen:

| Eigenschaft   | Gedanken-Raum (`reflection`)                      | Geschichten-Raum (`fiction`)                                        |
| ------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| Sortierung    | Chronologisch, neueste zuerst                     | Wählbar: Neu / Diese Woche / Top                                    |
| Voting        | Nein (API lehnt Votes ab)                         | Ja, Up/Down ohne sichtbare Zahl für andere; Rang ergibt sich daraus |
| Anonyme Texte | Ja, Standard                                      | Nein, Fiction wird mit Pseudonym veröffentlicht                     |
| Kommentare    | Opt-in pro Text                                   | Standard an, Feedback-Modus (siehe Abschnitt 9)                     |
| Beispiele     | «Nachts», «Trauer», «Nach der Schicht», «Dankbar» | «Kurzgeschichten», «Flash Fiction < 500 Wörter», «Fortsetzungen»    |

Räume werden im MVP vom Betreiber angelegt (ca. 15 pro Sprache). Community-Räume kommen in v2.

**Reaktion (reaction)** – eine stille Rückmeldung an die Autorin. Vier Typen: `read` (automatisch nach 80 % Scrolltiefe), `felt` («fühl ich»), `known` («kenn ich»), `thanks` («danke fürs Teilen»). Reaktionen haben keine öffentliche Zahl. Die Autorin sieht sie gebündelt («12 Menschen haben das gelesen, 4 fühlen es»), nie als Liste von Namen.

**Verfall (expiry)** – optionale Lebensdauer eines geteilten Texts: `none`, `24h`, `7d`. Nach Ablauf wird der Text aus dem Raum entfernt und bleibt nur in «Mein Heft» der Autorin. «Verbrennen» löscht ihn überall sofort und endgültig, inklusive Backups nach spätestens 30 Tagen.

**Identität** – ein Account hat ein Pseudonym (änderbar alle 30 Tage), eine Mail-Adresse und einen Avatar aus einem Set generischer Formen oder Foto-Upload ! Anonyme Texte sind nach aussen nicht zuordenbar, intern aber an den Account gebunden, damit Missbrauch gesperrt werden kann.

**Datenbanktabellen (PostgreSQL)**

| Tabelle            | Kernfelder                                                                                                                                                | Hinweis                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `users`            | id, email, apple\_sub, pseudonym, pseudonym\_changed\_at, locale, created\_at, deleted\_at                                                                | Soft-Delete, endgültige Löschung nach 30 Tagen                      |
| `rooms`            | id, slug, kind (`reflection`/`fiction`), locale, name, description, sort\_default                                                                         | Betreiber-verwaltet                                                 |
| `posts`            | id, author\_id, room\_id, type, visibility, title, body, ciphertext, nonce, expires\_at, comments\_enabled, series\_id, chapter, created\_at, deleted\_at | Bei `private` ist `body` NULL, nur `ciphertext`/`nonce` gefüllt     |
| `reactions`        | post\_id, user\_id, kind, created\_at                                                                                                                     | Unique (post\_id, user\_id, kind); kein öffentlicher Count-Endpoint |
| `votes`            | post\_id, user\_id, value (±1)                                                                                                                            | Nur für Posts in `fiction`-Räumen; Trigger prüft room.kind          |
| `comments`         | id, post\_id, author\_id, body, mode (`feedback`/`reply`), created\_at, deleted\_at                                                                       |                                                                     |
| `moderation_flags` | id, target\_type, target\_id, reporter\_id, reason, status, reviewer\_id, resolved\_at                                                                    | Status: open / reviewing / actioned / dismissed                     |
| `blocks`           | blocker\_id, blocked\_id                                                                                                                                  | Gegenseitiges Ausblenden                                            |
| `push_tokens`      | user\_id, token, platform                                                                                                                                 |                                                                     |
| `exports`          | id, user\_id, status, s3\_key, expires\_at                                                                                                                | Datenexport als ZIP                                                 |

## 5. Startseite (Landingpage, Route `/`)

Die Startseite ist Teil der Web-App und hat zwei Aufgaben: Vertrauen aufbauen und Registrieren bzw. Anmelden. Wer angemeldet ist, wird von `/` direkt nach `/today` geleitet. Sie ist eine einzige, ruhige Seite mit viel Weissraum oder einer passenden, gedeckten Hintergrundfarbe, Serifenschrift für Zitate und ohne Stock-Fotos, Marketing-Superlative oder animierte Hero-Grafiken.

**Technik:** Next.js-Route im selben Projekt wie die App, als Server Component statisch gerendert und über das CDN ausgeliefert. Gehostet auf Railway. Keine Tracking-Cookies, keine externen Scripts. Ladezeit unter 1 s, Lighthouse 95+. Sprachumschaltung DE/FR/IT/EN über Pfad (`/de`, `/fr`), Standardsprache aus `Accept-Language`. Der Klick auf «Anmelden» oder «Konto erstellen» öffnet das Auth-Panel als Overlay auf derselben Seite (Intercepting Route), die Startseite bleibt sichtbar dahinter.

**Aufbau, von oben nach unten**

1. **Navigation** (sticky, 56 px hoch): Wortmarke links; rechts «So funktioniert's», «Vertrauen», «FAQ», Sprachwahl, Button «Anmelden» (sekundär) und «Konto erstellen» (primär). Beim Scrollen wird die Leiste halbtransparent mit Blur; die Wortmarke verkleinert sich leicht.
2. **Hero** (volle Höhe, zentriert, maximal 640 px Textbreite):
   - Überschrift: «Schreib dir alles von der Seele.»
   - Unterzeile: «Ein Ort für Gedanken, Tagebuch und Geschichten. Privat, wenn du willst. Gelesen, wenn du es teilst. Ohne Zähler, ohne Algorithmus.»
   - Primär-Button «Konto erstellen», daneben Text-Link «Erst mal nur lesen» (führt ohne Konto nach `/rooms`). Darunter in Grau «Kostenlos. Keine Werbung. Läuft im Browser, installierbar auf Handy und Desktop.»
   - Darunter: ein einziger, echter Screenshot des Editors im Browser-Rahmen (Desktop) bzw. im Handy-Rahmen (mobil), mit einem realen, kurzen Text. Kein Lorem ipsum. Der Screenshot ist ein statisches Bild, keine Live-Demo.
3. **Drei Versprechen** (drei Spalten, auf Mobil untereinander; je Icon in Strichzeichnung, Titel, zwei Sätze; erscheinen beim Scrollen mit einem leichten Fade-up, 200 ms, versetzt um 60 ms):
   - «Kein Druck.» Keine Likes, keine Follower, keine Aufrufe. Nur du und dein Text, und wer ihn lesen soll.
   - «Kein Algorithmus.» Dein Feed ist chronologisch. Niemand entscheidet für dich, was du siehst.
   - «Keine Mitleser.» Private Einträge werden in deinem Browser verschlüsselt, bevor sie uns erreichen. Wir können sie nicht lesen.
4. **So funktioniert's** (vier Schritte, horizontaler Ablauf mit je einem Screenshot):
   1. Schreiben: Der Editor öffnet sich leer. Kein Titel nötig, keine Formatierung nötig.
   2. Entscheiden: Behalten, anonym teilen oder mit Pseudonym teilen.
   3. Loslassen: Optional nach 24 Stunden oder 7 Tagen verschwinden lassen. Oder sofort verbrennen.
   4. Gelesen werden: Du siehst, dass es gelesen wurde und wie viele es fühlen. Niemand sonst sieht Zahlen.
5. **Zwei Räume** (zweispaltig, mit je einem Beispieltext aus dem jeweiligen Raumtyp):
   - «Gedanken-Räume»: Chronologisch, ohne Voting, meist anonym. Für das, was raus muss.
   - «Geschichten-Räume»: Mit Voting und Feedback, mit Pseudonym. Für das, was gelesen werden will.
6. **Vertrauen** (abgesetzter Hintergrund, zwei Spalten; der wichtigste Abschnitt der Seite):
   - Links, Titel «Was wir mit deinen Daten tun»: Private Texte werden im Browser verschlüsselt, der Server speichert nur Chiffrat. Geteilte Texte liegen auf Servern in der EU. Verbrannte Texte sind nach 30 Tagen auch aus Backups weg. Du kannst jederzeit alles als ZIP exportieren oder dein Konto löschen, in der App, ohne Mail an den Support.
   - Rechts, Titel «Was wir nicht tun»: Kein Verkauf von Daten. Keine Werbung. Kein Training von KI-Modellen mit deinen Texten. Keine Dark Patterns beim Kündigen.
   - Darunter: Link zur Datenschutzerklärung und zum Impressum mit Firmensitz und Verantwortlichem. Ein echter Name baut mehr Vertrauen als ein Siegel.
7. **Für wen** (drei Zitate in Serifenschrift, 1–2 Sätze, mit Vorname und Alter; aus der Beta, nie erfunden. Solange keine echten vorliegen, entfällt der Abschnitt.)
8. **Sicherheit**: «Manchmal ist Schreiben nicht genug.» Erklärt, dass die App bei Texten mit Krisensignalen diskret auf Hilfsangebote hinweist, und nennt diese direkt: Die Dargebotene Hand 143, Pro Juventute 147, für Deutschland Telefonseelsorge 0800 111 0 111. Satz: «Wir lesen deine Texte nicht. Der Hinweis erscheint nur für dich, in deinem Browser.»
9. **Installieren**: Kurz erklärt, dass die App als PWA auf den Home-Bildschirm kommt (iOS: Teilen → Zum Home-Bildschirm; Android/Desktop: Installieren-Dialog). Ein Satz: «Eine native iOS-App ist in Arbeit.» Kein Datum.
10. **Preis**: «Kostenlos im Start. Später eine optionale Mitgliedschaft (ca. CHF 3/Monat) für unbegrenzten Export, Serien und mehr Räume. Die Kernfunktionen bleiben kostenlos. Nie Werbung.»
11. **FAQ** (Akkordeon, 9 Fragen): Ist es wirklich anonym? · Könnt ihr meine privaten Texte lesen? · Was passiert, wenn ich meinen Wiederherstellungscode verliere? · Gibt es eine App? (Antwort: PWA jetzt, iOS-App geplant.) · Funktioniert es offline? · Wie wird moderiert? · Trainiert ihr KI mit meinen Texten? · Wie lösche ich mein Konto? · Wer steht dahinter?
12. **Abschluss-CTA**: Überschrift wiederholt, Button «Konto erstellen», Link «Anmelden».
13. **Footer**: Impressum, Datenschutz, Nutzungsbedingungen, Kontakt (echte Mail-Adresse), Status, Changelog, Sprachwahl. Kein Social-Media-Icon-Band.

**Unterseiten (statisch):** `/privacy`, `/imprint`, `/terms`, `/changelog` (öffentlich, mit jeder Version), `/status`, `/press`. Alle mit derselben Navigation und demselben Seitenübergang wie die App (Abschnitt 7).

**Vertrauenssignale, zusammengefasst:** echter Name und Ort des Betreibers, verständliche Datenschutzerklärung, öffentliches Changelog, ehrliche Erklärung der Verschlüsselung samt ihrer Grenze im Browser, keine Tracker, keine erfundenen Testimonials, keine Superlative.

## 6. Web-App: Onboarding & Registrierung

Das Onboarding läuft in einem Overlay über der Startseite, dauert unter 60 Sekunden und endet im leeren Editor, nicht in einem Feed. Kein Schritt lädt die Seite neu; die Schritte gleiten horizontal ineinander (Slide, 240 ms), der Hintergrund bleibt stehen.

**Schritt 6.1 – Einstieg** (Route `/sign-in`, als Intercepting Route über `/` geöffnet; direkt aufgerufen eine eigene Seite mit demselben Panel)

- Panel 440 px breit, mittig, Wortmarke oben, drei Sätze in Serifenschrift: «Hier schreibst du für dich. Teilen ist optional. Zahlen gibt es keine.»
- Buttons: «Mit Passkey fortfahren» (primär, wenn der Browser WebAuthn kann), «Mit E-Mail fortfahren», «Mit Apple fortfahren». Darunter Link «Erst mal nur lesen» (schliesst das Panel, navigiert nach `/rooms`).
- Kein Carousel, keine Feature-Tour.

**Schritt 6.2 – E-Mail** (nur bei E-Mail-Weg)

- Ein Feld: E-Mail. Button «Code senden». 6-stelliger Code per Mail, Eingabe im selben Panel (6 Einzelfelder, Auto-Advance, Einfügen aus Zwischenablage). Session-Cookie `HttpOnly`, `Secure`, `SameSite=Lax`, 30 Tage.
- Fehlercodes vom Server (`EMAIL_INVALID`, `CODE_EXPIRED`, `RATE_LIMITED`) werden lokalisiert angezeigt, inline unter dem Feld, ohne Seitenwechsel.

**Schritt 6.3 – Mindestalter**

- Frage «Bist du mindestens 16 Jahre alt?» mit Ja/Nein. Bei Nein: freundlicher Abbruch mit Hinweis auf Pro Juventute 147, kein Konto wird angelegt.

**Schritt 6.4 – Pseudonym**

- Ein Feld, vorgefüllt mit einem generierten Vorschlag aus zwei Wörtern («stille.birke»). Verfügbarkeit wird nach 400 ms Tippause live geprüft (Server Action), Häkchen oder Hinweis inline.
- Regeln: 3–24 Zeichen, Kleinbuchstaben, Punkt und Ziffern. Hinweis darunter: «Dein Pseudonym erscheint nur bei Texten, die du mit Profil teilst. Anonyme Texte zeigen es nie.»

**Schritt 6.5 – Wiederherstellungscode** (der wichtigste Schritt)

- Erklärung in drei Sätzen: «Private Einträge werden in deinem Browser verschlüsselt. Wir haben keinen Schlüssel. Auf einem neuen Gerät oder nach dem Löschen der Browserdaten brauchst du diesen Code.»
- Zeigt den 12-Wörter-Code (BIP39) in einem Raster 3×4. Buttons «Kopieren», «Als Textdatei sichern», «Ich habe ihn gesichert».
- Checkbox vor dem Fortfahren: «Ich verstehe, dass private Einträge ohne diesen Code nicht wiederherstellbar sind.»
- Der Code kann später in den Einstellungen erneut angezeigt werden (nach erneuter Anmeldung).

**Schritt 6.6 – Sprache**

- Sprache der Räume (vorbelegt aus Browsersprache, mehrere wählbar). Push-Erlaubnis wird hier **nicht** abgefragt; sie kommt erst beim ersten Abonnieren, mit Erklärung.

**Schritt 6.7 – Erster Eintrag**

- Das Panel weitet sich animiert zum Editor-Vollbild (Scale + Fade, 300 ms); dahinter wechselt die Startseite unbemerkt zur App-Shell. Platzhaltertext «Was beschäftigt dich?». Oben rechts «Später». Wer schreibt, landet im Abschluss-Panel; wer «Später» tippt, in `/today`.

**Anmeldung auf neuem Gerät oder Browser:** Login wie oben, dann Abfrage des Wiederherstellungscodes, um private Einträge zu entschlüsseln. Überspringen ist möglich; private Einträge erscheinen dann als «gesperrt» mit Schloss-Symbol, bis der Code eingegeben wird. Der entschlüsselte Schlüssel wird als nicht-extrahierbarer `CryptoKey` in IndexedDB abgelegt und überlebt Reloads, nicht aber das Löschen der Site-Daten.

**PWA-Installation:** Nach dem dritten Besuch oder dem ersten geteilten Text erscheint einmalig ein ruhiger Hinweis unten: «Du kannst die App auf deinen Home-Bildschirm legen.» mit «Zeigen, wie» (plattformspezifische Anleitung: iOS Safari über Teilen-Menü, Android/Desktop über den `beforeinstallprompt`-Dialog) und «Nicht jetzt». Der Hinweis kommt nie wieder, wenn er einmal abgelehnt wurde.

## 7. Web-App: App-Shell, Seitenübergänge und Seiten

Die App ist eine persistente Shell: Navigation, Schreib-Button und Kopfzeile werden einmal gerendert und bleiben bei jedem Seitenwechsel stehen. Nur der Inhaltsbereich wechselt, animiert, ohne dass der Browser die Seite verlässt.

**7.1 Seitenübergänge (gilt für jede Route)**

- Grundlage: Next.js App Router mit einem Root-`layout.tsx` (Shell) und `template.tsx` pro Bereich, das den Inhalt in eine Übergangs-Komponente hüllt. Client-seitige Navigation über `<Link>` mit Prefetch beim Hover (Desktop) bzw. beim Sichtbarwerden (Mobil), sodass der Zielinhalt beim Klick meist schon da ist.
- Übergang: der alte Inhalt blendet aus (Opacity 1 → 0, 120 ms), der neue blendet ein und gleitet 8 px nach oben (160 ms, Ease-out). Auf dem Handy bei Tab-Wechsel horizontal (links/rechts je nach Tab-Reihenfolge, 220 ms). Umsetzung mit der View Transitions API, wo der Browser sie unterstützt, sonst derselbe Effekt über `AnimatePresence` (Motion). Beides mit `prefers-reduced-motion`-Fallback: nur Fade, 80 ms.
- Shared Elements: Von einer Karte in die Lese-Ansicht wandert die erste Textzeile als `view-transition-name` an ihre neue Position; zurück ebenso. Das macht den Wechsel räumlich nachvollziehbar.
- Overlays statt Seiten: Editor, Abschluss-Panel, Raum-Beitritt und Einstellungen-Unterseiten sind Intercepting Routes mit Parallel Route `@modal`. Sie legen sich über die aktuelle Seite, die URL ändert sich trotzdem (teilbar, Zurück-Taste schliesst das Overlay).
- Ladezustände: Jeder Bereich hat ein `loading.tsx` mit Skeleton in der endgültigen Form (Zeilen, keine Spinner), damit sich nichts verschiebt. Daten werden über Suspense gestreamt; die Shell ist nie blockiert.
- Scroll-Wiederherstellung: Listenpositionen werden pro Route gemerkt; Zurück landet exakt dort, wo man war.
- Optimistische Aktionen: Reaktionen, Votes, Beitreten, Kommentar senden erscheinen sofort (`useOptimistic`), Server Action im Hintergrund, bei Fehler stilles Zurücksetzen mit Hinweis.
- Offline: Die Shell und zuletzt besuchte Routen sind über den Service Worker gecacht; der Editor funktioniert komplett offline (Abschnitt 8).

**7.2 Layout**

| Breite       | Navigation                                                                            | Inhaltsbreite          |
| ------------ | ------------------------------------------------------------------------------------- | ---------------------- |
| unter 768 px | Tab-Leiste unten, 4 Tabs + zentraler Schreib-Button, 64 px hoch, Safe-Area beachtet   | 100 %, 16 px Rand      |
| 768–1200 px  | Schmale Seitenleiste links (Icons + Label, 220 px), Schreib-Button oben in der Leiste | max. 680 px, zentriert |
| über 1200 px | Seitenleiste links, rechts optionale Kontextspalte (Raumregeln, Serieninfo), 280 px   | 680 px                 |

| Tab       | Route                     | Zweck                                                                         |
| --------- | ------------------------- | ----------------------------------------------------------------------------- |
| Heute     | `/today`                  | Startpunkt: Datum, eigener letzter Eintrag, neue Texte aus abonnierten Räumen |
| Räume     | `/rooms`, `/rooms/[slug]` | Alle Räume der gewählten Sprachen, Beitritt, Lesen                            |
| Schreiben | `/write` (Overlay)        | Editor als Vollbild-Overlay                                                   |
| Mein Heft | `/journal`                | Alle eigenen Texte, privat und geteilt, lokal durchsuchbar                    |
| Ich       | `/me`, `/me/settings/*`   | Profil, Rückmeldungen, Einstellungen                                          |

Tastatur (Desktop): `N` neuer Text, `/` Suche im Heft, `J`/`K` nächster/voriger Text in einer Liste, `Esc` schliesst Overlays.

**7.3 Heute** (`/today`)

- Kopf: Wochentag und Datum in Serifenschrift. Kein Zitat des Tages, kein Streak.
- Block «Dein letzter Eintrag»: Titel oder erste Zeile, Datum, Sichtbarkeits-Symbol. Klick öffnet den Text per Shared-Element-Übergang. Ohne Eintrag: «Du hast noch nichts geschrieben. Das ist in Ordnung.» mit Button «Schreiben».
- Block «Neu in deinen Räumen»: chronologische Liste, maximal 20 Texte, Karten mit Raumname, erster Zeile (max. 3 Zeilen), Pseudonym oder «anonym», relatives Datum. Kein Zähler. Am Ende: «Das war's für heute.» Kein Endlos-Scrollen.
- Neue Texte, die während des Lesens eintreffen, werden nicht eingeschoben; oben erscheint ein stiller Hinweis «3 neue Texte», der beim Klick die Liste animiert erweitert.

**7.4 Räume** (`/rooms`)

- Segment oben: «Gedanken» / «Geschichten» (Wechsel animiert den Unterstrich, Inhalt cross-fadet).
- Liste der Räume: Name, ein Satz Beschreibung, Raumtyp-Symbol, Button «Beitreten» oder Häkchen. Keine Mitgliederzahl. Suchfeld filtert lokal, Sprachfilter als Chips.
- **Raum-Detail** (`/rooms/[slug]`): Kopf mit Name, Beschreibung, Regeln (aufklappbar, Höhe animiert), «Beitreten/Verlassen», Glocke für Push (nur nach Beitritt).
  - Gedanken-Raum: chronologisch, 20 pro Seite, «Mehr laden» am Ende (kein Auto-Load), Cursor-Pagination.
  - Geschichten-Raum: Segment «Neu / Diese Woche / Top»; Karten mit Titel, Pseudonym, Wortzahl, Serienhinweis. Kein Vote-Zähler sichtbar.
- Ohne Konto lesbar; Beitreten, Reagieren und Kommentieren öffnen das Auth-Overlay.

**7.5 Mein Heft** (`/journal`)

- Suchfeld oben, sucht lokal in IndexedDB (auch entschlüsselte private Einträge; der Index verlässt den Browser nie).
- Filter-Chips: Alle · Privat · Anonym · Öffentlich · Geschichten · Verfällt bald. Filterwechsel animiert die Liste (Layout-Animation, Einträge gleiten an ihre neue Position).
- Liste nach Monat gruppiert, je Eintrag erste Zeile oder Titel, Datum, Sichtbarkeits-Symbol, Punkt bei vorhandenen Reaktionen (kein Zähler).
- Hover/Swipe-Aktionen: «Sichtbarkeit» (nur einschränken), «Verbrennen» (Bestätigung im Overlay mit Wortlaut «Dieser Text wird überall endgültig gelöscht.»).
- Leer-Zustand: «Dein Heft ist leer.»
- Unten: «Als ZIP exportieren» (Markdown + JSON, private Einträge werden im Browser entschlüsselt und lokal ins ZIP geschrieben).

**7.6 Ich** (`/me`)

- Kopf: Avatar (generische Form aus einem Set oder eigenes Foto, max. 2 MB, serverseitig auf 512 px verkleinert), Pseudonym, Mitglied seit Monat/Jahr. Keine Zahlen.
- «Rückmeldungen»: pro geteiltem Text eine Zeile «Gelesen von 12 · 4 fühlen es · 1 danke». Nur die Autorin sieht das. Keine Namen.
- «Mein öffentliches Profil»: Vorschau wie für andere (`/@pseudonym`): Pseudonym, Avatar, Liste der öffentlich geteilten Texte, chronologisch. Mehr nicht.
- «Serien» (nur wenn Fiction geteilt): eigene Serien mit Kapiteln, Reihenfolge per Drag & Drop.

**7.7 Einstellungen** (`/me/settings/[group]`, auf Mobil als Overlay, auf Desktop in der Kontextspalte)

| Gruppe             | Einträge                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Konto              | E-Mail ändern, Passkeys verwalten (hinzufügen, umbenennen, entfernen), Apple-Verknüpfung, Pseudonym ändern (Sperre 30 Tage), Abmelden |
| Sicherheit         | Wiederherstellungscode anzeigen (nach erneuter Anmeldung), aktive Sitzungen mit Gerät/Browser und «Abmelden» pro Sitzung              |
| Schreiben          | Standard-Sichtbarkeit (`private` voreingestellt), Standard-Verfall, Schriftgrösse, Serif/Sans im Editor                               |
| Darstellung        | Hell/Dunkel/System, Bewegung reduzieren (überschreibt Systemeinstellung)                                                              |
| Benachrichtigungen | Web-Push pro Raum an/aus; Rückmeldungen einmal täglich (Standard aus); Kommentare an/aus; Hinweis zu iOS (nur in installierter PWA)   |
| Sprachen           | Sprachen der Räume                                                                                                                    |
| Blockiert          | Liste blockierter Pseudonyme, aufhebbar                                                                                               |
| Daten              | Export als ZIP, Konto löschen (zweistufig, 30 Tage Frist mit Widerruf)                                                                |
| Über               | Version, Changelog, Datenschutz, AGB, Impressum, Problem melden, Hilfsangebote                                                        |

## 8. Editor & Veröffentlichungsfluss

Der Editor ist ein Vollbild-Overlay (`/write`, Intercepting Route) mit nichts als Text. Alle Entscheidungen über Sichtbarkeit kommen erst nach dem Schreiben, in einem separaten Abschluss-Panel.

**8.1 Editor**

- Öffnet sich aus dem Schreib-Button heraus (Scale von der Button-Position, 260 ms); die darunterliegende Seite bleibt im DOM und wird beim Schliessen wieder sichtbar, mit erhaltener Scrollposition.
- Oben links «Abbrechen» (bei Inhalt: «Entwurf behalten?» mit Behalten/Verwerfen). Oben rechts «Fertig». `Esc` fragt dasselbe.
- Kein Titel-Feld sichtbar. Die erste Zeile dient als Vorschau. Titel per Werkzeugleiste einblendbar; bei Stories Pflicht.
- Werkzeugleiste (auf Mobil über der Bildschirmtastatur via `visualViewport`, auf Desktop oben): Fett, Kursiv, Zitat, Trennlinie, Titel ein/aus, Wortzahl (nur bei Stories). Kein Bild, kein Link, keine Überschriften-Ebenen.
- Technik: `contenteditable` über ein schlankes Editor-Framework (Tiptap/ProseMirror) mit auf die erlaubten Knoten reduziertem Schema; Ausgabe als Markdown-Untermenge.
- Autosave alle 2 Sekunden in IndexedDB, verschlüsselt mit dem lokalen Schlüssel. Entwürfe sind nie auf dem Server. Schliessen des Tabs verliert nichts; beim Öffnen von `/write` wird ein vorhandener Entwurf angeboten.
- Offline voll funktionsfähig: Schreiben, Speichern, Abschliessen. Veröffentlichen landet in einer Warteschlange (Background Sync, wo verfügbar; sonst beim nächsten Online-Zustand), mit Hinweis «Wird gesendet, sobald du online bist».
- Schrift: Serif/Sans, 17–22 px, Zeilenhöhe 1.5, Textbreite max. 680 px. Dunkelmodus folgt System oder Einstellung.
- Keine KI-Funktion: keine Vorschläge, keine Umformulierung, keine Stimmungsanalyse. Steht so in der FAQ.

**8.2 Abschluss-Panel** (gleitet nach «Fertig» von unten bzw. rechts herein, 240 ms; der Editor bleibt abgedunkelt sichtbar)

1. **Typ**: «Gedanke» oder «Geschichte» (vorbelegt: über 400 Wörter oder Titel gesetzt → Geschichte).
2. **Sichtbarkeit** (drei grosse Optionen mit je einem Satz):
   - «Nur für mich» – «Verschlüsselt in deinem Browser. Niemand sonst kann es lesen.» (Standard)
   - «Anonym teilen» – «Erscheint in einem Raum ohne deinen Namen. Nicht mit deinem Profil verknüpft.» (bei Geschichten ausgegraut)
   - «Mit Profil teilen» – «Erscheint mit deinem Pseudonym und in deinem Profil.»
3. **Raum** (nur bei Teilen): Liste der beigetretenen Räume passenden Typs, Suchfeld. Pflicht. Die Liste klappt animiert auf, wenn eine Teilen-Option gewählt wird.
4. **Verfall** (nur bei Teilen): «Bleibt» / «24 Stunden» / «7 Tage». Satz: «Nach Ablauf verschwindet der Text aus dem Raum, bleibt aber in deinem Heft.»
5. **Kommentare** (nur bei Teilen): Schalter. Standard: aus bei anonym, an bei Profil.
6. **Serie** (nur Geschichte mit Profil): «Keine» oder eigene Serie, Kapitelnummer automatisch.
7. Button: «Im Heft ablegen» / «Anonym teilen» / «Veröffentlichen».

**8.3 Krisenhinweis** (lokal, vor dem Abschluss-Panel)

- Ein Web Worker prüft den Text beim Tippen gegen eine sprachspezifische Wortliste plus Satzmuster (deterministisch, kein ML-Modell im Browser im MVP; eine kleine ONNX-Klassifikation ist für v2 vorgesehen). Nichts verlässt den Browser, nichts wird gespeichert.
- Bei Treffer erscheint **vor** dem Abschluss-Panel ein ruhiges, nicht blockierendes Panel: «Das klingt nach einem schweren Moment. Wenn du reden möchtest: Die Dargebotene Hand, 143, rund um die Uhr.» Buttons «Anrufen» (`tel:143`), «Weiter schreiben».
- Höchstens einmal pro Text.

**8.4 Nach dem Veröffentlichen**

- Das Overlay schliesst sich (Fade, 160 ms), der Text erscheint oben in der aktuellen Liste, falls sie den Raum zeigt, mit einem kurzen Hervorheben (Hintergrund-Tint, 600 ms ausklingend). Kein Modal, keine Aufforderung zum Teilen auf anderen Plattformen.
- Bearbeiten ist 15 Minuten möglich, danach nur Sichtbarkeit einschränken oder Verbrennen. Stories: Bearbeiten unbegrenzt, Hinweis «bearbeitet» in der Lese-Ansicht.

**8.5 Validierung (Server)**

| Regel                       | Grenze                     | Fehlercode                 |
| --------------------------- | -------------------------- | -------------------------- |
| Mindestlänge geteilter Text | 20 Zeichen                 | `POST_TOO_SHORT`           |
| Maximallänge Gedanke        | 10 000 Zeichen             | `POST_TOO_LONG`            |
| Maximallänge Geschichte     | 60 000 Zeichen pro Kapitel | `POST_TOO_LONG`            |
| Anonym in Fiction-Raum      | nicht erlaubt              | `ANON_NOT_ALLOWED_IN_ROOM` |
| Vote in Reflection-Raum     | nicht erlaubt              | `VOTING_DISABLED_IN_ROOM`  |
| Rate-Limit Veröffentlichen  | 20 Texte / 24 h            | `RATE_LIMITED`             |
| Rate-Limit Kommentare       | 60 / h                     | `RATE_LIMITED`             |

## 9. Lesen, Reaktionen, Kommentare, Voting

Die Lese-Ansicht ist eine Buchseite: Text, Autorin, Datum, und am Ende die stillen Reaktionen. Keine Leiste mit Zählern unter dem Text.

**9.1 Lese-Ansicht**

- Kopf: Raumname (tippbar), bei Profil-Texten Pseudonym und Avatar (tippbar), bei anonymen ein Symbol und das Wort «anonym». Datum relativ («vor 3 Std.»), bei Verfall ein Hinweis «verschwindet in 19 Std.».
- Text in Lese-Typografie, maximale Zeilenlänge 65 Zeichen, Serif als Standard. Stories mit Titel und Kapitelnavigation («Kapitel 3 von 7», Pfeile).
- Lesefortschritt wird lokal gemerkt; nach 80 % Scrolltiefe wird eine `read`-Reaktion gesendet (einmalig, idempotent).
- Menü oben rechts: Melden, Blockieren (blendet alle Texte dieser Person aus, bei anonymen Texten den Account dahinter, ohne ihn zu enthüllen), Link kopieren (Deep Link, nur für Profil-Texte; anonyme und verfallende Texte haben keinen teilbaren Link).

**9.2 Reaktionen**

- Am Textende drei Schaltflächen: «fühl ich», «kenn ich», «danke». Antippen toggelt, Haptik, keine Animation, keine Zahl.
- Die Autorin sieht die aggregierten Zahlen in «Ich → Rückmeldungen». Leser sehen nie Zahlen und nie, wer reagiert hat.
- API: `PUT /posts/:id/reactions/:kind`, `DELETE` entsprechend; `GET /me/posts/:id/reactions` nur für die Autorin.

**9.3 Kommentare**

- Nur wenn die Autorin sie eingeschaltet hat. Erscheinen unter dem Text, chronologisch, flach (keine Threads im MVP), maximal 2 000 Zeichen.
- In Gedanken-Räumen ist der Platzhalter «Antworte, wenn du magst. Keine Ratschläge, keine Diagnosen.» und die Raumregeln sind einen Tipp entfernt.
- In Geschichten-Räumen gibt es einen **Feedback-Modus**: Der Kommentar-Editor bietet zwei Pflicht-Chips «Was gut funktioniert hat» und «Was ich nicht verstanden habe». Beide Felder müssen ausgefüllt sein, bevor abgesendet werden kann. Das erzwingt Substanz und verhindert «cool» / «mag ich nicht».
- Autorin kann Kommentare ausblenden (für alle) und Kommentare am eigenen Text jederzeit abschalten; bestehende bleiben, neue werden verhindert.
- Keine Reaktionen auf Kommentare, kein Zitieren, keine @-Erwähnungen im MVP.

**9.4 Voting (nur Geschichten-Räume)**

- Pfeil hoch / Pfeil runter rechts vom Titel in der Lese-Ansicht. Eigener Zustand ist sichtbar (gefüllt), die Summe nicht.
- Ranking «Diese Woche» und «Top» berechnet sich aus Votes mit Zeit-Abklingen (Score = Netto-Votes / (Alter in Stunden + 2)^1.5, stündlich materialisiert). Die Autorin sieht ihre Netto-Zahl in den Rückmeldungen.
- Downvotes ohne Kommentar sind erlaubt, aber die Raumregel bittet um Feedback. Das wird nicht erzwungen.

**9.5 Serien**

- Eine Serie ist eine geordnete Liste von Stories derselben Autorin. Leser können Serien abonnieren; neues Kapitel löst Push aus (wenn eingeschaltet).
- Serienseite: Titel, Beschreibung (bis 500 Zeichen), Kapitelliste mit Lesestand.

## 10. Sicherheit, Moderation, Anonymität

Eine Plattform zum Abladen bekommt Krisentexte, Belästigung und Spam. Die drei Mechanismen dafür sind Teil des MVP: Melden, Review-Queue, Sperren.

**10.1 Melden**

- Jeder geteilte Text und jeder Kommentar hat «Melden» im Menü. Gründe: Belästigung, Hass, Spam/Werbung, sexueller Inhalt, Gewaltandrohung, Selbstgefährdung einer anderen Person, Urheberrecht, Sonstiges (Freitext bis 500 Zeichen).
- Bei «Selbstgefährdung» sieht die meldende Person sofort einen Hinweis: «Danke. Wir schauen uns das an. Wenn du selbst Unterstützung brauchst: 143.» Die Meldung landet mit höchster Priorität in der Queue.
- Ab 3 unabhängigen Meldungen innerhalb von 24 h wird der Text automatisch aus dem Raum ausgeblendet (`status = hidden_pending`), bis ein Review stattgefunden hat.

**10.2 Review-Queue** (Admin-Web, intern, nicht Teil der Landingpage)

- Route-Gruppe \`/admin\` im Next.js-Projekt, nur für Konten mit Admin-Rolle, zusätzlich IP-Allowlist im MVP.
- Spalten: Priorität, Grund, Anzahl Meldungen, Text (Vorschau), Raum, Alter, Account-Historie (frühere Verwarnungen, nie der Klarname).
- Aktionen: Behalten, Ausblenden, Löschen, Verwarnen, Sperren 7 Tage, Sperren dauerhaft. Jede Aktion erzeugt eine Mitteilung an die betroffene Person mit Grund in Klartext.
- Ziel-Reaktionszeit: Selbstgefährdung unter 1 h, Rest unter 24 h. Solange nur eine Person moderiert, ist das die Begrenzung für das Wachstum; eine zweite moderierende Person ist Voraussetzung für mehr als ca. 5 000 aktive Konten.

**10.3 Anonymität, wie sie wirklich funktioniert**

- Anonyme Texte tragen in der API keine `author_id`; das Feld wird serverseitig vor der Auslieferung entfernt, nie nur im Client ausgeblendet.
- Intern bleibt die Zuordnung in der Datenbank, damit Sperren wirken und Missbrauch nachverfolgbar ist. Das steht so in der Datenschutzerklärung: «Anonym gegenüber anderen Nutzenden, nicht gegenüber uns.»
- Pseudonym-Wechsel ändert nichts an früheren Texten; die bleiben beim alten Pseudonym nicht sichtbar, sondern werden auf das neue umgeschrieben (sonst wäre ein Wechsel sinnlos).
- Keine IP-Adressen in Logs länger als 7 Tage; Rate-Limits laufen über Account und gehashten Geräte-Identifier.

**10.4 Krisenhinweise**

- Beim Schreiben: lokal, siehe 8.3.
- Beim Lesen: Texte in Räumen wie «Nachts» oder «Trauer» zeigen am Ende dezent die Hilfsnummern des Landes der Person (aus Gerätesprache/Region, nie aus Standort).
- In «Einstellungen → Über → Hilfsangebote»: Liste nach Land, immer erreichbar.

**10.5 Automatische Filter (nur geteilte Texte)**

- Spam-Heuristik serverseitig: Links, wiederholte Texte, Mehrfachkonten pro Gerät. Treffer landen in der Queue, werden nicht automatisch gelöscht.
- Keine KI-basierte Inhaltsbewertung geteilter Texte im MVP. Grund: Fehlalarme bei literarischen Texten über schwere Themen würden genau die Texte treffen, für die die Plattform da ist. Wenn später eingeführt, dann nur zur Priorisierung in der Queue, nie zur automatischen Löschung.

**10.6 Sperren und Blockieren**

- Blockieren (durch Nutzende): gegenseitig unsichtbar, auch in Kommentaren. Funktioniert auch bei anonymen Texten über den internen Account.
- Sperren (durch Moderation): gesperrte Konten können lesen, aber nicht schreiben, reagieren oder kommentieren. Private Einträge bleiben vollständig zugänglich und exportierbar, auch bei dauerhafter Sperre.

## 11. Datenschutz & Verschlüsselung

Private Einträge verlassen den Browser nur verschlüsselt, und der Schlüssel liegt nur im Browser. Alles andere ist konventioneller Datenschutz, sauber umgesetzt.

**11.1 Verschlüsselung privater Einträge (Web Crypto API)**

- Beim Onboarding wird ein zufälliger 128-Bit-Seed erzeugt, als 12-Wörter-Code (BIP39) angezeigt und per HKDF-SHA-256 zu einem 256-Bit-Master-Key abgeleitet. Der Master-Key wird als nicht-extrahierbarer `CryptoKey` (`extractable: false`) in IndexedDB gespeichert; er ist für Scripts nicht auslesbar, nur verwendbar.
- Jeder private Eintrag wird mit einem eigenen Content-Key (AES-256-GCM) verschlüsselt; der Content-Key wird mit dem Master-Key umhüllt (`wrapKey`) und zusammen mit Chiffrat und Nonce gespeichert. Das erlaubt späteren Schlüsselwechsel ohne Neuverschlüsselung aller Texte.
- Der Server speichert `ciphertext`, `nonce`, `wrapped_key`, `created_at`. Kein Titel, keine Vorschau, keine Wortzahl.
- Suche über private Einträge läuft lokal: ein Index in IndexedDB, der beim Entsperren im Browser aufgebaut wird.
- Wechsel von privat zu geteilt entschlüsselt im Browser und sendet Klartext; umgekehrt löscht der Server den Klartext, und der Browser lädt das Chiffrat hoch.
- v2: Passkeys mit PRF-Erweiterung, damit der Master-Key aus dem Passkey abgeleitet werden kann und der 12-Wörter-Code nur noch Backup ist.

**11.2 Die Grenze im Browser, ehrlich**

Web-Verschlüsselung schützt gegen Datenbank-Lecks, Backups, Hoster-Zugriff und den neugierigen Betreiber. Sie schützt **nicht** gegen einen kompromittierten Server, der manipulierten JavaScript-Code ausliefert, denn den Code liefert derselbe Betreiber. Diese Grenze steht wörtlich in der Datenschutzerklärung und in der FAQ. Gegenmassnahmen im MVP: Subresource Integrity für alle Bundles, strikte Content Security Policy ohne `unsafe-inline`, öffentlich einsehbare Build-Hashes im Changelog. Die native iOS-App (Roadmap) schliesst die Lücke mit auditierbaren, signierten Binaries.

**11.3 Was der Server im Klartext sieht**

| Daten                              | Klartext auf Server               | Begründung                               |
| ---------------------------------- | --------------------------------- | ---------------------------------------- |
| Geteilte Texte (anonym/öffentlich) | Ja                                | Müssen ausgeliefert und moderiert werden |
| Private Texte                      | Nein                              | E2E, siehe oben                          |
| Entwürfe                           | Nein, nie hochgeladen             | IndexedDB                                |
| E-Mail-Adresse                     | Ja, zusätzlich gehasht für Lookup | Login                                    |
| Passkey-Public-Keys                | Ja                                | WebAuthn                                 |
| Pseudonym, Avatar, Sprachen        | Ja                                | Profil                                   |
| Reaktionen, Votes                  | Ja                                | Funktion                                 |
| Lesefortschritt                    | Nein                              | IndexedDB                                |
| Web-Push-Subscription              | Ja                                | Push                                     |

**11.4 Rechtsgrundlagen (Schweiz DSG, EU DSGVO)**

- Datenschutzerklärung in verständlicher Sprache, Zweck pro Datenkategorie, Speicherdauer pro Kategorie.
- Hosting: Railway-Region EU (Amsterdam). S3-kompatibler Storage ebenfalls EU. Keine Übermittlung an Drittanbieter ausser Apple (Sign in with Apple), dem Mailversand (EU-Anbieter) und den Push-Diensten der Browser-Hersteller (Web Push ist Ende-zu-Ende verschlüsselt nach RFC 8291, der Push-Dienst sieht keinen Inhalt).
- Keine Analytics-SDKs, keine Third-Party-Cookies. Nutzungszahlen werden serverseitig aggregiert, ohne Profilbildung.
- Auskunft: Export in der App. Löschung: Konto löschen in der App, 30 Tage Widerruf, dann endgültig inklusive Backups (Retention 30 Tage, also spätestens 60 Tage nach Antrag vollständig weg; steht so in der Datenschutzerklärung).
- Verantwortlicher mit Name und Adresse im Impressum. EU-Vertreter nach Art. 27 DSGVO wird geprüft.

**11.5 Datenexport**

- ZIP mit einem Ordner pro Jahr, je Text eine Markdown-Datei mit YAML-Frontmatter, plus `profile.json`, `reactions.json`, `comments.json`.
- Geteilte Texte werden serverseitig vorbereitet (Presigned URL, 24 h gültig); private Einträge werden im Browser entschlüsselt und clientseitig in dasselbe ZIP geschrieben (Streams API, ohne alles im Speicher zu halten). Der Server sieht nie den Klartext privater Texte.

**11.6 Verbrennen**

- Harte Löschung (kein Soft-Delete), entfernt Reaktionen, Votes und Kommentare, invalidiert Deep Links, löscht den lokalen Eintrag in IndexedDB. Backups laufen nach 30 Tagen aus.

## 12. Technische Architektur

Next.js (aktuelle Version, App Router) rendert die App und die Startseite und spricht intern mit der bestehenden Fastify-API, die Daten, Regeln und Moderation hält. Alles läuft auf Railway in der EU.

&#91;embedded content: Architektur Web-App · 6 Komponenten\]

Der Browser spricht nur mit Next.js; Next.js ruft die Fastify-API über das interne Railway-Netz auf. Private Texte kommen in beiden als Chiffrat an. Das Admin-Web ist eine Route-Gruppe `/admin` im selben Next.js-Projekt.

**12.1 Frontend (Next.js, App Router, React Server Components)**

- Projektstruktur: `app/(marketing)` für Startseite und statische Seiten, `app/(app)` für die Shell mit `layout.tsx`, `template.tsx`, `loading.tsx` pro Bereich, `app/(app)/@modal` für Overlays (Editor, Auth, Einstellungen), `app/(admin)`.
- Rendering: Listen als Server Components mit Streaming (Suspense), interaktive Teile (Editor, Reaktionen, Filter) als Client Components. Mutationen über Server Actions mit `useOptimistic`; die Actions rufen die Fastify-API auf und revalidieren per `revalidateTag`.
- Übergänge: View Transitions API über die React-`<ViewTransition>`-Integration von Next.js, Fallback über Motion (`AnimatePresence`) in `template.tsx`. Alle Dauern und Kurven als CSS-Variablen an einer Stelle (`--motion-fast: 120ms`, `--motion-base: 200ms`, `--ease-out`), `prefers-reduced-motion` global beachtet.
- PWA: `manifest.webmanifest` (Name, Icons maskable, `display: standalone`, `start_url: /today`, Theme-Farben hell/dunkel), Service Worker via Serwist: Shell und Assets precached, Routen-HTML network-first mit Offline-Fallback, API-Antworten stale-while-revalidate für Listen, nie für private Inhalte. Background Sync für die Veröffentlichungs-Warteschlange. Update-Hinweis «Neue Version verfügbar» unten, Reload erst auf Klick.
- Lokaler Speicher: IndexedDB (Dexie) für Entwürfe, entschlüsselte private Einträge, Suchindex, Lesefortschritt und Warteschlange. Verschlüsselung über Web Crypto in einem Worker, damit die Oberfläche nicht blockiert.
- Lokalisierung: `next-intl`, Sprach-Segment `[locale]`, alle Strings extern; Fehlercodes vom Server werden über eine Tabelle auf lokalisierte Sätze abgebildet.
- Abhängigkeiten bewusst klein: Next.js, React, Motion, Tiptap, Dexie, Serwist, next-intl, bip39, idb-keyval. Keine UI-Bibliothek; Komponenten selbst gebaut mit Tailwind und CSS-Variablen.
- Performance-Budget: LCP unter 1.5 s auf 4G, JS für `/today` unter 150 kB gzip, Lighthouse PWA-Audit grün.

**12.2 Backend (Node 22, Fastify 5, TypeScript)**

- Plugins: `auth` (Magic-Code, WebAuthn/Passkeys mit `@simplewebauthn/server`, Sign in with Apple, Sessions mit `scrypt`-Hash), `rateLimit` (Postgres-basiert für den Start), `rooms`, `posts`, `reactions`, `votes`, `comments`, `moderation`, `exports`, `push` (`web-push`, VAPID), `media` (Avatar-Upload, Verkleinerung mit `sharp` oder serverlos über Railway-Function, je nach Build-Stabilität).
- Regeln liegen im Server: `visibility`-Übergänge, Raumtyp-Regeln, Verfall (stündlicher Cron), Edit-Fenster, Rate-Limits.
- Fehler: immer `{ error: "CODE", details?: {...} }`, nie Prosa.
- Hintergrund-Jobs: Verfall, Export-Erstellung, Ranking-Materialisierung, endgültige Löschung nach 30 Tagen. Im MVP als Fastify-Route mit Railway-Cron.
- Die API ist nur intern erreichbar (Railway Private Networking); der Browser erreicht sie nie direkt. Damit bleibt die spätere iOS-App frei, dieselbe API über ein öffentliches Gateway zu nutzen.

**12.3 API (Auszug, alle unter `/v1`)**

| Methode & Pfad                                            | Zweck                                                                     | Auth     |
| --------------------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| `POST /auth/email/code`, `POST /auth/email/verify`        | Magic-Code-Login                                                          | –        |
| `POST /auth/passkey/options`, `POST /auth/passkey/verify` | WebAuthn Registrierung und Login                                          | –        |
| `POST /auth/apple`                                        | Sign in with Apple                                                        | –        |
| `GET /rooms?locale=de&kind=reflection`                    | Räume listen                                                              | optional |
| `GET /rooms/:slug/posts?cursor=&sort=`                    | Texte eines Raums                                                         | optional |
| `POST /posts`                                             | Text anlegen (privat: Chiffrat; geteilt: Klartext + room\_id)             | Pflicht  |
| `PATCH /posts/:id`                                        | Bearbeiten (15-min-Fenster), Sichtbarkeit einschränken, Kommentare an/aus | Autor    |
| `DELETE /posts/:id`                                       | Verbrennen                                                                | Autor    |
| `PUT/DELETE /posts/:id/reactions/:kind`                   | Reaktion setzen/entfernen                                                 | Pflicht  |
| `PUT /posts/:id/vote`                                     | Vote ±1 (nur fiction)                                                     | Pflicht  |
| `GET/POST /posts/:id/comments`                            | Kommentare                                                                | Pflicht  |
| `POST /reports`                                           | Melden                                                                    | Pflicht  |
| `GET /me/posts`, `GET /me/posts/:id/reactions`            | Eigenes Heft, Rückmeldungen                                               | Pflicht  |
| `POST /me/avatar`                                         | Avatar hochladen                                                          | Pflicht  |
| `POST /me/push`, `DELETE /me/push`                        | Web-Push-Subscription                                                     | Pflicht  |
| `POST /me/export`, `GET /me/export/:id`                   | Export anstossen, Status/Link                                             | Pflicht  |
| `DELETE /me`                                              | Konto löschen (30 Tage Frist)                                             | Pflicht  |
| `GET /admin/queue`, `POST /admin/flags/:id/action`        | Moderation                                                                | Admin    |

**12.4 Hosting (Railway, EU)**

- Services: `web` (Next.js, Node-Runtime, Standalone-Output), `api` (Fastify), `postgres`, `s3` (Railway Bucket), `cron`. Ein Projekt, zwei Umgebungen (staging, production).
- Backups: Postgres täglich, 30 Tage Retention. S3-Lifecycle: Exporte nach 24 h weg.
- Keine nativen Node-Module ausser gegebenenfalls `sharp` (vorab auf Railway-Build getestet); `scrypt` und `crypto` aus Node-Built-ins.
- Security-Header in `next.config`: strikte CSP mit Nonces, HSTS, `Permissions-Policy`, COOP/COEP. Subresource Integrity für Bundles.
- Observability: strukturierte Logs (pino), keine IP-Adressen über 7 Tage, Health-Endpoints, Uptime-Check für die Status-Seite.

**12.5 Codebase-Konventionen**

Die Codebasis ist durchgehend englisch: Ordner, Dateien, Routen, Variablen, Datenbankspalten, Commit-Messages, Kommentare und Übersetzungsschlüssel. Deutsch kommt nur in `messages/de.json` und in Nutzertexten vor.

**Monorepo-Struktur (pnpm Workspaces, Turborepo)**

```text
inkwell/
├── apps/
│   ├── web/                        # Next.js, App Router, PWA
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── (marketing)/    # /, /privacy, /imprint, /terms, /press, /changelog
│   │   │   │   ├── (app)/          # /today, /rooms, /journal, /me
│   │   │   │   │   ├── @modal/     # /write, /sign-in, /me/settings/[group]
│   │   │   │   │   ├── layout.tsx  # persistente Shell
│   │   │   │   │   ├── template.tsx# Seitenübergang
│   │   │   │   │   └── loading.tsx
│   │   │   │   └── (admin)/        # /admin
│   │   │   ├── api/                # Route Handlers: health, push
│   │   │   └── manifest.ts
│   │   ├── components/             # ui/, editor/, rooms/, journal/, profile/
│   │   ├── features/               # auth/, posts/, crypto/, offline/, moderation/
│   │   ├── lib/                    # api-client.ts, db.ts, motion.ts, i18n.ts
│   │   ├── messages/               # de.json, fr.json, it.json, en.json
│   │   ├── public/                 # icons/, fonts/
│   │   ├── styles/                 # globals.css, tokens.css, motion.css
│   │   ├── workers/                # crypto.worker.ts, crisis.worker.ts
│   │   └── sw.ts                   # Service Worker (Serwist)
│   └── api/                        # Fastify
│       ├── src/
│       │   ├── plugins/            # auth.ts, rate-limit.ts, session.ts
│       │   ├── routes/             # posts.ts, rooms.ts, reactions.ts, comments.ts, ...
│       │   ├── services/           # moderation.ts, exports.ts, ranking.ts, expiry.ts
│       │   ├── db/                 # migrations/, schema.ts, client.ts
│       │   ├── lib/                # errors.ts, crypto.ts, mail.ts, push.ts
│       │   └── server.ts
│       └── test/                   # unit/, integration/
├── packages/
│   ├── shared/                     # error-codes.ts, types/, schemas/ (zod)
│   └── config/                     # eslint, prettier, tsconfig
├── docs/
│   ├── adr/                        # Architecture Decision Records
│   └── prd.md
├── .github/workflows/              # ci.yml, deploy.yml
├── turbo.json
└── pnpm-workspace.yaml
```

**Namensregeln**

| Element              | Konvention                                           | Beispiel                              |
| -------------------- | ---------------------------------------------------- | ------------------------------------- |
| Ordner, Dateien      | kebab-case                                           | `rate-limit.ts`, `post-card.tsx`      |
| React-Komponenten    | PascalCase im Export, Datei kebab-case               | `PostCard` in `post-card.tsx`         |
| Hooks                | `use`-Präfix                                         | `use-post-draft.ts`                   |
| Server Actions       | Verb-Objekt                                          | `publishPost`, `burnPost`             |
| Routen               | kebab-case, Substantive, Plural für Sammlungen       | `/rooms/[slug]`, `/me/settings`       |
| DB-Tabellen, Spalten | snake\_case, Plural                                  | `posts.expires_at`                    |
| Fehlercodes          | SCREAMING\_SNAKE\_CASE, zentral in `packages/shared` | `POST_TOO_SHORT`                      |
| i18n-Schlüssel       | dot.notation nach Feature                            | `editor.placeholder`, `journal.empty` |
| CSS-Variablen        | `--` + Domäne                                        | `--color-ink`, `--motion-base`        |
| Branches             | `feat/`, `fix/`, `chore/` + kebab-case               | `feat/journal-search`                 |

**Qualitätsregeln**

- TypeScript `strict`, `noUncheckedIndexedAccess`, kein `any`, keine `@ts-ignore` ohne Begründung in derselben Zeile.
- ESLint (typescript-eslint, react-hooks, jsx-a11y, import-order) und Prettier als Pre-Commit-Hook (lefthook). Ein Lint-Fehler blockiert den Merge.
- Validierung an jeder Grenze mit zod: Server Actions, API-Routen, Umgebungsvariablen (`env.ts` mit Schema, Build bricht bei fehlender Variable).
- Tests: Vitest für Logik (Crypto, Ranking, Verfall, Fehler-Mapping), Playwright für die fünf Kernflüsse (Registrieren, Schreiben privat, Teilen anonym, Verbrennen, Export), Lighthouse CI für Performance- und PWA-Budget. CI läuft auf jedem Pull Request.
- Commits nach Conventional Commits (`feat:`, `fix:`, `refactor:`), englisch, Imperativ. Changelog wird daraus generiert (changesets).
- Keine toten Dateien, keine auskommentierten Blöcke, keine TODO-Kommentare ohne Issue-Nummer.
- Jede nicht offensichtliche Architekturentscheidung bekommt einen ADR in `docs/adr/` (z. B. «Warum Fastify neben Next.js», «Warum Web Crypto statt libsodium»).
- README pro App mit: Zweck, Start in drei Befehlen, Umgebungsvariablen, Deployment.

## 13. Design-System, Bewegung & Tonalität

Das Design ist das eines guten Notizbuchs: Papierweiss oder eine passende gedeckte Fläche, eine Serife für Texte, eine Sans für die Oberfläche, eine einzige Akzentfarbe. Bewegung erklärt Raum und Richtung, nie Aufmerksamkeit.

**Typografie** (selbst gehostet über `next/font/local`, keine Google-Fonts-Abrufe, `font-display: swap` mit passenden Fallback-Metriken gegen Layout-Sprünge)

| Rolle                       | Schrift                                                       | Grösse                            |
| --------------------------- | ------------------------------------------------------------- | --------------------------------- |
| Lesetext und Editor         | Serif (z. B. Source Serif 4 oder Literata, variable Schnitte) | 17–22 px wählbar, Zeilenhöhe 1.5  |
| Oberfläche, Buttons, Listen | Sans (z. B. Inter oder Geist, variabel)                       | 15–17 px, `clamp()` nach Viewport |
| Datumsangaben, Hinweise     | Sans, Sekundärfarbe                                           | 13 px                             |
| Startseite                  | Serif für Überschriften und Zitate, Sans für Fliesstext       |                                   |

**Farben** (als CSS-Variablen, Dunkelmodus über `prefers-color-scheme` und `data-theme`)

- Hintergrund: warmes Weiss (#F9F8F5) hell, tiefes Graublau (#0F1014) dunkel, dazu Kartenfläche und vertiefte Fläche als eigene Töne. Kein reines Schwarz, kein reines Weiss. (Werte seit ADR 0010.)
- Text: #16181E hell, #EDEBE7 dunkel. Sekundär- und Tertiärtext als feste Grautöne mit mindestens 4.5:1 Kontrast.
- Akzent: ein Tintenblau (#1A57AD hell, #83B3FA dunkel) für Buttons und aktive Zustände. Keine zweite Akzentfarbe.
- Warnung nur für Verbrennen und Krisenhinweis: gedecktes Rot (#B3392D hell, #F2897B dunkel).
- Keine Verläufe, keine Schatten unter Karten; Karten werden durch Abstand getrennt.
- Theme-Wechsel animiert als Cross-Fade der ganzen Seite (View Transition, 200 ms), nicht als Farbsprung.

**Bewegungs-Regeln** (eine Datei `motion.css`, alle Werte als Variablen)

| Vorgang                                      | Dauer                  | Kurve                        | Form                                                |
| -------------------------------------------- | ---------------------- | ---------------------------- | --------------------------------------------------- |
| Seitenwechsel innerhalb der Shell            | 120 ms aus, 160 ms ein | `cubic-bezier(0.2, 0, 0, 1)` | Fade + 8 px nach oben; Tab-Wechsel mobil horizontal |
| Overlay öffnen (Editor, Auth, Einstellungen) | 240–300 ms             | gleiche Kurve                | Scale 0.96 → 1 + Fade, Hintergrund dunkelt auf 40 % |
| Overlay schliessen                           | 160 ms                 | `ease-in`                    | umgekehrt                                           |
| Shared Element (Karte → Lese-Ansicht)        | 260 ms                 | gleiche Kurve                | `view-transition-name` auf erster Zeile             |
| Listen-Filter, Sortierung                    | 200 ms                 | gleiche Kurve                | Layout-Animation, Elemente gleiten                  |
| Reaktion, Vote, Beitreten                    | 120 ms                 | `ease-out`                   | Zustandswechsel des Icons, keine Partikel           |
| Neuer Text erscheint                         | 600 ms                 | linear ausklingend           | Hintergrund-Tint, kein Einschieben                  |
| `prefers-reduced-motion`                     | 80 ms                  | linear                       | nur Fade, nie Bewegung                              |

Keine Konfetti, keine Pulse, keine Badge-Animationen, keine Skeleton-Shimmer (Skeletons sind statisch).

**Microcopy-Regeln**

- Du-Form, kurze Sätze, keine Ausrufezeichen, kein «Super!», kein «Los geht's».
- Jede destruktive Aktion sagt im Button, was passiert («Endgültig löschen», nicht «OK»).
- Leer-Zustände sind ruhig: «Dein Heft ist leer.» statt «Schreib jetzt deinen ersten Eintrag!».
- Fehler sagen, was zu tun ist: «Dieser Name ist vergeben. Versuch einen anderen.»
- Keine Zahlen in Benachrichtigungen. «Jemand hat deinen Text gelesen.» nie «3 neue Reaktionen».

**Barrierefreiheit**

- Alle Overlays als `<dialog>` mit Fokus-Falle und Rückgabe des Fokus; Tastatur-Navigation vollständig; Kontrast mindestens 4.5:1; Live-Regionen für «gesendet», «gespeichert»; Zielgrösse mindestens 44 px.

**Mehrsprachigkeit**

- Launch-Sprachen: Deutsch (Schweizer Rechtschreibung mit ss, nicht ß), Französisch, Italienisch, Englisch. Spanisch in v2.
- Räume sind pro Sprache getrennt; die App zeigt nur Räume der gewählten Sprachen.
- Hilfsnummern werden pro Region gepflegt (CH, DE, AT, FR, IT, UK, US).

## 14. Nicht-Ziele, offene Fragen, Metriken

Das MVP ist bewusst klein: Schreiben, Teilen in Betreiber-Räumen, stille Reaktionen, Moderation, Verschlüsselung, Export, als PWA installierbar. Alles andere wartet.

**Nicht-Ziele (explizit nicht im Produkt)**

- Bilder, Audio, Video in Texten (Avatar-Foto ausgenommen)
- Direktnachrichten zwischen Nutzenden
- Follower, Freundeslisten, Kontakte importieren
- Algorithmische Empfehlungen, «Für dich»-Feed
- Streaks, Badges, Gamification jeder Art
- KI-Schreibhilfe, KI-Zusammenfassungen, Stimmungsanalyse
- Werbung, Datenverkauf, Affiliate-Links
- Native Apps im MVP (iOS kommt später, siehe Roadmap)

**Offene Fragen**

- [ ] Produktname: «Inkwell» ist bereits ein etablierter Markenname. Kandidatenliste, Markenrecherche CH/EU, Domain prüfen.
- [ ] Rechtsform und Impressum: Einzelfirma oder GmbH vor Launch?
- [ ] EU-Vertreter nach Art. 27 DSGVO: nötig, sobald DE/AT-Nutzende aktiv angesprochen werden.
- [ ] Zweite moderierende Person: wer, ab wann?
- [ ] Mail-Anbieter mit EU-Hosting festlegen.
- [ ] Passkeys im MVP oder erst v1? (Empfehlung: MVP, weil die Bibliotheken reif sind und Passwörter entfallen.)
- [ ] Lesen ohne Konto: im MVP erlauben, bei Missbrauch zurücknehmen?
- [ ] Mitgliedschaft: Preis und Umfang vor Launch kommunizieren; Zahlung über Stripe (Web) statt StoreKit.
- [ ] iOS-PWA-Grenzen (Push nur in installierter PWA, IndexedDB-Löschung nach 7 Tagen Inaktivität in Safari ohne Installation): im Onboarding erklären oder auf die native App vertrösten?

**Erfolgsmetriken (serverseitig aggregiert, ohne Profilbildung)**

| Metrik                                                 | Zielwert nach 90 Tagen | Warum diese                                   |
| ------------------------------------------------------ | ---------------------- | --------------------------------------------- |
| Anteil Nutzende mit mindestens 1 Text in Woche 2       | über 40 %              | Misst, ob die App zum Schreiben taugt         |
| Anteil privater Texte an allen Texten                  | 50–70 %                | Zu niedrig: Feed geworden; zu hoch: Räume tot |
| Median Zeit von Seitenaufruf bis erster Tastenanschlag | unter 10 s             | Der Editor ist der Startpunkt                 |
| Anteil installierter PWA unter aktiven Nutzenden       | über 30 %              | Zeigt, ob die App als App wahrgenommen wird   |
| Meldungen mit Reaktionszeit unter 24 h                 | 100 %                  | Sicherheit                                    |
| Exporte und Kontolöschungen ohne Support-Kontakt       | 100 %                  | Vertrauen                                     |

Bewusst keine Metrik: Sitzungsdauer. Eine längere Sitzung ist hier kein Erfolg.

## 15. Roadmap

| Phase                            | Inhalt                                                                                                                                                                                                                                                                                                      | Abschlusskriterium                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| MVP Web (ca. 12 Wochen)          | Startseite, Onboarding mit Passkeys und Magic-Code, Editor offline-fähig, private E2E-Einträge, 15 Räume pro Sprache (DE, EN), anonym/öffentlich teilen, Reaktionen, Kommentare, Melden + Review-Queue, Verfall, Verbrennen, Export, Konto löschen, PWA installierbar, Seitenübergänge gemäss Abschnitt 7.1 | Private Beta mit 50 Personen, alle Meldungen in 24 h bearbeitet, Lighthouse PWA grün, Export und Löschung durchgetestet |
| v1 Web (ca. 8 Wochen nach MVP)   | Geschichten-Räume mit Voting und Feedback-Modus, Serien, FR/IT, Web-Push für Räume und Serien, Mitgliedschaft (Stripe), Status-Seite, Avatar-Fotos                                                                                                                                                          | Öffentlicher Launch CH                                                                                                  |
| v2 Web                           | Community-Räume mit eigenen Moderatoren, ES, Passkey-PRF für den Schlüssel, ONNX-Krisenklassifikation im Worker, Tablet-Layout, Mehrgeräte-Sync                                                                                                                                                             | abhängig von v1-Zahlen                                                                                                  |
| iOS-App (nach v1, ca. 16 Wochen) | SwiftUI-Client auf derselben Fastify-API über ein öffentliches Gateway, CryptoKit mit Keychain statt Web Crypto, Core ML für den Krisenhinweis, Widgets, Sign in with Apple nativ; Web-Konto und Wiederherstellungscode gelten weiter                                                                       | App-Store-Launch CH, Feature-Parität mit v1 Web                                                                         |
