# Security Review — Elite Aufbereitung Website

**Date:** 2026-07-06
**Reviewer:** Claude (automated security check)
**Scope:** Full repository — React/Vite frontend (`src/`), Vercel serverless API (`api/`), config, dependencies, and third-party integrations (Google Calendar, Google Sheets, Google Places, Cloudinary, Make.com, FormSubmit).

> **Purpose of this file:** findings only. Do **not** treat any single item as pre-approved to "just fix" without judgement — several fixes touch live integrations (Make.com fallback, Cloudinary preset) and need the change made carefully so bookings keep working. Each finding lists the location, the concrete risk, and a recommended fix.

---

## ✅ Remediation status — 2026-07-06

All findings were addressed in a hardening pass. Build (`npm run build`) and tests (`npm test`, 46 passing) are green.

| # | Status | What was done |
|---|--------|---------------|
| 1 | ✅ Fixed | Per-IP rate limiting on all endpoints + hidden honeypot field on booking (`api/_lib/security.js`, `api/book.js`, `BookingPage.jsx`). **Best-effort in-memory** — see note below. |
| 2 | ✅ Fixed | `npm audit fix` — react-router-dom bumped to a patched 7.x (non-breaking). |
| 3 | ✅ Fixed | Removed `*` CORS from `vercel.json`; each function now reflects only allow-listed origins (`ALLOWED_ORIGINS`). |
| 4 | ✅ Fixed | `/api/book` validates + length-caps + strips control chars on every field server-side. |
| 5 | ⚠️ Partial (code) | Client + server file-type/size/count checks + photo-URL allowlist added. **Manual step remains:** lock the unsigned Cloudinary preset in the console (formats, size, folder, moderation). |
| 6 | ⚠️ Partial (needs owner decision) | Make URL moved out of source to `VITE_MAKE_WEBHOOK_URL` (empty = disabled). **Manual:** rotate the leaked URL (it's in git history) and retire/secure the scenario. |
| 7 | ✅ Fixed | CSP + `X-Content-Type-Options` + `X-Frame-Options: DENY` + `Referrer-Policy` + `Permissions-Policy` + HSTS in `vercel.json`. CSP verified against the built `index.html`. |
| 8 | ✅ Fixed | FormSubmit call moved server-side into `api/book.js`; fires only after a validated, rate-limited booking. Client-side email primitive removed. |
| 9 | ✅ Fixed | `sanitizePhotoUrls()` drops any URL not `https` on our Cloudinary host, before it reaches the calendar/email. |
| 10 | ✅ Fixed | Rate limit (120/min) added to `/api/availability`. |
| 11 | ⚠️ Partial | Non-breaking deps fixed. **Left:** `vite`/`esbuild` (dev-server-only, not in the prod build) — needs a breaking Vite 8 major bump; deferred to avoid build risk. |
| 12–14 | ℹ️ Info | No action needed (12/13 are positives; 14 is a compliance note). |

**Remaining manual / follow-up items for the owner:**
1. **Cloudinary console** (#5): restrict the `vdrpbzfw` unsigned preset (allowed formats = images, max size/dimensions, fixed folder, enable moderation), or move to signed uploads.
2. **Make.com** (#6): rotate the exposed webhook URL and decide whether to keep the fallback (set `VITE_MAKE_WEBHOOK_URL` to the new URL) or retire the scenario. Confirm what it does first (see `docs/context/open-questions.md`).
3. **Env vars to set in Vercel** (see `.env.example`): `ALLOWED_ORIGINS` (if the domain differs from the default), optionally `NOTIFY_EMAIL`, `CLOUDINARY_CLOUD_NAME`, `VITE_MAKE_WEBHOOK_URL`.
4. **Rate limiting** (#1/#10): the in-memory limiter is per warm serverless instance, so the global cap is `max × instances`. For a hard guarantee, back `rateLimit()` in `api/_lib/security.js` with Vercel KV / Upstash Redis.
5. **Vite 8 upgrade** (#11): schedule the breaking bump and re-run `npm audit`.
6. **CSP**: currently enforced. If anything breaks in production, temporarily switch the header key to `Content-Security-Policy-Report-Only` while diagnosing.

## How to read severity
- **Critical** — exploitable now, serious impact. (none found)
- **High** — exploitable now, meaningful impact; fix promptly.
- **Medium** — real weakness, needs a plausible pre-condition or has bounded impact.
- **Low** — hardening / defense-in-depth / limited impact.
- **Info** — good-to-know, no direct exploit.

## Summary table

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| 1 | High | No rate-limiting / abuse control on state-changing API endpoints (calendar spam / booking DoS) | `api/book.js`, `api/faq-log.js` |
| 2 | High | Vulnerable dependency: `react-router-dom` 7.13.1 (XSS, open redirect, DoS advisories) | `package.json` |
| 3 | Medium | Wide-open CORS (`Access-Control-Allow-Origin: *`) on all `/api/*`, including POSTs | `vercel.json` |
| 4 | Medium | Server trusts client-supplied booking data — no server-side validation/sanitisation/length limits | `api/book.js`, `api/_lib/calendar.js` |
| 5 | Medium | Cloudinary **unsigned** upload preset exposed in client bundle → arbitrary uploads to the account | `src/pages/BookingPage.jsx` |
| 6 | Medium | Make.com webhook URL hard-coded in the shipped bundle → unauthenticated abuse of the scenario | `src/lib/api.js` |
| 7 | Medium | No security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS) | `vercel.json` / `index.html` |
| 8 | Low | FormSubmit call ships with `_captcha: false` → email-flood vector | `src/pages/BookingPage.jsx` |
| 9 | Low | `photoUrls` are arbitrary client-supplied URLs echoed into calendar event + notification email | `api/book.js`, `api/_lib/calendar.js` |
| 10 | Low | `availability` endpoint: no rate limit; leaks owner's real busy/free schedule; can burn Google quota | `api/availability.js` |
| 11 | Low | Other outdated dev/build deps (`vite`/`esbuild`, `picomatch` ReDoS, `qs`, `yaml`, `@babel/core`) | `package.json` |
| 12 | Info | No secrets committed to the repo or git history (good) | — |
| 13 | Info | No `dangerouslySetInnerHTML` / `eval`; React auto-escaping in effect (good) | `src/**` |
| 14 | Info | PII flow spreads across Cloudinary / Calendar / FormSubmit / Make / Sheets — DSGVO surface | multiple |

---

## 1. High — No rate-limiting or abuse control on state-changing endpoints

**Where:** `api/book.js`, `api/faq-log.js` (and to a lesser degree `api/availability.js`, `api/reviews.js`).

**Problem:** None of the serverless endpoints have any rate limiting, CAPTCHA, bot check, or authentication. Combined with the wide-open CORS (finding #3), any client anywhere can call them repeatedly.

- `POST /api/book` creates a **real event on the business owner's Google Calendar** on every successful call. There is no throttle. An attacker (or a broken script / bot) can:
  - Flood the calendar with hundreds of fake bookings.
  - Because the booking flow's double-booking guard blocks a slot once it's booked, an attacker can **fill all availability with junk**, denying real customers the ability to book (a booking-system DoS that directly hurts revenue).
  - Trigger the downstream notification email (FormSubmit) and Make.com scenario repeatedly.
- `POST /api/faq-log` appends a row to a Google Sheet on every call (question up to 300 chars). Unlimited calls → **unbounded sheet growth / Google API quota exhaustion / cost**, and pollutes the review workflow.

**Impact:** Denial of service against the core business function (bookings), calendar/inbox spam, third-party quota/cost exhaustion.

**Recommended fix:**
- Add server-side rate limiting keyed on IP (e.g. Vercel KV / Upstash Redis token bucket, or `@vercel/firewall` / Edge middleware). Suggested: a few bookings per IP per hour, and a modest per-IP cap on `faq-log`.
- Add a bot/spam check to the booking submit (hCaptcha / Cloudflare Turnstile / an invisible honeypot field verified server-side). A honeypot is the lowest-friction option for this site.
- Consider requiring a lightweight proof-of-work or a signed nonce issued by the availability call before `book` will accept a submission.

---

## 2. High — Vulnerable `react-router-dom` version

**Where:** `package.json` → `"react-router-dom": "^7.13.1"` (resolved 7.13.1). `npm audit` flags `react-router` 7.0.0–7.15.0.

**Advisories affecting this range include:**
- Stored/DOM XSS in redirect handling (GHSA-8646-j5j9-6r62, GHSA-f22v-gfqf-p8f3).
- Open redirect via protocol-relative `//` paths (GHSA-2j2x-hqr9-3h42).
- DoS via unbounded path expansion / reflected single-fetch input (GHSA-8x6r-g9mw-2r78, GHSA-rxv8-25v2-qmq8).
- Potential CSRF on document PUT/PATCH/DELETE (GHSA-84g9-w2xq-vcv6).

Not all apply to a pure SPA build, but XSS/open-redirect are relevant and there is no reason to stay on a vulnerable minor.

**Recommended fix:** `npm audit fix` (this one is a **non-breaking** in-range bump). Re-run `npm audit` and smoke-test routing afterwards.

---

## 3. Medium — Wide-open CORS on all API routes

**Where:** `vercel.json`
```json
{ "key": "Access-Control-Allow-Origin", "value": "*" },
{ "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" }
```

**Problem:** `*` is applied to `/api/(.*)`, i.e. also to the state-changing `POST /api/book` and `POST /api/faq-log`. Any third-party website can invoke these endpoints from a visitor's browser. There are no session cookies, so classic CSRF impact is limited, but this removes the origin as any barrier to the abuse in finding #1 and lets other sites embed/drive the booking API.

**Recommended fix:** Restrict the allowed origin to the site's own domain(s) (e.g. `https://eliteaufbereitung.at`). If a reviews/availability widget must be embeddable elsewhere, scope the `*` to only the safe GET endpoints and lock down `book`/`faq-log` to the first-party origin. Reflect a single allowed origin rather than `*` for the POST routes.

---

## 4. Medium — Server trusts client-supplied booking data (no server-side validation)

**Where:** `api/book.js` (destructures `req.body` and forwards it), `api/_lib/calendar.js` → `createBookingEvent()`.

**Problem:** `book.js` only checks *presence* of a few fields:
```js
const baseValid = date && services?.length && contact?.name && contact?.phone && contact?.email && vehicleCategory;
```
All **format** validation (email regex, phone regex, name length, address length, photo count) lives client-side in `BookingPage.jsx` (`EMAIL_REGEX`, `PHONE_REGEX`) and is trivially bypassed by calling the endpoint directly. The server then writes `contact.name/phone/email/notes`, `location`, `services[].name/price`, `totalStr`, `vehicleCategory`, etc. **verbatim** into the calendar event summary and description. Consequences:
- No length caps → an attacker can send megabyte-sized fields, bloating events and consuming Google quota.
- `contact.notes` and other free-text fields are joined into the description with `\n`; an attacker can inject newlines to forge official-looking lines (e.g. a fake "Bezahlt: JA" / phishing instructions) that the business owner reads as trusted event content.
- `date`/`time` are not format-validated in `book.js` (unlike `availability.js`, which uses `DATE_RE`). `time.split(':')` on malformed input can produce `NaN` minutes.

**Impact:** Content/notification injection into the owner's calendar, resource/quota abuse, malformed events.

**Recommended fix:**
- Validate every field server-side: `date` against `^\d{4}-\d{2}-\d{2}$`, `time` against `^\d{2}:\d{2}$`, email/phone format, and enforce max lengths on all strings (name, notes, location, service names, `totalStr`).
- Validate `services` is an array of objects with expected shape and a bounded length.
- Sanitise/strip control characters and cap `notes` length before writing to the event.
- Reject rather than coerce malformed `date`/`time`.

---

## 5. Medium — Cloudinary unsigned upload preset exposed in client bundle

**Where:** `src/pages/BookingPage.jsx`
```js
formData.append('upload_preset', 'vdrpbzfw');
const res = await fetch('https://api.cloudinary.com/v1_1/ddtmjszd6/image/upload', { method: 'POST', body: formData });
```

**Problem:** Both the cloud name (`ddtmjszd6`) and an **unsigned** upload preset (`vdrpbzfw`) ship in the public JS bundle. Unsigned presets let *anyone* who reads the bundle upload files directly to the business's Cloudinary account with no auth. The UI limits to 4 images and checks `f.type.startsWith('image/')`, but both checks are client-side and bypassed by calling the Cloudinary endpoint directly.

**Impact:** Storage/bandwidth abuse and cost on the Cloudinary account; hosting of arbitrary attacker content under the business's account/domain (reputational/abuse risk); possible account suspension.

**Recommended fix:**
- In the Cloudinary console, lock down the unsigned preset: restrict allowed formats to images, set a max file size and max dimensions, restrict to a specific folder, and enable incoming transformations/moderation if available.
- Prefer moving uploads behind a **signed** upload (generate the signature in a serverless function so the API secret stays server-side), or proxy uploads through your own `api/` endpoint that enforces size/type/count.
- Set an upload rate/asset quota and monitoring/alerts on the Cloudinary account.

---

## 6. Medium — Make.com webhook URL hard-coded in the shipped bundle

**Where:** `src/lib/api.js`
```js
const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/ugto7s564hkhy94gvh6ldgyjqgx7dn8x';
```

**Problem:** This webhook is a bearer capability — anyone who knows the URL can trigger it. It's shipped in plain text in the client bundle, so it's public. `submitBooking()` still falls back to it when `/api/book` errors. Anyone can POST arbitrary JSON to it unlimited times, triggering whatever the Make scenario does (per `docs/context/integrations.md` this is unconfirmed — possibly creating calendar events and/or notifications).

**Impact:** Unauthenticated abuse of the Make scenario: spam bookings/notifications, Make operations-quota exhaustion (cost), and potentially duplicate calendar events.

**Recommended fix:**
- Confirm what the scenario does (this is already an OPEN question in `docs/context/open-questions.md`). If `/api/book` is now the real write path, **retire the Make fallback** and delete/rotate the webhook.
- If the fallback must stay temporarily, move the webhook call server-side (into an `api/` function) so the URL is not public, and add a shared secret / rate limit. Rotate the current URL since it is already exposed.

---

## 7. Medium — No security response headers

**Where:** `vercel.json` `headers` block (only CORS is set); `index.html` has no CSP meta.

**Missing:**
- **Content-Security-Policy** — no CSP at all. This is the main defense-in-depth against XSS/data exfiltration. The app legitimately loads Google Fonts, Cloudinary, FormSubmit, Make, and its own `/api`, so a CSP needs an allowlist, but its absence is a real gap.
- **X-Frame-Options / `frame-ancestors`** — site can be framed → clickjacking of the booking flow.
- **X-Content-Type-Options: nosniff** — missing.
- **Strict-Transport-Security** — not set here (Vercel may add HSTS at the platform level; confirm).
- **Referrer-Policy** — set in `index.html` meta (good), consider also as a header.

**Recommended fix:** Add a `headers` entry in `vercel.json` for `/(.*)` with `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (or `SAMEORIGIN`), `Referrer-Policy`, `Permissions-Policy`, and a `Content-Security-Policy` allowlisting exactly the origins used (`'self'`, `fonts.googleapis.com`, `fonts.gstatic.com`, `api.cloudinary.com`, `res.cloudinary.com`, `formsubmit.co`, `hook.eu1.make.com`, `maps.googleapis.com` as needed). Start in `Content-Security-Policy-Report-Only` to avoid breakage, then enforce.

---

## 8. Low — FormSubmit call disables CAPTCHA

**Where:** `src/pages/BookingPage.jsx`
```js
body: JSON.stringify({ _subject: ..., _captcha: 'false', ... })
```

**Problem:** The fire-and-forget notification email to `info.eliteaufbereitung@gmail.com` is sent client-side with `_captcha: 'false'`. The endpoint and target address are in the bundle, so this is an unauthenticated email-send primitive that can be scripted to flood the business inbox. (Tied to the same lack of rate-limiting/bot-check as #1.)

**Recommended fix:** Ideally send this notification **server-side** from `api/book.js` (so it only fires on a validated booking and behind the same rate limit), rather than an unauthenticated client call. If it must stay client-side, don't disable CAPTCHA, and gate it behind the booking bot-check.

---

## 9. Low — Arbitrary `photoUrls` echoed into calendar event and email

**Where:** `api/_lib/calendar.js` → `createBookingEvent()` (`photoUrls?.length ? ... photoUrls.join('\n')`), and `src/pages/BookingPage.jsx` FormSubmit body (`Fahrzeugfotos: photoUrls.join('\n')`).

**Problem:** `photoUrls` come from the request body and are inserted unmodified into the event description and the notification email. A direct API caller can supply any URLs (not just Cloudinary), turning the owner's calendar entry / email into a vehicle for phishing or tracking links that the owner is likely to trust and click.

**Recommended fix:** Server-side, validate each `photoUrls` entry is an `https://` URL on the expected Cloudinary host (`res.cloudinary.com/ddtmjszd6/...`) and cap the count (e.g. ≤4). Drop anything else.

---

## 10. Low — `availability` endpoint: no rate limit, schedule disclosure, quota burn

**Where:** `api/availability.js`

**Problem:** `GET /api/availability` is unauthenticated and unthrottled. Each call issues a Google free/busy query across up to a 21-day window. This (a) discloses the owner's real busy/free calendar to anyone (by design for the UI, but it is a data exposure of when the owner is occupied), and (b) with no rate limit can be hammered to exhaust the Google Calendar API quota (denying availability to real users) or run up cost. Input itself is safely validated by `DATE_RE`, so no injection.

**Recommended fix:** Add caching (already has `s-maxage=30`) plus a per-IP rate limit; consider returning only free/busy booleans per slot rather than raw busy intervals if the exact schedule need not be public.

---

## 11. Low — Other outdated build/dev dependencies

**Where:** `package.json` / `npm audit` (8 vulnerabilities: 1 low, 3 moderate, 4 high).

- `vite` ≤6.4.2 and its `esbuild` — dev-server request/path-traversal issues (mostly **dev-time**, not production runtime, but `npm audit fix --force` to Vite 8 is a **major** bump — test carefully).
- `picomatch` ≤2.3.1 — ReDoS + method-injection (high). `npm audit fix` (non-breaking).
- `@babel/core`, `qs`, `yaml` — moderate/high, fixable in-range via `npm audit fix`.

**Recommended fix:** Run `npm audit fix` for the non-breaking set first (covers react-router #2, picomatch, babel, qs, yaml). Evaluate the Vite/esbuild major bump separately with a full build + smoke test. Note the Vite/esbuild issues affect the dev server, not the deployed static site.

---

## 12. Info — No secrets committed (good)

Searched the working tree and full git history (`git rev-list --all`) for `private_key`, `BEGIN PRIVATE KEY`, Google API keys (`AIza...`), `.env`, `.pem`, `.key`, service-account JSON. **None found.** `.gitignore` correctly excludes `.env.local` / `.env*.local`. All real secrets (`GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_CALENDAR_ID`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`, `FAQ_LOG_SHEET_ID`) are read from server-side env vars only. Keep it that way.

## 13. Info — No dangerous DOM sinks (good)

No `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, `eval`, or `new Function` anywhere in the codebase. Google review text and FAQ answers render as JSX text nodes, so React auto-escapes them — the reflected/stored-XSS surface on the client is minimal even though review text originates from the Google Places API. Keep rendering these as text (never switch to `dangerouslySetInnerHTML`).

## 14. Info — PII / DSGVO data-flow note

The booking flow collects name, phone, email, address, free-text notes, and vehicle photos, then distributes them across **Cloudinary** (photos, USA), **Google Calendar** (all details), **FormSubmit** (all details, USA), and **Make.com** (fallback). The FAQ chat log (`api/faq-log.js`) can also capture whatever a visitor types (potential PII) into a Google Sheet, and `localStorage['elite-faq-unanswered']` keeps a local copy. This is a compliance surface more than a vulnerability, but worth confirming the privacy policy (`src/pages/Datenschutz.jsx`) covers every processor and that the FAQ sheet is access-restricted. Not a code bug — flagged for awareness.

---

## Suggested fix order
1. **#2 + #11** — `npm audit fix` (non-breaking) to clear react-router XSS/redirect and other in-range CVEs. Fast, high value.
2. **#1** — add rate-limiting + a bot/honeypot check to `book` and `faq-log` (biggest real-world risk: booking DoS / spam).
3. **#3** — lock CORS on the POST endpoints to the first-party origin.
4. **#4 + #9** — server-side validation & length caps in `api/book.js`; validate `photoUrls`.
5. **#5 + #6** — tighten the Cloudinary preset; retire or server-side-proxy the Make webhook (confirm scenario first).
6. **#7** — add security headers (CSP in report-only first).
7. **#8, #10** — move FormSubmit server-side / add availability rate limit.

## Notes for the fixer
- `api/book.js` is the highest-value target; changes there must preserve the existing double-booking guard (`multiDaySpanFree` / `sameDayIntervalFree`) and the Make.com fallback semantics in `src/lib/api.js` (`submitBooking` deliberately does **not** fall back on HTTP 409 — keep that).
- Before retiring the Make webhook (#6), resolve the OPEN question in `docs/context/open-questions.md` about what the scenario does, to avoid losing notifications or creating duplicate events.
- Keep `docs/context/integrations.md` updated if you move the FormSubmit/Make calls server-side.
