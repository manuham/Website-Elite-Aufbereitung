// Shared security helpers for the serverless API: CORS allowlisting, best-effort
// rate limiting, and input validation/sanitisation. Imported by every function
// under api/.

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Only first-party origins may call the API from a browser. The site and its API
// are served from the same Vercel deployment, so same-origin requests (no Origin
// header) always pass; cross-origin requests are limited to the allowlist.
// Override/extend via the ALLOWED_ORIGINS env var (comma-separated).
const DEFAULT_ALLOWED_ORIGINS = [
  'https://eliteaufbereitung.at',
  'https://www.eliteaufbereitung.at',
];

function allowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ALLOWED_ORIGINS;
}

/**
 * Apply CORS + preflight handling. Returns true if the request was a preflight
 * (OPTIONS) that has already been answered — the caller should return immediately.
 */
export function applyCors(req, res, methods = 'GET, POST, OPTIONS') {
  const origin = req.headers.origin;
  const list = allowedOrigins();

  // Reflect only allow-listed origins. Requests with no Origin (same-origin,
  // server-to-server, curl) are not blocked here — they simply get no ACAO header.
  if (origin && list.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

// ─── Rate limiting (best-effort, in-memory) ───────────────────────────────────
// NOTE: This is a per-instance fixed-window limiter. On a warm serverless instance
// it throttles bursts from a single client; because Vercel may run several
// instances concurrently the *global* limit is (max × instances). It raises the
// cost of abuse but is not a hard guarantee — for that, back it with a shared store
// (Vercel KV / Upstash Redis). Kept dependency-free on purpose.
const buckets = new Map();

export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/**
 * @returns {boolean} true if the request is ALLOWED, false if it should be rejected (429).
 */
export function rateLimit(key, max, windowMs, now = Date.now()) {
  // Opportunistic prune so the Map can't grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
  }
  const entry = buckets.get(key);
  if (!entry || entry.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

/** Convenience: enforce a limit and send 429 if exceeded. Returns true if limited. */
export function enforceRateLimit(req, res, { name, max, windowMs }) {
  const key = `${name}:${getClientIp(req)}`;
  if (!rateLimit(key, max, windowMs)) {
    res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
    res.status(429).json({ error: 'rate_limited', message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' });
    return true;
  }
  return false;
}

// ─── Input validation / sanitisation ──────────────────────────────────────────

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const HM_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
// Deliberately loose but bounded — matches the client-side checks in BookingPage.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-/]{6,}$/;

export function isIsoDate(v) { return typeof v === 'string' && ISO_DATE_RE.test(v); }
export function isHmTime(v) { return typeof v === 'string' && HM_TIME_RE.test(v); }
export function isEmail(v) { return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v); }
export function isPhone(v) { return typeof v === 'string' && v.trim().length <= 40 && PHONE_RE.test(v.trim()); }

/** Strip control characters (incl. CR/LF used for field-injection) and clamp length. */
export function cleanStr(v, max) {
  if (typeof v !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, max);
}

/** Like cleanStr but preserves newlines (for the free-text notes field). */
export function cleanMultiline(v, max) {
  if (typeof v !== 'string') return '';
  // Drop CR and every control char except LF, then clamp.
  // eslint-disable-next-line no-control-regex
  return v.replace(/\r/g, '').replace(/[\x00-\x09\x0b-\x1f\x7f]/g, ' ').trim().slice(0, max);
}

/**
 * Keep only https URLs on the expected Cloudinary host. Anything else (arbitrary
 * links a direct API caller could inject into the calendar/email) is dropped.
 */
export function sanitizePhotoUrls(urls, { cloudName, max = 4 } = {}) {
  if (!Array.isArray(urls)) return [];
  const host = cloudName ? `res.cloudinary.com/${cloudName}/` : 'res.cloudinary.com/';
  return urls
    .filter((u) => typeof u === 'string')
    .map((u) => u.trim())
    .filter((u) => {
      try {
        const parsed = new URL(u);
        return parsed.protocol === 'https:' && `${parsed.host}${parsed.pathname}`.startsWith(host);
      } catch {
        return false;
      }
    })
    .slice(0, max);
}
