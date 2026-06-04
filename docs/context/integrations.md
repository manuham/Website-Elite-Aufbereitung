# External integrations

Third-party services the booking flow depends on. Update when credentials/roles change.

## Google Calendar (source of truth for availability + bookings)
- Used by `api/_lib/calendar.js` via a Google service account (`googleapis`).
- Env vars (Vercel): `GOOGLE_SERVICE_ACCOUNT_KEY` (base64 JSON), `GOOGLE_CALENDAR_ID`.
- `GOOGLE_CALENDAR_ID` may be a **single ID or a comma-separated list**. ALL listed
  calendars are checked for busy times; the **first** is the write target for new bookings.
- Every calendar in the list must be shared with the service-account email. The write-target
  (first) calendar needs "make changes to events"; the others need at least "see free/busy".
- Reads: free/busy across all listed calendars → available slots. Writes: new booking events
  (90 min) to the primary calendar.
- Client setup walkthrough: `SETUP-ANLEITUNG.md`.

### ⚠️ Known real-world failure mode (the double-booking cause)
The client enters phone/walk-in appointments into **his own** calendar. If
`GOOGLE_CALENDAR_ID` points to a *different* calendar than the one he actually uses, the
website never sees those appointments and offers the slot again → double-booking. Fix: make
sure the calendar he uses is in `GOOGLE_CALENDAR_ID` (either as the single connected calendar,
or added to the comma-separated list) and shared with the service account.

## Make.com webhook (status: being phased out of the write path)
- URL previously hard-coded in `src/lib/api.js`: `https://hook.eu1.make.com/ugto7s564hkhy94gvh6ldgyjqgx7dn8x`.
- As of the double-booking fix, `submitBooking()` no longer calls it — bookings go through
  `/api/book.js` instead.
- ❓ OPEN: what does the Make.com scenario actually do (create a calendar event? notify?).
  Must be confirmed before deleting the scenario, to avoid losing notifications OR creating
  duplicate calendar events. See `open-questions.md`.

## Cloudinary (vehicle photos)
- `uploadPhoto()` (in `BookingPage.jsx`) uploads customer vehicle photos; URLs are attached
  to the calendar event and the notification email.

## FormSubmit.co (email notification backup)
- `BookingPage.jsx` handleSubmit sends a fire-and-forget email to
  `info.eliteaufbereitung@gmail.com` with the full booking summary. Does not touch the
  calendar — purely a notification.
