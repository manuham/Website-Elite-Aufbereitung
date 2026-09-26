/* Elité — the booking flow (buchen.html), rebuilt 2026-09-17.
   ---------------------------------------------------------------------------------------------
   Manuel asked to "move through the booking pages as it was, just with the new design". So this
   file owns the LOOK and nothing else: every rule that decides a price, a duration, an opening
   hour, a free slot or an upsell is imported from the live site's own modules, copied verbatim
   into assets/data/ by `node _build/booking-data.mjs`. If a price is wrong here, it is wrong on
   the live site too — there is no second copy to drift.

   Same five steps and the same order as src/pages/BookingPage.jsx:
     0 Standort · 1 Service · 2 Fahrzeug · 3 Termin · 4 Kontakt → 5 Bestätigung

   2026-09-26, for the go-live (Manuel: „elite gave the go"): the page talks to the live site's
   own serverless API, exactly as src/pages/BookingPage.jsx does —
     • GET  /api/availability?start=…&days=HORIZON_DAYS → Google Calendar free/busy, polled every
       30 s while the Termin step is open. A day the answer did not cover is UNKNOWN, never free;
       a `fallback` answer (Google unreachable) is not knowledge either, and the step then offers
       the phone instead of a wall of invented slots (the live hook's two failure modes, kept).
     • photos → Cloudinary (the live unsigned preset), Promise.allSettled: a failed upload never
       costs the booking.
     • POST /api/book → the server re-checks the slot and writes the calendar event + mail.
       409 slot_taken sends the customer back to the calendar with the reason.
   Only on the local prototype server (localhost, where /api does not exist) does the old demo
   behaviour come back — every slot the opening hours allow, nothing sent — and the .bk-dev
   line says so on screen. Anywhere else a missing API is an error, never a silent „Danke".
--------------------------------------------------------------------------------------------- */

import { serviceCategories, tierPackages, allInOnePackages } from './assets/data/services.js';
import {
  MOBILE_SURCHARGE, VEHICLE_SIZES, computeTotals, linePrice,
  formatEuro, formatFrom, formatServicePrice, sizeFactorLabel, sizeFactorForRecord,
} from './assets/data/pricing.js';
import {
  AXIS_START, AXIS_END, DAYS_SHORT, MONTHS, HORIZON_DAYS, DAY,
  startOfDay, addDays, sameDay, isoKey, minToTime, isWorkingDay,
  weekStartMonday, weekDays, durLabel, daysLabel, germanFull,
  computeBookingDuration, sameDayPlan, makeAvailability, multiDayStartState,
  workingSpan, availableDays, multiDayTerms,
} from './assets/data/scheduling.js';
import { serviceRecommendations, exclusionRules, packageDetectionRules } from './assets/data/recommendations.js';
import { FACTS } from './assets/data/facts.js';

const $ = (sel, root = document) => root.querySelector(sel);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STEPS = ['Standort', 'Service', 'Fahrzeug', 'Termin', 'Kontakt'];
const MIN_PX = 0.9;                       // one minute of the day, in pixels of calendar height
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-/]{6,}$/;
const MAX_PHOTOS = 4;

/* ── state ─────────────────────────────────────────────────────────────────── */

const S = {
  step: 0,
  mode: null,                              // 'studio' | 'mobil'
  place: null,                             // which studio
  items: [],                               // the cart, exactly the shape BookingPage.jsx uses
  size: null,                              // a VEHICLE_SIZES entry
  dt: { date: null, time: null, multiDay: false, spanDays: null, endDate: null },
  contact: { name: '', phone: '', email: '', address: '', notes: '', consent: false },
  photos: [],                              // { url, name, file } — object URL for the preview; the file is uploaded on submit
  sending: false,                          // „Anfrage absenden" is in flight
  sendError: null,                         // why the last attempt did not arrive
  calNote: null,                           // why a picked slot was taken away
  photoWarning: null,                      // photos that did not make it (the booking did)
  tab: 'aio',   // 2026-09-22, Manuel: the packages are what a visitor should meet first
  open: {},                                // which tiles show their full feature list
  weekStart: weekStartMonday(new Date()),
  pending: null,                           // a service waiting behind the Preishinweis
  phoneFor: null,                          // a „Nur auf Termin" service whose dialog is open
  touched: false,                          // show form errors only after the first attempt
};

/* ── the calendar (GET /api/availability) ──────────────────────────────────── */

/* Until the first answer lands NOTHING is known — makeAvailability with an untrusted map marks
   every day unknown, and the Termin step shows „wird geladen" instead of slots. */
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
let AVAIL = makeAvailability({}, { trusted: false });
const CAL = { loaded: false, fallback: false, stale: false, failed: false, demo: false, sig: '' };
let calCtrl = null;

async function loadCalendar() {
  if (CAL.demo) return;
  if (calCtrl) calCtrl.abort();
  const ctrl = new AbortController();
  calCtrl = ctrl;
  const start = isoKey(startOfDay(new Date()));
  try {
    const res = await fetch(`/api/availability?start=${start}&days=${HORIZON_DAYS}`, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`availability ${res.status}`);
    const data = await res.json();
    if (calCtrl !== ctrl) return;                // a newer request owns the state
    const map = {};
    for (const d of data.daysBusy || []) map[d.date] = d.closed ? [] : (d.busy || []);
    const sig = JSON.stringify([map, !!data.fallback]);
    const changed = sig !== CAL.sig || CAL.stale || CAL.failed || !CAL.loaded;
    AVAIL = makeAvailability(map, { trusted: !data.fallback });
    Object.assign(CAL, { loaded: true, fallback: !!data.fallback, stale: false, failed: false, sig });
    if (changed) { dropTakenPick(); if (S.step === 3) render(); }
  } catch (e) {
    if (e.name === 'AbortError' || calCtrl !== ctrl) return;
    if (LOCAL && !CAL.loaded) {
      /* The local prototype server has no /api. Only here: every day of the horizon is declared
         KNOWN and empty, so the real opening hours are offered and nothing is sent (.bk-dev). */
      const today0 = startOfDay(new Date());
      AVAIL = makeAvailability(Object.fromEntries(
        Array.from({ length: HORIZON_DAYS }, (_, i) => [isoKey(addDays(today0, i)), []])
      ), { trusted: true });
      Object.assign(CAL, { loaded: true, demo: true });
      if (devEl) devEl.hidden = false;
    } else if (CAL.loaded) CAL.stale = true;      // keep the held data — it is real, only older
    else CAL.failed = true;
    if (S.step === 3) render();
  }
}

/** A poll that shows the picked slot KNOWN and taken clears it — never an unknown day (an outage
    must not wipe a pick). Same rule as the live ghost guard. */
function dropTakenPick() {
  if (!S.dt.date) return;
  const d = duration();
  const n = now();
  if (d.multiDay) {
    const st = multiDayStartState(S.dt.date, d.spanDays, AVAIL, n);
    if (st !== DAY.FREE && st !== DAY.UNKNOWN) takeAway();
    return;
  }
  if (!S.dt.time || !AVAIL.isKnown(S.dt.date)) return;
  const plan = sameDayPlan(S.dt.date, d.durationMin, AVAIL.busy(S.dt.date), n);
  if (!plan.free.some((f) => minToTime(f.start) === S.dt.time)) takeAway();
}
function takeAway() {
  S.dt = { date: null, time: null, multiDay: duration().multiDay, spanDays: null, endDate: null };
  S.calNote = 'Ihr gewählter Termin ist inzwischen vergeben — bitte wählen Sie einen anderen.';
}

const now = () => new Date();
const duration = () => computeBookingDuration(S.items, S.mode);
const totals = (size = S.size) => computeTotals(S.items, S.mode, size);
const has = (id) => S.items.some((i) => i.id === id);

/* ── the cart ──────────────────────────────────────────────────────────────── */

/** A tier package as a cart line (same fields as BookingPage.jsx — the calendar needs the durations). */
const pkgItem = (p) => ({
  id: p.id, name: `${p.tier} – ${p.name}`, priceNum: p.price, type: 'aio',
  durationMin: p.durationMin ?? null, durationDays: p.durationDays ?? null,
  mobilExtraMin: p.mobilExtraMin ?? 0, mobilSurcharge: p.mobilSurcharge ?? 0,
});

/** An individual service as a cart line. Its id is `${categoryId}-${index}` — services have no id. */
const svcItem = (cat, pkg, i) => ({
  id: `${cat.id}-${i}`, name: pkg.name, priceNum: pkg.price, type: 'service',
  priceSuffix: pkg.priceSuffix ?? null,
  durationMin: pkg.durationMin ?? null, durationDays: pkg.durationDays ?? null,
  mobilExtraMin: pkg.mobilExtraMin ?? 0, mobilSurcharge: pkg.mobilSurcharge ?? 0,
});

/** The package or service behind an id, or null. Ids are `tier-…` or `${categoryId}-${index}`. */
function sourceOf(id) {
  const p = tierPackages.find((x) => x.id === id);
  if (p) return { pkg: p };
  const m = String(id).match(/^(.+)-(\d+)$/);
  if (!m) return null;
  const cat = serviceCategories.find((c) => c.id === m[1]);
  const pkg = cat && cat.packages[+m[2]];
  return pkg ? { cat, pkg, i: +m[2] } : null;
}

function itemById(id) {
  const src = sourceOf(id);
  if (!src) return null;
  return src.cat ? svcItem(src.cat, src.pkg, src.i) : pkgItem(src.pkg);
}

/** Adding shows the site's Preishinweis first; removing is immediate. */
function toggle(id) {
  if (has(id)) {
    S.items = S.items.filter((i) => i.id !== id);
    afterCartChange();
    return;
  }
  S.pending = id;
  render();
}
function confirmPending() {
  const item = S.pending && itemById(S.pending);
  S.pending = null;
  if (item) { S.items = [...S.items, item]; afterCartChange(); } else render();
}

/** Any change to the length of the job invalidates a date already picked (as on the live site). */
let lastShape = 's0';
function afterCartChange() {
  const d = duration();
  const shape = d.multiDay ? `m${d.spanDays}` : `s${d.durationMin}`;
  if (shape !== lastShape) {
    lastShape = shape;
    S.dt = { date: null, time: null, multiDay: d.multiDay, spanDays: null, endDate: null };
  }
  render();
}

/* ── recommendations (the live hook, as a plain function) ──────────────────── */

function advice() {
  const ids = new Set(S.items.map((i) => i.id));
  const excluded = new Set();
  for (const item of S.items) {
    for (const rule of exclusionRules) if (rule.if === item.id) rule.exclude.forEach((x) => excluded.add(x));
  }

  const seen = new Set();
  const recs = [];
  for (const item of S.items) {
    for (const rec of serviceRecommendations[item.id] || []) {
      if (ids.has(rec.recommend) || excluded.has(rec.recommend) || seen.has(rec.recommend)) continue;
      const src = sourceOf(rec.recommend);
      if (!src || src.pkg.phoneOnly) continue;    // appointment-only is never a one-click upsell
      const resolved = itemById(rec.recommend);
      seen.add(rec.recommend);
      recs.push({ ...rec, service: resolved });
    }
  }
  recs.sort((a, b) => a.priority - b.priority);

  let best = null;
  if (S.items.length >= 2) {
    for (const rule of packageDetectionRules) {
      if (ids.has(rule.packageId)) continue;
      const matched = rule.requiredServiceIds.filter((id) => ids.has(id));
      if (matched.length < (rule.partialMatchThreshold || rule.requiredServiceIds.length)) continue;
      const cost = matched.reduce((sum, id) => sum + (S.items.find((i) => i.id === id)?.priceNum || 0), 0);
      const pkg = allInOnePackages.find((p) => p.id === rule.packageId);
      if (!pkg || pkg.phoneOnly || pkg.price >= cost) continue;
      const savings = cost - pkg.price;
      if (!best || savings > best.savings) best = { pkg, replaces: matched, savings };
    }
  }
  return { recs: recs.slice(0, 3), best };
}

/* ── can we leave this step? ───────────────────────────────────────────────── */

function formState() {
  const c = S.contact;
  return {
    name: c.name.trim().length >= 2,
    phone: PHONE_RE.test(c.phone.trim()),
    email: EMAIL_RE.test(c.email.trim()),
    address: S.mode !== 'mobil' || c.address.trim().length >= 5,
    photos: S.photos.length >= 1,
    consent: c.consent === true,
  };
}
function canLeave(step = S.step) {
  const d = duration();
  if (step === 0) return !!S.mode && (S.mode !== 'studio' || !!S.place);
  if (step === 1) return S.items.length > 0;
  if (step === 2) return !!S.size;
  if (step === 3) return d.multiDay ? (!!S.dt.date && !!S.dt.endDate) : (!!S.dt.date && !!S.dt.time);
  if (step === 4) return Object.values(formState()).every(Boolean);
  return true;
}

/* ── views ─────────────────────────────────────────────────────────────────── */

// no arrows on buttons (Manuel, 2026-09-26: „premium car brands websites do not have this")
const foot = (label = 'Weiter', act = 'next') => `
  <div class="bk-foot">
    ${S.step > 0 ? '<button class="bk-back" type="button" data-act="back">Zurück</button>' : ''}
    <button class="bk-next" type="button" data-act="${act}"${canLeave() && !S.sending ? '' : ' disabled'}>${S.sending && act === 'submit' ? 'Wird gesendet …' : label}</button>
  </div>`;

const head = (title, lead) => `
  <div class="bk-step-head">
    <h1 class="bk-h">${title}</h1>
    ${lead ? `<p class="bk-lead">${lead}</p>` : ''}
  </div>`;

/* The town on its own, without the postcode — the summary card is 230 px wide. */
const town = (key) => FACTS.studio[key].split(',').pop().trim().replace(/^\d{4}\s+/, '');

/* ---- step 0 · Standort */
function placeList() {
  return Object.entries(FACTS.studio).map(([key, addr]) => {
    const open = key === 'feldkirch';                       // the other one is closed — see FACTS
    const on = S.place === key;
    return `<button class="bk-opt bk-place${on ? ' is-on' : ''}${open ? '' : ' is-off'}" type="button"
              ${open ? `data-act="place" data-v="${key}"` : 'disabled'}>
      <span class="bk-mark">${on ? '✓' : ''}</span>
      <span><span class="bk-place-n">${esc(key === 'feldkirch' ? 'Feldkirch' : FACTS.blockedName)}</span>
        <span class="bk-place-a">${esc(addr)}${open ? '' : ` · ${esc(FACTS.blockedNote)}`}</span></span>
      ${open ? '' : `<span class="bk-place-x">${esc(FACTS.blockedBadge)}</span>`}
    </button>`;
  }).join('');
}

/* Manuel, 2026-09-22: „make the standort wählen a popup and not on the buttom of the card."
   Choosing „Im Studio" opens this; picking a studio closes it again. The backdrop and Esc
   close it too and leave the studio that was already chosen alone. */
/* A „Nur auf Termin" card used to do nothing at all when clicked, which reads as broken.
   It answers now, with the telephone number the whole site already carries. */
function phoneDialog() {
  const name = itemById(S.phoneFor)?.name || '';
  return `<div class="bk-veil" data-act="closephone">
    <div class="bk-dialog" role="dialog" aria-modal="true">
      <h3>Nur auf Termin</h3>
      <p>${name ? `<b>${esc(name)}</b> stimmen wir` : 'Diese Leistung stimmen wir'} vorab kurz telefonisch ab — dann wissen wir, was Ihr Fahrzeug braucht.</p>
      <a class="bk-next" href="tel:${esc(FACTS.tel)}">${esc(FACTS.tel.replace(/^\+43(\d{3})(\d+)$/, '+43 $1 $2'))}</a>
      <button class="bk-back bk-dialog-x" type="button" data-act="closephone">Schließen</button>
    </div>
  </div>`;
}

function placeDialog() {
  return `<div class="bk-veil" data-act="closeplace">
    <div class="bk-dialog bk-dialog--wide" role="dialog" aria-modal="true" aria-label="Standort wählen">
      <h3>Standort wählen</h3>
      <p>Wo möchten Sie Ihr Fahrzeug abgeben?</p>
      <div class="bk-places">${placeList()}</div>
      <button class="bk-next" type="button" data-act="closeplace">Fertig</button>
    </div>
  </div>`;
}

function viewPlace() {
  const studio = S.mode === 'studio';
  return head('Wo soll es<br>stattfinden?', 'Wählen Sie, ob Sie zu uns kommen oder wir zu Ihnen kommen sollen.') + `
    <div class="bk-modes bk-bleed">
      <button class="bk-opt bk-mode${studio ? ' is-on' : ''}" type="button" data-act="mode" data-v="studio">
        <img class="bk-mode-img" src="assets/img/arbeit/handarbeit.webp" alt="" loading="lazy" decoding="async" />
        <span class="bk-mode-b">
          <span class="bk-mode-t">Im Studio</span>
          <span class="bk-mode-s">Sie bringen Ihr Fahrzeug zu uns</span>
          <span class="bk-mode-f">${studio && S.place ? `${esc(FACTS.studio[S.place])} · ändern` : `${Object.keys(FACTS.studio).length} Standorte`}</span>
        </span>
      </button>
      <button class="bk-opt bk-mode${S.mode === 'mobil' ? ' is-on' : ''}" type="button" data-act="mode" data-v="mobil">
        <img class="bk-mode-img" src="assets/img/arbeit/van.webp" alt="" loading="lazy" decoding="async" />
        <span class="bk-mode-b">
          <span class="bk-tagnew">Neu</span>
          <span class="bk-mode-t">Mobiler Service</span>
          <span class="bk-mode-s">Wir kommen direkt zu Ihnen</span>
          <span class="bk-mode-f bk-surcharge">+${esc(formatEuro(MOBILE_SURCHARGE))} Anfahrtspauschale</span>
        </span>
      </button>
    </div>
    ${foot()}`;
}

/* ---- step 1 · Service */
function tile({ id, band, name, sub, price, feats, phoneOnly, tier, durMin }) {
  const on = has(id);
  const opened = !!S.open[id];
  const cut = band ? 5 : 4;
  const shown = opened ? feats : feats.slice(0, cut);
  const rest = feats.length - cut;
  const list = shown.map((f) => `<li class="${f.bold ? 'is-bold' : ''}${f.muted ? ' is-muted' : ''}">${esc(f.text)}</li>`).join('');
  return `<div class="bk-opt bk-tile${on ? ' is-on' : ''}" ${band ? `style="--bk-tier:${band}"` : ''} role="button" tabindex="0"
            ${phoneOnly ? `data-act="phone" data-id="${esc(id)}"` : `data-act="pick" data-id="${esc(id)}"`}>
    ${band ? `<span class="bk-tile-band">${tier}</span>` : ''}
    <span class="bk-tile-in">
      <span class="bk-tile-top">
        <span class="bk-tile-n">${esc(name)}</span>
        ${phoneOnly ? '<span class="bk-phone">Nur auf Termin</span>' : `<span class="bk-mark">${on ? '✓' : '+'}</span>`}
      </span>
      ${sub ? `<span class="bk-tile-s">${esc(sub)}</span>` : ''}
      ${phoneOnly ? '<span class="bk-phone-l">Vorab kurz telefonisch abstimmen — hier tippen.</span>' : ''}
      <span class="bk-tile-line">
        <span class="bk-tile-p">${esc(price)}</span>
        ${durMin ? `<span class="bk-tile-d">ca. ${esc(durLabel(durMin))}</span>` : ''}
      </span>
      <ul class="bk-tile-f">${list}</ul>
      ${rest > 0 ? `<button class="bk-tile-more" type="button" data-act="more" data-id="${esc(id)}">${opened ? 'Weniger anzeigen' : `+${rest} weitere`}</button>` : ''}
    </span>
  </div>`;
}

function viewServices() {
  /* All-in-One first and in the accent colour: it is the offer, the rest are its parts. */
  const tabs = [{ id: 'aio', label: '✦ All-in-One' }, ...serviceCategories.map((c) => ({ id: c.id, label: c.title }))];
  const bar = tabs.map((t) => `<button class="bk-tab${t.id === 'aio' ? ' bk-tab--aio' : ''}${S.tab === t.id ? ' is-on' : ''}" type="button" data-act="tab" data-v="${t.id}">${esc(t.label)}</button>`).join('');

  let tiles;
  if (S.tab === 'aio') {
    tiles = `<div class="bk-tiles bk-tiles--pkg">` + tierPackages.map((p) => {
      const stops = String(p.headerStyle?.background || '').match(/#[0-9a-f]{3,8}/gi) || ['#555'];
      const dots = p.dots > 0 ? '<i></i>'.repeat(p.dots) : '';
      return tile({
        id: p.id, band: stops[Math.floor((stops.length - 1) / 2)], tier: `${dots}${esc(p.tier)}`,
        name: p.name, sub: p.subtitle, price: formatFrom(p.price), durMin: p.durationMin,
        feats: p.features.filter((f) => !f.section), phoneOnly: !!p.phoneOnly,
      });
    }).join('') + '</div>';
  } else {
    const cat = serviceCategories.find((c) => c.id === S.tab);
    tiles = `<div class="bk-tiles">` + cat.packages.map((pkg, i) => tile({
      id: `${cat.id}-${i}`, name: pkg.name, sub: pkg.subtitle || '',
      price: formatServicePrice(pkg), durMin: pkg.durationMin,
      feats: pkg.features.map((f) => (typeof f === 'string' ? { text: f } : f)),
      phoneOnly: !!pkg.phoneOnly,
    })).join('') + '</div>';
  }

  const { recs, best } = advice();
  const recBlock = S.items.length && (recs.length || best) ? `
    <div class="bk-block bk-bleed">
      <p class="bk-block-h"><span>Passt dazu</span><span class="bk-block-s">Ein Klick nimmt es dazu</span></p>
      ${best ? `<div class="bk-save">
        <span class="bk-save-t">${esc(best.pkg.name)} enthält Ihre Auswahl und kostet <b>${esc(formatEuro(best.savings))}</b> weniger.</span>
        <button class="bk-btn" type="button" data-act="swap">Paket nehmen</button>
      </div>` : ''}
      ${recs.length ? `<div class="bk-recs"${best ? ' style="margin-top:2px"' : ''}>${recs.map((r) => `
        <button class="bk-opt bk-rec" type="button" data-act="rec" data-id="${esc(r.service.id)}">
          <span class="bk-rec-t"><span class="bk-rec-n">${esc(r.service.name)}</span><span class="bk-rec-plus" aria-hidden="true">+</span></span>
          <span class="bk-rec-r">${esc(r.reason)}</span>
          <span class="bk-rec-p">${esc(formatFrom(r.service.priceNum))}</span>
        </button>`).join('')}</div>` : ''}
    </div>` : '';

  // The note: since 2026-09-25 Elité is VAT-registered (Matthias; NEW design only — _build/deviations.mjs).
  // Before: „Alle Preise sind Endpreise; keine Umsatzsteuer gemäß § 6 Abs. 1 Z 27 UStG."
  return head('Welche<br>Services?', 'Wählen Sie beliebig viele Leistungen — Kombinationen sind möglich.') + `
    <div class="bk-tabs bk-bleed">${bar}</div>
    <div class="bk-bleed">${tiles}</div>
    ${recBlock}
    <p class="bk-note">Alle Preise sind Endpreise inklusive 20 % Umsatzsteuer.</p>
    ${foot(`Weiter${S.items.length ? ` (${S.items.length})` : ''}`)}`;
}

/* ---- step 2 · Fahrzeug

   2026-09-22, Manuel: the five classes were full-width rows with the factor floating far to the
   right, and most of the page was empty. They are cards now, and each one answers the question a
   person actually has here — not „what is my factor" but „what does it cost me". The price shown
   is the client's own `computeTotals` run with that class, never a number typed here. */
function viewVehicle() {
  const t = totals();
  const cards = VEHICLE_SIZES.map((c) => {
    const on = S.size?.id === c.id;
    const tt = totals(c);
    /* the factor label already says „auf Anfrage" for the class without a factor — printing it
       twice on the same card read as a stutter. */
    const price = !t.anySized || c.factor == null ? '' : esc(formatFrom(tt.total));
    return `<button class="bk-opt bk-veh${on ? ' is-on' : ''}" type="button" data-act="size" data-v="${c.id}">
      <span class="bk-veh-top">
        <span class="bk-veh-n">${esc(c.name)}</span>
        <span class="bk-mark">${on ? '✓' : ''}</span>
      </span>
      <span class="bk-veh-e">${esc(c.examples)}</span>
      <span class="bk-veh-d">${esc(c.description)}</span>
      <span class="bk-veh-foot">
        <span class="bk-veh-f${t.anySized ? '' : ' is-quiet'}">${esc(t.anySized ? sizeFactorLabel(c) : 'kein Größenfaktor')}</span>
        ${price ? `<span class="bk-veh-p">${price}</span>` : ''}
      </span>
    </button>`;
  }).join('');

  return head('Ihr Fahrzeug', t.anySized
    ? 'Der Preis wird mit dem Größenfaktor Ihrer Klasse multipliziert.'
    : 'Hilft uns bei der Planung — ein Größenfaktor fällt nur bei manchen Leistungen an.') + `
    <div class="bk-vehs bk-bleed">${cards}</div>
    <p class="bk-note">${t.anySized ? 'Ein größeres Auto braucht anteilig mehr Zeit — deshalb der Faktor.' : ''}</p>
    ${foot()}`;
}

/* ---- step 3 · Termin */
function viewDate() {
  const d = duration();
  const terms = multiDayTerms(S.mode);
  const week = weekDays(S.weekStart);
  const n = now();
  const thisWeek = weekStartMonday(n);
  const lastWeek = weekStartMonday(addDays(startOfDay(n), HORIZON_DAYS - 1));
  const canPrev = S.weekStart > thisWeek;
  const canNext = S.weekStart < lastWeek;

  const a = week[0], b = week[6];
  const label = a.getMonth() === b.getMonth()
    ? `${a.getDate()}.–${b.getDate()}. ${MONTHS[a.getMonth()]} ${a.getFullYear()}`
    : `${a.getDate()}. ${MONTHS[a.getMonth()].slice(0, 3)} – ${b.getDate()}. ${MONTHS[b.getMonth()].slice(0, 3)} ${b.getFullYear()}`;

  const bar = `<div class="bk-cal-bar">
      <span class="bk-cal-w">${esc(label)}</span>
      <button class="bk-btn bk-btn--main" type="button" data-act="week" data-v="free">Nächster freier Termin</button>
      <button class="bk-btn" type="button" data-act="week" data-v="today">Heute</button>
      <button class="bk-btn bk-btn--arrow" type="button" data-act="week" data-v="prev"${canPrev ? '' : ' disabled'} aria-label="Woche zurück">←</button>
      <button class="bk-btn bk-btn--arrow" type="button" data-act="week" data-v="next"${canNext ? '' : ' disabled'} aria-label="Woche vor">→</button>
    </div>`;

  const tel = `<a href="tel:${esc(FACTS.tel)}">+43 664 2546078</a>`;
  // the calendar's own state first: nothing is offered before it has answered, and nothing when
  // its answer is a fallback (Google unreachable) — then the phone, never invented slots
  if (!CAL.loaded || CAL.failed || CAL.fallback) {
    const msg = !CAL.loaded && !CAL.failed
      ? '<p class="bk-msg">Freie Termine werden geladen …</p>'
      : `<p class="bk-msg bk-warn">Die freien Termine können gerade nicht geladen werden. Bitte versuchen Sie es in einem Moment erneut — oder rufen Sie uns an: ${tel}.</p>
         <p class="bk-retry"><button class="bk-btn" type="button" data-act="reloadcal">Erneut laden</button></p>`;
    return head('Wann passt es Ihnen?', esc(d.multiDay ? `${terms.stay(daysLabel(d.spanDays))}.` : `Dauer ca. ${durLabel(d.durationMin)}.`)) + `
      <div class="bk-cal bk-bleed">${msg}</div>
      ${foot()}`;
  }

  const body = d.multiDay ? multiDayGrid(week, d, n) : timeGrid(week, d, n);
  const notes = [
    S.calNote ? `<p class="bk-msg bk-warn" role="alert">${esc(S.calNote)}</p>` : '',
    CAL.stale ? '<p class="bk-note">Die Verfügbarkeit konnte gerade nicht aktualisiert werden — die Anzeige ist wenige Minuten alt.</p>' : '',
  ].join('');

  let pick = '';
  if (d.multiDay && S.dt.date) {
    const span = workingSpan(S.dt.date, d.spanDays);
    pick = `${terms.start} ${germanFull(span[0])} ${terms.startTime} · ${terms.end} ${germanFull(span[span.length - 1])} ${terms.endTime}`;
  } else if (!d.multiDay && S.dt.date && S.dt.time) {
    const [h, m] = S.dt.time.split(':').map(Number);
    pick = `${germanFull(S.dt.date)} · ${S.dt.time}–${minToTime(h * 60 + m + d.durationMin)} Uhr`;
  }

  const lead = d.multiDay
    ? `${terms.stay(daysLabel(d.spanDays))} — wählen Sie einen ${terms.chooseDay}.`
    : `Dauer ca. ${durLabel(d.durationMin)} — wählen Sie einen freien Termin.`;

  return head('Wann passt es Ihnen?', esc(lead)) + notes + `
    <div class="bk-cal bk-bleed">${bar}${body}</div>
    ${pick ? `<div class="bk-pick bk-bleed">
      <span><span class="bk-pick-l">${d.multiDay ? 'Ihr Zeitraum' : 'Ihr Termin'}</span><span class="bk-pick-v">${esc(pick)}</span></span>
      <button class="bk-pick-x" type="button" data-act="clearpick">ändern</button>
    </div>` : ''}
    <p class="bk-note">Alle Zeitangaben sind Richtwerte und können je nach Fahrzeugzustand variieren.</p>
    ${foot()}`;
}

function caps(week, n) {
  return `<div class="bk-grid bk-caps"><div class="bk-axis-cap"></div>${week.map((day) => {
    const off = !isWorkingDay(day) || startOfDay(day) < startOfDay(n);
    return `<div class="bk-cap${sameDay(day, n) ? ' is-today' : ''}${off ? ' is-off' : ''}">
      <div class="bk-cap-d">${DAYS_SHORT[day.getDay()]}</div>
      <div class="bk-cap-n">${day.getDate()}.</div>
    </div>`;
  }).join('')}</div>`;
}

/* The week as seven day buttons, then the chosen day's free times as pills.

   This replaced a week×hour calendar grid that read like a spreadsheet. Three things were taken
   from booking flows that do this for a living and were looked at first:
     · Walmart Auto Care writes „Full" UNDER a day that has nothing — a dark column says nothing;
     · GoDaddy groups the times into Morning / Afternoon instead of one long list;
     · Cal.com keeps the times as plain pills, never as blocks on an axis.
   The data underneath is unchanged: `sameDayPlan` still decides every free slot. */
function dayState(day, d, n) {
  if (!isWorkingDay(day)) return { kind: 'closed', label: 'geschlossen', free: [] };
  if (startOfDay(day) < startOfDay(n)) return { kind: 'past', label: 'vorbei', free: [] };
  // not covered by the calendar's answer: never offered as free
  if (!AVAIL.isKnown(day)) return { kind: 'full', label: '—', free: [] };
  const plan = sameDayPlan(day, d.durationMin, AVAIL.busy(day), n);
  if (plan.closed || plan.fullyPast) return { kind: 'past', label: 'vorbei', free: [] };
  if (!plan.free.length) return { kind: 'full', label: 'ausgebucht', free: [] };
  return { kind: 'free', label: `${plan.free.length} frei`, free: plan.free };
}

function timeGrid(week, d, n) {
  const states = week.map((day) => ({ day, ...dayState(day, d, n) }));
  const free = states.filter((x) => x.kind === 'free');

  // the open day: the one already picked if it is in this week, otherwise the first with room
  let open = states.find((x) => sameDay(x.day, S.dt.date) && x.kind === 'free') || free[0] || null;

  const pills = states.map((x) => {
    const on = open && sameDay(x.day, open.day);
    const today = sameDay(x.day, n);
    return `<button class="bk-dp bk-dp--${x.kind}${on ? ' is-on' : ''}${x.kind === 'free' ? '' : ' is-off'}${today ? ' is-today' : ''}"
      type="button" ${x.kind === 'free' ? `data-act="openday" data-d="${isoKey(x.day)}"` : 'disabled'}>
      <span class="bk-dp-d">${DAYS_SHORT[x.day.getDay()]}${today ? '<span class="bk-dp-t"> · heute</span>' : ''}</span>
      <span class="bk-dp-n">${x.day.getDate()}.</span>
      <span class="bk-dp-s">${esc(x.label)}</span>
    </button>`;
  }).join('');

  let body;
  if (!open) {
    body = `<p class="bk-empty">In dieser Woche passt kein Termin dieser Länge. Springen Sie zum nächsten freien Termin.</p>`;
  } else {
    body = dayCalendar(open, d, n);
  }

  return `<div class="bk-dps">${pills}</div>${body}`;
}

/* The chosen day as a real day, the way a calendar shows one.

   Manuel, 2026-09-22: „for the times, I want to have a calendar view of the day that is selected
   … like an Apple Calendar.“ The pills grouped Vormittag/Nachmittag were a list, not a day.

   This works only because the client's own planner hands back NON-OVERLAPPING starts:
   `sameDayPlan` steps its cursor by `durMin + BUFFER`, so every free slot can be drawn as a block
   on one axis without lanes or collision maths. Nothing about the times is decided here — the
   opening hours, the buffer, the busy intervals and the free starts all come from `scheduling.js`. */
function dayCalendar(open, d, n) {
  const plan = sameDayPlan(open.day, d.durationMin, AVAIL.busy(open.day), n);
  const from = plan.open;
  const to = plan.close;
  const span = to - from;
  if (span <= 0) return '';
  const pct = (a, b) => `top:${((a - from) / span * 100).toFixed(3)}%;height:${((b - a) / span * 100).toFixed(3)}%`;

  const hours = [];
  for (let m = Math.ceil(from / 60) * 60; m <= to; m += 60) hours.push(m);

  const lines = hours.map((m) => `<i class="bk-cd-line" style="top:${((m - from) / span * 100).toFixed(3)}%"></i>`).join('');
  const axis = hours.map((m) => `<span class="bk-cd-hr" style="top:${((m - from) / span * 100).toFixed(3)}%">${minToTime(m)}</span>`).join('');

  const past = plan.past ? `<div class="bk-cd-band bk-cd-past" style="${pct(plan.past[0], plan.past[1])}"><span>vorbei</span></div>` : '';
  const busy = (plan.busy || []).map(([a, b]) => `<div class="bk-cd-band bk-cd-busy" style="${pct(Math.max(from, a), Math.min(to, b))}"><span>belegt</span></div>`).join('');

  const slots = plan.free.map((f) => {
    const t = minToTime(f.start);
    const on = sameDay(open.day, S.dt.date) && S.dt.time === t;
    return `<button class="bk-cd-slot${on ? ' is-on' : ''}" type="button" style="${pct(f.start, f.end)}"
      data-act="slot" data-d="${isoKey(open.day)}" data-t="${t}">
      <span class="bk-cd-t">${t} – ${minToTime(f.end)}</span>
      <span class="bk-cd-s">${on ? 'Ihr Termin' : 'frei'}</span>
    </button>`;
  }).join('');

  const tall = Math.round(span / 60 * 62);
  return `<div class="bk-cd" style="--bk-cd-h:${tall}px">
    <p class="bk-cd-h">${esc(germanFull(open.day))}<span>${open.free.length} freie Startzeiten</span></p>
    <div class="bk-cd-body">
      <div class="bk-cd-axis">${axis}</div>
      <div class="bk-cd-col">${lines}${past}${busy}${slots}</div>
    </div>
  </div>`;
}

function multiDayGrid(week, d, n) {
  const span = S.dt.date ? workingSpan(S.dt.date, d.spanDays) : [];
  const terms = multiDayTerms(S.mode);
  let free = 0;
  const days = week.map((day) => {
    const open = multiDayStartState(day, d.spanDays, AVAIL, n) === DAY.FREE;
    if (open) free++;
    const on = sameDay(day, S.dt.date);
    const inSpan = !on && span.some((s) => sameDay(s, day));
    return `<button class="bk-opt bk-day${on ? ' is-on' : ''}${inSpan ? ' in-span' : ''}${open ? '' : ' is-off'}" type="button"
      ${open ? `data-act="day" data-d="${isoKey(day)}"` : 'disabled'}>
      <span class="bk-day-d">${DAYS_SHORT[day.getDay()]}</span>
      <span class="bk-day-n">${day.getDate()}.</span>
      <span class="bk-day-s">${on ? terms.bandStart : inSpan ? terms.bandMid : open ? 'frei' : ''}</span>
    </button>`;
  }).join('');

  const empty = free === 0
    ? `<p class="bk-empty bk-empty--flow">In dieser Woche ist kein ${terms.chooseDay} frei. Springen Sie zum nächsten freien Termin.</p>`
    : '';
  return `<div class="bk-days">${days}</div>${empty}`;
}

/* ---- step 4 · Kontakt */
function viewContact() {
  const v = formState();
  const c = S.contact;
  const bad = (ok, msg) => (S.touched && !ok ? `<span class="bk-err">${msg}</span>` : '');
  const field = (key, label, type, ph, ok, msg, wide) => `
    <div class="bk-field${wide ? ' bk-field--wide' : ''}">
      <label for="bk-${key}">${label}</label>
      <input id="bk-${key}" type="${type}" data-field="${key}" value="${esc(c[key])}" placeholder="${esc(ph)}" autocomplete="${type === 'tel' ? 'tel' : type === 'email' ? 'email' : 'on'}" />
      ${bad(ok, msg)}
    </div>`;

  const shots = S.photos.map((p, i) => `<div class="bk-shot"><img src="${p.url}" alt="Foto ${i + 1}" /><button type="button" data-act="rmphoto" data-i="${i}" aria-label="Foto entfernen">×</button></div>`).join('');

  return head('Ihre<br>Kontaktdaten', esc(FACTS.reply)) + `
    <!-- Honeypot: hidden from people, tempting to bots — the live site drops a filled request. -->
    <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" />
    <div class="bk-form">
      ${field('name', 'Vor- &amp; Nachname *', 'text', 'Max Mustermann', v.name, 'Bitte geben Sie Ihren vollständigen Namen ein.')}
      ${field('phone', 'Telefonnummer *', 'tel', '+43 664 000 0000', v.phone, 'Bitte geben Sie eine gültige Telefonnummer ein.')}
      ${field('email', 'E-Mail-Adresse *', 'email', 'max@mustermann.at', v.email, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.', true)}
      ${S.mode === 'mobil' ? field('address', 'Adresse (Einsatzort) *', 'text', 'Straße, Hausnummer, PLZ, Ort', v.address, 'Bitte geben Sie eine vollständige Adresse ein.', true) : ''}
      <div class="bk-field bk-field--wide">
        <label for="bk-notes">Anmerkungen</label>
        <textarea id="bk-notes" rows="3" data-field="notes" placeholder="Fahrzeugmodell, Zustand, besondere Wünsche…">${esc(c.notes)}</textarea>
      </div>
      <div class="bk-field bk-field--wide">
        <label>Fahrzeugfotos * <span style="text-transform:none;letter-spacing:0">(1–${MAX_PHOTOS} Fotos)</span></label>
        ${S.photos.length < MAX_PHOTOS ? `<label class="bk-drop" id="bk-drop">
          Fotos auswählen oder hierher ziehen <span>${S.photos.length} / ${MAX_PHOTOS}</span>
          <input type="file" accept="image/*" multiple hidden id="bk-file" />
        </label>` : ''}
        ${shots ? `<div class="bk-shots">${shots}</div>` : ''}
        ${bad(v.photos, 'Bitte laden Sie mindestens 1 Foto hoch.')}
      </div>
      <div class="bk-field bk-field--wide">
        <label class="bk-consent">
          <input type="checkbox" data-field="consent"${c.consent ? ' checked' : ''} />
          <span>Ich akzeptiere die
            <a href="https://www.eliteaufbereitung.at/datenschutz" target="_blank" rel="noreferrer">Datenschutzerklärung</a>,
            <a href="https://www.eliteaufbereitung.at/agb" target="_blank" rel="noreferrer">AGB</a> und
            <a href="https://www.eliteaufbereitung.at/widerruf" target="_blank" rel="noreferrer">Widerrufsbelehrung</a>.</span>
        </label>
        ${bad(v.consent, 'Bitte bestätigen Sie die Bedingungen.')}
      </div>
    </div>
    ${S.sendError ? `<p class="bk-msg bk-warn" role="alert">${esc(S.sendError)} <a href="tel:${esc(FACTS.tel)}">+43 664 2546078</a></p>` : ''}
    ${foot('Anfrage absenden', 'submit')}`;
}

/* ---- step 5 · Bestätigung */
function viewDone() {
  const t = totals();
  const terms = multiDayTerms(S.mode);
  const row = (k, val, add) => `<div class="bk-sum-row${add ? ' is-add' : ''}"><span>${k}</span><b>${val}</b></div>`;

  const when = S.dt.multiDay && S.dt.date
    ? row(terms.start, `${esc(germanFull(S.dt.date))} ${terms.startTime}`) + row(terms.end, `${esc(germanFull(S.dt.endDate))} ${terms.endTime}`)
    : row('Datum', esc(S.dt.date ? germanFull(S.dt.date) : '—')) + row('Uhrzeit', `${esc(S.dt.time || '—')} Uhr`);

  return `<div class="bk-done">
    <svg class="bk-tick" viewBox="0 0 48 48" aria-hidden="true"><path d="M8 25l11 11L40 13" /></svg>
    <h1 class="bk-h">Anfrage<br>erhalten.</h1>
    <p class="bk-lead">${esc(FACTS.reply)}</p>
    ${S.photoWarning ? `<p class="bk-msg bk-warn">${esc(S.photoWarning)}</p>` : ''}

    <div class="bk-table">
      <p class="bk-sum-h">Ihre Buchungsübersicht</p>
      ${S.items.map((i) => row(esc(i.name), esc(formatFrom(linePrice(i, S.size))))).join('')}
      ${S.size ? row(esc(S.size.name), esc(t.anySized ? sizeFactorLabel(S.size) : 'kein Größenfaktor')) : ''}
      ${S.mode === 'mobil' ? row('Anfahrtspauschale', `+${esc(formatEuro(MOBILE_SURCHARGE))}`, true) : ''}
      ${t.mobilPkg > 0 ? row('Mobil-Aufpreis (Premium-Paket)', `+${esc(formatEuro(t.mobilPkg))}`, true) : ''}
      ${row('Service-Art', S.mode === 'mobil' ? 'Mobiler Service' : 'Im Studio')}
      ${when}
      <div class="bk-sum-total"><span>Gesamtsumme</span><b>${esc(formatFrom(t.total))}${t.onRequest ? ' + Aufpreis auf Anfrage' : ''}</b></div>
    </div>

    <div class="bk-contact">
      <a href="tel:${esc(FACTS.tel)}"><small>Telefon</small>+43 664 2546078</a>
      <a href="mailto:${esc(FACTS.mail)}"><small>E-Mail</small>${esc(FACTS.mail)}</a>
      <div><small>${S.mode === 'mobil' ? 'Mobiler Service' : 'Im Studio'}</small>${esc(S.mode === 'mobil' ? S.contact.address : FACTS.studio[S.place] || '')}</div>
    </div>

    <div class="bk-acts">
      ${S.dt.date ? `<a class="bk-act bk-act--main" href="${icsHref()}" download="elite-termin.ics">Zum Kalender hinzufügen</a>` : ''}
      <a class="bk-act" href="tel:${esc(FACTS.tel)}">Anrufen</a>
      <a class="bk-act" href="mailto:${esc(FACTS.mail)}">E-Mail schreiben</a>
      <button class="bk-act" type="button" data-act="again">Neue Anfrage</button>
    </div>

    <a class="bk-home" href="/">Zurück zur Startseite</a>
  </div>`;
}

/** The chosen appointment as a calendar file, built in the browser — nothing is sent anywhere.
    (Square and Walmart both end on „Add to calendar"; it is the one thing a confirmation can
    actually do for you.) */
function icsHref() {
  const pad = (x) => String(x).padStart(2, '0');
  const stamp = (dt) => `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
  const d = duration();
  const start = new Date(S.dt.date);
  if (S.dt.time) {
    const [h, m] = S.dt.time.split(':').map(Number);
    start.setHours(h, m, 0, 0);
  } else start.setHours(9, 0, 0, 0);
  const end = S.dt.multiDay ? new Date(S.dt.endDate || S.dt.date) : new Date(start.getTime() + d.durationMin * 60000);
  if (S.dt.multiDay) end.setHours(16, 0, 0, 0);
  const where = S.mode === 'mobil' ? (S.contact.address || 'Mobiler Service') : (FACTS.studio[S.place] || '');
  const what = S.items.map((i) => i.name).join(', ');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Elite Auto Aufbereitung//Termin//DE',
    'BEGIN:VEVENT', `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:Elit\u00e9 \u2014 ${what}`, `LOCATION:${where}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

/* ---- the running summary */
function viewSide() {
  if (S.step < 1 || S.step > 4) return null;
  const t = totals();
  const d = duration();
  const row = (k, val, add) => `<div class="bk-sum-row${add ? ' is-add' : ''}"><span>${k}</span><b>${val}</b></div>`;

  const lines = S.items.map((i) => `<div class="bk-sum-row">
      <span>${esc(i.name)}</span>
      <b>${esc(formatFrom(linePrice(i, S.size)))}</b>
      <button class="bk-chip-x" type="button" data-act="pick" data-id="${esc(i.id)}" aria-label="Entfernen">×</button>
    </div>`).join('');

  return `<div class="bk-side-in">
    <p class="bk-sum-h">Ihre Auswahl</p>
    ${row('Service-Art', S.mode === 'mobil' ? 'Mobiler Service' : 'Im Studio')}
    ${S.mode === 'studio' && S.place ? row('Standort', esc(town(S.place))) : ''}
    ${lines || '<p class="bk-sum-empty">Noch keine Leistung gewählt.</p>'}
    ${S.size ? row(S.size.name, esc(t.anySized ? sizeFactorLabel(S.size) : 'kein Größenfaktor')) : ''}
    ${S.mode === 'mobil' ? row('Anfahrtspauschale', `+${esc(formatEuro(MOBILE_SURCHARGE))}`, true) : ''}
    ${t.mobilPkg > 0 ? row('Mobil-Aufpreis', `+${esc(formatEuro(t.mobilPkg))}`, true) : ''}
    ${S.items.length ? row('Dauer', esc(d.multiDay ? daysLabel(d.spanDays) : durLabel(d.durationMin))) : ''}
    ${S.dt.date ? row('Termin', esc(germanFull(S.dt.date)) + (S.dt.time ? ` · ${S.dt.time}` : '')) : ''}
    ${S.items.length ? `<div class="bk-sum-total"><span>Geschätzt</span><b>${esc(formatFrom(t.total))}</b></div>` : ''}
    ${S.items.length && t.anySized && !S.size ? '<p class="bk-sum-hint">Im Schritt „Fahrzeug" kommt der Größenfaktor Ihrer Klasse dazu.</p>' : ''}
    ${t.onRequest ? '<p class="bk-sum-hint">Großfahrzeuge: den Aufpreis nennen wir nach dem Blick aufs Fahrzeug.</p>' : ''}
  </div>`;
}

/* ── render ────────────────────────────────────────────────────────────────── */

const railEl = $('#bk-rail');
const mainEl = $('#bk-main');
const sideEl = $('#bk-side');
const stageEl = $('.bk-stage');
const modalEl = $('#bk-modal');
const devEl = $('.bk-dev');

function render() {
  railEl.innerHTML = STEPS.map((label, i) => {
    const state = S.step === i ? ' is-now' : S.step > i ? ' is-done' : '';
    return `<li><button class="bk-step${state}" type="button"${S.step > i ? ` data-act="goto" data-v="${i}"` : ' disabled'}>
      <span class="bk-step-n">${S.step > i ? '✓' : i + 1}</span><span class="bk-step-t">${label}</span>
    </button></li>`;
  }).join('');

  const views = [viewPlace, viewServices, viewVehicle, viewDate, viewContact, viewDone];
  mainEl.innerHTML = views[S.step]();
  modalEl.innerHTML = S.pending ? dialog() : S.placeOpen ? placeDialog() : S.phoneFor ? phoneDialog() : '';

  const side = viewSide();
  sideEl.hidden = !side;
  sideEl.innerHTML = side || '';
  stageEl.classList.toggle('is-solo', !side);

  if (S.step === 3) showFirstSlot();
  if (S.step === 4) wirePhotos();
  if (devEl) devEl.hidden = !CAL.demo;
}

/** Bring the earliest free slot into view — a day whose only opening is at 16:00, or a Friday on a
    phone's sideways-scrolling week, would otherwise sit outside the box and read as "nothing free". */
function showFirstSlot() {
  const slot = $('.bk-tp', mainEl) || $('.bk-dp:not(.is-off)', mainEl) || $('.bk-day:not(.is-off)', mainEl);
  if (!slot) return;
  const box = $('.bk-scroll', mainEl);
  if (!box) return;
  const b = box.getBoundingClientRect();
  box.scrollTop += slot.getBoundingClientRect().top - b.top - 76;   // 76 = the sticky day-name row
  const col = slot.closest('.bk-col');
  if (col && box.scrollWidth > box.clientWidth) {
    const c = col.getBoundingClientRect();
    box.scrollLeft += (c.left - b.left) - (b.width - c.width) / 2;
  }
}

function dialog() {
  return `<div class="bk-veil" data-act="okdisclaimer">
    <div class="bk-dialog" role="dialog" aria-modal="true">
      <h3>Preishinweis</h3>
      <p>Die angegebenen Preise sind <b>Richtpreise</b> und können je nach Fahrzeuggröße und Verschmutzungsgrad variieren. Der endgültige Preis wird vor Ort individuell festgelegt.</p>
      <button class="bk-next" type="button" data-act="okdisclaimer">Verstanden</button>
    </div>
  </div>`;
}

/** Step change: the new step slides in from the side it came from, and the page goes back to the top. */
function go(step) {
  const cls = step > S.step ? 'is-fwd' : 'is-back';
  S.step = step;
  S.touched = false;
  if (step === 3 && CAL.loaded && !CAL.demo) loadCalendar();   // fresh free/busy on the way in
  render();
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  mainEl.classList.remove('is-fwd', 'is-back');
  void mainEl.offsetWidth;                 // restart the animation on an element that never left
  mainEl.classList.add(cls);
}
mainEl.addEventListener('animationend', () => mainEl.classList.remove('is-fwd', 'is-back'));

/* ── sending (photos → Cloudinary, the booking → POST /api/book) ───────────── */

/** One photo to the live site's unsigned Cloudinary preset (the same call as BookingPage.jsx). */
async function uploadPhoto(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', 'vdrpbzfw');
  const res = await fetch('https://api.cloudinary.com/v1_1/ddtmjszd6/image/upload', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!data.secure_url) throw new Error('Upload fehlgeschlagen');
  return data.secure_url;
}

/** src/lib/photoUploads.js, as a plain function: failures never kill a completed booking. */
function summarizePhotoUploads(results) {
  const urls = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const failed = results.length - urls.length;
  let warning = null;
  if (failed === results.length && failed) {
    warning = failed === 1
      ? 'Ihr Foto konnte nicht übertragen werden — die Buchung ist aber angekommen.'
      : 'Ihre Fotos konnten nicht übertragen werden — die Buchung ist aber angekommen.';
  } else if (failed) {
    warning = `${failed} von ${results.length} Fotos konnten nicht übertragen werden — die Buchung ist aber angekommen.`;
  }
  return { urls, warning };
}

async function submit() {
  S.sending = true;
  S.sendError = null;
  render();

  if (CAL.demo) {                          // the local prototype only: nothing is sent
    S.sending = false;
    return go(5);
  }

  const honeypot = $('input[name="website"]', mainEl)?.value || '';
  const results = await Promise.allSettled(S.photos.map((p) => uploadPhoto(p.file)));
  const { urls: photoUrls, warning } = summarizePhotoUploads(results);

  // the studio sees the numbers the customer confirmed: every line at its SIZED price
  const t = totals();
  const d = duration();
  const services = S.items.map((i) => {
    const priceNum = linePrice(i, S.size);
    return { ...i, priceNum, price: i.priceSuffix ? `${formatFrom(priceNum)} ${i.priceSuffix}` : formatFrom(priceNum) };
  });
  const c = S.contact;
  const payload = {
    date: isoKey(S.dt.date),
    time: d.multiDay ? null : S.dt.time,
    services,
    contact: { name: c.name.trim(), phone: c.phone.trim(), email: c.email.trim(), address: c.address.trim(), notes: c.notes },
    website: honeypot,                     // spam trap: the server silently drops a filled one
    serviceMode: S.mode,
    location: S.mode === 'mobil' ? c.address.trim() : (FACTS.studio[S.place] || FACTS.studio.feldkirch),
    vehicleCategory: S.size?.name,
    vehicleSizeFactor: sizeFactorForRecord(S.size, t.anySized),
    mobileSurcharge: t.anfahrt,
    mobilePackageSurcharge: t.mobilPkg,
    totalStr: t.onRequest ? `${formatFrom(t.total)} + Aufpreis auf Anfrage` : formatFrom(t.total),
    photoUrls,
    durationMin: d.durationMin,
    multiDay: d.multiDay,
    spanDays: d.spanDays,
  };

  let res = null;
  let data = {};
  try {
    res = await fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    data = await res.json().catch(() => ({}));
  } catch { /* network down — handled below as „did not arrive" */ }
  S.sending = false;

  if (res && res.ok) {
    S.photoWarning = warning;
    return go(5);
  }
  if (res && res.status === 409 && data.error === 'slot_taken') {
    // taken while the customer typed: back to the calendar, with the reason, and fresh data
    S.dt = { date: null, time: null, multiDay: d.multiDay, spanDays: null, endDate: null };
    S.calNote = 'Dieser Termin wurde soeben von jemand anderem gebucht. Bitte wählen Sie einen anderen Zeitpunkt.';
    loadCalendar();
    return go(3);
  }
  S.sendError = 'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder rufen Sie uns direkt an:';
  render();
}

/* ── events ────────────────────────────────────────────────────────────────── */

/* Esc closes the standort popup. There was no keyboard handler on this page at all before
   2026-09-22 — the price notice could only be dismissed with the mouse. Now both can. */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (S.placeOpen) { S.placeOpen = false; render(); }
  else if (S.phoneFor) { S.phoneFor = null; render(); }
  else if (S.pending) confirmPending();
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  // the veil closes on the backdrop, but a click inside the dialog must not
  if (el.classList.contains('bk-veil') && e.target !== el) return;
  const act = el.dataset.act;
  const v = el.dataset.v;

  if (act === 'mode') {
    S.mode = v;
    if (v === 'mobil') { S.place = null; S.placeOpen = false; }
    else {
      if (!S.place) S.place = 'feldkirch';        // the only one open — see FACTS.blockedNote
      S.placeOpen = true;                         // … and the popup lets you say so
    }
    return render();
  }
  if (act === 'place') { S.place = v; S.placeOpen = false; return render(); }
  if (act === 'closeplace') { S.placeOpen = false; return render(); }
  if (act === 'phone') { S.phoneFor = el.dataset.id; return render(); }
  if (act === 'closephone') { S.phoneFor = null; return render(); }
  if (act === 'tab') { S.tab = v; return render(); }
  if (act === 'more') { S.open[el.dataset.id] = !S.open[el.dataset.id]; return render(); }
  if (act === 'pick') return toggle(el.dataset.id);
  if (act === 'rec') return toggle(el.dataset.id);
  if (act === 'okdisclaimer') return confirmPending();
  if (act === 'swap') {
    const { best } = advice();
    if (best) {
      S.items = [...S.items.filter((i) => !best.replaces.includes(i.id)), pkgItem(tierPackages.find((p) => p.id === best.pkg.id))];
      afterCartChange();
    }
    return;
  }
  if (act === 'size') { S.size = VEHICLE_SIZES.find((c) => c.id === v); return render(); }
  if (act === 'week') {
    const n = now();
    if (v === 'prev') S.weekStart = addDays(S.weekStart, -7);
    else if (v === 'next') S.weekStart = addDays(S.weekStart, 7);
    else if (v === 'today') S.weekStart = weekStartMonday(n);
    else if (v === 'free') {
      const first = availableDays(n, duration(), AVAIL, n).items.find((it) => it.kind === 'day');
      if (first) S.weekStart = weekStartMonday(first.date);
    }
    return render();
  }
  if (act === 'openday') {
    // open a day without choosing a time yet — the pills below re-render for it
    S.dt = { ...S.dt, date: dateOf(el.dataset.d), time: null, multiDay: false, spanDays: null, endDate: null };
    return render();
  }
  if (act === 'slot') {
    S.calNote = null;
    S.dt = { ...S.dt, date: dateOf(el.dataset.d), time: el.dataset.t, multiDay: false, spanDays: null, endDate: null };
    return render();
  }
  if (act === 'day') {
    S.calNote = null;
    const d = duration();
    const start = dateOf(el.dataset.d);
    const span = workingSpan(start, d.spanDays);
    S.dt = { date: start, time: null, multiDay: true, spanDays: d.spanDays, endDate: span[span.length - 1] || start };
    return render();
  }
  if (act === 'clearpick') { S.dt = { date: null, time: null, multiDay: duration().multiDay, spanDays: null, endDate: null }; return render(); }
  if (act === 'rmphoto') {
    const i = +el.dataset.i;
    URL.revokeObjectURL(S.photos[i].url);
    S.photos.splice(i, 1);
    return render();
  }
  if (act === 'again') { location.reload(); return; }
  if (act === 'goto') return go(+v);
  if (act === 'back') return go(S.step - 1);
  if (act === 'next') { if (canLeave()) go(S.step + 1); return; }
  if (act === 'reloadcal') { CAL.failed = false; render(); loadCalendar(); return; }
  if (act === 'submit') {
    S.touched = true;
    if (!canLeave() || S.sending) return render();
    submit();
  }
});

/** "2026-09-17" → a local Date at midnight (never `new Date(iso)`, which is UTC). */
function dateOf(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

document.addEventListener('input', (e) => {
  const key = e.target.dataset?.field;
  if (!key) return;
  S.contact[key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
  if (S.touched || e.target.type === 'checkbox') {
    // re-rendering on every keystroke would lose the caret: only the button's state can change
    const btn = $('.bk-next', mainEl);
    if (btn) btn.disabled = !canLeave();
    if (e.target.type === 'checkbox') render();
    return;
  }
  const btn = $('.bk-next', mainEl);
  if (btn) btn.disabled = !canLeave();
});

/** Photos: an object URL for the preview here; the file itself goes to Cloudinary on submit. */
function wirePhotos() {
  const drop = $('#bk-drop', mainEl);
  const input = $('#bk-file', mainEl);
  if (!drop || !input) return;
  const add = (files) => {
    const ok = [...files].filter((f) => f.type.startsWith('image/')).slice(0, MAX_PHOTOS - S.photos.length);
    if (!ok.length) return;
    S.photos.push(...ok.map((f) => ({ url: URL.createObjectURL(f), name: f.name, file: f })));
    render();
  };
  input.addEventListener('change', () => add(input.files));
  drop.addEventListener('dragover', (e) => e.preventDefault());
  drop.addEventListener('drop', (e) => { e.preventDefault(); add(e.dataTransfer.files); });
}

/* ── the navbar ────────────────────────────────────────────────────────────── */

/* hero.js is the homepage's script and is not loaded here, so this page carries the one piece of
   it that the shared navbar needs: the phone menu. The bar itself keeps its scrolled look at every
   scroll position (there is no hero underneath it to be transparent over). */
(function nav() {
  const menu = $('#mobile-menu');
  const toggle = $('[data-nav-toggle]');
  if (!menu || !toggle) return;
  let open = false;
  let tl = null;

  function set(want) {
    if (want === open) return;
    open = want;
    document.body.style.overflow = want ? 'hidden' : '';
    menu.style.pointerEvents = want ? 'auto' : 'none';
    $('[data-icon="menu"]', toggle).hidden = want;
    $('[data-icon="x"]', toggle).hidden = !want;
    const gsap = window.gsap;
    if (!gsap) { menu.style.clipPath = want ? 'circle(150% at calc(100% - 2.5rem) 1.75rem)' : 'circle(0% at calc(100% - 2.5rem) 1.75rem)'; return; }
    if (want) {
      tl = gsap.timeline();
      tl.fromTo(menu, { clipPath: 'circle(0% at calc(100% - 2.5rem) 1.75rem)' },
        { clipPath: 'circle(150% at calc(100% - 2.5rem) 1.75rem)', duration: 0.7, ease: 'power4.inOut' });
      tl.fromTo([...menu.querySelectorAll('.menu-item')],
        { y: 40, opacity: 0, scale: 0.95, filter: 'blur(8px)' },
        { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, stagger: 0.08, ease: 'power3.out' }, '-=0.3');
    } else if (tl) tl.timeScale(1.5).reverse();
  }

  toggle.addEventListener('click', () => set(!open));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  $('[data-nav-home]')?.addEventListener('click', () => { location.href = '/'; });
  window.addEventListener('scroll', () => { if (open) set(false); }, { passive: true });
}());

/* ── boot ──────────────────────────────────────────────────────────────────── */

// The homepage links here plainly, but the live site also accepts ?service=mobil from the
// mobile-service page — keep the same entry point.
if (new URLSearchParams(location.search).get('service') === 'mobil') { S.mode = 'mobil'; S.step = 1; }
render();
loadCalendar();
// every 30 s while the Termin step is open and the tab is seen, so a slot taken meanwhile disappears
setInterval(() => { if (S.step === 3 && document.visibilityState === 'visible') loadCalendar(); }, 30_000);
