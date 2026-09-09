# Open questions / checklist

Live list of things to confirm. Resolve each line and note the answer + date.

- [x] **Feldkirch street name** — RESOLVED (2026-09-09): **Ketschenstraße 1, 6800 Feldkirch**
  is correct. The booking flow and the FAQ already had it right; only the JSON-LD in
  `index.html` said "Ketschelenstraße 1". That block is copied byte-identical into all nine
  prerendered documents, so the wrong spelling was the one every crawler read and a NAP
  mismatch against the Google Business Profile. Fixed.

- [ ] **Echte Vorher/Nachher-Fotos** — BLOCKED ON MATTHIAS. `/projekte` used to show a
  before/after slider for six vehicles. It was not one: both halves were the same file and
  the "before" was manufactured with a grayscale/contrast filter at render time. Removed
  2026-09-09 along with six invented captions (a red Ferrari 488 was labelled "Tesla Model 3
  — Perlweiß", a Mercedes G-Klasse console "BMW 3er", a Mercedes wheel "VW Golf R", and an
  interior photo of leather seats was labelled "Lackkorrektur").
  To bring the section back honestly, Matthias needs to shoot **one job**: the same vehicle
  from the same position in the same light, once at intake and once at handover. Then add
  both files, run `npm run images:optimize`, and push one entry into `beforeAfterPairs` in
  `src/pages/Projekte.jsx` — the section renders only when that array is non-empty.
  Whoever builds the slider: it needs `role="slider"`, `tabIndex`, `aria-valuenow/min/max`
  and arrow-key handling. The removed version had none, so it was keyboard-inoperable.

- [x] **"500+ Fahrzeuge aufbereitet" / "100% Kundenzufriedenheit"** — RESOLVED (2026-09-09):
  no real number exists. Both claims are **removed** and stay removed; they were unsourced,
  and the counters also prerendered as a literal `0` because the count-up ran in a
  ScrollTrigger that never fires under `renderToString`. The homepage Manifest section now
  carries three refusals instead (Keine Bürsten. / Keine Massenabfertigung. / Keine
  Kompromisse.), which are true and need no source. If a real figure ever surfaces it can
  come back — as rendered text, with the animation as an enhancement.

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
(`src/components/booking/AvailabilityRail.jsx`) that lists only bookable days. These need
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
  → **Saturday confirmed 2026-09-09**: Sa 08:00–13:00 is correct and genuinely open. The
  code, `api/_lib/calendar.js` and the opening-hours JSON-LD all already matched — no change
  was needed. Mo–Fr hours and the "nach Feierabend" claim are still unconfirmed.
- [ ] **Zahlungsmethoden** — bar / Karte / Überweisung / Anzahlung? (entry `info-zahlung`)
- [x] **Keramik-Garantie** — answered 2026-09-09. The 40.000–60.000 km guarantee is
  **FIREBALL's, on the coating** — Elité does not issue it. This matters legally: under
  § 9b KSchG a *Garantie* binds whoever gives it, and an unattributed claim on a detailer's
  own site reads as the detailer's undertaking. All customer-facing copy now says
  "FIREBALL Herstellergarantie" (`src/data/services.js`, `src/pages/MobilerService.jsx`,
  `src/pages/Projekte.jsx`) and the FAQ answer states outright that it comes from the
  manufacturer and not from Elité. (entry `info-garantie`)
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
