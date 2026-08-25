# Open questions / checklist

Live list of things to confirm. Resolve each line and note the answer + date.

- [ ] **Make.com role** — Does the Make.com scenario
  (`hook.eu1.make.com/ugto7s564hkhy94gvh6ldgyjqgx7dn8x`) create a Google Calendar event, or
  only send notifications? Determines whether we delete it or keep it as notification-only.
  (As of the double-booking fix, the website no longer calls it. Confirmed 2026-07-16:
  `VITE_MAKE_WEBHOOK_URL` is unset in production — see Q3 — so the site literally cannot reach
  Make; the fallback can only throw 503. Safe to retire the scenario once you've confirmed nothing
  else feeds it.)

- [x] **Vercel env vars** — CONFIRMED (2026-07-16): the Google integration is set up and working
  in production (`GOOGLE_SERVICE_ACCOUNT_KEY` / `GOOGLE_CALENDAR_ID` set, calendar shared with the
  service account). Availability and booking read/write the live calendar.

- [x] **Client's outside-booking workflow** — CONFIRMED (2026-06): the client enters phone
  appointments manually into **his own** calendar. Symptom reported: those appointments show
  only in his calendar, NOT on the website → the website was reading a different calendar.
  → Root cause = calendar mismatch (see below).

- [x] **ACTION: calendar ID mismatch** — RESOLVED (2026-07-16): `GOOGLE_CALENDAR_ID` points at the
  correct calendar — the one Matthias actually enters phone/walk-in appointments and time-off into —
  and it is already working. The website sees his real commitments, so "empty = free" is trustworthy
  (this is what the availability-first rail and the 8-week horizon rest on). No further action.
  (`api/_lib/calendar.js` reads busy from every calendar in the comma-separated list and writes new
  bookings to the first.)

## Availability-first date picker (rail) — confirm before deploy

The Step-3 calendar was rebuilt from a time-axis week grid into an availability-first rail
(`src/components/booking/WeekCalendar.jsx`) that lists only bookable days. These need
Matthias' sign-off before it goes live:

- [x] **Q1 — Calendar maintained how far ahead?** — CONFIRMED (2026-07-16): Matthias blocks his
  time-off (vacation, days he won't work) reliably weeks in advance, so far-out empty days are
  genuinely free, not merely unplanned. The 56-day (8-week) horizon stays as-is (`HORIZON_DAYS` in
  `src/lib/scheduling.js`, mirrored by the clamp in `api/availability.js`; one line to change if
  that ever stops holding). The risk was never un-entered customer bookings (those accumulate and
  an empty far week really is free) — only un-blocked time-off, which he enters early.
  ⚠️ **This trust holds only if `GOOGLE_CALENDAR_ID` points at the calendar he actually blocks
  time-off on** — still gated on the calendar-ID ACTION above. Resolve that before deploy.
- [x] **Q2 — Multi-day tolerance (90 min)** — CONFIRMED (2026-07-16): keep 90. A multi-day
  drop-off day accepts up to `MULTIDAY_TOLERANCE_MIN` (90) of existing bookings instead of
  demanding a totally empty day (`scheduling.js` + `api/_lib/calendar.js`, kept in sync by a drift
  test). The single spanning booking event visually overlapping those short appointments in the
  calendar is accepted — it reflects reality (car in the studio + a quick appointment). One line
  to retune if the workflow changes.
- [x] **Q3 — `VITE_MAKE_WEBHOOK_URL` set in production?** — CONFIRMED UNSET (2026-07-16, verified
  in the deployed bundle at www.eliteaufbereitung.at: no `make.com` host present, and a `VITE_` var
  is folded in at build time, so its absence is conclusive). `submitViaMake` (`src/lib/api.js`)
  therefore already throws 503 during a Google outage today, so the rail's "refuse and show the
  phone" is a strict improvement (an upfront honest CTA instead of an end-of-funnel 503) at zero
  revenue cost — no Wunschtermin form needed. Spillover: the Make fallback is now dead weight (can
  only 503) — see the Make.com role item at the top.
- [ ] **Q6 — Gap notes** ("kein freier Termin · 21.–24. Juli") between free days: keep for
  orientation, or drop to honour "only show what's available" literally? One flip:
  `SHOW_GAP_NOTES` in `WeekCalendar.jsx`.
- [ ] **Q9 — Per-day "Zeitachse anzeigen" toggle** was scoped but not built: at the flagship
  durations (300–360 min) a day has one slot, so an axis would render a single block and the chip
  already shows the duration. Recommend dropping unless Matthias wants it after seeing the rail.

## FAQ-Bot Inhalte (zu bestätigen mit Matthias)

The FAQ bot (`src/data/faqKnowledge.js`) has entries for these topics, but with safe
deflection answers ("ruf uns kurz an…") because the facts are unconfirmed. Each entry is
flagged `confirm: true`. Once Matthias answers, replace the deflection with the real answer
and remove the flag.

- [ ] **Öffnungszeiten je Standort** — booking slots in code are Mo–Fr 08:00–18:00,
  Sa 08:00–13:00 (`src/lib/scheduling.js` HOURS). (2026-08-25: the contradicting
  "Mo–Sa, auch nach Feierabend" claim was removed from `MobileService.jsx` and
  `MobilerService.jsx`; both now state the bookable window and offer a phone call for anything
  outside it. The question of the *official* hours is still open, but nothing on the site now
  contradicts the booking engine.) (entry `buchung-zeiten`)
- [ ] **Zahlungsmethoden** — bar / Karte / Überweisung / Anzahlung? (entry `info-zahlung`)
- [ ] **Keramik-Garantie** — is the 40.000–60.000 km durability a written guarantee?
  (entry `info-garantie`). (2026-08-25: every marketing use of the word "Garantie" was replaced
  with "hält je nach Paket …", sourced from `KERAMIK_DURABILITY_KM` in `src/data/business.js`.
  In Austria a Garantie is a binding undertaking under § 9b KSchG and needs a Garantieerklärung,
  so the site should not claim one until this is answered. If a written guarantee DOES exist,
  send the document and the word can come back.)
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

## Humanisierungs-Durchgang (2026-08-25) — beantwortet

- [x] **Öffnungszeiten — BEANTWORTET.** Google Business Profile: **Mo–Fr 08:00–18:00, Sa + So
  geschlossen.** Saturday was previously bookable 08:00–13:00, so the site was selling slots on a
  day the studio is shut. Closed in `src/lib/scheduling.js` (`HOURS[6] = null`), mirrored in
  `api/_lib/calendar.js`, removed from the `openingHoursSpecification` in `index.html`, and taken
  out of every copy surface. Two tests in `scheduling.test.js` were rewritten to encode the new
  truth. ⚠ This reduces bookable capacity by one day — intended, but worth knowing.
- [x] **Google-Profile — BEANTWORTET.** Three profiles exist: two studios plus one for the mobile
  service. Recorded as `GOOGLE_PROFILES` in `src/data/business.js` as clean `kgmid` URLs (the
  share.google links carried browser-identifying session parameters) and added to the JSON-LD
  `sameAs`. The reviews section links to the first. See the remaining question below.
- [x] **Hausnummer Feldkirch — BESTÄTIGT.** Ketschelenstraße 1, 6800 Feldkirch.
- [x] **Fahrzeug-Identifikationen — BESTÄTIGT.** Mercedes-AMG G-Klasse, Ferrari Mondial t,
  Ferrari 488 GTB, BMW M5.
- [x] **Bystander-Foto — ENTSCHIEDEN.** `IMG_2374.jpg` stays as is.
- [x] **Keramik-Garantie — Wortlaut bleibt.** The site says "hält je nach Paket 40.000 – 60.000 km"
  and never "Garantie". ⚠ If Matthias *does* issue a written Garantieerklärung, send it and the
  word can come back — until then this wording is the safe one under § 9b KSchG.

## Weiterhin offen

- [ ] **Welches der beiden Studio-Profile ist das Haupt-Profil?** The reviews in
  `src/data/reviews.js` were hand-copied from one of them, and the "Alle Bewertungen auf Google
  ansehen" link should point at the same profile the visitor just read. Currently
  `GOOGLE_PROFILES[0]`. One-line change in `src/data/business.js`.
- [ ] **Zitat von Matthias.** `src/data/founder.js` currently holds a clearly-marked PLACEHOLDER,
  and `src/data/founder.test.js` fails on purpose until it is replaced. `npm run build` does not
  run tests, so this does not block a deploy — it just makes it impossible to forget.
- [ ] **Behandlungsdaten für Fallstudien** — Arbeitsschritte, Dauer, verwendete Produkte for any
  project worth showing properly. The data shapes already carry the empty fields.
