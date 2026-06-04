/* ─── App shell · Wochenansicht booking step ─────────────────────────────────
   Duration-aware: the active service (chosen in Step 1 of the real flow; a
   selector here for the prototype) drives whether the week grid shows same-day
   time blocks or a multi-day drop-off band.
-----------------------------------------------------------------------------*/
const { useState, useEffect, useMemo, useRef } = React;
const C = window.CAL;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#4DB292",
  "density": "regular",
  "grain": true,
  "ambient": true
}/*EDITMODE-END*/;

const ACCENTS = ['#4DB292', '#4D9DB2', '#C9A24B', '#C77F4D'];

function hexToRgb(hex) { const h = hex.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function lighten([r, g, b], a) { const m = c => Math.round(c + (255 - c) * a); return `rgb(${m(r)}, ${m(g)}, ${m(b)})`; }

function useWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return w;
}
function mondayOf(d) { const x = C.startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const width = useWidth();
  const compact = width < 768;

  const [serviceId, setServiceId] = useState(() => localStorage.getItem('ea_service') || 'wash');
  const service = useMemo(() => C.SERVICES.find(s => s.id === serviceId) || C.SERVICES[0], [serviceId]);
  const multi = C.isMultiDay(service);

  const [selected, setSelected] = useState({ date: null, time: null });
  const [confirmed, setConfirmed] = useState(false);
  const thisMonday = useMemo(() => mondayOf(C.TODAY), []);
  const [weekStart, setWeekStart] = useState(thisMonday);

  useEffect(() => {
    const rgb = hexToRgb(t.accent);
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent-rgb', rgb.join(', '));
    document.documentElement.style.setProperty('--accent-glow', lighten(rgb, 0.25));
  }, [t.accent]);
  useEffect(() => { document.body.classList.toggle('grain', !!t.grain); }, [t.grain]);
  useEffect(() => { const a = document.querySelector('.ambient'); if (a) a.style.display = t.ambient ? '' : 'none'; }, [t.ambient]);
  useEffect(() => { localStorage.setItem('ea_service', serviceId); }, [serviceId]);

  // changing service invalidates the current pick
  const pickService = (id) => { setServiceId(id); setSelected({ date: null, time: null }); setConfirmed(false); };
  const onSelect = (date, time) => { setConfirmed(false); setSelected({ date: C.startOfDay(date), time }); };

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => C.addDays(weekStart, i)), [weekStart]);
  const canPrevWeek = weekStart > thisMonday;

  // selection summary line
  const selLabel = useMemo(() => {
    if (!selected.date) return null;
    if (multi) {
      const spanDays = C.workingSpan(selected.date, C.spanDaysOf(service));
      const last = spanDays[spanDays.length - 1];
      return `Abgabe ${C.germanFull(spanDays[0])} · Abholung ${C.germanFull(last)}`;
    }
    if (!selected.time) return null;
    const startMin = C.timeToMin(selected.time);
    const end = C.minToTime(startMin + service.min);
    return `${C.germanFull(selected.date)} · ${selected.time}–${end} Uhr`;
  }, [selected, multi, service]);

  const ready = multi ? !!selected.date : !!(selected.date && selected.time);

  const subline = multi
    ? `Wählen Sie den Abgabetag — Ihr Fahrzeug bleibt ca. ${C.daysLabel(service.days)} im Studio.`
    : `Tippen Sie eine freie Zeit an — die Termindauer richtet sich nach Ihrer Leistung (ca. ${C.durLabel(service.min)}).`;

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px clamp(18px, 5vw, 64px)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span className="drama" style={{ fontSize: 24, fontStyle: 'italic' }}>Elité</span>
          <span className="pill" style={{ fontSize: 10, color: 'rgba(250,248,245,0.4)' }}>Aufbereitung</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'rgba(250,248,245,0.4)' }}>
          <Lock size={13} /> <span>Sichere Buchung</span>
        </div>
      </header>

      <main style={{ flex: 1, width: '100%', maxWidth: 1080, margin: '0 auto', padding: '8px clamp(18px, 5vw, 48px) 150px' }}>
        <StepRail />

        <div style={{ marginTop: 22, marginBottom: 8 }}>
          <h1 className="drama" style={{ fontStyle: 'italic', fontSize: 'clamp(34px, 6vw, 56px)', lineHeight: 1.04, margin: 0, letterSpacing: '-0.01em' }}>Wann passt es Ihnen?</h1>
          <p style={{ fontSize: 'clamp(14px,2.2vw,16px)', color: 'rgba(250,248,245,0.55)', marginTop: 10, maxWidth: 560, lineHeight: 1.55 }}>{subline}</p>
        </div>

        {/* service selector + mobil note */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', margin: '18px 0 26px' }}>
          <ServiceSelector service={service} onPick={pickService} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 99, border: '1px solid rgba(250,248,245,0.1)', fontSize: 12.5, color: 'rgba(250,248,245,0.55)' }}>
            <Truck size={15} /> Mobiler Service verlängert die Dauer
          </span>
        </div>

        <WeekView week={week} service={service} selected={selected} onSelect={onSelect}
          onPrevWeek={() => canPrevWeek && setWeekStart(s => C.addDays(s, -7))}
          onNextWeek={() => setWeekStart(s => C.addDays(s, 7))}
          onToday={() => setWeekStart(thisMonday)}
          compact={compact} density={t.density} canPrev={canPrevWeek} />
      </main>

      <SelectionBar selLabel={selLabel} ready={ready} confirmed={confirmed} multi={multi}
        onClear={() => { setSelected({ date: null, time: null }); setConfirmed(false); }}
        onConfirm={() => { if (ready) setConfirmed(true); }} />

      <TweaksPanel>
        <TweakSection label="Akzent" />
        <TweakColor label="Akzentfarbe" value={t.accent} options={ACCENTS} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Darstellung" />
        <TweakRadio label="Dichte" value={t.density} options={['compact', 'regular', 'comfy']} onChange={(v) => setTweak('density', v)} />
        <TweakToggle label="Filmkorn" value={t.grain} onChange={(v) => setTweak('grain', v)} />
        <TweakToggle label="Ambiente-Licht" value={t.ambient} onChange={(v) => setTweak('ambient', v)} />
      </TweaksPanel>
    </div>
  );
}

function ServiceSelector({ service, onPick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const groups = useMemo(() => {
    const m = {};
    C.SERVICES.forEach(s => { (m[s.g] = m[s.g] || []).push(s); });
    return Object.entries(m);
  }, []);
  const dur = C.isMultiDay(service) ? C.daysLabel(service.days) : C.durLabel(service.min);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} className="focus-ring"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderRadius: 99, border: '1px solid rgba(250,248,245,0.14)', background: 'rgba(250,248,245,0.04)' }}>
        <span className="pill" style={{ fontSize: 9.5, color: 'rgba(250,248,245,0.4)' }}>Leistung</span>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{service.name}</span>
        <span style={{ width: 1, height: 14, background: 'rgba(250,248,245,0.14)' }} />
        <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>{dur}</span>
        <ChevD size={15} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>

      {open && (
        <div className="glass hide-scroll fade-up" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 30, width: 320, maxHeight: 420, overflowY: 'auto', borderRadius: 18, padding: 8, boxShadow: '0 24px 60px rgba(0,0,0,0.55)' }}>
          {groups.map(([g, items]) => (
            <div key={g} style={{ marginBottom: 6 }}>
              <div className="pill" style={{ fontSize: 9.5, color: 'var(--accent)', padding: '8px 10px 4px' }}>{g}</div>
              {items.map(s => {
                const on = s.id === service.id;
                const d = C.isMultiDay(s) ? C.daysLabel(s.days) : C.durLabel(s.min);
                return (
                  <button key={s.id} onClick={() => { onPick(s.id); setOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 11, textAlign: 'left', background: on ? 'rgba(var(--accent-rgb),0.16)' : 'transparent', color: 'var(--ivory)' }}
                    onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(250,248,245,0.05)'; }}
                    onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: on ? 700 : 500 }}>
                      {C.isMultiDay(s) && <CalIco size={13} style={{ opacity: 0.55 }} />}
                      {s.name}
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: on ? 'var(--accent)' : 'rgba(250,248,245,0.45)', whiteSpace: 'nowrap' }}>{d}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepRail() {
  const steps = ['Service', 'Termin', 'Kontakt', 'Bestätigung'];
  const active = 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: i <= active ? 1 : 0.4 }}>
            <span style={{ width: 22, height: 22, borderRadius: 99, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < active ? 'rgba(var(--accent-rgb),0.18)' : i === active ? 'var(--accent)' : 'transparent',
              color: i === active ? 'var(--obsidian)' : i < active ? 'var(--accent)' : 'rgba(250,248,245,0.5)',
              border: i > active ? '1px solid rgba(250,248,245,0.18)' : 'none' }}>{i < active ? '✓' : i + 1}</span>
            <span className="pill" style={{ fontSize: 11, color: i === active ? 'var(--ivory)' : 'rgba(250,248,245,0.45)' }}>{s}</span>
          </span>
          {i < steps.length - 1 && <span style={{ width: 18, height: 1, background: 'rgba(250,248,245,0.12)' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function SelectionBar({ selLabel, onConfirm, onClear, ready, confirmed, multi }) {
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, padding: '14px clamp(18px,5vw,48px) calc(14px + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, rgba(13,13,18,0.96) 60%, rgba(13,13,18,0))', backdropFilter: 'blur(10px)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          {selLabel ? (
            <div className="fade-up">
              <div className="pill" style={{ fontSize: 10, color: 'var(--accent)' }}>{confirmed ? 'Termin reserviert' : multi ? 'Ihr Zeitraum' : 'Ihr Termin'}</div>
              <div style={{ fontSize: 'clamp(14px,2.3vw,17px)', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                {confirmed && <span style={{ width: 22, height: 22, borderRadius: 99, background: 'var(--accent)', color: 'var(--obsidian)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} sw={3} /></span>}
                {selLabel}
                <button onClick={onClear} style={{ fontSize: 12, color: 'rgba(250,248,245,0.4)', textDecoration: 'underline', textUnderlineOffset: 3 }}>ändern</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: 'rgba(250,248,245,0.45)' }}>{multi ? 'Wählen Sie einen Abgabetag' : 'Wählen Sie einen freien Termin aus'}</div>
          )}
        </div>
        <button onClick={onConfirm} disabled={!ready} className="focus-ring"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 30px', borderRadius: 99, fontSize: 15, fontWeight: 800,
            background: ready ? 'var(--accent)' : 'rgba(250,248,245,0.08)', color: ready ? 'var(--obsidian)' : 'rgba(250,248,245,0.3)',
            cursor: ready ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', boxShadow: ready ? '0 10px 30px rgba(var(--accent-rgb),0.35)' : 'none', transition: 'background-color .2s, box-shadow .2s, transform .15s' }}
          onMouseEnter={e => { if (ready) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          {confirmed ? 'Reserviert' : 'Weiter'} {confirmed ? <Check size={18} sw={3} /> : <ArrowR size={18} />}
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
