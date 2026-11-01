/* ===================================================================================
   „Élite Winterschutz" — winterschutz.html, „Der Wischer".

   The whole page is one idea: you look through a windscreen in winter. Each section holds the screen while the scroll
   plays one physical thing from the winter or the wash, with Matthias' words inside it.

   The wipers (Manuel, 2026-11-01: „they do not look real"). Now drawn the way a real one is built: a tapered arm with its
   spring housing, one curved blade with a clip in the middle, a rubber lip, and a soft shadow on the glass. They move like
   one: up across the glass, back down, and they park low at the foot of the windscreen. Two of them, in tandem, as on a
   left-hand-drive car; one long one on an upright phone. The frost is painted on a canvas and each wiper rubs it off
   along hundreds of concentric arcs, so the wiped glass has the fine streaks of real rubber and no cut edge.

   Same safety net as the other pages: everything that starts hidden is shown by a tween, and if animation frames are
   paused the page un-hides itself after two seconds.
   =================================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = $('.wi-stage');
  if (!stage) return;

  const showAll = () => {
    $$('.wi-reveal').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    $$('.wi-w').forEach((el) => { el.style.opacity = '1'; });
    $$('.wi-not, .wi-msg-btn').forEach((el) => { el.style.opacity = '1'; });
    $$('.wi-fl').forEach((el) => el.style.setProperty('--p', 1));
    $$('.hq-row').forEach((el) => el.classList.add('is-in'));
  };

  /* the FAQ works with or without animation: one open at a time, the first one stands open, as on the home page */
  const rows = $$('.wi-faq .hq-row');
  const turn = (row, on) => {
    const panel = $('.hq-a', row);
    const inner = $('.hq-a-in', row);
    $('.hq-btn', row).setAttribute('aria-expanded', on ? 'true' : 'false');
    row.classList.toggle('is-open', on);
    if (reduced || !window.gsap) { panel.style.height = on ? 'auto' : '0'; return; }
    gsap.killTweensOf(panel);
    if (!on) panel.style.height = `${panel.offsetHeight}px`;
    gsap.to(panel, {
      height: on ? inner.offsetHeight : 0,
      duration: on ? 0.74 : 0.44,
      ease: on ? 'expo.out' : 'power2.inOut',
      onComplete: () => { if (on) panel.style.height = 'auto'; if (window.ScrollTrigger) ScrollTrigger.refresh(); },
    });
  };
  rows.forEach((row, i) => {
    $('.hq-btn', row).addEventListener('click', () => {
      const open = row.classList.contains('is-open');
      rows.forEach((o) => { if (o !== row && o.classList.contains('is-open')) turn(o, false); });
      turn(row, !open);
    });
    if (i === 0) {
      row.classList.add('is-open');
      $('.hq-btn', row).setAttribute('aria-expanded', 'true');
      $('.hq-a', row).style.height = 'auto';
    }
  });

  if (reduced || !window.gsap) {
    if (!window.gsap) document.documentElement.classList.remove('hx-js');   // no engine: the plain column, not a stage that never moves
    $$('.wi-h1-big, .wi-h1-sub').forEach((el) => { el.style.opacity = '1'; });
    showAll();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------------- what the scenes share */
  const RAD = Math.PI / 180;
  const f1 = (n) => Math.round(n * 10) / 10;
  const nav = () => parseFloat(getComputedStyle(document.body).getPropertyValue('--study-nav')) || 48;
  /* one scrubbed timeline per scene: it plays while the scene holds the screen */
  const held = (el, onUpdate) => gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate,
    scrollTrigger: { trigger: el, start: () => `top ${nav()}px`, end: 'bottom bottom', scrub: 0.35, invalidateOnRefresh: true },
  });
  /* ScrollTrigger sets a timeline silently when it refreshes (a reload halfway down the page, a font coming in late, a turned phone),
     so a scene that draws itself in onUpdate would stay on its old picture until the next scroll. So it also draws after every refresh. */
  const redraw = (fn) => ScrollTrigger.addEventListener('refresh', fn);
  const seeded = (start) => { let s = start; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

  /* big type fills the screen, but never spills out of it: on a short window it comes down until everything fits.
     The stylesheet multiplies its sizes by --fit. */
  const fit = (box, content, room = 0) => {
    box.style.setProperty('--fit', 1);
    let f = 1;
    for (let i = 0; i < 14 && content() > box.clientHeight - room && f > 0.45; i++) {
      f -= 0.05;
      box.style.setProperty('--fit', f.toFixed(2));
    }
    return f;
  };

  /* One wiper, drawn along +x from its pivot at 0,0. The silhouette is what makes it read: a thick spring housing that
     narrows into a flat arm, carrying one long slightly curved blade by a clip at its middle. */
  let wiperCount = 0;
  const wiperSVG = (r1, r2, t) => {
    wiperCount += 1;
    const id = `wg${wiperCount}`;
    const m = (r1 + r2) / 2;
    const half = (r2 - r1) / 2;
    const bow = -(r2 - r1) * 0.009;                                   // blades are bent a little, to press on a curved screen
    const yAt = (x) => { const u = (x - m) / half; return bow * (1 - u * u); };
    const wAt = (x) => { const u = Math.abs((x - m) / half); return t * (0.56 + 0.44 * (1 - u ** 1.8)); };
    const N = 30;
    const xs = Array.from({ length: N + 1 }, (_, i) => r1 + ((r2 - r1) * i) / N);
    const edge = (sign, k = 0.5) => xs.map((x) => `${f1(x)} ${f1(yAt(x) + sign * wAt(x) * k)}`);
    const top = edge(-1);
    const bot = edge(1).reverse();
    const blade = `M${top.join('L')}Q${f1(r2 + t * 0.5)} ${f1(yAt(r2))} ${bot[0]}L${bot.join('L')}Q${f1(r1 - t * 0.5)} ${f1(yAt(r1))} ${top[0]}Z`;
    const spine = `M${edge(-1, 0.2).slice(2, N - 1).join('L')}`;
    const lip = `M${edge(1, 0.54).join('L')}`;
    // the notches of the blade's cover, a little either side of the clip
    const notches = [-0.72, -0.4, 0.4, 0.72].map((u) => {
      const x = m + u * half; const w = wAt(x);
      return `M${f1(x)} ${f1(yAt(x) - w / 2)}L${f1(x + t * 0.18)} ${f1(yAt(x) + w / 2)}`;
    }).join('');
    // the arm: housing at the pivot, shoulder, then the flat strip to the clip
    const w0 = t * 1.42; const w1 = t * 1.02; const w2 = t * 0.5;
    const x1 = m * 0.46; const x2 = m * 0.52;
    const yc = yAt(m);
    const arm = `M${f1(-t * 1.1)} ${f1(-w0 * 0.5)}Q${f1(-t * 1.5)} 0 ${f1(-t * 1.1)} ${f1(w0 * 0.5)}L${f1(x1)} ${f1(w1 / 2)}L${f1(x2)} ${f1(w2 / 2)}L${f1(m)} ${f1(yc + w2 * 0.42)}L${f1(m)} ${f1(yc - w2 * 0.42)}L${f1(x2)} ${f1(-w2 / 2)}L${f1(x1)} ${f1(-w1 / 2)}Z`;
    const seam = `M${f1(t * 0.3)} ${f1(-w0 * 0.2)}L${f1(x1 * 0.96)} ${f1(-w1 * 0.16)}`;
    const cw = t * 3.6; const ch = t * 1.3;
    return `<svg class="wi-wiper" width="1" height="1" aria-hidden="true">
      <defs>
        <linearGradient id="${id}b" x1="0" y1="${f1(-t * 0.7)}" x2="0" y2="${f1(t * 0.7)}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#3b3d43"/><stop offset=".3" stop-color="#1a1b1f"/><stop offset=".72" stop-color="#08090b"/><stop offset="1" stop-color="#020203"/>
        </linearGradient>
        <linearGradient id="${id}a" x1="0" y1="${f1(-w0 / 2)}" x2="0" y2="${f1(w0 / 2)}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#4a4d54"/><stop offset=".26" stop-color="#23252a"/><stop offset=".78" stop-color="#0c0d10"/><stop offset="1" stop-color="#030304"/>
        </linearGradient>
      </defs>
      <g class="wi-wiper-shadow"><path d="${blade}"/><path d="${arm}"/></g>
      <path d="${arm}" fill="url(#${id}a)" stroke="rgba(255,255,255,.1)" stroke-width="1"/>
      <path d="${seam}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1.2" stroke-linecap="round"/>
      <path d="${lip}" fill="none" stroke="#000" stroke-width="${f1(Math.max(1.6, t * 0.16))}" stroke-linecap="round"/>
      <path d="${blade}" fill="url(#${id}b)" stroke="rgba(255,255,255,.12)" stroke-width="1"/>
      <path d="${spine}" fill="none" stroke="rgba(255,255,255,.26)" stroke-width="${f1(Math.max(0.9, t * 0.07))}" stroke-linecap="round"/>
      <path d="${notches}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1"/>
      <rect x="${f1(m - cw / 2)}" y="${f1(yc - ch / 2)}" width="${f1(cw)}" height="${f1(ch)}" rx="${f1(t * 0.26)}" fill="url(#${id}a)" stroke="rgba(255,255,255,.16)"/>
      <path d="M${f1(m - cw * 0.3)} ${f1(yc - ch * 0.18)}H${f1(m + cw * 0.3)}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1"/>
    </svg>`;
  };

  /* the wet film a blade leaves behind it: fine arcs that fade away from the rubber. Drawn once, it turns with the arm. */
  const smearCanvas = (g, seed) => {
    const spread = 15 * RAD;
    const c = document.createElement('canvas');
    c.className = 'wi-smear';
    c.width = Math.ceil(g.r2 + 4);
    c.height = Math.ceil(g.r2 * Math.sin(spread) + 4);
    const x = c.getContext('2d');
    const rnd = seeded(seed);
    x.lineCap = 'round';
    for (let r = g.r1; r < g.r2; r += 2.5 + rnd() * 7) {
      const len = spread * (0.22 + 0.78 * rnd());
      const a = 0.05 + rnd() * 0.17;
      x.lineWidth = 0.6 + rnd() * 1.3;
      for (let s = 0; s < 7; s++) {
        x.strokeStyle = `rgba(255,255,255,${(a * (1 - s / 7)).toFixed(3)})`;
        x.beginPath();
        x.arc(0, 0, r, (len * s) / 7, (len * (s + 1)) / 7);
        x.stroke();
      }
    }
    return c;
  };
  /* the frost a blade pushes ahead of itself, on the side it is moving to */
  const powderCanvas = (g, t, seed) => {
    const band = Math.ceil(t * 2.4);
    const c = document.createElement('canvas');
    c.className = 'wi-powder';
    c.width = Math.ceil(g.r2 + 4);
    c.height = band + Math.ceil(t);
    c.style.top = `${-c.height}px`;
    const x = c.getContext('2d');
    const rnd = seeded(seed);
    const n = (g.r2 - g.r1) * 1.6;
    x.fillStyle = '#f2f7fa';
    for (let i = 0; i < n; i++) {
      const px = g.r1 + rnd() * (g.r2 - g.r1);
      const d = rnd() * rnd() * band;
      const s = 0.7 + rnd() * 1.9;
      x.globalAlpha = (0.25 + rnd() * 0.7) * (1 - d / band);
      x.fillRect(px, c.height - t * 0.46 - d, s, s);
    }
    return c;
  };
  const mountArm = (el, g, t, extras = {}) => {
    el.style.left = `${f1(g.cx)}px`;
    el.style.top = `${f1(g.cy)}px`;
    el.innerHTML = wiperSVG(g.r1, g.r2, t);
    if (extras.smear) { const s = smearCanvas(g, extras.smear); el.prepend(s); el.smear = s; }
    if (extras.powder) { const p = powderCanvas(g, t, extras.powder); el.prepend(p); el.powder = p; }
  };
  const bladeSize = (w, h) => Math.max(11, Math.min(30, Math.min(w, h * 1.6) * 0.0165));

  /* the wipers of the later scenes reach further than the screen, so one stroke clears all of it. Two on a wide window, one upright. */
  const longWipers = (w, h) => {
    if (w / h < 1.02) {
      return [{ cx: w * 0.06, cy: h * 1.012, r1: w * 0.22, r2: Math.hypot(w * 0.94, h) * 1.03, rest: 2.5, top: 112 }];
    }
    const a = { cx: w * 0.07, cy: h * 1.02, r1: h * 0.16, rest: 2.5, top: 128 };
    const b = { cx: w * 0.6, cy: h * 1.02, r1: h * 0.14, rest: 2.5, top: 114 };
    const atTop = b.cx - (b.cy / Math.tan((180 - b.top) * RAD));   // where the right wiper's last line meets the top of the screen
    a.r2 = 1.03 * Math.max(Math.hypot(a.cx, a.cy), Math.hypot(atTop - a.cx, a.cy), (b.cx - a.cx) * 1.1);
    b.r2 = 1.03 * Math.hypot(w - b.cx, b.cy);
    return [a, b];
  };
  const wedge = (g, a0, a1) => {
    const pt = (d) => { const t = d * RAD; return `${f1(g.cx + g.r2 * Math.cos(t))} ${f1(g.cy - g.r2 * Math.sin(t))}`; };
    return `M${f1(g.cx)} ${f1(g.cy)}L${pt(a0)}A${f1(g.r2)} ${f1(g.r2)} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${pt(a1)}Z`;
  };

  /* ---------------------------------------------------------------- 1 the windscreen */
  (() => {
    const view = $('.wi-view');
    const panes = { a: $('[data-pane="a"]', view), b: $('[data-pane="b"]', view) };
    const armEls = { a: $('[data-arm="a"]', view), b: $('[data-arm="b"]', view) };
    const foot = $('.wi-foot', view);
    const copy = $('.wi-copy', view);
    const canvas = $('.wi-frost-c', view);
    const ctx = canvas.getContext('2d');
    const img = $('.wi-frost img', view);

    let W = 0; let H = 0; let k = 1; let geo = {}; let t = 14;
    let base = null;       // the frost with its shade, ready to copy onto the canvas
    let painted = '';
    const st = { a: 0, b: 0, armA: 0, armB: 0, copy: 1, foot: 0, nudge: 0 };

    /* each wiper rubs the frost off along many thin arcs; a few of them miss a little, and that is what looks like rubber on glass */
    const arcsFor = (g, seed) => {
      const rnd = seeded(seed);
      const step = W < 700 ? 6 : 4.6;
      const arcs = [];
      const n = Math.floor((g.r2 - g.r1) / step);
      for (let i = 0; i <= n; i++) {
        const edgeDist = Math.min(i, n - i);
        let a = 0.998;
        const q = rnd();
        if (q < 0.04) a = 0.95; else if (q < 0.14) a = 0.98;
        if (edgeDist === 0) a = 0.22; else if (edgeDist === 1) a = 0.45; else if (edgeDist === 2) a = 0.72;
        arcs.push({ r: g.r1 + i * step, a, w: step + 0.9 });
      }
      return arcs;
    };

    const prepare = () => {
      if (!img.complete || !img.naturalWidth) return;
      const off = document.createElement('canvas');
      off.width = canvas.width;
      off.height = canvas.height;
      const o = off.getContext('2d');
      // the same crop as the picture's object-fit: cover
      const sc = Math.max(off.width / img.naturalWidth, off.height / img.naturalHeight);
      const dw = img.naturalWidth * sc; const dh = img.naturalHeight * sc;
      o.drawImage(img, (off.width - dw) / 2, (off.height - dh) / 2, dw, dh);
      // the shade under the words, in the frost itself, so the wiper takes it away with the frost
      const tall = W / H < 1;
      const g = tall ? o.createLinearGradient(0, 0, 0, off.height) : o.createLinearGradient(0, 0, off.width, off.height * 0.18);
      g.addColorStop(0, 'rgba(5,8,12,.68)');
      g.addColorStop(tall ? 0.56 : 0.48, tall ? 'rgba(5,8,12,.5)' : 'rgba(5,8,12,.52)');
      g.addColorStop(tall ? 0.86 : 0.86, 'rgba(5,8,12,0)');
      o.fillStyle = g;
      o.fillRect(0, 0, off.width, off.height);
      base = off;
      view.classList.add('has-canvas');
      painted = '';
    };

    const paintFrost = () => {
      if (!base) return;
      const key = `${f1(st.a * 1000)}|${f1(st.b * 1000)}`;
      if (key === painted) return;
      painted = key;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'butt';
      for (const key2 of ['a', 'b']) {
        const g = geo[key2];
        if (!g || st[key2] <= 0.002) continue;
        const end = -(g.rest + (g.top - g.rest) * st[key2]) * RAD;
        const start = -(g.rest - 6) * RAD;
        for (const arc of g.arcs) {
          ctx.globalAlpha = arc.a;
          ctx.lineWidth = arc.w * k;
          ctx.beginPath();
          ctx.arc(g.cx * k, g.cy * k, arc.r * k, end, start);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    const measure = () => {
      W = view.clientWidth;
      H = view.clientHeight;
      k = Math.min(devicePixelRatio || 1, 1.25);
      const wide = W / H > 1.02;
      geo = wide ? {
        a: { cx: W * 0.17, cy: H * 1.012, r1: H * 0.13, r2: Math.max(W * 0.5, Math.min(H * 0.99, W * 0.64)), rest: 7, top: 124 },
        b: { cx: W * 0.64, cy: H * 1.012, r1: H * 0.12, r2: Math.max(W * 0.42, Math.min(H * 0.93, W * 0.58)), rest: 7, top: 112 },
      } : {
        // upright the sentence and its button stand at the foot of the glass, so the blade parks under them
        a: { cx: W * 0.08, cy: H * 1.008, r1: W * 0.2, r2: Math.hypot(W * 0.92, H) * 0.95, rest: Math.min(9, Math.atan2(H * 0.055, W * 0.92) / RAD), top: 106 },
        b: null,
      };
      t = bladeSize(W, H);
      for (const key of ['a', 'b']) {
        const g = geo[key];
        const el = armEls[key];
        el.hidden = !g;
        if (!g) { panes[key].style.clipPath = 'none'; continue; }
        g.arcs = arcsFor(g, key === 'a' ? 3 : 17);
        mountArm(el, g, t, { powder: key === 'a' ? 5 : 19 });
      }
      canvas.width = Math.round(W * k);
      canvas.height = Math.round(H * k);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      prepare();
    };

    /* a ring sector from just under the rest position up to `deg`: what has to go from the headline */
    const hole = (g, deg) => {
      const pt = (r, d) => { const a = d * RAD; return `${f1(g.cx + r * Math.cos(a))} ${f1(g.cy - r * Math.sin(a))}`; };
      const from = g.rest - 6;
      const large = deg - from > 180 ? 1 : 0;
      return `M${pt(g.r1, from)}L${pt(g.r2, from)}A${f1(g.r2)} ${f1(g.r2)} 0 ${large} 0 ${pt(g.r2, deg)}L${pt(g.r1, deg)}A${f1(g.r1)} ${f1(g.r1)} 0 ${large} 1 ${pt(g.r1, from)}Z`;
    };

    const draw = () => {
      paintFrost();
      for (const key of ['a', 'b']) {
        const g = geo[key];
        if (!g) continue;
        const span = g.top - g.rest;
        const sweep = st[key];                            // how far this wiper has ever come: the cleared glass
        const arm = key === 'a' ? st.armA : st.armB;      // where the blade is now
        armEls[key].style.transform = `rotate(${f1(-(g.rest + span * arm + st.nudge) * 10) / 10}deg)`;
        panes[key].style.clipPath = sweep > 0.002 ? `path(evenodd,"M0 0H${W}V${H}H0Z${hole(g, g.rest + span * sweep)}")` : 'none';
        // on the way up it pushes frost; on the way back the glass is clean
        const pushing = sweep > 0.004 && sweep < 0.995 && Math.abs(arm - sweep) < 0.006;
        if (armEls[key].powder) armEls[key].powder.style.opacity = pushing ? 1 : 0;
      }
      copy.style.opacity = st.copy;
      copy.style.visibility = st.copy < 0.01 ? 'hidden' : 'visible';
      foot.style.opacity = st.foot;
      foot.style.visibility = st.foot < 0.01 ? 'hidden' : 'visible';
      foot.style.transform = `translateY(${(1 - st.foot) * 26}px)`;
    };

    measure();
    draw();
    if (!base) {
      const ready = () => { prepare(); painted = ''; draw(); };
      if (img.decode) img.decode().then(ready).catch(() => img.addEventListener('load', ready, { once: true }));
      else img.addEventListener('load', ready, { once: true });
    }
    let lastSize = `${W}x${H}`;
    ScrollTrigger.addEventListener('refreshInit', () => {
      const now = `${view.clientWidth}x${view.clientHeight}`;
      if (now !== lastSize) { lastSize = now; measure(); }
      painted = '';
      draw();
    });
    redraw(draw);

    gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: draw,
      scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom bottom', scrub: 0.35 },
    })
      // up: the blade and the edge of the clean glass are one movement
      .to(st, { a: 1, armA: 1, duration: 1, ease: 'sine.inOut' }, 0)
      .to(st, { b: 1, armB: 1, duration: 1, ease: 'sine.inOut' }, 0.05)
      // whatever a wiper does not reach of the words goes last, with the end of the stroke
      .to(st, { copy: 0, duration: 0.26 }, 0.78)
      // the blades go home; the glass stays clean
      .to(st, { armA: 0, duration: 0.62, ease: 'sine.inOut' }, 1.05)
      .to(st, { armB: 0, duration: 0.62, ease: 'sine.inOut' }, 1.09)
      .to(st, { foot: 1, duration: 0.36, ease: 'power1.out' }, 1.1)
      .to({}, { duration: 0.34 });                       // a beat with the sentence on the clean glass

    /* one short twitch of the blades after loading, so you see what they are */
    if (scrollY < 20) {
      gsap.to(st, { nudge: 5, duration: 0.55, ease: 'sine.inOut', yoyo: true, repeat: 1, delay: 1.5, onUpdate: draw });
    }

    /* the way in */
    gsap.timeline({ delay: 0.12 }).add(hxWrite($$('.wi-h1-big, .wi-h1-sub', view)));
    gsap.fromTo($$('.wi-reveal', view), { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut', stagger: 0.09, delay: 0.2 });
  })();

  /* ---------------------------------------------------------------- 2 Salz auf den Worten
     His first paragraph lights up word by word while road salt falls past it. The words crust over, the grey veil his text
     speaks of comes down over everything, then the wipers go up and back, and his second paragraph stands on clean black. */
  (() => {
    const sec = $('.wi-salt');
    if (!sec) return;
    const view = $('.wi-held-view', sec);
    const a = $('.wi-salt-a', sec);
    const b = $('.wi-salt-b', sec);
    const arms = $$('.wi-arm', sec);
    const words = $$('.wi-salt-t .wi-w', sec);
    const body = $('.wi-salt-t', sec);
    const crust = $('.wi-crust', sec);
    const film = $('.wi-film', sec);
    const gloss = $('.wi-gloss', sec);
    const canvas = $('.wi-grains', sec);
    const ctx = canvas.getContext('2d');
    let w = 0; let h = 0; let k = 1; let gs = []; let share = 1;

    /* the grains: fixed in advance, their fall is a pure function of the clock, and how many show is a function of the scroll */
    const rnd = seeded(7);
    const grains = Array.from({ length: 1100 }, () => {
      const near = rnd();
      return { x: rnd(), y: rnd(), s: 0.9 + near * near * 2.6, v: 0.09 + near * 0.3, a: 0.28 + near * 0.62, d: rnd() * 0.05 - 0.025 };
    });
    const st = { fall: 0, crust: 0, film: 0, dim: 0, s0: 0, s1: 0, arm0: 0, arm1: 0, gloss: 0 };

    const measure = () => {
      w = view.clientWidth;
      h = view.clientHeight;
      k = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * k);
      canvas.height = Math.round(h * k);
      share = Math.max(0.28, Math.min(1, (w * h) / 1.1e6));
      gs = longWipers(w, h);
      const t = bladeSize(w, h);
      arms.forEach((el, i) => {
        const g = gs[i];
        el.hidden = !g;
        if (g) mountArm(el, g, t, { smear: 23 + i * 6 });
      });
      fit(view, () => Math.max(a.scrollHeight, b.scrollHeight));
    };
    const paint = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (st.fall <= 0 || st.s1 >= 1) return;
      const n = Math.floor(grains.length * st.fall * share);
      ctx.fillStyle = '#f4f7f8';
      for (let i = 0; i < n; i++) {
        const p = grains[i];
        const y = ((p.y + time * p.v) % 1) * (canvas.height + 20) - 10;
        const x = ((p.x + time * p.d + 2) % 1) * canvas.width;
        ctx.globalAlpha = p.a;
        ctx.fillRect(x, y, p.s * k, p.s * k * (1 + p.v * 3.2)); // falling, so a little longer than wide
      }
      ctx.globalAlpha = 1;
    };
    const draw = () => {
      crust.style.opacity = st.crust;
      film.style.opacity = st.film;
      body.style.opacity = 1 - st.dim * 0.42;
      gloss.style.transform = `translate(0,${f1((0.5 - st.gloss) * 16)}%)`;
      const cut = gs.map((g, i) => {
        const p = i ? st.s1 : st.s0;
        return p > 0.001 ? wedge(g, g.rest - 6, g.rest + (g.top - g.rest) * p) : '';
      }).join('');
      const done = st.s0 >= 1 && st.s1 >= 1;
      b.style.visibility = cut || done ? 'visible' : 'hidden';
      b.style.clipPath = done || !cut ? 'none' : `path("${cut}")`;
      a.style.visibility = done ? 'hidden' : 'visible';
      gs.forEach((g, i) => {
        const arm = i ? st.arm1 : st.arm0;
        const sweep = i ? st.s1 : st.s0;
        arms[i].style.transform = `rotate(${f1(-(g.rest + (g.top - g.rest) * arm) * 10) / 10}deg)`;
        if (arms[i].smear) arms[i].smear.style.opacity = sweep > 0.004 && sweep < 0.995 && Math.abs(arm - sweep) < 0.006 ? 1 : 0;
      });
    };
    measure();
    draw();
    let last = `${w}x${h}`;
    ScrollTrigger.addEventListener('refreshInit', () => {
      const now = `${view.clientWidth}x${view.clientHeight}`;
      if (now !== last) { last = now; measure(); }
      draw();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fit(view, () => Math.max(a.scrollHeight, b.scrollHeight)); });
    redraw(draw);

    const tl = held(sec, draw);
    tl.to(words, { opacity: 1, duration: 0.05, stagger: 0.024 }, 0)
      .to(st, { fall: 1, duration: 0.8, ease: 'power1.in' }, 0.05)
      .to(st, { crust: 1, duration: 0.9, ease: 'power1.in' }, 0.5)
      .to(st, { film: 1, dim: 1, duration: 0.5 }, 0.95)
      .to({}, { duration: 0.2 }, 1.45)
      // the wipers go up, the clean black comes with them; then they go home
      .to(st, { s0: 1, arm0: 1, duration: 0.72, ease: 'sine.inOut' }, 1.62)
      .to(st, { s1: 1, arm1: 1, duration: 0.72, ease: 'sine.inOut' }, 1.66)
      .to(st, { arm0: 0, duration: 0.5, ease: 'sine.inOut' }, 2.4)
      .to(st, { arm1: 0, duration: 0.5, ease: 'sine.inOut' }, 2.44)
      .to(st, { gloss: 1, duration: 1.3 }, 2.1)
      .to({}, { duration: 0.1 }, 3.3);

    /* the salt keeps falling while the scene is on screen, whatever the scroll does; it costs nothing when it is not */
    let on = false;
    const tick = (t) => paint(t);
    const fall = (active) => {
      if (active && !on) { gsap.ticker.add(tick); on = true; }
      if (!active && on) { gsap.ticker.remove(tick); on = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
    const watch = ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onToggle: (self) => fall(self.isActive) });
    redraw(() => fall(watch.isActive));
  })();

  /* ---------------------------------------------------------------- 3 Der Wischer läuft
     The screen holds. The wipers go up, and what they pass is the next picture with its line; then they go back down and park.
     The words sit in the picture, so they arrive with it. */
  (() => {
    const sec = $('.wi-pack');
    if (!sec) return;
    const view = $('.wi-held-view', sec);
    const lays = $$('.wi-lay', sec);
    const arms = $$('.wi-arm', sec);
    const head = $('.wi-lay-head', sec);
    const st = { arm0: 0, arm1: 0 };
    let w = 0; let h = 0; let gs = [];
    lays.forEach((lay, i) => { st[`p${i}`] = i === 0 ? 1 : 0; st[`q${i}`] = i === 0 ? 1 : 0; lay.style.zIndex = i + 1; });
    const measure = () => {
      w = view.clientWidth;
      h = view.clientHeight;
      gs = longWipers(w, h);
      const t = bladeSize(w, h);
      arms.forEach((el, i) => {
        const g = gs[i];
        el.hidden = !g;
        if (g) mountArm(el, g, t, { smear: 41 + i * 6 });
      });
      fit(view, () => head.offsetHeight, 44);
    };
    const draw = () => {
      let live = false;
      for (let i = 1; i < lays.length; i++) {
        const p0 = st[`p${i}`];
        const p1 = st[`q${i}`];
        const lay = lays[i];
        if (p0 <= 0 && p1 <= 0) { lay.style.visibility = 'hidden'; continue; }
        lay.style.visibility = 'visible';
        if (p0 >= 1 && (p1 >= 1 || !gs[1])) { lay.style.clipPath = 'none'; continue; }
        live = true;
        const cut = gs.map((g, n) => {
          const p = n ? p1 : p0;
          return p > 0.001 ? wedge(g, g.rest - 6, g.rest + (g.top - g.rest) * p) : '';
        }).join('');
        lay.style.clipPath = `path("${cut || 'M0 0'}")`;
      }
      gs.forEach((g, n) => {
        const arm = n ? st.arm1 : st.arm0;
        arms[n].style.transform = `rotate(${f1(-(g.rest + (g.top - g.rest) * arm) * 10) / 10}deg)`;
        if (arms[n].smear) arms[n].smear.style.opacity = live ? 1 : 0;
      });
    };
    measure();
    draw();
    let last = `${w}x${h}`;
    ScrollTrigger.addEventListener('refreshInit', () => {
      const now = `${view.clientWidth}x${view.clientHeight}`;
      if (now !== last) { last = now; measure(); }
      draw();
    });
    redraw(draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fit(view, () => head.offsetHeight, 44));
    ScrollTrigger.create({ trigger: sec, start: 'top 220%', onEnter: () => { $$('img', sec).forEach((im) => { im.loading = 'eager'; if (im.decode) im.decode().catch(() => {}); }); } });

    const tl = held(sec, draw);
    let t = 1.15;                  // time to read the title card, with his summary on it
    for (let i = 1; i < lays.length; i++) {
      tl.to(st, { [`p${i}`]: 1, arm0: 1, duration: 0.9, ease: 'sine.inOut' }, t)
        .to(st, { [`q${i}`]: 1, arm1: 1, duration: 0.9, ease: 'sine.inOut' }, t + 0.04)
        .to(st, { arm0: 0, duration: 0.62, ease: 'sine.inOut' }, t + 0.98)
        .to(st, { arm1: 0, duration: 0.62, ease: 'sine.inOut' }, t + 1.02);
      const im = $('img', lays[i]);
      if (im) tl.fromTo(im, { scale: 1.06 }, { scale: 1, duration: 3, ease: 'none', force3D: false }, t);
      // the old line goes as the blades start, the new one comes when they have passed: never two lines on top of each other
      const gone = $('.wi-lay-t', lays[i - 1]);
      if (gone) tl.fromTo(gone, { opacity: 1, y: 0 }, { opacity: 0, y: -16, duration: 0.2, ease: 'power1.in', immediateRender: false, force3D: false }, t - 0.06);
      const words = $('.wi-lay-t', lays[i]);
      if (words) tl.fromTo(words, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.36, ease: 'power1.out', force3D: false }, t + 0.56);
      t += 2.5;                    // up, back, and a moment with no blade over the line
    }
    tl.to({}, { duration: 0.1 }, t - 0.1);
  })();

  /* ---------------------------------------------------------------- 4 Der Kilometerzähler
     A car drawn in one line grows from the small class to the SUV as you scroll, and the price rolls on drums like a mileage
     counter. All four prices stand underneath the whole time. Nothing is calculated: the drums only travel between the four
     numbers in his table, and they roll by themselves to the nearest one, so a stopped scroll never leaves half a digit. */
  (() => {
    const sec = $('.wi-price');
    if (!sec) return;
    const items = $$('.wi-ruler li', sec);
    const stops = items.map((li) => ({ name: li.dataset.n, cars: li.dataset.c, v: Number(li.dataset.v) }));
    const ruler = $('.wi-ruler', sec);
    const nameEl = $('.wi-meter-n', sec);
    const carsEl = $('.wi-meter-c', sec);
    const drums = $$('.wi-drum i', sec);

    /* the drums: each carries the digits five times over and only ever rolls forwards between neighbours */
    drums.forEach((d) => {
      for (let i = 0; i < 50; i++) { const b = document.createElement('b'); b.textContent = i % 10; d.append(b); }
    });
    const roll = [[], [], []];
    stops.forEach((s, i) => {
      const ds = [Math.floor(s.v / 100) % 10, Math.floor(s.v / 10) % 10, s.v % 10];
      ds.forEach((dig, col) => {
        if (i === 0) { roll[col].push(dig); return; }
        const prev = roll[col][i - 1];
        let step = (dig - (prev % 10) + 10) % 10;
        if (col === 2 && step === 0) step = 10;      // the last drum always turns once, the way a counter does
        roll[col].push(prev + step);
      });
    });
    const reel = { v0: roll[0][0], v1: roll[1][0], v2: roll[2][0] };
    const paintDrums = () => drums.forEach((d, col) => { d.style.transform = `translateY(${-reel[`v${col}`] * 1.08}em)`; });
    paintDrums();

    /* the car, as numbers in millimetres: his four classes. One set of points, so one shape can become the other */
    const CARS = [
      { L: 3950, H: 1460, WB: 2500, FO: 740, R: 300, G: 150, hood: [80, 790], cowl: [1120, 1000], rf: [1800, 1440], rr: [3060, 1420], deck: [3790, 1060], tail: [3930, 960], low: [3950, 560], k: 0.86 },
      { L: 4280, H: 1460, WB: 2640, FO: 840, R: 318, G: 145, hood: [90, 780], cowl: [1270, 1000], rf: [1980, 1445], rr: [3330, 1425], deck: [4090, 1060], tail: [4260, 970], low: [4280, 560], k: 0.92 },
      { L: 4780, H: 1460, WB: 2790, FO: 900, R: 330, G: 140, hood: [95, 750], cowl: [1500, 985], rf: [2240, 1445], rr: [3440, 1430], deck: [4220, 1060], tail: [4760, 1030], low: [4780, 610], k: 1 },
      { L: 4760, H: 1700, WB: 2860, FO: 880, R: 380, G: 220, hood: [100, 1040], cowl: [1270, 1270], rf: [1990, 1680], rr: [4090, 1660], deck: [4590, 1260], tail: [4720, 1160], low: [4760, 660], k: 1.04 },
    ];
    const mix = (a, b, f) => (typeof a === 'number' ? a + (b - a) * f : a.map((v, i) => v + (b[i] - v) * f));
    const carAt = (p) => {
      const i = Math.min(Math.floor(p), CARS.length - 2);
      const f = p - i;
      const out = {};
      for (const key of Object.keys(CARS[0])) out[key] = mix(CARS[i][key], CARS[i + 1][key], f);
      return out;
    };
    const svg = $('.wi-car', sec);
    const q = (s) => $(s, svg);
    const parts = { body: q('.wi-car-body'), glass: q('.wi-car-glass'), door: q('.wi-car-door'), lamp: q('.wi-car-lamp'), tail: q('.wi-car-lamp--tail'), group: q('.wi-car-g'), ticks: q('.wi-car-ticks') };
    const wheels = $$('.wi-car-wheel', svg);
    const n = (v) => Math.round(v * 10) / 10;
    const shape = (c) => {
      const fx = c.FO; const rx = c.FO + c.WB;                  // the two axles
      const r = c.R + 58;                                       // the arch, round the wheel's own centre
      const sill = c.G + 50;
      const half = Math.sqrt(Math.max(1, r * r - (c.R - sill) * (c.R - sill)));
      const [hx, hy] = c.hood; const [cx, cy] = c.cowl; const [ax, ay] = c.rf; const [bx, by] = c.rr;
      const [dx, dy] = c.deck; const [tx, ty] = c.tail; const [lx, ly] = c.low;
      const body = `M70 ${n(sill + 10)}C20 ${n(sill + 70)} 0 ${n(c.G + 230)} 10 ${n(c.G + 320)}`
        + `C16 ${n(hy - 130)} 34 ${n(hy - 50)} ${n(hx)} ${n(hy)}`
        + `C${n(hx + 340)} ${n(hy + 110)} ${n(cx - 330)} ${n(cy - 44)} ${n(cx)} ${n(cy)}`
        + `C${n(cx + 240)} ${n(cy + 150)} ${n(ax - 260)} ${n(ay - 34)} ${n(ax)} ${n(ay)}`
        + `C${n(ax + 340)} ${n(ay + 26)} ${n(bx - 340)} ${n(by + 22)} ${n(bx)} ${n(by)}`
        + `C${n(bx + 220)} ${n(by - 44)} ${n(dx - 130)} ${n(dy + 170)} ${n(dx)} ${n(dy)}`
        + `C${n(dx + 80)} ${n(dy - 16)} ${n(tx - 80)} ${n(ty + 18)} ${n(tx)} ${n(ty)}`
        + `C${n(tx + 24)} ${n(ty - 110)} ${n(lx)} ${n(ly + 130)} ${n(lx)} ${n(ly)}`
        + `C${n(lx)} ${n(ly - 170)} ${n(lx - 26)} ${n(sill + 60)} ${n(lx - 76)} ${n(sill + 10)}`
        + `L${n(rx + half)} ${n(sill)}A${n(r)} ${n(r)} 0 1 1 ${n(rx - half)} ${n(sill)}`
        + `L${n(fx + half)} ${n(sill)}A${n(r)} ${n(r)} 0 1 1 ${n(fx - half)} ${n(sill)}Z`;
      const belt = cy + 16;                                     // the line under the side windows
      const gx0 = cx + 150; const gx1 = dx - 150;
      const glass = `M${n(gx0)} ${n(belt)}C${n(gx0 + 200)} ${n(belt + 170)} ${n(ax - 170)} ${n(ay - 150)} ${n(ax - 20)} ${n(ay - 76)}`
        + `L${n(bx - 30)} ${n(by - 84)}C${n(bx + 120)} ${n(by - 130)} ${n(gx1 - 40)} ${n(belt + 90)} ${n(gx1)} ${n(belt + 8)}Z`;
      const pillar = (ax + bx) / 2 + 30;
      const front = Math.max(gx0 + 30, fx + half + 30);          // the front door's edge, just behind the front wheel
      const rear = Math.min(gx1 - 40, rx - half + 40);           // the rear door's edge, into the arch
      const door = `M${n(pillar)} ${n(ay - 76)}L${n(pillar + 14)} ${n(sill + 16)}`
        + `M${n(front)} ${n(belt)}L${n(front + 20)} ${n(sill + 16)}`
        + `M${n(rear)} ${n(belt + 8)}L${n(rear - 16)} ${n(c.R + r * 0.72)}`;
      const lamp = `M${n(hx + 26)} ${n(hy - 92)}L${n(hx + 300)} ${n(hy - 36)}`;
      const tail = `M${n(tx - 60)} ${n(ty - 56)}L${n(lx - 2)} ${n(ty - 110)}`;
      return { body, glass, door, lamp, tail, fx, rx };
    };
    const st = { p: 0, turn: 0, show: 0 };
    let shown = -1;
    const draw = () => {
      const p = st.p;
      const c = carAt(p);
      const s = shape(c);
      parts.body.setAttribute('d', s.body);
      parts.glass.setAttribute('d', s.glass);
      parts.door.setAttribute('d', s.door);
      parts.lamp.setAttribute('d', s.lamp);
      parts.tail.setAttribute('d', s.tail);
      // it faces the price; it stands on the ground line, and its middle stays in the middle while it grows
      parts.group.setAttribute('transform', `translate(${n(2700 + (c.L * c.k) / 2)} 1980) scale(${n(-c.k * 100) / 100} ${n(-c.k * 100) / 100})`);
      parts.group.style.opacity = st.show;
      [s.fx, s.rx].forEach((x, i) => {
        wheels[i].setAttribute('transform', `translate(${n(x)} ${n(c.R)}) scale(${n(c.R) / 100}) rotate(${n(st.turn)})`);
      });
      parts.ticks.setAttribute('transform', `translate(${n(-(st.turn * 7) % 420)} 0)`);
      // the name and the cars of the class you are closest to, and the bar beneath
      ruler.style.setProperty('--bar', p / (stops.length - 1));
      const near = Math.round(p);
      if (near !== shown) {
        const first = shown === -1;
        shown = near;
        nameEl.textContent = stops[near].name;
        carsEl.textContent = stops[near].cars;
        items.forEach((li, j) => li.classList.toggle('is-on', j === near));
        const to = { v0: roll[0][near], v1: roll[1][near], v2: roll[2][near] };
        if (first) { Object.assign(reel, to); paintDrums(); } else gsap.to(reel, { ...to, duration: 0.8, ease: 'power3.inOut', overwrite: true, onUpdate: paintDrums });
      }
    };
    draw();
    redraw(() => { shown = -1; draw(); });
    const tl = held(sec, draw);
    tl.to(st, { show: 1, duration: 0.35 }, 0);
    let t = 0.7;
    for (let i = 1; i < stops.length; i++) {
      tl.to(st, { p: i, turn: i * 360, duration: 0.8, ease: 'sine.inOut' }, t);
      t += 1.45;
    }
    tl.to({}, { duration: 0.1 }, t - 0.2);
  })();

  /* ---------------------------------------------------------------- 5 Beschlagene Scheibe
     Glass fogged up at night. A finger writes his lines into the fog, and the bright Halle shines through the letters.
     Each line of text carries the same big picture, lined up with the screen, so it runs on from one line to the next. */
  (() => {
    const sec = $('.wi-fog');
    if (!sec) return;
    const view = $('.wi-held-view', sec);
    const texts = $$('.wi-fog-write', sec);
    const not = $('.wi-not', sec);
    const SRC = { wide: ['assets/img/winter/letters-wide.webp', 1536 / 1085], tall: ['assets/img/winter/letters-tall.webp', 3 / 4] };
    let lastW = 0;

    /* one playhead for the whole scene, made once. Where the lines break depends on the window, so what each line does at which
       point of the playhead is a plan, and only the plan is made again. */
    const st = { p: 0 };
    let lines = [];
    let plan = [];
    let notAt = [0, 1];
    const part = (from, length) => Math.min(1, Math.max(0, (st.p - from) / length));
    const paint = () => {
      lines.forEach((line, i) => line.style.setProperty('--p', ((1 - Math.cos(Math.PI * part(plan[i][0], plan[i][1]))) / 2).toFixed(3)));
      not.style.opacity = part(notAt[0], notAt[1]);
    };
    redraw(paint);
    held(sec, paint).to(st, { p: 1, duration: 1 }, 0);

    /* into lines as the browser has really broken them; every line then is its own window */
    const split = (el) => {
      const text = el.dataset.text || (el.dataset.text = el.textContent.replace(/\s+/g, ' ').trim());
      el.textContent = '';
      const spans = text.split(' ').map((word) => {
        const s = document.createElement('span');
        s.textContent = word;
        el.append(s, ' ');
        return s;
      });
      const lines = [];
      spans.forEach((s) => {
        const top = s.offsetTop;
        const row = lines.find((r) => Math.abs(r.top - top) < 4);
        if (row) row.words.push(s.textContent); else lines.push({ top, words: [s.textContent] });
      });
      el.textContent = '';
      return lines.map((r) => {
        const line = document.createElement('span');
        line.className = 'wi-fl';
        line.textContent = r.words.join(' ');
        el.append(line, ' ');
        return line;
      });
    };
    const inner = () => {
      const first = $('.wi-fog-t', view).getBoundingClientRect();
      const lastBox = not.getBoundingClientRect();
      return lastBox.bottom - first.top;
    };

    const build = () => {
      const w = view.clientWidth;
      const h = view.clientHeight;
      // whole sentences while it is measured, so the fit does not depend on the last build's lines
      texts.forEach((el) => { if (el.dataset.text) el.textContent = el.dataset.text; });
      fit(view, inner, 34);
      const box = view.getBoundingClientRect();
      const [src, ratio] = w / h >= 1 ? SRC.wide : SRC.tall;
      const bw = Math.max(w, h * ratio);             // the picture's width at „cover"
      const bh = bw / ratio;
      const ox = (w - bw) / 2;
      const oy = (h - bh) * 0.62;
      const groups = texts.map(split);
      lines = groups.flat();
      lines.forEach((line) => {
        const r = line.getBoundingClientRect();
        line.style.backgroundImage = `url('${src}')`;
        line.style.backgroundSize = `${f1(bw)}px ${f1(bh)}px`;
        line.style.backgroundPosition = `${f1(ox - (r.left - box.left))}px ${f1(oy - (r.top - box.top))}px`;
      });
      // the longer the line, the longer the finger takes; a short rest between sentences; then his note, and a moment to read
      const times = [];
      let t = 0.05;
      groups.forEach((group) => {
        group.forEach((line) => {
          const len = Math.max(0.3, line.textContent.length / 46);
          times.push([t, len]);
          t += len * 0.96;
        });
        t += 0.22;
      });
      const all = t + 1.3;
      plan = times.map(([from, len]) => [from / all, len / all]);
      notAt = [(t + 0.1) / all, 0.4 / all];
      paint();
      lastW = window.innerWidth;
    };
    /* the fonts decide where lines break, so nothing is measured before they are in */
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { build(); ScrollTrigger.refresh(); });
    let timer = 0;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastW) return;       // a phone's address bar coming and going is not a new layout
      clearTimeout(timer);
      timer = setTimeout(build, 180);
    });
  })();

  /* ---------------------------------------------------------------- 6 Der Chat
     A plain dark phone rises beside the word, and his four steps arrive as chat bubbles: three dots first, then the words.
     On a wide screen each step also stands large beside the phone. The last bubble is the real button. */
  (() => {
    const sec = $('.wi-steps');
    if (!sec) return;
    const view = $('.wi-held-view', sec);
    const phone = $('.wi-phone', sec);
    const inner = $('.wi-phone-in', sec);
    const large = $$('.wi-steps-now p', sec);
    /* the phone has to hold its name, all four messages and the button. The list itself is stretched, so it is measured from its first message to its last */
    const msgs = $$('.wi-msg', inner);
    const who = $('.wi-phone-who', inner);
    const btn = $('.wi-msg-btn', inner);
    const outer = (el) => { const c = getComputedStyle(el); return el.offsetHeight + parseFloat(c.marginTop) + parseFloat(c.marginBottom); };
    const needs = () => {
      const c = getComputedStyle(inner);
      return msgs[msgs.length - 1].getBoundingClientRect().bottom - msgs[0].getBoundingClientRect().top + outer(who) + outer(btn) + parseFloat(c.paddingTop) + parseFloat(c.paddingBottom);
    };
    const refit = () => fit(view, () => needs() + view.clientHeight - inner.clientHeight);
    refit();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
    ScrollTrigger.addEventListener('refreshInit', refit);
    const tl = held(sec);
    tl.fromTo(phone, { yPercent: 70 }, { yPercent: 0, duration: 0.8, ease: 'power2.out' }, 0);
    let t = 0.75;
    $$('.wi-msg', sec).forEach((m, i) => {
      const dots = $('.wi-dots', m);
      const bubble = $('.wi-bubble', m);
      tl.to(dots, { opacity: 1, duration: 0.12 }, t)
        .to(dots, { opacity: 0, duration: 0.07 }, t + 0.34)
        .fromTo(bubble, { opacity: 0, y: 12, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: 'back.out(1.6)' }, t + 0.36);
      if (large[i]) {
        if (i > 0) tl.to(large[i - 1], { opacity: 0, y: -24, duration: 0.16 }, t + 0.2);
        tl.fromTo(large[i], { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.22 }, t + 0.36);
      }
      t += 0.82;
    });
    tl.to($('.wi-msg-btn', sec), { opacity: 1, duration: 0.24 }, t)
      .to({}, { duration: 0.1 }, t + 0.5);
  })();

  /* ---------------------------------------------------------------- 7 Die Nachtfahrt
     Night, seen from above: village lights, and a pair of headlights driving the valley road from Bregenz. The camera goes with it.
     At Feldkirch the first Halle opens, at Nüziders the second, then the camera pulls back and the whole road lies there. */
  (() => {
    const sec = $('.wi-end');
    if (!sec) return;
    const view = $('.wi-held-view', sec);
    const svg = $('.wi-map', sec);
    const cam = $('.wi-cam', sec);
    const road = $('.wi-road', sec);
    const far = $('.wi-road-far', sec);
    const lamps = $('.wi-lamps', sec);
    const lights = $('.wi-lights', sec);
    const lightsB = $('.wi-lights-b', sec);
    const cards = $$('.wi-adr', sec);
    const btns = $('.wi-end-btns', sec);
    const marks = $$('[data-x]', cam).map((el) => ({ el, x: +el.dataset.x, y: +el.dataset.y, t: 0, name: el.dataset.name }));
    const len = road.getTotalLength();
    road.style.strokeDasharray = `${len} ${len}`;
    /* how far along the road each town lies */
    const SAMPLES = 500;
    const pts = Array.from({ length: SAMPLES + 1 }, (_, i) => road.getPointAtLength((len * i) / SAMPLES));
    marks.forEach((m) => {
      let best = 1e12;
      pts.forEach((p, i) => { const d = (p.x - m.x) ** 2 + (p.y - m.y) ** 2; if (d < best) { best = d; m.t = i / SAMPLES; } });
    });
    const tF = marks.find((m) => m.name === 'Feldkirch').t;
    const tN = marks.find((m) => m.name === 'Nüziders').t;
    const xs = pts.map((p) => p.x); const ys = pts.map((p) => p.y);
    const bb = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    /* the valley at night: lights thick round the towns and along the road, thin further out. They say „people live here", not where. */
    {
      const rnd = seeded(29);
      const near0 = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;      // from -1 to 1, most of them near 0
      let dim = ''; let bright = '';
      const put = (x, y, strong) => { const s = `M${f1(x)} ${f1(y)}h.01`; if (strong) bright += s; else dim += s; };
      marks.forEach((m) => {
        const big = /Bregenz|Dornbirn|Feldkirch|Bludenz/.test(m.name);
        for (let i = 0; i < (big ? 120 : 76); i++) put(m.x + near0() * (big ? 30 : 20), m.y + near0() * (big ? 30 : 20), rnd() < 0.3);
      });
      for (let i = 0; i < 330; i++) {                               // along the road
        const p = pts[Math.floor(rnd() * SAMPLES)];
        const a = rnd() * Math.PI * 2; const d = 4 + rnd() * rnd() * 44;
        put(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, rnd() < 0.16);
      }
      for (let i = 0; i < 130; i++) {                               // a farm here and there
        const p = pts[Math.floor(rnd() * SAMPLES)];
        const a = rnd() * Math.PI * 2; const d = 70 + rnd() * 340;
        put(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, false);
      }
      lights.setAttribute('d', dim);
      lightsB.setAttribute('d', bright);
    }
    const st = { t: 0, zoom: 0, c1: 0, c2: 0, btn: 0 };
    let w = 0; let h = 0; let z0 = 1; let centre = { x: 0, y: 0 }; let hold = { x: 0, y: 0 };
    const measure = () => {
      w = view.clientWidth;
      h = view.clientHeight;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const tall = matchMedia('(max-aspect-ratio: 23/20)').matches;   // the same shape the stylesheet stacks at
      // where the whole road lies at the end, and where the car is held while the camera follows it
      const box = view.getBoundingClientRect();
      const under = (el) => el.getBoundingClientRect().bottom - box.top;
      const above = (el) => el.getBoundingClientRect().top - box.top;
      const top = Math.max(under($('.wi-end-head', sec)) + 16, h * (tall ? 0.17 : 0.2));
      // the last town's name hangs under the road, so a name's height stays free above whatever comes below it
      const foot = (tall ? above($('.wi-adrs', sec)) : above(btns)) - 46;
      const rect = tall
        ? { x: w * 0.3, y: top, w: w * 0.62, h: Math.min(h * 0.35, foot - top) }
        : { x: w * 0.1, y: top, w: w * 0.36, h: Math.min(h * 0.6, foot - top) };
      z0 = Math.min(rect.w / (bb.x1 - bb.x0), rect.h / (bb.y1 - bb.y0));
      centre = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
      hold = tall ? { x: w * 0.46, y: h * 0.4 } : { x: w * 0.3, y: h * 0.56 };
    };
    const draw = () => {
      const zoomed = z0 * 2.7;
      const z = zoomed + (z0 - zoomed) * st.zoom;
      const p = road.getPointAtLength(len * st.t);
      const a = road.getPointAtLength(Math.max(0, len * st.t - 2));
      const b = road.getPointAtLength(Math.min(len, len * st.t + 2));
      const deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      // following the car, or looking at the whole road: the camera slides from the one to the other
      const followX = hold.x - p.x * z; const followY = hold.y - p.y * z;
      const wholeX = centre.x - ((bb.x0 + bb.x1) / 2) * z; const wholeY = centre.y - ((bb.y0 + bb.y1) / 2) * z;
      const tx = followX + (wholeX - followX) * st.zoom;
      const ty = followY + (wholeY - followY) * st.zoom;
      cam.setAttribute('transform', `translate(${f1(tx)} ${f1(ty)}) scale(${Math.round(z * 1000) / 1000})`);
      road.style.strokeDashoffset = len * (1 - st.t);
      road.style.strokeWidth = 2.6 / z;
      far.style.strokeWidth = 2 / z;
      lights.style.strokeWidth = 1.9 / z;
      lightsB.style.strokeWidth = 2.7 / z;
      marks.forEach((m) => {
        m.el.setAttribute('transform', `translate(${m.x} ${m.y}) scale(${Math.round(1000 / z) / 1000})`);
        m.el.classList.toggle('is-lit', st.t >= m.t - 0.012);
        if (m.name === 'Götzis') m.el.classList.toggle('is-quiet', z < 0.6);   // on the smallest phones it would stand on top of Hohenems
      });
      // when the camera pulls back the car has arrived: its lights get small and go down
      lamps.setAttribute('transform', `translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(deg)}) scale(${Math.round((1000 / z) * (1 - st.zoom * 0.45)) / 1000})`);
      lamps.style.opacity = 1 - st.zoom * 0.7;
      cards[0].style.opacity = st.c1;
      cards[0].style.transform = `translateY(${f1((1 - st.c1) * 26)}px)`;
      cards[1].style.opacity = st.c2;
      cards[1].style.transform = `translateY(${f1((1 - st.c2) * 26)}px)`;
      btns.style.opacity = st.btn;
    };
    measure();
    draw();
    ScrollTrigger.addEventListener('refreshInit', () => { measure(); draw(); });
    redraw(draw);
    const tl = held(sec, draw);
    tl.to(st, { t: tF, duration: 1.5, ease: 'sine.inOut' }, 0)
      .to(st, { c1: 1, duration: 0.3 }, 1.3)
      .to(st, { t: tN, duration: 1.2, ease: 'sine.inOut' }, 1.75)
      .to(st, { c2: 1, duration: 0.3 }, 2.75)
      .to(st, { zoom: 1, duration: 0.8, ease: 'sine.inOut' }, 3.0)
      .to(st, { btn: 1, duration: 0.3 }, 3.4)
      .to({}, { duration: 0.1 }, 4.15);
  })();

  /* ---------------------------------------------------------------- 8 Friert wieder zu
     The last screen: the frost grows back in from the edges of the glass, and what stays clear is his date and the button. */
  (() => {
    const sec = $('.wi-last');
    if (!sec) return;
    const frost = $('.wi-last-frost', sec);
    const st = { r: 130 };
    const end = () => (innerWidth / innerHeight < 1 ? 70 : 44);
    const draw = () => frost.style.setProperty('--r', f1(st.r));
    redraw(draw);
    const tl = held(sec, draw);
    tl.to(st, { r: () => end(), duration: 1, ease: 'sine.out' }, 0).to({}, { duration: 0.1 }, 1.2);
  })();

  /* ---------------------------------------------------------------- the bands that only have to arrive
     (no `once: true` on any of these: several triggers killing themselves inside ScrollTrigger's first refresh crash it when the page is reloaded halfway down.
     A trigger's timeline plays once anyway, and the plain ones only set something that can safely be set twice.) */
  $$('.wi-price-foot, .wi-faq, .wi-end-foot').forEach((band) => {
    const fades = $$('.wi-reveal', band);
    const heads = $$('.wi-write', band);
    hxWrite.park(heads);
    const tl = gsap.timeline({ scrollTrigger: { trigger: band, start: 'top 84%' } });
    if (fades.length) tl.fromTo(fades, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power1.inOut', stagger: 0.08 }, 0);
    if (heads.length) tl.add(hxWrite(heads), 0.04);
  });
  /* the big titles of the scenes are written in as you come to them */
  $$('.wi-held .wi-write').forEach((head) => {
    hxWrite.park(head);
    gsap.timeline({ scrollTrigger: { trigger: head.closest('.wi-held'), start: 'top 62%' } }).add(hxWrite(head));
  });

  /* the rules of the FAQ draw themselves, as on the home page */
  rows.forEach((row) => ScrollTrigger.create({ trigger: row, start: 'top 94%', onEnter: () => row.classList.add('is-in') }));

  /* the safety net: if frames are paused (a background tab, some previews), show everything */
  setTimeout(() => {
    if (gsap.ticker.frame < 3) { showAll(); $$('.wi-h1-big, .wi-h1-sub, .wi-write').forEach((el) => { el.style.opacity = '1'; }); }
  }, 2000);

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
