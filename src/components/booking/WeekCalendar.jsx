/* ─── Buchungskalender · Wochenansicht (duration-aware) ──────────────────────
   Apple-Calendar week grid driven by real availability + the selected service's
   duration.
     • same-day  → time blocks sized to the duration, packed around busy intervals
     • multi-day → pick a drop-off day; an all-day band spans the working days
   Collapses to a day-pill strip + single column under 768px.
-----------------------------------------------------------------------------*/
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Plus, Calendar as CalIcon } from 'lucide-react';
import gsap from 'gsap';
import {
  AXIS_START, AXIS_END, DAYS_SHORT, MONTHS,
  sameDay, isoKey, minToTime, isWorkingDay, durLabel, daysLabel, germanFull,
  sameDayPlan, freeStartCount, workingSpan, multiDayStartFree, multiDayTerms,
} from '../../lib/scheduling';

const ACCENT = '#4DB292';
const GLOW = '#2ce09a';
const IVORY = '#FAF8F5';
const OBSIDIAN = '#0D0D12';
const acc = (a) => `rgba(77,178,146,${a})`;
const iv = (a) => `rgba(250,248,245,${a})`;
const MIN_PX = 0.9;
const GUTTER = 48;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Quiet recess for any unavailable time (past / busy / after-hours / closed). One flat, near-black
// treatment — no hatching, no border, no label. The client asked us to stop emphasising WHY a time
// isn't available; only free time should carry visual weight.
function Region({ top, h }) {
  return (
    <div style={{ position: 'absolute', left: 4, right: 4, top: top + 1, height: Math.max(h - 2, 0), borderRadius: 9, background: 'rgba(0,0,0,0.28)' }} />
  );
}

export default function WeekCalendar({
  week, duration, avail, now, selected, pending,
  onSelectSameDay, onSelectMultiDay,
  onPrevWeek, onNextWeek, onToday, onNextFree, nextFree, canPrev, canNext,
  compact, serviceMode,
}) {
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const multi = !!duration.multiDay;
  const span = multi ? duration.spanDays : 0;
  const terms = useMemo(() => multiDayTerms(serviceMode), [serviceMode]);
  const bodyH = (AXIS_END - AXIS_START) * MIN_PX;
  const hours = useMemo(() => {
    const a = []; for (let h = AXIS_START / 60; h <= AXIS_END / 60; h++) a.push(h); return a;
  }, []);

  const today = useMemo(() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }, [now]);

  const [activeIdx, setActiveIdx] = useState(() => {
    const i = week.findIndex(d => sameDay(d, selected.date));
    if (i >= 0) return i;
    const t = week.findIndex(d => sameDay(d, today));
    return t >= 0 ? t : 0;
  });
  useEffect(() => {
    const i = week.findIndex(d => sameDay(d, selected.date));
    if (i >= 0) setActiveIdx(i);
  }, [selected.date, week]);

  // GSAP entrance — transform only (opacity stays 1 so a stalled tween never hides content)
  useEffect(() => {
    if (prefersReducedMotion() || !rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(rootRef.current, { y: 10 }, { y: 0, duration: 0.4, ease: 'power3.out' });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const weekLabel = useMemo(() => {
    const a = week[0], b = week[6];
    if (a.getMonth() === b.getMonth()) return `${a.getDate()}.–${b.getDate()}. ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
    return `${a.getDate()}. ${MONTHS[a.getMonth()].slice(0, 3)} – ${b.getDate()}. ${MONTHS[b.getMonth()].slice(0, 3)} ${b.getFullYear()}`;
  }, [week]);

  // multi-day span membership for the currently chosen drop-off
  const spanDays = useMemo(() => (multi && selected.date) ? workingSpan(selected.date, span) : [], [multi, span, selected.date]);
  const inSpan = (d) => spanDays.some(s => sameDay(s, d));
  const spanIndex = (d) => spanDays.findIndex(s => sameDay(s, d));

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMin >= AXIS_START && nowMin <= AXIS_END) ? (nowMin - AXIS_START) * MIN_PX : null;

  // Auto-scroll the column body to the earliest free slot, so a day whose only opening is late
  // (e.g. 16:00) isn't hidden below the fold of the 528px / 54vh scroller. Runs on week/day/duration
  // change and once when the first data lands (pending → false) — NOT on every 30 s poll.
  const weekKey = isoKey(week[0]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || multi) return;
    const cols = compact ? [week[activeIdx]] : week;
    let earliest = Infinity;
    for (const d of cols) {
      if (!d) continue;
      const p = sameDayPlan(d, duration.durationMin, avail.busy(d), now);
      if (!p.closed && !p.fullyPast && !p.unknown && p.free.length) earliest = Math.min(earliest, p.free[0].start);
    }
    if (earliest !== Infinity) el.scrollTop = Math.max(0, (earliest - AXIS_START) * MIN_PX - 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekKey, activeIdx, duration.durationMin, multi, compact, pending]);

  // ── same-day column ──
  function DayColumn({ date }) {
    // avail.busy() returns null for a day we have no trustworthy data for, and sameDayPlan turns
    // that into `unknown` rather than packing an invented wide-open day.
    const plan = sameDayPlan(date, duration.durationMin, avail.busy(date), now);
    const isToday = sameDay(date, today);
    const wh = isWorkingDay(date) ? plan.close : null;
    const closeTop = wh ? (plan.close - AXIS_START) * MIN_PX : bodyH;

    return (
      <div style={{ position: 'relative', flex: 1, minWidth: 0, borderLeft: `1px solid ${iv(0.05)}` }}>
        {hours.map(h => (
          <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: (h * 60 - AXIS_START) * MIN_PX, borderTop: `1px solid ${iv(0.03)}` }} />
        ))}
        {/* closed day → one quiet recess over the whole column (no "Geschlossen" word) */}
        {plan.closed && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)' }} />}
        {/* after-hours recess */}
        {!plan.closed && closeTop < bodyH && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: closeTop, height: bodyH - closeTop, background: 'rgba(0,0,0,0.28)' }} />
        )}
        {/* past + busy → same quiet recess, no labels */}
        {plan.past && <Region top={(plan.past[0] - AXIS_START) * MIN_PX} h={(plan.past[1] - plan.past[0]) * MIN_PX} />}
        {plan.fullyPast && <Region top={0} h={bodyH} />}
        {plan.busy.map(([s, e], i) => (
          <Region key={i} top={(s - AXIS_START) * MIN_PX} h={(e - s) * MIN_PX} />
        ))}
        {/* now line */}
        {isToday && nowTop != null && (
          <div style={{ position: 'absolute', left: -2, right: 0, top: nowTop, zIndex: 6, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: GLOW, boxShadow: `0 0 8px ${ACCENT}` }} />
            <span style={{ flex: 1, height: 1.5, background: GLOW, opacity: 0.85 }} />
          </div>
        )}
        {/* free blocks — the only lit objects on the column. Bright fill + border + soft glow so a
            single available slot on an otherwise-quiet day is impossible to miss. Hover/focus live
            in CSS (.slot-free) so keyboard focus gets the same feedback the mouse does. */}
        {plan.free.map(b => {
          const top = (b.start - AXIS_START) * MIN_PX;
          const h = (b.end - b.start) * MIN_PX;
          const rh = Math.max(h - 3, 44);   // rendered height — floored to a real 44px tap target
          const isSel = sameDay(date, selected.date) && selected.time === minToTime(b.start);
          return (
            <button key={b.start} type="button" className="slot-free" onClick={() => onSelectSameDay(date, minToTime(b.start))}
              style={{
                position: 'absolute', left: 4, right: 4, top: top + 1.5, height: rh, borderRadius: 11,
                padding: rh > 52 ? '7px 9px' : '5px 9px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden',
                background: isSel ? ACCENT : `linear-gradient(180deg, ${acc(0.28)} 0%, ${acc(0.16)} 100%)`,
                border: `1px solid ${isSel ? ACCENT : acc(0.6)}`,
                color: isSel ? OBSIDIAN : IVORY,
                boxShadow: isSel ? `0 8px 26px ${acc(0.4)}` : `0 0 0 1px ${acc(0.10)}, 0 4px 14px ${acc(0.16)}`,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'space-between' }}>
                <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{minToTime(b.start)}</span>
                {isSel && <Check size={13} strokeWidth={3} />}
              </span>
              {rh > 40 && (
                <span className="font-mono uppercase" style={{ fontSize: 9.5, letterSpacing: '.08em', opacity: isSel ? 0.85 : 0.6 }}>
                  bis {minToTime(b.end)} · {durLabel(duration.durationMin)}
                </span>
              )}
            </button>
          );
        })}
        {/* Not yet known. Only say "lädt" while data may actually still arrive (`pending`) —
            during an outage nothing is loading, and a column pulsing "lädt" forever would
            contradict the notice above the calendar. Then we simply show nothing.
            Never accent: accent means "frei", so an accent placeholder would re-create the
            fabricated-availability lie in shimmer form. */}
        {plan.unknown && pending && (
          <div className="motion-safe:animate-pulse" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: iv(0.02) }}>
            <span className="font-mono uppercase" style={{ fontSize: 9, color: iv(0.25), letterSpacing: '.08em' }}>lädt</span>
          </div>
        )}
        {/* Known day with no free slot → one quiet recess, no words. The recess itself says
            "nothing here"; the "N frei" header (absent) confirms it. */}
        {!plan.closed && !plan.fullyPast && !plan.unknown && plan.free.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)', borderRadius: 4 }} />
        )}
      </div>
    );
  }

  const columns = compact ? [week[activeIdx]] : week;

  return (
    <div ref={rootRef}>
      {/* nav */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="font-sans text-ivory" style={{ fontSize: 16, fontWeight: 600 }}>{weekLabel}</div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {nextFree && (
            <button type="button" onClick={onNextFree}
              className="font-sans rounded-full border border-accent/40 text-accent bg-accent/[0.08] hover:bg-accent/[0.16] transition-colors"
              style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600 }}>
              Nächster freier Termin
            </button>
          )}
          {/* keep the three step controls together so the next arrow never orphans onto its own line */}
          <div className="flex items-center gap-2 flex-nowrap">
            <NavBtn onClick={onPrevWeek} disabled={!canPrev} aria="Vorherige Woche"><ChevronLeft size={18} /></NavBtn>
            <button type="button" onClick={onToday} className="font-sans rounded-full border border-ivory/12 text-ivory bg-ivory/[0.03] hover:border-accent hover:text-accent transition-colors" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>Heute</button>
            <NavBtn onClick={onNextWeek} disabled={!canNext} aria="Nächste Woche"><ChevronRight size={18} /></NavBtn>
          </div>
        </div>
      </div>

      {/* mobile day pills */}
      {compact && (
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2.5 mb-1.5">
          {week.map((d, i) => {
            const closed = !isWorkingDay(d);
            const isT = sameDay(d, today);
            const act = i === activeIdx;
            const selectableMulti = multi && multiDayStartFree(d, span, avail, now);
            const within = multi && inSpan(d);
            const cnt = multi ? 0 : freeStartCount(d, duration.durationMin, avail.busy(d), now);
            const onClickPill = multi
              ? () => { setActiveIdx(i); if (selectableMulti) onSelectMultiDay(d); }
              : () => setActiveIdx(i);
            return (
              <button key={i} type="button" onClick={onClickPill} disabled={closed || (multi && !selectableMulti && !within)}
                style={{
                  flex: '0 0 auto', width: 58, padding: '9px 0', borderRadius: 16, textAlign: 'center',
                  border: (within || (!multi && act)) ? `1px solid ${ACCENT}` : `1px solid ${iv(0.08)}`,
                  background: within ? ACCENT : act ? acc(0.14) : 'transparent',
                  color: within ? OBSIDIAN : IVORY, opacity: closed ? 0.3 : 1,
                }}>
                <div className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '.08em', color: within ? OBSIDIAN : isT ? ACCENT : iv(0.5) }}>{DAYS_SHORT[d.getDay()]}</div>
                <div className="font-drama italic" style={{ fontSize: 22, lineHeight: 1.1, margin: '2px 0' }}>{d.getDate()}</div>
                <div style={{ height: 5, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  {!multi && !closed && Array.from({ length: Math.min(cnt, 3) }).map((_, k) => (
                    <span key={k} style={{ width: 4, height: 4, borderRadius: 9, background: ACCENT }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* grid */}
      <div className="glass-card overflow-hidden" style={{ borderRadius: 22 }}>
        {/* day header row (desktop) */}
        {!compact && (
          <div className="flex" style={{ borderBottom: `1px solid ${iv(0.07)}` }}>
            <div style={{ width: GUTTER, flex: '0 0 auto' }} />
            {week.map((d, i) => {
              const isT = sameDay(d, today);
              // How many bookable starts this day has, so the whole week is scannable at a glance:
              // green "N frei" where there's an opening, dimmed and wordless where there isn't.
              const cnt = multi
                ? (multiDayStartFree(d, span, avail, now) ? 1 : 0)
                : freeStartCount(d, duration.durationMin, avail.busy(d), now);
              const badge = multi ? (cnt > 0 ? 'frei' : null) : (cnt > 0 ? `${Math.min(cnt, 9)}${cnt > 9 ? '+' : ''} frei` : null);
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '9px 4px 8px', borderLeft: `1px solid ${iv(0.05)}`, opacity: (cnt === 0 && !isT) ? 0.4 : 1 }}>
                  <div className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '.08em', color: isT ? ACCENT : iv(0.45) }}>{DAYS_SHORT[d.getDay()]}</div>
                  <div className="font-sans" style={{ fontSize: 17, fontWeight: 700, marginTop: 3, color: isT ? OBSIDIAN : IVORY, background: isT ? ACCENT : 'transparent', width: 30, height: 30, lineHeight: '30px', borderRadius: 99, margin: '3px auto 0' }}>{d.getDate()}</div>
                  <div style={{ height: 16, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {badge && (
                      <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '.06em', color: ACCENT, background: acc(0.16), border: `1px solid ${acc(0.45)}`, borderRadius: 99, padding: '1px 7px' }}>{badge}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {multi ? (
          <MultiDayBand
            week={week} compact={compact} span={span} duration={duration} selected={selected}
            onSelectMultiDay={onSelectMultiDay} inSpan={inSpan} spanIndex={spanIndex} spanDays={spanDays}
            avail={avail} now={now} terms={terms}
          />
        ) : (
          <div ref={scrollRef} className="hide-scrollbar flex overflow-y-auto" style={{ maxHeight: compact ? '54vh' : 528 }}>
            <div style={{ width: GUTTER, flex: '0 0 auto', position: 'relative', height: bodyH }}>
              {hours.map(h => (
                <div key={h} className="font-mono" style={{ position: 'absolute', top: (h * 60 - AXIS_START) * MIN_PX - 6, right: 9, fontSize: 10, color: iv(0.32) }}>{String(h).padStart(2, '0')}:00</div>
              ))}
            </div>
            <div style={{ display: 'flex', flex: 1, position: 'relative', height: bodyH }}>
              {columns.map(d => <DayColumn key={isoKey(d)} date={d} />)}
            </div>
          </div>
        )}
      </div>

      {/* legend (same-day only) — only "frei" and "jetzt"; we no longer label the quiet unavailable
          time, so there is nothing to teach about "belegt". */}
      {!multi && (
        <div className="flex gap-4 mt-3.5 flex-wrap">
          <Legend swatch="free">frei · {durLabel(duration.durationMin)}</Legend>
          <Legend swatch="now">jetzt</Legend>
        </div>
      )}
    </div>
  );
}

// ── multi-day all-day band ──
function MultiDayBand({ week, compact, span, duration, selected, onSelectMultiDay, inSpan, spanIndex, spanDays, avail, now, terms }) {
  if (compact) {
    // mobile uses the day-pill strip above for selection; show only the note
    return <MultiDayNote duration={duration} spanDays={spanDays} selected={selected} terms={terms} />;
  }
  const lastSpan = spanDays[spanDays.length - 1];
  const overflowsWeek = lastSpan && lastSpan > week[6];
  return (
    <div>
      <div className="flex items-stretch">
        <div style={{ width: GUTTER, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 9 }}>
          <span className="font-mono uppercase" style={{ fontSize: 9, color: iv(0.32), letterSpacing: '.06em', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Ganztägig</span>
        </div>
        {week.map((d, i) => {
          const within = inSpan(d);
          const idx = spanIndex(d);
          const selectable = multiDayStartFree(d, span, avail, now);
          const isStart = idx === 0;
          const isEnd = within && (idx === spanDays.length - 1 || (overflowsWeek && i === 6));
          return (
            <div key={i} style={{ flex: 1, minWidth: 0, borderLeft: `1px solid ${iv(0.05)}`, padding: '12px 5px', minHeight: 96, display: 'flex' }}>
              <button type="button" disabled={!selectable && !within} onClick={() => selectable && onSelectMultiDay(d)}
                style={{
                  flex: 1, borderRadius: 12, padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, textAlign: 'center',
                  background: within ? ACCENT : selectable ? acc(0.08) : 'transparent',
                  border: within ? `1px solid ${ACCENT}` : selectable ? `1px dashed ${acc(0.4)}` : `1px dashed ${iv(0.07)}`,
                  color: within ? OBSIDIAN : selectable ? IVORY : iv(0.2),
                  cursor: selectable ? 'pointer' : 'default',
                }}>
                {within ? (
                  <>
                    {isStart && <span className="font-mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em' }}>{terms.bandStart}</span>}
                    {isEnd && idx !== 0 && <span className="font-mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em' }}>{overflowsWeek && i === 6 ? '→' : terms.bandEnd}</span>}
                    {!isStart && !isEnd && <span style={{ width: 6, height: 6, borderRadius: 9, background: OBSIDIAN, opacity: 0.5 }} />}
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{isStart ? terms.startTime : isEnd ? terms.endTime : terms.bandMid}</span>
                  </>
                ) : selectable ? (
                  <>
                    <Plus size={14} style={{ opacity: 0.7 }} />
                    <span className="font-mono" style={{ fontSize: 9.5, letterSpacing: '.06em', opacity: 0.7 }}>{terms.start}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 16, opacity: 0.5 }}>·</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      <MultiDayNote duration={duration} spanDays={spanDays} selected={selected} terms={terms} />
    </div>
  );
}

function MultiDayNote({ duration, spanDays, selected, terms }) {
  return (
    <div className="flex gap-4 items-center flex-wrap" style={{ borderTop: `1px solid ${iv(0.07)}`, padding: '16px 20px' }}>
      <span className="inline-flex items-center gap-2 font-sans" style={{ fontSize: 13, color: iv(0.7) }}>
        <CalIcon size={16} style={{ opacity: 0.7 }} />
        {terms.stayPrefix}<strong style={{ color: IVORY, fontWeight: 700 }}>{daysLabel(duration.spanDays)}</strong>{terms.staySuffix}.
      </span>
      {selected.date && spanDays.length ? (
        <span className="font-sans" style={{ fontSize: 13, color: ACCENT }}>
          {terms.start} {germanFull(spanDays[0])} {terms.startTime} · {terms.end} {germanFull(spanDays[spanDays.length - 1])} {terms.endTime}
        </span>
      ) : (
        <span className="font-sans" style={{ fontSize: 13, color: iv(0.4) }}>Wählen Sie einen {terms.chooseDay}.</span>
      )}
    </div>
  );
}

function Legend({ children, swatch }) {
  const sw = swatch === 'busy'
    ? { background: `repeating-linear-gradient(135deg, ${iv(0.06)} 0 4px, ${iv(0.12)} 4px 5px)`, border: `1px solid ${iv(0.12)}` }
    : swatch === 'now' ? { background: GLOW }
      : { background: acc(0.12), border: `1px solid ${acc(0.45)}` };
  return (
    <span className="inline-flex items-center gap-2 font-sans" style={{ fontSize: 11.5, color: iv(0.5) }}>
      <span style={{ width: swatch === 'now' ? 12 : 13, height: swatch === 'now' ? 2 : 11, borderRadius: swatch === 'now' ? 2 : 4, ...sw }} />
      {children}
    </span>
  );
}

function NavBtn({ children, onClick, disabled, aria }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={aria}
      className="flex items-center justify-center rounded-full border border-ivory/12 text-ivory disabled:opacity-30 enabled:hover:border-accent enabled:hover:text-accent transition-colors"
      style={{ width: 40, height: 40, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
    </button>
  );
}
