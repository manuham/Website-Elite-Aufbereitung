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
  AXIS_START, AXIS_END, DROPOFF_BY, PICKUP_FROM, DAYS_SHORT, MONTHS,
  sameDay, isoKey, minToTime, isWorkingDay, durLabel, daysLabel, germanFull,
  sameDayPlan, freeStartCount, workingSpan, multiDayStartFree,
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

// shaded region (past / busy)
function Region({ top, h, kind, label }) {
  const style = kind === 'busy'
    ? { background: `repeating-linear-gradient(135deg, ${iv(0.03)} 0 7px, ${iv(0.07)} 7px 8px)`, border: `1px solid ${iv(0.07)}` }
    : { background: 'rgba(0,0,0,0.18)' };
  return (
    <div style={{ position: 'absolute', left: 4, right: 4, top: top + 1, height: Math.max(h - 2, 0), borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      {label && <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '.1em', color: iv(0.3) }}>{label}</span>}
    </div>
  );
}

export default function WeekCalendar({
  week, duration, busyByIso, now, selected,
  onSelectSameDay, onSelectMultiDay,
  onPrevWeek, onNextWeek, onToday, canPrev,
  compact,
}) {
  const rootRef = useRef(null);
  const multi = !!duration.multiDay;
  const span = multi ? duration.spanDays : 0;
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

  // ── same-day column ──
  function DayColumn({ date }) {
    const plan = sameDayPlan(date, duration.durationMin, busyByIso[isoKey(date)] || [], now);
    const isToday = sameDay(date, today);
    const wh = isWorkingDay(date) ? plan.close : null;
    const closeTop = wh ? (plan.close - AXIS_START) * MIN_PX : bodyH;

    return (
      <div style={{ position: 'relative', flex: 1, minWidth: 0, borderLeft: `1px solid ${iv(0.05)}` }}>
        {hours.map(h => (
          <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: (h * 60 - AXIS_START) * MIN_PX, borderTop: `1px solid ${iv(0.045)}` }} />
        ))}
        {/* after-hours / closed shade */}
        {!plan.closed && closeTop < bodyH && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: closeTop, height: bodyH - closeTop, background: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.18) 0 6px, rgba(0,0,0,0.28) 6px 7px)' }} />
        )}
        {plan.closed && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-mono uppercase" style={{ transform: 'rotate(-90deg)', opacity: 0.4, fontSize: 10, letterSpacing: '.08em', color: iv(0.5) }}>Geschlossen</span>
          </div>
        )}
        {/* past shade */}
        {plan.past && <Region top={(plan.past[0] - AXIS_START) * MIN_PX} h={(plan.past[1] - plan.past[0]) * MIN_PX} kind="past" />}
        {plan.fullyPast && <Region top={0} h={bodyH} kind="past" />}
        {/* busy */}
        {plan.busy.map(([s, e], i) => (
          <Region key={i} top={(s - AXIS_START) * MIN_PX} h={(e - s) * MIN_PX} kind="busy" label={(e - s) * MIN_PX > 34 ? 'Belegt' : ''} />
        ))}
        {/* now line */}
        {isToday && nowTop != null && (
          <div style={{ position: 'absolute', left: -2, right: 0, top: nowTop, zIndex: 6, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: GLOW, boxShadow: `0 0 8px ${ACCENT}` }} />
            <span style={{ flex: 1, height: 1.5, background: GLOW, opacity: 0.85 }} />
          </div>
        )}
        {/* free blocks */}
        {plan.free.map(b => {
          const top = (b.start - AXIS_START) * MIN_PX;
          const h = (b.end - b.start) * MIN_PX;
          const isSel = sameDay(date, selected.date) && selected.time === minToTime(b.start);
          return (
            <button key={b.start} type="button" onClick={() => onSelectSameDay(date, minToTime(b.start))}
              style={{
                position: 'absolute', left: 4, right: 4, top: top + 1.5, height: Math.max(h - 3, 26), borderRadius: 11,
                padding: h > 50 ? '7px 9px' : '4px 9px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden',
                background: isSel ? ACCENT : acc(0.08), border: `1px solid ${isSel ? ACCENT : acc(0.28)}`,
                color: isSel ? OBSIDIAN : IVORY, boxShadow: isSel ? `0 8px 26px ${acc(0.4)}` : 'none',
                cursor: 'pointer', transition: 'background .15s, border-color .15s, transform .15s',
              }}
              onMouseEnter={(ev) => { if (!isSel) { ev.currentTarget.style.background = acc(0.16); ev.currentTarget.style.borderColor = acc(0.55); ev.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={(ev) => { if (!isSel) { ev.currentTarget.style.background = acc(0.08); ev.currentTarget.style.borderColor = acc(0.28); ev.currentTarget.style.transform = 'none'; } }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'space-between' }}>
                <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{minToTime(b.start)}</span>
                {isSel && <Check size={13} strokeWidth={3} />}
              </span>
              {h > 44 && (
                <span className="font-mono uppercase" style={{ fontSize: 9.5, letterSpacing: '.08em', opacity: isSel ? 0.85 : 0.55 }}>
                  bis {minToTime(b.end)} · {durLabel(duration.durationMin)}
                </span>
              )}
            </button>
          );
        })}
        {/* no-fit */}
        {!plan.closed && !plan.fullyPast && plan.free.length === 0 && (
          <div style={{ position: 'absolute', left: 6, right: 6, top: '42%', textAlign: 'center' }}>
            <span className="font-mono uppercase" style={{ fontSize: 9.5, color: iv(0.3), letterSpacing: '.06em', lineHeight: 1.5 }}>An diesem Tag<br />nicht möglich</span>
          </div>
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
        <div className="flex items-center gap-2">
          <NavBtn onClick={onPrevWeek} disabled={!canPrev} aria="Vorherige Woche"><ChevronLeft size={18} /></NavBtn>
          <button type="button" onClick={onToday} className="font-sans rounded-full border border-ivory/12 text-ivory bg-ivory/[0.03] hover:border-accent hover:text-accent transition-colors" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>Heute</button>
          <NavBtn onClick={onNextWeek} aria="Nächste Woche"><ChevronRight size={18} /></NavBtn>
        </div>
      </div>

      {/* mobile day pills */}
      {compact && (
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-2.5 mb-1.5">
          {week.map((d, i) => {
            const closed = !isWorkingDay(d);
            const isT = sameDay(d, today);
            const act = i === activeIdx;
            const selectableMulti = multi && multiDayStartFree(d, span, busyByIso, now);
            const within = multi && inSpan(d);
            const cnt = multi ? 0 : freeStartCount(d, duration.durationMin, busyByIso[isoKey(d)] || [], now);
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
              const closed = !isWorkingDay(d);
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '11px 4px', borderLeft: `1px solid ${iv(0.05)}`, opacity: closed ? 0.4 : 1 }}>
                  <div className="font-mono uppercase" style={{ fontSize: 10, letterSpacing: '.08em', color: isT ? ACCENT : iv(0.45) }}>{DAYS_SHORT[d.getDay()]}</div>
                  <div className="font-sans" style={{ fontSize: 17, fontWeight: 700, marginTop: 3, color: isT ? OBSIDIAN : IVORY, background: isT ? ACCENT : 'transparent', width: 30, height: 30, lineHeight: '30px', borderRadius: 99, margin: '3px auto 0' }}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
        )}

        {multi ? (
          <MultiDayBand
            week={week} compact={compact} span={span} duration={duration} selected={selected}
            onSelectMultiDay={onSelectMultiDay} inSpan={inSpan} spanIndex={spanIndex} spanDays={spanDays}
            busyByIso={busyByIso} now={now}
          />
        ) : (
          <div className="hide-scrollbar flex overflow-y-auto" style={{ maxHeight: compact ? '54vh' : 528 }}>
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

      {/* legend (same-day only) */}
      {!multi && (
        <div className="flex gap-4 mt-3.5 flex-wrap">
          <Legend swatch="free">frei · {durLabel(duration.durationMin)}</Legend>
          <Legend swatch="busy">belegt</Legend>
          <Legend swatch="now">jetzt</Legend>
        </div>
      )}
    </div>
  );
}

// ── multi-day all-day band ──
function MultiDayBand({ week, compact, span, duration, selected, onSelectMultiDay, inSpan, spanIndex, spanDays, busyByIso, now }) {
  if (compact) {
    // mobile uses the day-pill strip above for selection; show only the note
    return <MultiDayNote duration={duration} spanDays={spanDays} selected={selected} />;
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
          const selectable = multiDayStartFree(d, span, busyByIso, now);
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
                    {isStart && <span className="font-mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em' }}>ABGABE</span>}
                    {isEnd && idx !== 0 && <span className="font-mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em' }}>{overflowsWeek && i === 6 ? '→' : 'ABHOLUNG'}</span>}
                    {!isStart && !isEnd && <span style={{ width: 6, height: 6, borderRadius: 9, background: OBSIDIAN, opacity: 0.5 }} />}
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{isStart ? `bis ${DROPOFF_BY}` : isEnd ? `ab ${PICKUP_FROM}` : 'im Studio'}</span>
                  </>
                ) : selectable ? (
                  <>
                    <Plus size={14} style={{ opacity: 0.7 }} />
                    <span className="font-mono" style={{ fontSize: 9.5, letterSpacing: '.06em', opacity: 0.7 }}>Abgabe</span>
                  </>
                ) : (
                  <span style={{ fontSize: 16, opacity: 0.5 }}>·</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      <MultiDayNote duration={duration} spanDays={spanDays} selected={selected} />
    </div>
  );
}

function MultiDayNote({ duration, spanDays, selected }) {
  return (
    <div className="flex gap-4 items-center flex-wrap" style={{ borderTop: `1px solid ${iv(0.07)}`, padding: '16px 20px' }}>
      <span className="inline-flex items-center gap-2 font-sans" style={{ fontSize: 13, color: iv(0.7) }}>
        <CalIcon size={16} style={{ opacity: 0.7 }} />
        Ihr Fahrzeug bleibt <strong style={{ color: IVORY, fontWeight: 700 }}>{daysLabel(duration.spanDays)}</strong> im Studio.
      </span>
      {selected.date && spanDays.length ? (
        <span className="font-sans" style={{ fontSize: 13, color: ACCENT }}>
          Abgabe {germanFull(spanDays[0])} bis {DROPOFF_BY} · Abholung {germanFull(spanDays[spanDays.length - 1])} ab {PICKUP_FROM}
        </span>
      ) : (
        <span className="font-sans" style={{ fontSize: 13, color: iv(0.4) }}>Wählen Sie einen Abgabetag.</span>
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
