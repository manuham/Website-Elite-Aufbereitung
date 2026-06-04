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
