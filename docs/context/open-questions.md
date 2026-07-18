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

## Availability-first date picker (rail) — confirm before deploy

The Step-3 calendar was rebuilt from a time-axis week grid into an availability-first rail
(`src/components/booking/AvailabilityRail.jsx`) that lists only bookable days. These need
Matthias' sign-off before it goes live:

- [ ] **Q1 — Calendar maintained how far ahead?** *(gates the rail)* The rail scans a 56-day
  (8-week) horizon and presents empty days as *free*. That's only true if the calendar is
  maintained that far out. If Matthias only enters events ~1–2 weeks ahead, far-out days are
  *unplanned*, not free, and the rail would advertise openings that don't exist. There is no
  holiday/vacation/blackout table in the repo (grep `feiertag|holiday|urlaub` → 0); days are
  blocked only by Google events. If he doesn't maintain 8 weeks, shorten `HORIZON_DAYS`
  (`src/lib/scheduling.js`, mirrored by the clamp in `api/availability.js`).
- [ ] **Q2 — Multi-day tolerance (90 min).** A multi-day drop-off day now accepts up to
  `MULTIDAY_TOLERANCE_MIN` (90) of existing bookings instead of demanding a totally empty day
  (`scheduling.js` + `api/_lib/calendar.js`, kept in sync by a drift test). Right value? And is
  he OK that the single spanning booking event will now visually **overlap** those tolerated
  appointments in his calendar (Google allows it; nothing breaks, but the calendar looks busier)?
- [ ] **Q3 — `VITE_MAKE_WEBHOOK_URL` set in production?** If unset, `submitViaMake`
  (`src/lib/api.js`) already throws 503, so a customer can't book during a Google outage anyway —
  which makes the rail's "refuse and show the phone" behaviour a strict improvement. If it *is*
  set, revisit whether the outage path should offer a Wunschtermin request form. One `vercel env
  ls` settles it.
- [ ] **Q6 — Gap notes** ("kein freier Termin · 21.–24. Juli") between free days: keep for
  orientation, or drop to honour "only show what's available" literally? One flip:
  `SHOW_GAP_NOTES` in `AvailabilityRail.jsx`.
- [ ] **Q9 — Per-day "Zeitachse anzeigen" toggle** was scoped but not built: at the flagship
  durations (300–360 min) a day has one slot, so an axis would render a single block and the chip
  already shows the duration. Recommend dropping unless Matthias wants it after seeing the rail.

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
