/* ─── Wochenansicht ──────────────────────────────────────────────────────────
   Apple-Calendar week grid, duration-aware.
     • same-day service  → time blocks sized to the duration; valid starts packed
       back-to-back around existing bookings; a live "jetzt" line on today.
     • multi-day service → pick a drop-off day; an all-day band spans the working
       days the car stays in the studio.
   Collapses to a day-pill strip + single column under 768px.
-----------------------------------------------------------------------------*/
const { useState: useStateW, useMemo: useMemoW, useEffect: useEffectW } = React;

function WeekView({ week, service, selected, onSelect, onPrevWeek, onNextWeek, onToday, compact, density, canPrev }) {
  const C = window.CAL;
  const multi = C.isMultiDay(service);
  const span = multi ? C.spanDaysOf(service) : 0;
  const minPx = density === 'compact' ? 0.74 : density === 'comfy' ? 1.06 : 0.9;
  const bodyH = (C.AXIS_END - C.AXIS_START) * minPx;
  const GUTTER = 48;

  const hours = useMemoW(() => {
    const a = []; for (let h = C.AXIS_START / 60; h <= C.AXIS_END / 60; h++) a.push(h); return a;
  }, []);

  const [activeIdx, setActiveIdx] = useStateW(() => {
    const i = week.findIndex(d => C.sameDay(d, selected.date));
    if (i >= 0) return i;
    const t = week.findIndex(d => C.sameDay(d, C.TODAY));
    return t >= 0 ? t : 1;
  });
  useEffectW(() => {
    const i = week.findIndex(d => C.sameDay(d, selected.date));
    if (i >= 0) setActiveIdx(i);
  }, [selected.date]); // eslint-disable-line

  const weekLabel = useMemoW(() => {
    const a = week[0], b = week[6];
    if (a.getMonth() === b.getMonth()) return `${a.getDate()}.–${b.getDate()}. ${C.MONTHS[a.getMonth()]} ${a.getFullYear()}`;
    return `${a.getDate()}. ${C.MONTHS[a.getMonth()].slice(0, 3)} – ${b.getDate()}. ${C.MONTHS[b.getMonth()].slice(0, 3)} ${b.getFullYear()}`;
  }, [week]);

  // multi-day span membership
  const spanDays = useMemoW(() => (multi && selected.date) ? C.workingSpan(selected.date, span) : [], [multi, span, selected.date]);
  const inSpan = (d) => spanDays.some(s => C.sameDay(s, d));
  const spanIndex = (d) => spanDays.findIndex(s => C.sameDay(s, d));

  const nowTop = useMemoW(() => {
    if (C.NOW_MIN < C.AXIS_START || C.NOW_MIN > C.AXIS_END) return null;
    return (C.NOW_MIN - C.AXIS_START) * minPx;
  }, [minPx]);

  // ── SAME-DAY column ──
  function DayColumn({ date }) {
    const wh = C.HOURS[date.getDay()];
    const plan = C.sameDayPlan(date, service.min);
    const isToday = C.sameDay(date, C.TODAY);
    const closeTop = wh ? (wh[1] - C.AXIS_START) * minPx : bodyH;

    return (
      <div style={{ position: 'relative', flex: 1, minWidth: 0, borderLeft: '1px solid rgba(250,248,245,0.05)' }}>
        {hours.map(h => (
          <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: (h * 60 - C.AXIS_START) * minPx, borderTop: '1px solid rgba(250,248,245,0.045)' }} />
        ))}
        {/* after-hours / closed shade (e.g. Sat after 13:00) */}
        {wh && closeTop < bodyH && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: closeTop, height: bodyH - closeTop, background: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.18) 0 6px, rgba(0,0,0,0.28) 6px 7px)' }} />
        )}
        {plan.closed && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="pill" style={{ transform: 'rotate(-90deg)', opacity: 0.4 }}>Geschlossen</span>
          </div>
        )}
        {/* past shade */}
        {plan.past && (
          <Region top={(plan.past[0] - C.AXIS_START) * minPx} h={(plan.past[1] - plan.past[0]) * minPx} kind="past" />
        )}
        {/* busy / belegt */}
        {plan.busy.map(([s, e], i) => (
          <Region key={i} top={(s - C.AXIS_START) * minPx} h={(e - s) * minPx} kind="busy" label={(e - s) * minPx > 34 ? 'Belegt' : ''} />
        ))}
        {/* now line */}
        {isToday && nowTop != null && (
          <div style={{ position: 'absolute', left: -2, right: 0, top: nowTop, zIndex: 6, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: 'var(--accent-glow)', boxShadow: '0 0 8px var(--accent)' }} />
            <span style={{ flex: 1, height: 1.5, background: 'var(--accent-glow)', opacity: 0.85 }} />
          </div>
        )}
        {/* free blocks */}
        {plan.free.map(b => {
          const top = (b.start - C.AXIS_START) * minPx;
          const h = (b.end - b.start) * minPx;
          const isSel = C.sameDay(date, selected.date) && selected.time === C.minToTime(b.start);
          return (
            <button key={b.start} className={(isSel ? 'slot slot-selected' : 'slot slot-free') + ' focus-ring'}
              onClick={() => onSelect(date, C.minToTime(b.start))}
              style={{ position: 'absolute', left: 4, right: 4, top: top + 1.5, height: Math.max(h - 3, 26), borderRadius: 11, padding: h > 50 ? '7px 9px' : '4px 9px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 12.5, fontWeight: 700 }}>{C.minToTime(b.start)}</span>
                {isSel && <Check size={13} sw={3} />}
              </span>
              {h > 44 && (
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', opacity: isSel ? 0.85 : 0.55 }}>
                  bis {C.minToTime(b.end)} · {C.durLabel(service.min)}
                </span>
              )}
            </button>
          );
        })}
        {/* no-fit notice */}
        {!plan.closed && !plan.fullyPast && plan.free.length === 0 && (
          <div style={{ position: 'absolute', left: 6, right: 6, top: '42%', textAlign: 'center' }}>
            <span className="mono" style={{ fontSize: 9.5, color: 'rgba(250,248,245,0.3)', textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1.5 }}>An diesem Tag<br />nicht möglich</span>
          </div>
        )}
      </div>
    );
  }

  const columns = compact ? [week[activeIdx]] : week;

  return (
    <div className="fade-up">
      {/* nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{weekLabel}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavBtn onClick={onPrevWeek} disabled={!canPrev} aria="Vorherige Woche"><ChevL size={18} /></NavBtn>
          <button onClick={onToday} className="focus-ring" style={{ padding: '8px 16px', borderRadius: 99, border: '1px solid rgba(250,248,245,0.12)', fontSize: 13, fontWeight: 600, color: 'var(--ivory)', background: 'rgba(250,248,245,0.03)' }}>Heute</button>
          <NavBtn onClick={onNextWeek} aria="Nächste Woche"><ChevR size={18} /></NavBtn>
        </div>
      </div>

      {/* mobile day pills */}
      {compact && (
        <div className="hide-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 6 }}>
          {week.map((d, i) => {
            const closed = !C.isWorkingDay(d);
            const isT = C.sameDay(d, C.TODAY);
            const act = i === activeIdx;
            const selectableMulti = multi && C.multiDayStartFree(d, span);
            const within = multi && inSpan(d);
            const onClickPill = multi ? () => { setActiveIdx(i); if (selectableMulti) onSelect(d, null); } : () => setActiveIdx(i);
            const cnt = multi ? 0 : C.freeStartCount(d, service.min);
            return (
              <button key={i} onClick={onClickPill} disabled={closed || (multi && !selectableMulti && !within)}
                style={{ flex: '0 0 auto', width: 58, padding: '9px 0', borderRadius: 16, textAlign: 'center',
                  border: (within || (!multi && act)) ? '1px solid var(--accent)' : '1px solid rgba(250,248,245,0.08)',
                  background: within ? 'var(--accent)' : act ? 'rgba(var(--accent-rgb),0.14)' : 'transparent',
                  color: within ? 'var(--obsidian)' : 'var(--ivory)', opacity: closed ? 0.3 : 1 }}>
                <div className="pill" style={{ fontSize: 10, color: within ? 'var(--obsidian)' : isT ? 'var(--accent)' : 'rgba(250,248,245,0.5)' }}>{C.DAYS_SHORT[d.getDay()]}</div>
                <div className="drama" style={{ fontSize: 22, fontStyle: 'italic', lineHeight: 1.1, margin: '2px 0' }}>{d.getDate()}</div>
                <div style={{ height: 5, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  {!multi && !closed && Array.from({ length: Math.min(cnt, 3) }).map((_, k) => <Dot key={k} size={4} color="var(--accent)" />)}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* grid */}
      <div className="glass" style={{ borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {/* day header row (desktop) */}
        {!compact && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(250,248,245,0.07)' }}>
            <div style={{ width: GUTTER, flex: '0 0 auto' }} />
            {week.map((d, i) => {
              const isT = C.sameDay(d, C.TODAY);
              const closed = !C.isWorkingDay(d);
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '11px 4px', borderLeft: '1px solid rgba(250,248,245,0.05)', opacity: closed ? 0.4 : 1 }}>
                  <div className="pill" style={{ fontSize: 10, color: isT ? 'var(--accent)' : 'rgba(250,248,245,0.45)' }}>{C.DAYS_SHORT[d.getDay()]}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginTop: 3, color: isT ? 'var(--obsidian)' : 'var(--ivory)', background: isT ? 'var(--accent)' : 'transparent', width: 30, height: 30, lineHeight: '30px', borderRadius: 99, margin: '3px auto 0' }}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
        )}

        {multi
          ? <MultiDayBand week={week} compact={compact} span={span} service={service} selected={selected} onSelect={onSelect} inSpan={inSpan} spanIndex={spanIndex} spanDays={spanDays} GUTTER={GUTTER} />
          : (
            <div className="hide-scroll" style={{ display: 'flex', maxHeight: compact ? '54vh' : 528, overflowY: 'auto' }}>
              <div style={{ width: GUTTER, flex: '0 0 auto', position: 'relative', height: bodyH }}>
                {hours.map(h => (
                  <div key={h} className="mono" style={{ position: 'absolute', top: (h * 60 - C.AXIS_START) * minPx - 6, right: 9, fontSize: 10, color: 'rgba(250,248,245,0.32)' }}>{String(h).padStart(2, '0')}:00</div>
                ))}
              </div>
              <div style={{ display: 'flex', flex: 1, position: 'relative', height: bodyH }}>
                {columns.map(d => <DayColumn key={C.isoKey(d)} date={d} />)}
              </div>
            </div>
          )}
      </div>

      {/* legend */}
      {!multi && (
        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
          <LegendW swatch="free">frei · {C.durLabel(service.min)}</LegendW>
          <LegendW swatch="busy">belegt</LegendW>
          <LegendW swatch="now">jetzt</LegendW>
        </div>
      )}
    </div>
  );
}

// shaded region (past / busy)
function Region({ top, h, kind, label }) {
  const styles = kind === 'busy'
    ? { background: 'repeating-linear-gradient(135deg, rgba(250,248,245,0.03) 0 7px, rgba(250,248,245,0.07) 7px 8px)', border: '1px solid rgba(250,248,245,0.07)' }
    : { background: 'rgba(0,0,0,0.18)' };
  return (
    <div style={{ position: 'absolute', left: 4, right: 4, top: top + 1, height: Math.max(h - 2, 0), borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', ...styles }}>
      {label && <span className="mono" style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(250,248,245,0.3)' }}>{label}</span>}
    </div>
  );
}

// ── multi-day all-day band (desktop) ──
function MultiDayBand({ week, compact, span, service, selected, onSelect, inSpan, spanIndex, spanDays, GUTTER }) {
  const C = window.CAL;
  if (compact) {
    // mobile uses the day-pill strip above for selection; show only the summary panel
    return <MultiDayNote service={service} span={span} spanDays={spanDays} selected={selected} />;
  }
  const lastSpan = spanDays[spanDays.length - 1];
  const overflowsWeek = lastSpan && lastSpan > week[6];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: GUTTER, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 9 }}>
          <span className="mono" style={{ fontSize: 9, color: 'rgba(250,248,245,0.32)', textTransform: 'uppercase', letterSpacing: '.06em', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Ganztägig</span>
        </div>
        {week.map((d, i) => {
          const within = inSpan(d);
          const idx = spanIndex(d);
          const selectable = C.multiDayStartFree(d, span);
          const isStart = idx === 0;
          const isEnd = within && (idx === spanDays.length - 1 || (overflowsWeek && i === 6));
          return (
            <div key={i} style={{ flex: 1, minWidth: 0, borderLeft: '1px solid rgba(250,248,245,0.05)', padding: '12px 5px', minHeight: 96, display: 'flex' }}>
              <button disabled={!selectable && !within} onClick={() => selectable && onSelect(d, null)} className="focus-ring slot"
                style={{ flex: 1, borderRadius: 12, padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, textAlign: 'center',
                  background: within ? 'var(--accent)' : selectable ? 'rgba(var(--accent-rgb),0.08)' : 'transparent',
                  border: within ? '1px solid var(--accent)' : selectable ? '1px dashed rgba(var(--accent-rgb),0.4)' : '1px dashed rgba(250,248,245,0.07)',
                  color: within ? 'var(--obsidian)' : selectable ? 'var(--ivory)' : 'rgba(250,248,245,0.2)',
                  cursor: selectable ? 'pointer' : 'default' }}>
                {within ? (
                  <>
                    {isStart && <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em' }}>ABGABE</span>}
                    {isEnd && idx !== 0 && <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.08em' }}>{overflowsWeek && i === 6 && lastSpan > week[6] ? '→' : 'ABHOLUNG'}</span>}
                    {!isStart && !isEnd && <span style={{ width: 6, height: 6, borderRadius: 9, background: 'var(--obsidian)', opacity: 0.5 }} />}
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{isStart ? `bis ${C.DROPOFF_BY}` : isEnd ? `ab ${C.PICKUP_FROM}` : 'im Studio'}</span>
                  </>
                ) : selectable ? (
                  <>
                    <Plus />
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.06em', opacity: 0.7 }}>Abgabe</span>
                  </>
                ) : (
                  <span style={{ fontSize: 16, opacity: 0.5 }}>·</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      <MultiDayNote service={service} span={span} spanDays={spanDays} selected={selected} />
    </div>
  );
}

function MultiDayNote({ service, span, spanDays, selected }) {
  const C = window.CAL;
  return (
    <div style={{ borderTop: '1px solid rgba(250,248,245,0.07)', padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(250,248,245,0.7)' }}>
        <CalIco size={16} style={{ opacity: 0.7 }} />
        Ihr Fahrzeug bleibt <strong style={{ color: 'var(--ivory)', fontWeight: 700 }}>{C.daysLabel(service.days)}</strong> im Studio.
      </span>
      {selected.date ? (
        <span style={{ fontSize: 13, color: 'var(--accent)' }}>
          Abgabe {C.germanFull(spanDays[0])} bis {C.DROPOFF_BY} · Abholung {C.germanFull(spanDays[spanDays.length - 1])} ab {C.PICKUP_FROM}
        </span>
      ) : (
        <span style={{ fontSize: 13, color: 'rgba(250,248,245,0.4)' }}>Wählen Sie einen Abgabetag.</span>
      )}
    </div>
  );
}

function LegendW({ children, swatch }) {
  const sw = swatch === 'busy'
    ? { background: 'repeating-linear-gradient(135deg, rgba(250,248,245,0.06) 0 4px, rgba(250,248,245,0.12) 4px 5px)', border: '1px solid rgba(250,248,245,0.12)' }
    : swatch === 'now' ? { background: 'var(--accent-glow)' }
    : { background: 'rgba(var(--accent-rgb),0.12)', border: '1px solid rgba(var(--accent-rgb),0.45)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'rgba(250,248,245,0.5)' }}>
      <span style={{ width: swatch === 'now' ? 12 : 13, height: swatch === 'now' ? 2 : 11, borderRadius: swatch === 'now' ? 2 : 4, ...sw }} />
      {children}
    </span>
  );
}

function Plus() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.7 }}><path d="M12 5v14M5 12h14" /></svg>;
}

function NavBtn({ children, onClick, disabled, aria }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={aria} className="focus-ring"
      style={{ width: 40, height: 40, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(250,248,245,0.12)', color: 'var(--ivory)', opacity: disabled ? 0.28 : 1, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'border-color .15s, color .15s' }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(250,248,245,0.12)'; e.currentTarget.style.color = 'var(--ivory)'; }}>
      {children}
    </button>
  );
}

Object.assign(window, { WeekView, NavBtn });
