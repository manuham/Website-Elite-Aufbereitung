# Booking architecture

How the "Jetzt buchen" flow works end-to-end. Keep this current when the flow changes.

## Tech stack
React 18 + Vite, JavaScript (no TS), Tailwind, React Router, GSAP. Serverless API routes
under `/api` (Vercel). Main flow component: `src/pages/BookingPage.jsx` (5 steps).

## Flow
Step0 Location (Studio/Mobil) → Step1 Services → StepVehicle (category/Aufpreis) →
Step2 Date & time → Step3 Contact + photos → Step4 Confirmation.

## Vehicle size surcharge (StepVehicle) — conditional
`VEHICLE_CATEGORIES` (`BookingPage.jsx`) carries `aufpreis` per size: Kleinwagen 0, Kompakt 55,
Mittelklasse 75, SUV 95, Großfahrzeuge `null` ("auf Anfrage"). The size Aufpreis applies **only**
when the cart contains a service/package flagged `sizeSurcharge: true` in `src/data/services.js` —
currently every full-car service flagged `sizeSurcharge: true`: all All-in-One tiers, all Handwäsche
& Innenreinigung, *Leichte* & *Schwere Politur*, all Keramik coatings, and *Verkaufsaufbereitung*
(`verkauf-0`) — but **not** *Spot-Politur* (`politur-2`), *Scheinwerfer* (`politur-3`), or the
Zusatzpakete add-ons. The size Aufpreis is a flat amount charged **once per booking** (not per line
item). `SIZE_SURCHARGE_IDS` in `BookingPage.jsx` is **derived from that flag** (single source
of truth), so flipping the flag in the data updates every surface at once. For every other selection
no size surcharge is added (the step still asks for the size so the operator knows the vehicle). The
gate is recomputed identically in `StepVehicle`, `handleSubmit`, and the `Step4` confirmation.
Keep the marketing copy (`Pricing.jsx`) and FAQ answers (`faqKnowledge.js`) in sync with the flag.

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

## Duration-aware week calendar (Step 3 "Termin")
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
  Beginn/Fertigstellung "vor Ort"). Used by `WeekCalendar`, Step 3, Step 4 confirmation, the email,
  and the calendar event — change wording there, not per surface.
- **Mobile surcharge** = flat `MOBILE_SURCHARGE` (€50 Anfahrtspauschale) **plus** a per-package
  Mobil-Aufpreis (`mobilePackageSurchargeOf` = MAX of the cart's `mobilSurcharge`, €45–85, shown as
  its own line on every surface). Both are included in every total (Step 1 / StepVehicle / Step 4 /
  email / calendar). A duration-shape change resets the date pick (parent-level guard in
  `BookingPage`), so a stale same-day pick can't leak into a multi-day booking.
- `src/components/booking/WeekCalendar.jsx` is an Apple-Calendar week view (replaces the old
  month-grid + `DayTimePickerModal`, both deleted):
  - **same-day:** time blocks sized to the duration, packed around busy intervals with a
    30-min buffer (`sameDayPlan` in `scheduling.js`); days that can't fit show "An diesem Tag
    nicht möglich".
  - **multi-day:** an all-day band; pick a drop-off day, the span highlights Abgabe (09:00) →
    Abholung (16:00) across working days.
- All scheduling rules live in `src/lib/scheduling.js` (working hours Mo–Fr 08–18 / Sa 08–13 /
  So closed, `BUFFER=30`, packing, working-day span). Pure + unit-testable.

## Availability (read path) — no double-booking
- `src/hooks/useWeekAvailability.js` calls `GET /api/availability?start=YYYY-MM-DD&days=7`,
  polls every 30 s while Step 3 is open.
- `api/availability.js` → `getBusyForRange()` in `api/_lib/calendar.js` queries Google
  Calendar free/busy across all connected calendars and returns, per day,
  `{ closed, open, close, busy: [[startMin,endMin],…] }` (minutes from midnight, Europe/Vienna,
  timezone-correct). The client packs blocks for the selected duration.
- If Google Calendar fails, the endpoint returns a working-hours skeleton with `fallback:true`
  and empty busy; the calendar shows an amber "Live-Verfügbarkeit nicht abrufbar" notice so it
  is never silent. The ghost-guard clears a pick that a poll shows is no longer free.

## Booking (write path) — single writer with race guard
- `src/lib/api.js` `submitBooking()` POSTs to `POST /api/book` (NOT the old Make.com webhook).
- `api/book.js` **re-checks availability, then creates the event** (double-booking guard). If
  the slot was taken in the meantime it returns `409 slot_taken`; the frontend bounces the
  user back to the time-picker (`BookingPage.jsx` handleSubmit).
- The re-check is interval-based: same-day rejects if `[start, start+durationMin]` overlaps a
  busy interval (incl. 30-min buffer); multi-day rejects if any working day in the span has
  bookings (`sameDayIntervalFree` / `multiDaySpanFree` in `calendar.js`).
- `createBookingEvent()` in `api/_lib/calendar.js` writes a Google Calendar event with full
  details: service mode, location/address, vehicle + Aufpreis, services, total, notes, photo
  URLs. Same-day events span `[start, start+durationMin]`; multi-day creates ONE spanning
  event from day-1 09:00 to last-working-day 16:00.
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
