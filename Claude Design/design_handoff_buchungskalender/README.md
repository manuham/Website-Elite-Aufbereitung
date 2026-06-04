# Handoff: Buchungskalender — Wochenansicht (duration-aware)

> Target repo: **manuham/Website-Elite-Aufbereitung** (Vite + React 18 + React Router + Tailwind + GSAP + lucide-react).
> Replaces **Step 3 / "Date & Time"** (`Step2` in `BookingPage.jsx`) and the `DayTimePickerModal`.

---

## Overview

Replace the current month-grid + per-day-modal date picker with an **Apple-Calendar week view** where every day's availability is visible at once and the customer picks **inline** — no modal.

**The critical rule: different services take different amounts of time, so the calendar adapts to the duration of the service chosen in Step 1.** There are **two booking shapes**:

1. **Same-day services (1 h – 6 h)** → the week grid shows selectable **time blocks whose height = the duration**. Valid start times are packed around existing bookings; days where the job can't finish before closing show *"An diesem Tag nicht möglich."*
2. **Multi-day services (1 – 5 days)** → no time-of-day picking. The customer chooses a **drop-off day**; an **all-day band** highlights the working-day span the car stays (Abgabe → Abholung).

The component decides the mode from the selected service: `service.durationDays != null` ⇒ multi-day, else same-day.

> The prototype includes a **service selector dropdown** so you can preview every service's behaviour. **In production there is no selector** — the service comes from Step 1 state. The "Tweaks" panel is prototype-only too. Don't ship either.

## About the Design Files & Fidelity

`design_files/` contains a **standalone HTML + in-browser-Babel React prototype** — a high-fidelity design reference, **not production code**. Recreate it in the repo with real components under `src/components/booking/`, **Tailwind classes** (tokens already exist), `lucide-react` icons, and GSAP for entrances. Reuse `submitBooking` and the booking-step scaffolding. **Availability/duration logic must be wired to real data — see "Availability" below; do not port the prototype's seeded mock (`calendar-data.js`).**

**Fidelity: high.** Colors, type, spacing, slot states, and both modes are final.

---

## Service durations (source of truth — add these to `src/data/services.js`)

Times are **studio** durations (client-provided, "Richtwerte"). **Mobil** adds time + (sometimes) a surcharge. Add a `durationMin` (same-day) **or** `durationDays` (multi-day) field, plus `mobilExtraMin` / `mobilSurcharge`, to each package.

| Service | Studio | Mode | Mobil extra (time) | Mobil surcharge |
|---|---|---|---|---|
| **Komplettpakete** | | | | |
| Wash & Clean | **5 h** | same-day | +1 h + Anfahrt | — |
| Deep Clean | **1 Tag** | multi-day | +1 h + Anfahrt | + €45 |
| Deep Polish | **2 Tage** | multi-day | — | + €65 |
| Endstufe | **4–5 Tage** (use 5) | multi-day | — | auf Anfrage |
| **Handwäsche** | | | | |
| Handwäsche Basic | **1 h** | same-day | +30 min + Anfahrt | — |
| Handwäsche Premium | **1,5 h** | same-day | +30 min + Anfahrt | — |
| Premium + Basic Innen | **2,5 h** | same-day | +30 min + Anfahrt | — |
| **Innenraum** | | | | |
| Basic Innen | **1,5 h** | same-day | + Anfahrt | — |
| Premium Innen | **2,5 h** | same-day | + Anfahrt | — |
| Leder Beschichtung | **1 h** | same-day | + Anfahrt | — |
| **Politur** | | | | |
| Spot Politur | **1 h** | same-day | + Anfahrt | — |
| Leichte Politur | **6 h** | same-day | +30 min + Anfahrt | + €45 |
| Schwere Politur | **1,5 Tage** | multi-day | — | + €65 |
| Scheinwerfer Politur | **3 h** | same-day | +30 min + Anfahrt | auf Anfrage |
| **Zusatzleistungen** | | | | |
| Autofenster | **2 h** | same-day | +30 min + Anfahrt | — |
| Felgen | **4 h** | same-day | — | — |
| Ozonbehandlung | **2 h** | same-day | +30 min + Anfahrt | — |
| Verkaufsaufbereitung | **6 h** | same-day | +1 h + Anfahrt | — |
| Interieur Pflege | **1 h** | same-day | + Anfahrt | — |
| **Beschichtungen** | | | | |
| Neuwagen Keramik | **2 Tage** | multi-day | — | — |
| Beschichtungspaket | **3 Tage** | multi-day | — | + €65 |
| Matt-Beschichtung | **2 Tage** | multi-day | — | + €85 |
| Kunststoffteile beschichten | **1 Tag** | multi-day | +30 min + Anfahrt | auf Anfrage |

**Mobil & duration:** when the booking is **mobil** (the flow already has `serviceMode === 'mobil'`), add `mobilExtraMin` to the effective duration for same-day services (so the block is taller and fewer starts fit). "+ Anfahrt" (travel) is scheduled/charged separately — out of scope for the block sizing unless you want to pad it.

> "Richtwerte" disclaimer to surface somewhere near the calendar: *"Alle Zeitangaben sind Richtwerte und können je nach Fahrzeugzustand variieren."*

---

## Business rules (use these exact values)

- **Working hours:** Mo–Fr **08:00–18:00**, Sa **08:00–13:00**, So **closed**.
- **Buffer between two jobs:** **30 min**.
- **Same-day start packing:** within each free gap (working hours minus existing bookings, each existing booking padded by the 30-min buffer), place blocks of `duration` back-to-back separated by the buffer, starting at the gap start. A block is valid only if `start + duration ≤ close`. Today: earliest start = now rounded up to the next 30 min + buffer; everything before is shaded "past".
- **Day can't fit the job →** show **no start blocks** + "An diesem Tag nicht möglich." (e.g. a 6 h job can't fit Saturday's 5 h window).
- **Multi-day span:** `spanDays = ceil(durationDays)`. From the chosen drop-off day, collect `spanDays` **working days** (skip Sundays). First = **Abgabe bis 09:00**, last = **Abholung ab 16:00**. A drop-off day is selectable only if every day in its span is available, it's a future working day, and **not today** (can't start a multi-day job same day).

---

## Design Tokens (already in `tailwind.config.js`)

| Token | Value | Tailwind |
|---|---|---|
| Background | `#0D0D12` | `obsidian` |
| Surface (glass) | `slate #2A2A35` @ 30% + blur | `.glass-card` |
| Accent | `#4DB292` | `accent` |
| Accent glow ("jetzt" line) | `#2ce09a` | `accent-glow` |
| Text / muted | `#FAF8F5` / `ivory/50`,`/30` | `ivory` |
| Hairlines | `ivory/5`–`ivory/12` | — |

Accent rgba: `rgba(77,178,146,α)` — free-block fill `.08`, border `.28`, hover fill `.16` / border `.55`, selected glow `0 8px 26px /.40`.

**Type:** headings `font-drama` (Playfair Display *italic*); body/labels `font-sans` (Inter); **all times, durations, eyebrows `font-mono` (JetBrains Mono)** — times 12.5–13px **700**, eyebrows 9.5–11px uppercase letter-spacing `.08em`.
**Radius:** card 22px, blocks/chips 11–14px, pills/buttons 999px. **Density:** ship "regular" (`minPx ≈ 0.9` px/min for block height).

---

## The screen (one layout, two modes)

**Chrome (keep, mirrors the live page):** step rail (`Service · Termin · Kontakt · Bestätigung`, step 2 active) · title **"Wann passt es Ihnen?"** · a duration-aware subline · the selected-service summary (name + duration; a dropdown in the prototype, static text in prod) · a fixed bottom **selection bar**. Week nav: `‹` / **Heute** / `›` (disable `‹` at the current week).

### Grid frame (both modes)
`.glass-card` rounded 22px. Day-header row: Mon→Sun, weekday short + date number; **today** = number in a solid accent circle; non-working days dimmed (Sunday shows rotated "Geschlossen").

### Mode A — same-day (time grid)
- Left **time gutter** `08:00…18:00`; 7 columns with faint hourly gridlines; scroll area ~528px.
- **Free block:** absolute, `top = (startMin − 480) × minPx`, `height = duration × minPx`. Shows time (mono) top, and "bis HH:MM · {durLabel}" bottom when tall enough. States = shared (see below).
- **Existing bookings:** shaded 135° hairline-stripe region labeled **"Belegt"**.
- **After-hours** (e.g. Sat after 13:00) and **past** (today before now): darker shade.
- **Live "jetzt" line:** `accent-glow` line + dot on today's column at the current time.
- **No-fit day:** centered "An diesem Tag nicht möglich".
- **Legend:** frei · {duration} / belegt / jetzt.

### Mode B — multi-day (all-day band)
- The time grid is **replaced** by a single **all-day band** row (gutter label "Ganztägig"): one cell per weekday.
  - Selectable drop-off day → dashed accent cell, "+ Abgabe".
  - In-span days → solid accent: first "ABGABE · bis 09:00", last "ABHOLUNG · ab 16:00", middle "im Studio". If the span runs past the visible week, show "→".
  - Unavailable/closed/past → faint "·".
- Below the band: a note — "Ihr Fahrzeug bleibt **{N Tage}** im Studio." + once chosen: "Abgabe {Weekday, D. Month} bis 09:00 · Abholung {…} ab 16:00".

### Shared slot/cell states
| State | Visual |
|---|---|
| free / selectable | fill `accent/8`, border `accent/28` (multi-day: dashed). Hover: fill `accent/16`, border `accent/55`, lift 1px. |
| selected | solid `accent`, obsidian text, glow shadow, `Check` (sw 3). |
| busy/belegt | 135° stripe, border `ivory/7`, muted, not interactive. |
| past / after-hours | dark shade, not interactive. |

---

## Interactions, State, Behavior

- **Same-day select:** `setDatetime({ date, time })` where `time` = block start "HH:MM". Summary: "{Weekday, D. Month} · {start}–{end} Uhr" (end = start + duration).
- **Multi-day select:** `setDatetime({ date, time: null })` where `date` = drop-off day. Summary: "Abgabe {…} · Abholung {…}". The booking should persist the **start date, computed end date, and a drop-off/pickup time** (09:00 / 16:00) so `submitBooking`/Google-Calendar gets the full block.
- **Switching service resets the current pick** (validity differs by duration).
- **Bottom bar:** disabled "Weiter" until ready (same-day needs date+time; multi-day needs date). Keep existing `onNext`/`onBack`. Include an "ändern" (clear) link.
- **Preserve from the old `DayTimePickerModal`:** the **ghost-booking guard** (if a chosen slot is taken on the next poll, clear it + warn) and the **`isFallback`** notice.
- **Animations:** GSAP entrance rises ~10px + fades; the prototype animates **transform only** (opacity stays 1) so a stalled animation never hides content — **keep this principle**. Respect `prefers-reduced-motion`.
- **Responsive:** `< 768px` → week grid collapses to a horizontal **day-pill strip** + single-day column (same-day) or pill-based drop-off selection (multi-day).

---

## Availability — the main integration work ⚠️

The prototype fakes everything in `calendar-data.js`. In production the calendar needs, **per visible day**, the **existing bookings (busy intervals)** so it can compute valid starts for *any* duration — not a fixed slot list.

Today, `useAvailability(date)` + `fetchAvailability(dateString)` (`src/lib/api.js`) return a **fixed 90-min slot list** for one day. That's insufficient for variable durations. You need one of:
- **(Preferred)** API returns each day's **busy time ranges** (or free ranges); the client packs blocks per the rules above for the selected service's duration. Add a **range endpoint** (e.g. `fetchAvailabilityRange(start, days)`) so the week (7 days) / future weeks load in one call.
- **(Alt)** API accepts `{ date, durationMin }` and returns valid start times server-side; client just renders them. Still needs a range/multi-day variant.

Either way: **the booking write must reserve the full `[start, start+duration]` block** (and for multi-day, the whole day span), not a single point — update `submitBooking` / the Google-Calendar event accordingly. **Flag this with the backend owner.**

## Assets & Strings
- Icons: `lucide-react` (`ChevronLeft/Right/Down`, `Check`, `Clock`, `Truck`, `Lock`, `Calendar`, `Plus`). Prototype reimplements them inline in `js/icons.jsx` — just import the real ones.
- Logo: real `/assets/logo-new2.png` (prototype uses a text "Elité" placeholder).
- German (`de-AT`): "Wann passt es Ihnen?", "Leistung", "Heute", "frei", "Belegt", "Geschlossen", "An diesem Tag nicht möglich", "Ganztägig", "Abgabe", "Abholung", "bis 09:00", "ab 16:00", "im Studio", "Ihr Fahrzeug bleibt … im Studio", "Wählen Sie einen freien Termin aus", "Wählen Sie einen Abgabetag", "Ihr Termin" / "Ihr Zeitraum", "ändern", "Weiter", "{n} Std" / "{n} Tage". Days/months full German.

## Files in this bundle (`design_files/`)
- `Buchungskalender.html` — open in a browser; use the **Leistung** dropdown to see same-day vs multi-day adapt. ("Tweaks" + the selector are prototype-only.)
- `js/WeekView.jsx` — **the design to recreate** (both modes, all states, responsive).
- `js/app.jsx` — chrome, service selector, duration-aware summary, bottom bar (reference).
- `js/calendar-data.js` — services + durations + the **packing/span/working-hours logic** (reference for the rules; **replace data source with real availability**).
- `js/icons.jsx` — prototype icon stand-ins; use `lucide-react`.
