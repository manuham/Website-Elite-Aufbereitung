# Booking architecture

How the "Jetzt buchen" flow works end-to-end. Keep this current when the flow changes.

## Tech stack
React 18 + Vite, JavaScript (no TS), Tailwind, React Router, GSAP. Serverless API routes
under `/api` (Vercel). Main flow component: `src/pages/BookingPage.jsx` (5 steps).

## Flow
Step0 Location (Studio/Mobil) → Step1 Services → StepVehicle (class/Größenfaktor) →
Step2 Date & time → Step3 Contact + photos → Step4 Confirmation.

## Money: `src/lib/pricing.js` is the single source of truth
Prices in `src/data/services.js` are plain **numbers** (`price: 350`). Nothing formats a euro
string or applies the size factor on its own — it all goes through `src/lib/pricing.js`, which owns
`VEHICLE_SIZES`, `MOBILE_SURCHARGE`, `SIZED_IDS`, `applyFactor`, `linePrice`, `computeTotals` and
the `format*` helpers. Two traps that module exists to keep solved, both pinned by
`src/lib/pricing.test.js`:

- **Float error.** `350 * 1.15` is `402.49999999999994`, which rounds *down* to 400 € where the
  client's own table says 405 €. `applyFactor` snaps the product to cents before rounding to 5 €.
- **Locale.** Current ICU groups `de-AT` thousands with a narrow no-break space ("1 250"), so
  prices used to render as "ab €1 890,-". Money is formatted with `de-DE` to get "1.250". Dates
  stay on `de-AT`.

`pricing.test.js` reproduces all 24 cells of the client's worked example ("So sieht das gerechnet
aus" in `preisliste-eliteaufbereitung.md`). Treat a failure there as a real regression.

## Vehicle size factor (StepVehicle) — conditional
Since the August 2026 price list, size is a **multiplier applied per line item**, not a flat amount
charged once per booking. `VEHICLE_SIZES` (`src/lib/pricing.js`) carries `factor` per class:
Kleinwagen 1,0 · Kompakt 1,15 · Mittelklasse 1,3 · SUV/Van 1,5 · Großfahrzeuge `null`
("auf Anfrage"). `Endpreis = Grundpreis × Faktor`, rounded half-up to 5 € **per service**.

It applies only to services flagged `sizeSurcharge: true` in `src/data/services.js`. That is now
almost everything; exactly four are exempt, because there the effort does not depend on car size:
*Scheinwerfer-Aufbereitung* (`politur-3`), *Textilimprägnierung* (`zusatz-5`),
*Türverkleidung & Armaturen* (`zusatz-6`), *Dachhimmel* (`zusatz-7`). The Anfahrtspauschale and the
per-package Mobil-Aufpreis are never multiplied either.

`SIZED_IDS` is **derived from that flag** (single source of truth), so flipping it in the data
updates every surface at once — and `pricing.test.js` asserts both that exactly those four are
exempt and that the four IDs still name the services we think they do (IDs are array indices, so a
reorder would otherwise move the exemption silently). `computeTotals` is the one implementation,
called from Step 1, `StepVehicle`, `Step4` and `handleSubmit`. Keep the marketing copy
(`Pricing.jsx` disclaimer) and the FAQ (`faqKnowledge.js` → `faq-aufpreis-groesse`) in sync.

Step 1 shows **base** prices (no vehicle chosen yet) with a hint that the factor follows; from
StepVehicle on, every line and the total are the sized figures — including what is written to the
calendar event and the notification mail, so the studio sees what the customer confirmed.

## Services: bookable vs. appointment-only
Services live in `src/data/services.js`. Some carry `phoneOnly: true` (Gold & Élite tiers,
*Schwere Politur*, the Keramik coatings). The `verkauf` category ("Verkauf & Leasing") holds the
combined **Verkaufsaufbereitung / Leasingrückläufer** card (id `verkauf-0`). The `zusatz` add-ons
each carry a `group` (`innenraum`/`aussen`/`polieren`/`beschichten`) used by `Pricing.jsx` to render
collapsible folders; the booking Step-1 still lists them flat.

- **All** services are shown in Step1 (`BookingPage.jsx`). They are no longer filtered out.
- Bookable services → added to the selection cart as normal.
- `phoneOnly` services → clicking opens `src/components/PhoneConsultModal.jsx`
  ("Termin telefonisch vereinbaren", phone + email). They are **not** added to the cart and
  cannot be booked online (price needs individual calculation).
- `phoneOnly` items are also excluded from the smart upsell recommendations and the
  package-savings suggestion (`src/hooks/useRecommendations.js`), so they can't sneak into
  the cart via an "add" button.

## Availability-first date picker (Step 3 "Termin")
- Different services take different time. Each package in `src/data/services.js` carries
  `durationMin` (same-day) **or** `durationDays` (multi-day), plus `mobilExtraMin` /
  `mobilSurcharge`. `computeBookingDuration(selectedItems, serviceMode)` in
  `src/lib/scheduling.js` combines the Step-1 cart into one effective duration: it sums ALL
  same-day minutes (+ mobil travel time when mobil), and the booking becomes multi-day when any
  item is multi-day **OR** the combined same-day work exceeds one working day (`WORKDAY_MIN=600`).
  The span folds in both (`ceil(multiDays + sameDayMin/WORKDAY_MIN)`), so a long combo never leaves
  the user on an all-blocked calendar and a multi-day + same-day mix never under-blocks the studio.
- **Multi-day spans run Mo–Fr only** (`isMultiDayDay` / `workingSpan`): Saturday's short hours
  (08–13) can't host a 09:00 drop-off → 16:00 pickup. The backend `workingSpanStr` mirrors this.
- **Mobil vs studio wording** is one source of truth: `multiDayTerms(serviceMode)` in
  `scheduling.js` supplies every multi-day label (studio = Abgabe/Abholung "im Studio"; mobil =
  Beginn/Fertigstellung "vor Ort"; `chooseDay`/`chooseDayPlural` for "Abgabetag"/"Starttag"). Used
  by `WeekCalendar`, Step 3, Step 4 confirmation, the email, and the calendar event — change
  wording there, not per surface.
- **Mobile surcharge** = flat `MOBILE_SURCHARGE` (€65 Anfahrtspauschale, `src/lib/pricing.js`)
  **plus** a per-package Mobil-Aufpreis (`mobilePackageSurchargeOf` = MAX of the cart's
  `mobilSurcharge`, €45–85, shown as its own line on every surface; a test pins the data to that
  advertised range because the FAQ quotes it verbatim). Neither is multiplied by the size factor.
  Both are included in every total (Step 1 / StepVehicle / Step 4 / email / calendar). A
  duration-shape change resets the date pick (parent-level guard in `BookingPage`), so a stale
  same-day pick can't leak into a multi-day booking.
- `src/components/booking/WeekCalendar.jsx` is an Apple-Calendar-style **week time-axis grid** (day
  columns, hour rows 08–18). It was briefly replaced by an availability-first list (`WeekCalendar`)
  but the client preferred the calendar layout, so the grid is back — with **inverted visual
  emphasis** so the original "everything is gray" complaint stays solved: free slots are the only lit
  objects (bright accent gradient + border + soft glow, ≥44px), while all unavailable time (past /
  busy / after-hours / closed) is one flat, wordless recess. The `Belegt` / `Geschlossen` / "An
  diesem Tag nicht möglich" labels are gone — the client said the *reason* a time is unavailable
  doesn't matter.
  - **same-day:** duration-sized blocks packed around busy intervals with a 30-min buffer
    (`sameDayPlan`). Each desktop day header shows a green **"N frei"** badge (or dims, wordless, at
    zero). A **"Nächster freier Termin"** button jumps to the week of the next opening
    (`availableDays` → first `kind:'day'`). The column body **auto-scrolls** to the earliest free
    slot so a late (16:00-only) opening isn't hidden below the fold. Hover/focus live in CSS
    (`.slot-free` in `index.css`) so keyboard focus gets a visible ring.
  - **multi-day:** an all-day band; pick a drop-off day, the span highlights Abgabe (09:00) →
    Abholung (16:00) across working days.
  - **Inherent limitation:** at the flagship 300–360 min durations an empty day yields exactly ONE
    bookable start, so the grid is tall and sparse for long services — the inversion makes that one
    slot unmissable, but can't change the arithmetic.
- All scheduling rules live in `src/lib/scheduling.js` (working hours Mo–Fr 08–18 / Sa 08–13 /
  So closed, `BUFFER=30`, packing, working-day span). Pure + unit-tested (`scheduling.test.js`).

## Availability (read path) — no double-booking
- `src/hooks/useAvailability.js` calls `GET /api/availability?start=YYYY-MM-DD&days=56` **once**
  (anchored on today, not the visible week), polls every 30 s while Step 3 is open, and replaces
  the map wholesale each poll. The grid pages **client-side** within that one loaded horizon — the
  next/prev arrows and the "Nächster freier Termin" jump slice already-fetched data, so there is no
  fetch-per-arrow. The server clamp in `api/availability.js` mirrors `HORIZON_DAYS=56` (pinned by a
  test). One `freebusy.query` covers any range, so a wide horizon costs no more Google quota.
- **Coverage is first-class.** `makeAvailability()` wraps the busy map so a day that was *never
  fetched* is `UNKNOWN`, not "free" — key presence is the signal (the API writes a key per returned
  day). Nothing infers availability from absence, which is what previously let a multi-day span
  reaching past the loaded range be offered and then 409'd at the end of the funnel.
- `api/availability.js` → `getBusyForRange()` in `api/_lib/calendar.js` queries Google Calendar
  free/busy across all connected calendars and returns, per day,
  `{ closed, open, close, busy: [[startMin,endMin],…] }` (minutes from midnight, Europe/Vienna).
- Two failure modes, kept distinct: `isFallback` (Google unreachable → the server returns a
  fabricated skeleton; `makeAvailability` marks every such day UNKNOWN, and the rail shows a phone
  CTA instead of a wall of invented slots) vs `isStale` (a poll threw but the held data is still
  real → keep the rail, show a soft amber note). The ghost-guard clears a pick only when a poll
  shows the day is *known* FULL — never on UNKNOWN, so an outage can't wipe every in-flight pick.

## Booking (write path) — single writer with race guard
- `src/lib/api.js` `submitBooking()` POSTs to `POST /api/book` (NOT the old Make.com webhook).
- `api/book.js` **re-checks availability, then creates the event** (double-booking guard). If
  the slot was taken in the meantime it returns `409 slot_taken`; the frontend bounces the
  user back to the time-picker (`BookingPage.jsx` handleSubmit).
- The re-check is interval-based: same-day rejects if `[start, start+durationMin]` overlaps a
  busy interval (incl. 30-min buffer); multi-day rejects if any working day in the span has
  bookings (`sameDayIntervalFree` / `multiDaySpanFree` in `calendar.js`).
- `createBookingEvent()` in `api/_lib/calendar.js` writes a Google Calendar event with full
  details: service mode, location/address, vehicle + `vehicleSizeFactor` ("×1,15 (Kompaktklasse)"),
  services at their **sized** prices, total, notes, photo URLs. Same-day events span
  `[start, start+durationMin]`; multi-day creates ONE spanning event from day-1 09:00 to
  last-working-day 16:00. (`api/book.js` still accepts the pre-factor field name
  `vehicleAufpreis` as a fallback, for clients cached across the deploy.)
- A FormSubmit.co email (`info.eliteaufbereitung@gmail.com`) is sent fire-and-forget as a
  notification backup. It does **not** touch the calendar.
- Photos upload to Cloudinary first (`uploadPhoto`).

### Known limitation
`/api/book.js` does check-then-insert; a millisecond-wide race remains (Google Calendar has
no atomic lock). Acceptable for a single-operator studio. True atomicity would need a DB with
a unique `(date, time)` constraint.

## Required environment (Vercel)
- `GOOGLE_SERVICE_ACCOUNT_KEY` — base64-encoded service-account JSON.
- `GOOGLE_CALENDAR_ID` — the calendar the booking writes to / reads from.
- The calendar must be shared with the service-account email ("make changes to events").
- Setup walkthrough for the client: `SETUP-ANLEITUNG.md` (repo root).

⚠️ All manual/phone/walk-in appointments must be entered into the **same** Google Calendar,
otherwise the website won't see them. The Apple Calendar in SETUP-ANLEITUNG.md is a
read-only subscription and does NOT write back to Google.
