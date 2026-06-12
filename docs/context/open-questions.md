# Open questions / checklist

Live list of things to confirm. Resolve each line and note the answer + date.

- [ ] **Make.com role** — Does the Make.com scenario
  (`hook.eu1.make.com/ugto7s564hkhy94gvh6ldgyjqgx7dn8x`) create a Google Calendar event, or
  only send notifications? Determines whether we delete it or keep it as notification-only.
  (As of the double-booking fix, the website no longer calls it.)

- [ ] **Vercel env vars** — Are `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_CALENDAR_ID` set in
  the Vercel project, and is the calendar shared with the service-account email? If not,
  `/api/book.js` returns 500s and availability silently shows all slots. See
  `SETUP-ANLEITUNG.md`.

- [x] **Client's outside-booking workflow** — CONFIRMED (2026-06): the client enters phone
  appointments manually into **his own** calendar. Symptom reported: those appointments show
  only in his calendar, NOT on the website → the website was reading a different calendar.
  → Root cause = calendar mismatch (see below).

- [ ] **ACTION: calendar ID mismatch** — Find out (a) which calendar `GOOGLE_CALENDAR_ID`
  currently points to on Vercel, and (b) the ID of the calendar the client actually uses for
  phone appointments. Then either:
  - point `GOOGLE_CALENDAR_ID` at the client's own calendar (simplest), OR
  - add the client's calendar ID to `GOOGLE_CALENDAR_ID` as a comma-separated list and share
    it (≥ free/busy) with the service account.
  The code (`api/_lib/calendar.js`) already supports a comma-separated list and unions busy
  times across all of them.

## FAQ-Bot Inhalte (zu bestätigen mit Matthias)

The FAQ bot (`src/data/faqKnowledge.js`) has entries for these topics, but with safe
deflection answers ("ruf uns kurz an…") because the facts are unconfirmed. Each entry is
flagged `confirm: true`. Once Matthias answers, replace the deflection with the real answer
and remove the flag.

- [ ] **Öffnungszeiten je Standort** — booking slots in code are Mo–Fr 08:00–18:00,
  Sa 08:00–13:00 (`src/lib/scheduling.js` HOURS), but /mobiler-service advertises
  "auch nach Feierabend". What are the official hours? (entry `buchung-zeiten`)
- [ ] **Zahlungsmethoden** — bar / Karte / Überweisung / Anzahlung? (entry `info-zahlung`)
- [ ] **Keramik-Garantie** — is the 40.000–60.000 km durability a written guarantee?
  (entry `info-garantie`)
- [ ] **Storno-/Umbuchungsregeln** — deadline, fees? (entry `info-storno`)
- [ ] **Geschenkgutscheine** — offered? fixed amounts or per service? (entry `info-gutschein`)
- [ ] **Firmen-/Flottenkonditionen** — discounts, invoicing? (entry `info-firmen`)
- [ ] **Hol- & Bringservice / Ersatzwagen** — offered, radius, price? (entry `info-holbring`)
- [ ] **Regenwetter beim Mobilservice** — official policy? (entry `info-regen`)
- [ ] **Motorräder / Wohnmobile / Boote** — accepted? pricing? (entry `info-andere-fahrzeuge`)

Unanswered visitor questions are collected centrally in a **Google Sheet** via
`api/faq-log.js` (see `integrations.md` → "Google Sheets") — review it occasionally and
turn frequent questions into new KB entries. localStorage
(`elite-faq-unanswered`) remains as a per-browser fallback.

- [ ] **ACTION: FAQ-log sheet setup** — (a) enable the Google Sheets API in Matthias'
  Cloud project (SETUP-ANLEITUNG Bonus-Schritt), (b) create the sheet and share it with
  the service-account email as editor (+ Matthias), (c) set `FAQ_LOG_SHEET_ID` on Vercel.
