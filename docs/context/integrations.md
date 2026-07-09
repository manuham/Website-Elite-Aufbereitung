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
- **No longer hard-coded.** As of the security hardening, the URL is read from the
  `VITE_MAKE_WEBHOOK_URL` env var in `src/lib/api.js`. If unset, the fallback is **disabled**
  (`submitViaMake` throws) rather than shipping a public URL in the bundle.
- The old hard-coded URL (`https://hook.eu1.make.com/ugto7s564hkhy94gvh6ldgyjqgx7dn8x`) is in
  git history and should be treated as **compromised → rotate it**. A client-side webhook can
  never be secret (it ships in the JS), so use a dedicated, rotatable URL and secure the scenario.
- `submitBooking()` only uses this fallback when `/api/book` is unreachable or errors (never on 409).
- ❓ OPEN: what does the Make.com scenario actually do (create a calendar event? notify?).
  Must be confirmed before deleting the scenario, to avoid losing notifications OR creating
  duplicate calendar events. See `open-questions.md`.

## API security (added in the hardening pass)
- Shared helper: `api/_lib/security.js` — CORS allowlisting, best-effort in-memory rate limiting,
  and input validation/sanitisation. Imported by every function under `api/`.
- **CORS** is no longer `*`. `vercel.json` sets only static security headers; each function reflects
  an allow-listed origin via `applyCors()`. Allowlist defaults to the prod domain(s); override with
  the `ALLOWED_ORIGINS` env var (comma-separated — add `http://localhost:5173` for local dev).
- **Rate limits** (per-IP, per warm instance): book 8/h, faq-log 20/h, availability & reviews 120/min.
  This is a soft mitigation; back it with Vercel KV / Upstash for a hard guarantee.
- **Booking validation**: `/api/book` fully validates + length-caps every field server-side, strips
  control chars (CRLF-injection), and drops any `photoUrls` not on our Cloudinary host. A hidden
  `website` honeypot field silently rejects bots.
- **Security headers** (`vercel.json`, all routes): CSP, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS. The CSP allowlist must be updated if a new external
  origin (font host, CDN, analytics) is added.

## Google Sheets (FAQ-bot unanswered-questions log)
- `api/faq-log.js` appends questions the FAQ bot couldn't answer to a Google Sheet
  (columns: Vienna timestamp, question text — no visitor identity, no IP).
- Client side: `logUnansweredQuestion()` in `src/lib/api.js`, called fire-and-forget from
  `FAQBot.jsx` on every no-match (deduped per session). localStorage
  (`elite-faq-unanswered`) keeps a local copy as fallback.
- Ambiguous questions (bot asked back "Meinst du …?" instead of answering) are logged with
  a `[mehrdeutig]` prefix in the question column — filter for it to spot ambiguity hot-spots
  that may need a more specific knowledge-base entry.
- Uses the **same service account** as the calendar integration
  (`GOOGLE_SERVICE_ACCOUNT_KEY`), with the Sheets scope requested per-request.
- Setup required:
  1. **Google Sheets API** enabled in the same Cloud project as the calendar bot
     (Matthias' project — see `SETUP-ANLEITUNG.md`).
  2. A Google Sheet (any account can own it) **shared with the service-account email as
     editor**. Optionally also share it with Matthias so he can answer questions directly
     in a second column.
  3. `FAQ_LOG_SHEET_ID` env var on Vercel = the ID from the sheet URL
     (`docs.google.com/spreadsheets/d/<THIS PART>/edit`).
- Not configured (`FAQ_LOG_SHEET_ID` missing) → endpoint returns 503, the bot is unaffected.
- Privacy note: visitors could type personal data into the question box; the sheet should be
  treated as potentially containing personal data (DSG/DSGVO) — don't share it publicly.

## Cloudinary (vehicle photos)
- `uploadPhoto()` (in `BookingPage.jsx`) uploads customer vehicle photos; URLs are attached
  to the calendar event and the notification email.

## FormSubmit.co (email notification backup)
- **Now sent server-side** from `api/book.js` (`sendNotificationEmail`), fire-and-forget, **only
  after** a validated + rate-limited booking succeeds. Previously it was an unauthenticated
  client-side call (anyone could script it to flood the inbox) — that call has been removed.
- Recipient is `NOTIFY_EMAIL` (defaults to `info.eliteaufbereitung@gmail.com`). Body reuses the
  calendar event's summary/description. Does not touch the calendar — purely a notification.
- Note: on the Make.com fallback path (`/api/book` unreachable) no server email is sent — the Make
  scenario is expected to handle notification there.
