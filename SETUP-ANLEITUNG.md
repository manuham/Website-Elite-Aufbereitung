# Kalender-Einrichtung fuer deine Website

Hallo Matthias,

Damit die Kalender-Synchronisation auf deiner Website funktioniert, musst du einmalig ein paar Dinge einrichten. Ich fuehre dich Schritt fuer Schritt durch. Das Ganze dauert ca. 15-20 Minuten.

---

## Was danach passiert

- Wenn ein Kunde auf deiner Website einen Termin bucht, erscheint dieser **automatisch in deinem Google Kalender**
- Dein **Apple Kalender** (iPhone/Mac) synchronisiert sich automatisch mit dem Google Kalender
- Auf der Website werden **nur noch freie Zeiten** angezeigt — keine Doppelbuchungen mehr
- Du musst nichts manuell eintragen

---

## Schritt 1: Google Cloud Projekt erstellen

1. Oeffne diesen Link: https://console.cloud.google.com
2. Melde dich mit deinem Google-Konto an (dasselbe wie fuer deinen Google Kalender)
3. Oben in der Leiste siehst du **"Projekt auswaehlen"** — klicke darauf
4. Klicke auf **"Neues Projekt"**
5. Name: `Elite Aufbereitung Booking`
6. Klicke auf **"Erstellen"**
7. Warte ein paar Sekunden, bis das Projekt erstellt ist

## Schritt 2: Google Calendar API aktivieren

1. Klicke links im Menue auf **"APIs und Dienste"** > **"Bibliothek"**
2. Suche nach **"Google Calendar API"**
3. Klicke auf das Ergebnis **"Google Calendar API"**
4. Klicke auf den blauen Button **"Aktivieren"**

## Schritt 3: Service Account erstellen (der "Bot" fuer deine Website)

1. Gehe zu **"APIs und Dienste"** > **"Anmeldedaten"**
2. Klicke oben auf **"+ Anmeldedaten erstellen"** > **"Dienstkonto"**
3. Name: `booking-bot`
4. Klicke auf **"Erstellen und fortfahren"**
5. Die naechsten Schritte (Rolle, Zugriff) kannst du einfach ueberspringen — klicke jeweils auf **"Weiter"** und dann **"Fertig"**

## Schritt 4: Schluessel-Datei herunterladen

1. Du siehst jetzt dein neues Dienstkonto in der Liste. Klicke darauf.
2. Oben auf den Tab **"Schluessel"** klicken
3. Klicke auf **"Schluessel hinzufuegen"** > **"Neuen Schluessel erstellen"**
4. Waehle **"JSON"** und klicke auf **"Erstellen"**
5. Eine Datei wird heruntergeladen (z.B. `elite-aufbereitung-xxxxx.json`). **Diese Datei ist wichtig! Bewahre sie sicher auf und teile sie mit niemandem ausser mir.**

**Wichtig:** Auf der Seite des Dienstkontos siehst du eine E-Mail-Adresse, die so aehnlich aussieht wie:
`booking-bot@elite-aufbereitung-xxxxx.iam.gserviceaccount.com`

Kopiere diese E-Mail-Adresse — du brauchst sie im naechsten Schritt.

## Schritt 5: Kalender mit dem Bot teilen

1. Oeffne deinen **Google Kalender** (https://calendar.google.com)
2. Links in der Seitenleiste findest du deinen Kalender. Fahre mit der Maus darueber und klicke auf die **drei Punkte** > **"Einstellungen und Freigabe"**
3. Scrolle runter zu **"Fuer bestimmte Personen freigeben"**
4. Klicke auf **"Personen hinzufuegen"**
5. Fuege die Service-Account-E-Mail-Adresse ein (die aus Schritt 4, z.B. `booking-bot@elite-aufbereitung-xxxxx.iam.gserviceaccount.com`)
6. Berechtigung: **"Aenderungen an Terminen vornehmen"**
7. Klicke auf **"Senden"**

Ausserdem brauche ich noch deine **Kalender-ID**:
- Scrolle auf derselben Einstellungsseite runter zu **"Kalender integrieren"**
- Dort steht deine **"Kalender-ID"** — sieht so aus wie eine E-Mail-Adresse (z.B. `deinname@gmail.com` oder eine laengere Adresse)
- Kopiere diese ID

## Schritt 6: Apple Kalender synchronisieren

Damit dein Apple Kalender (iPhone/Mac) automatisch die Buchungen sieht:

### Auf dem iPhone:
1. Oeffne **Einstellungen**
2. Gehe zu **Kalender** > **Accounts** > **Account hinzufuegen** > **Andere**
3. Waehle **"Kalenderabo hinzufuegen"**
4. Hier brauchst du eine spezielle URL aus deinem Google Kalender:
   - Oeffne Google Kalender am Computer > Einstellungen deines Kalenders > "Kalender integrieren"
   - Kopiere die **"Privatadresse im iCal-Format"** (beginnt mit `https://calendar.google.com/calendar/ical/...`)
5. Fuege diese URL auf dem iPhone ein
6. Klicke auf **"Weiter"** und dann **"Sichern"**

### Auf dem Mac:
1. Oeffne die **Kalender-App**
2. Klicke oben auf **"Ablage"** > **"Neues Kalenderabonnement"**
3. Fuege dieselbe iCal-URL ein
4. Stelle die **automatische Aktualisierung** auf **"Alle 5 Minuten"**
5. Klicke auf **"Abonnieren"**

---

## Was du mir schicken musst

Damit ich alles fertig einrichten kann, schicke mir bitte:

1. Die **JSON-Schluessel-Datei** aus Schritt 4
2. Deine **Kalender-ID** aus Schritt 5

Ich trage diese dann sicher auf Vercel ein (dem Server, auf dem deine Website laeuft). Danach funktioniert alles automatisch.

---

## Zusammenfassung

| Was | Wer | Wie oft |
|-----|-----|---------|
| Google Cloud Projekt + Service Account | Du (einmalig) | 1x |
| Kalender freigeben | Du (einmalig) | 1x |
| Apple Kalender verbinden | Du (einmalig) | 1x |
| Vercel Einstellungen | Ich | 1x |
| Termine verwalten | Automatisch | Laeuft von selbst |

Nach der Einrichtung musst du **nichts mehr tun**. Jede Buchung erscheint automatisch in deinem Kalender, und die Website zeigt nur freie Zeiten an.

Bei Fragen einfach melden!
