/* ─── Buchungskalender · Verfügbarkeits-Rail ─────────────────────────────────
   Availability-FIRST date picker. Instead of a week grid where most of the screen is
   unavailable time, it lists only the days that actually have an opening — drawn from the
   whole loaded horizon — with each day's free start times as chips.

   Why a rail and not the old time-axis grid: at the studio's real service durations a totally
   empty ten-hour day yields ONE bookable start for the flagship packages (300–360 min), so the
   axis spent 540px to render a single block and everything else read as gray. The rail shows
   only what can be booked; unavailable days simply aren't drawn.

   One code path for both breakpoints (no JS mobile switch): the grid reflows from multi-column
   to single-column on its own. `min(300px, 100%)` is load-bearing — Step 2 sits inside 48px of
   page padding, so on a 320px phone a fixed 300px track would force horizontal page scroll,
   which is the very complaint this exists to fix.
----------------------------------------------------------------------------- */
import { useMemo, useState } from 'react';
import { Check, Phone, Calendar as CalIcon, RotateCcw, Plus } from 'lucide-react';
import {
  MONTHS, isoKey, sameDay, minToTime, durLabel, daysLabel, germanFull,
  availableDays, groupAvailableDays, relativeDayLabel,
  multiDayTerms, CHIPS_COLLAPSED, DAYS_SHOWN_INITIALLY,
} from '../../lib/scheduling';

// One flip from deletion (open question Q6): gap markers keep the rail oriented when it jumps
// e.g. Mo 20 → Fr 25, at the cost of ~20px of "kein freier Termin". Set false to honour the
// customer's literal "only show what's available" to the letter.
const SHOW_GAP_NOTES = true;

// ── one free start time ──────────────────────────────────────────────────────
function SlotChip({ start, end, durMin, dayLabel, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={!!selected}
      aria-label={`${minToTime(start)} bis ${minToTime(end)} am ${dayLabel}`}
      className={[
        'flex flex-col items-start justify-center gap-0.5 rounded-xl px-3 min-h-[44px] font-mono transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-glow focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian',
        selected
          ? 'bg-accent border border-accent text-obsidian shadow-[0_8px_26px_rgba(77,178,146,0.4)]'
          : 'bg-accent/[0.14] border border-accent/60 text-ivory hover:bg-accent/[0.22] hover:-translate-y-px motion-reduce:hover:transform-none',
      ].join(' ')}
    >
      <span className="flex items-center gap-1.5 text-[15px] font-bold leading-none">
        {minToTime(start)}
        {selected && <Check size={13} strokeWidth={3} />}
      </span>
      <span className={`text-[10px] uppercase tracking-[0.08em] leading-none ${selected ? 'text-obsidian/70' : 'text-ivory/50'}`}>
        bis {minToTime(end)} · {durLabel(durMin)}
      </span>
    </button>
  );
}

// ── one same-day date, with its start times ──────────────────────────────────
function DayCard({ item, durMin, now, selectedDate, selectedTime, onSelectSameDay }) {
  const [expanded, setExpanded] = useState(false);
  const title = germanFull(item.date);
  const rel = relativeDayLabel(item.date, now);
  const isSelectedDay = selectedDate && sameDay(selectedDate, item.date);

  const shown = expanded ? item.starts : item.starts.slice(0, CHIPS_COLLAPSED);
  const hidden = item.starts.length - shown.length;

  return (
    <li className="glass-card rounded-2xl p-4 list-none">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="font-drama italic text-[17px] text-ivory leading-tight truncate">{title}</h4>
          {rel && (
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-accent border border-accent/40 rounded-full px-2 py-0.5 whitespace-nowrap">{rel}</span>
          )}
        </div>
        <span className="font-mono text-[11px] text-ivory/40 whitespace-nowrap">
          {item.freeCount} {item.freeCount === 1 ? 'Termin' : 'Termine'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {shown.map((s) => (
          <SlotChip
            key={s.start}
            start={s.start}
            end={s.end}
            durMin={durMin}
            dayLabel={title}
            selected={isSelectedDay && selectedTime === minToTime(s.start)}
            onSelect={() => onSelectSameDay(item.date, minToTime(s.start))}
          />
        ))}
      </div>

      {hidden > 0 && (
        <button type="button" onClick={() => setExpanded(true)}
          className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-accent/80 hover:text-accent transition-colors">
          +{hidden} weitere
        </button>
      )}
      {expanded && item.starts.length > CHIPS_COLLAPSED && (
        <button type="button" onClick={() => setExpanded(false)}
          className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-ivory/40 hover:text-ivory/70 transition-colors">
          weniger anzeigen
        </button>
      )}
    </li>
  );
}

// ── one multi-day drop-off day (the card IS the button) ──────────────────────
function MultiDayCard({ item, spanDays, terms, now, selectedDate, onSelectMultiDay }) {
  const title = germanFull(item.date);
  const rel = relativeDayLabel(item.date, now);   // never 'Heute' (multi-day can't start today)
  const span = item.span;
  const last = span[span.length - 1];
  const isSel = !!(selectedDate && sameDay(selectedDate, item.date));
  // workingSpan skips weekends, so a calendar gap wider than the span means it straddles one.
  const crossesWeekend = (last - span[0]) / 86400000 > span.length - 1;

  return (
    <li className="list-none">
      <button
        type="button"
        onClick={() => onSelectMultiDay(item.date)}
        aria-pressed={isSel}
        className={[
          'w-full text-left glass-card rounded-2xl p-4 flex flex-col gap-1.5 transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-glow focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian',
          isSel
            ? 'border-accent shadow-[0_8px_26px_rgba(77,178,146,0.28)] bg-accent/[0.10]'
            : 'hover:border-accent/50 hover:-translate-y-px motion-reduce:hover:transform-none',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-drama italic text-[17px] text-ivory leading-tight">{title}</h4>
          <span className="flex items-center gap-2">
            {rel && (
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-accent border border-accent/40 rounded-full px-2 py-0.5">{rel}</span>
            )}
            {isSel
              ? <Check size={16} className="text-accent" strokeWidth={3} />
              : <Plus size={16} className="text-accent/70" />}
          </span>
        </div>
        <span className="font-mono text-[12px] text-ivory/80">{terms.start} {terms.startTime}</span>
        <span className="font-sans text-[13px] text-ivory/60">
          → {terms.end} {germanFull(last)} {terms.endTime}
        </span>
        <span className="mt-1 pt-2 border-t border-ivory/10 font-sans text-[12px] text-ivory/50">
          {terms.stay(daysLabel(spanDays))}
          {crossesWeekend && ` · ${terms.bandMid === 'vor Ort' ? 'über das Wochenende vor Ort' : 'über das Wochenende im Studio'}`}
        </span>
      </button>
    </li>
  );
}

// ── a run with no availability, between two free days ────────────────────────
function GapNote({ from, to }) {
  const label = sameDay(from, to)
    ? `${from.getDate()}. ${MONTHS[from.getMonth()]}`
    : `${from.getDate()}.–${to.getDate()}. ${MONTHS[to.getMonth()]}`;
  return (
    <li className="list-none flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-ivory/10" />
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ivory/30 whitespace-nowrap">
        kein freier Termin · {label}
      </span>
      <span className="h-px flex-1 bg-ivory/10" />
    </li>
  );
}

// A single centered column, one card per day. Real availability here is sparse (a booked-out
// single-operator studio, flagship services = one start per day), and gap markers separate most
// day pairs — a multi-column grid would collapse to one left-aligned column against a wall of
// dead space anyway. A constrained reading column looks intentional on desktop and is identical
// to the mobile layout, so there is one code path and no breakpoint to drift.
const RAIL_MAX = 'max-w-2xl mx-auto w-full';

// ── loading / outage / empty panels ──────────────────────────────────────────
function RailSkeleton() {
  return (
    <div className={`${RAIL_MAX} flex flex-col gap-3`} aria-busy="true">
      <span className="sr-only" role="status">Freie Termine werden geladen</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass-card rounded-2xl p-4 motion-safe:animate-pulse">
          <div className="h-4 w-32 rounded bg-slate/40 mb-4" />
          <div className="flex gap-2">
            <div className="h-11 w-24 rounded-xl bg-slate/40" />
            <div className="h-11 w-24 rounded-xl bg-slate/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CtaPanel({ icon, title, children, onRetry, onPhone }) {
  return (
    <div className={`${RAIL_MAX} glass-card rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-3`}>
      {icon}
      <h3 className="font-drama italic text-2xl text-ivory">{title}</h3>
      <p className="font-sans text-sm text-ivory/60 leading-relaxed max-w-md">{children}</p>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {onRetry && (
          <button type="button" onClick={onRetry}
            className="inline-flex items-center gap-2 font-sans text-sm font-semibold text-ivory border border-ivory/20 hover:border-accent hover:text-accent rounded-full px-5 py-2.5 transition-colors">
            <RotateCcw size={15} /> Erneut versuchen
          </button>
        )}
        <button type="button" onClick={onPhone}
          className="inline-flex items-center gap-2 font-sans text-sm font-bold bg-accent text-obsidian rounded-full px-6 py-2.5 shadow-[0_0_20px_rgba(77,178,146,0.2)]">
          <Phone size={15} /> Anrufen
        </button>
      </div>
    </div>
  );
}

function RailFallback({ onRetry, onPhone }) {
  return (
    <CtaPanel
      icon={<CalIcon size={30} className="text-accent/70" />}
      title="Live-Verfügbarkeit gerade nicht abrufbar"
      onRetry={onRetry}
      onPhone={onPhone}
    >
      Wir zeigen Ihnen lieber keine Termine als falsche. Rufen Sie uns an — wir haben den Kalender
      vor uns und buchen Sie sofort ein.
    </CtaPanel>
  );
}

function RailEmpty({ duration, until, onPhone }) {
  const untilLabel = `${until.getDate()}. ${MONTHS[until.getMonth()]}`;
  const line = duration.multiDay
    ? `Für ${daysLabel(duration.spanDays)} am Stück ist bis ${untilLabel} kein durchgehender Zeitraum offen.`
    : `Für Ihre Auswahl brauchen wir ca. ${durLabel(duration.durationMin)} am Stück — dafür ist bis ${untilLabel} kein Termin offen.`;
  return (
    <CtaPanel
      icon={<CalIcon size={30} className="text-accent/70" />}
      title={`Bis ${untilLabel} ist nichts frei`}
      onPhone={onPhone}
    >
      {line} Rufen Sie uns an — wir finden gemeinsam einen Termin, auch kurzfristig.
    </CtaPanel>
  );
}

// ── the rail ─────────────────────────────────────────────────────────────────
export default function AvailabilityRail({
  duration, avail, now, selected, serviceMode,
  hasLoaded, pending, noData,
  onSelectSameDay, onSelectMultiDay, onRetry, onPhone,
}) {
  const [showAll, setShowAll] = useState(false);
  const terms = useMemo(() => multiDayTerms(serviceMode), [serviceMode]);

  // Recomputed only when coverage, duration or the minute-bucketed clock changes.
  const result = useMemo(
    () => availableDays(now, duration, avail, now),
    [avail, duration, now],
  );

  // A Google outage (fabricated skeleton) or a first-load failure: never render invented days.
  if (noData) return <RailFallback onRetry={onRetry} onPhone={onPhone} />;
  if (!hasLoaded) return <RailSkeleton />;
  if (result.count === 0) return <RailEmpty duration={duration} until={result.until} onPhone={onPhone} />;

  // Show the first N free days; the rest are already fetched, so revealing them triggers no request.
  let items = result.items;
  let hiddenDays = 0;
  if (!showAll) {
    const out = [];
    let dc = 0;
    for (const it of items) {
      if (it.kind === 'day') {
        if (dc >= DAYS_SHOWN_INITIALLY) { hiddenDays++; continue; }
        dc++;
      }
      out.push(it);
    }
    while (out.length && out[out.length - 1].kind === 'gap') out.pop();
    items = out;
  }
  if (!SHOW_GAP_NOTES) items = items.filter((it) => it.kind !== 'gap');

  const groups = groupAvailableDays(items, now);

  return (
    <div className={`${RAIL_MAX} flex flex-col gap-6`}>
      {groups.map((g) => (
        <section key={g.key}>
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="font-sans text-[13px] font-bold uppercase tracking-[0.12em] text-ivory/70">{g.title}</h3>
            {g.sub && <span className="font-mono text-[11px] text-ivory/30">{g.sub}</span>}
          </div>
          <ul className="flex flex-col gap-3">
            {g.items.map((it) =>
              it.kind === 'gap' ? (
                <GapNote key={`gap-${isoKey(it.from)}`} from={it.from} to={it.to} />
              ) : duration.multiDay ? (
                <MultiDayCard
                  key={it.iso}
                  item={it}
                  spanDays={duration.spanDays}
                  terms={terms}
                  now={now}
                  selectedDate={selected.date}
                  onSelectMultiDay={onSelectMultiDay}
                />
              ) : (
                <DayCard
                  key={it.iso}
                  item={it}
                  durMin={duration.durationMin}
                  now={now}
                  selectedDate={selected.date}
                  selectedTime={selected.time}
                  onSelectSameDay={onSelectSameDay}
                />
              ),
            )}
          </ul>
        </section>
      ))}

      {hiddenDays > 0 && (
        <button type="button" onClick={() => setShowAll(true)}
          className="self-center font-sans text-sm font-semibold text-ivory/70 border border-ivory/15 hover:border-accent hover:text-accent rounded-full px-6 py-2.5 transition-colors">
          Weitere Termine anzeigen ({hiddenDays})
        </button>
      )}

      {pending && (
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ivory/25 text-center">
          Verfügbarkeit wird aktualisiert …
        </p>
      )}
    </div>
  );
}
