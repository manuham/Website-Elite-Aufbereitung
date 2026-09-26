/* ===================================================================================
   „Unsere Arbeit" — arbeit.html

   Five jobs:
     1. the head comes in (the title written letter by letter, write.js),
     2. the wall builds itself like a „Baukasten" as you scroll — every photo lands from
        its own side (Manuel, 2026-09-26: „pop up from below, left, right … not boring"),
     3. the strip on top re-lays the wall: leavers drop out, stayers glide to their new
        place, newcomers are built in,
     4. a photograph opens large — it grows out of its own tile (Apple's zoom), with round
        frosted controls, arrows on the keyboard and a swipe on the phone,
     5. on a desktop a round „Zoom" cursor rides over the photos, and the photo under it
        leans toward the pointer — this page only (Manuel, 2026-09-26).

   The wall is a CSS grid (`grid-auto-flow: dense`), and that stays the no-JS fallback.
   With reduced motion: no flights, no cursor — everything simply stands there.
   =================================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motion = !reduced && !!window.gsap;

  const wall = $('#ha-wall');
  if (!wall) return;
  const tiles = $$('.ha-tile', wall);
  const chips = $$('.ha-chip');
  // the list is a JSON data block (arbeit.mjs) — an inline script would be blocked by the live CSP
  let photos = [];
  try { photos = JSON.parse(document.getElementById('ha-photos')?.textContent || '[]'); } catch { photos = []; }

  /* ---------------------------------------------------------------- 1. the head */
  const head = $('.ha-head');
  // the title is not faded: since 2026-09-25 it is WRITTEN in, letter by letter (write.js)
  if (head) $$('.ha-intro, .ha-chips', head).forEach((el) => el.classList.add('ha-reveal'));

  if (!motion) {
    $$('.ha-reveal').forEach((el) => { el.style.opacity = '1'; });
    tiles.forEach((t) => { t.style.opacity = '1'; t._in = true; });
  } else {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo('.ha-reveal', { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut', stagger: 0.08 });
    if (head && window.hxWrite) gsap.timeline({ delay: 0.1 }).add(hxWrite($$('.ha-title .ha-line', head)));
  }

  /* Everything on this page starts at opacity 0 and only a tween makes it visible, so if the
     animation frame never fires — a paused tab, a blocked script, a throttled preview — the page
     would read as blank. Measured once in a preview pane that pauses rAF: `gsap.ticker.frame`
     stayed at 0 and nothing ever appeared. After two seconds, show whatever is still hidden. */
  setTimeout(() => {
    if (window.gsap && gsap.ticker.frame > 0) return;
    $$('.ha-reveal').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    tiles.forEach((t) => { t.style.opacity = '1'; t.style.transform = 'none'; t.style.filter = 'none'; t._in = true; });
  }, 2000);

  /* ---------------------------------------------------------------- 2. no holes */
  // ⚠ 2026-09-25 (page sweep, Manuel: „fix them"): `dense` packing cannot close the END of the wall.
  // 27 photos make 37 cells, and 37 is no multiple of 4, 3 or 2 — so every width ended on a gap
  // (three empty tiles on a desktop, two on a phone), and every filter made its own. So the wall is
  // packed here exactly the way `dense` packs it, and whatever stays open is closed afterwards:
  //   a) a last row holding only the feet of tall photos goes — those photos lose one row;
  //   b) else the photo above grows down into the gap, then c) the one on the left grows right,
  //      then d) the one on the right grows left. Photos are `object-fit: cover`, so a tile that
  //      grows re-crops; it never stretches.
  // Each tile also keeps where it landed (`t._at`) — the Baukasten below picks its side from that.
  const columns = () => getComputedStyle(wall).gridTemplateColumns.split(' ').filter(Boolean).length;
  const shown = () => tiles.filter((t) => !t.hidden);

  function pack() {
    const n = columns();
    const boxes = shown().map((t) => ({
      t,
      w: Math.min(n, t.classList.contains('is-wide') ? 2 : 1),
      h: t.classList.contains('is-tall') ? 2 : 1,
      r: 0,
      c: 0,
    }));
    const grid = []; // grid[row][col] = the box in that cell
    const cell = (r, c) => (grid[r] ? grid[r][c] : undefined);
    const free = (r, c, w, h) => {
      if (c < 0 || c + w > n) return false;
      for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (cell(y, x)) return false;
      return true;
    };
    const mark = (b) => {
      for (let y = b.r; y < b.r + b.h; y++) {
        grid[y] = grid[y] || [];
        for (let x = b.c; x < b.c + b.w; x++) grid[y][x] = b;
      }
    };

    // dense first fit: every photo takes the earliest cell it fits in, in reading order
    boxes.forEach((b) => {
      for (let r = 0; ; r++) {
        for (let c = 0; c + b.w <= n; c++) {
          if (free(r, c, b.w, b.h)) { b.r = r; b.c = c; mark(b); return; }
        }
      }
    });

    for (let guard = 0; guard < 4 * boxes.length; guard++) {
      while (grid.length && grid[grid.length - 1].every((x) => !x)) grid.pop();
      let hr = -1;
      let hc = -1;
      for (let r = 0; r < grid.length && hr < 0; r++) {
        for (let c = 0; c < n; c++) if (!cell(r, c)) { hr = r; hc = c; break; }
      }
      if (hr < 0) break; // no gap left

      const last = grid.length - 1;
      const feet = grid[last].filter(Boolean);
      if (hr === last && feet.every((b) => b.r < last)) { // a)
        new Set(feet).forEach((b) => { b.h -= 1; });
        grid[last] = [];
        continue;
      }
      const above = cell(hr - 1, hc);
      if (above && above.h === 1 && free(above.r + above.h, above.c, above.w, 1)) { above.h += 1; mark(above); continue; } // b)
      const left = cell(hr, hc - 1);
      if (left && free(left.r, left.c + left.w, 1, left.h)) { left.w += 1; mark(left); continue; } // c)
      const right = cell(hr, hc + 1);
      if (right && free(right.r, right.c - 1, 1, right.h)) { right.c -= 1; right.w += 1; mark(right); continue; } // d)
      if (above && free(above.r + above.h, above.c, above.w, 1)) { above.h += 1; mark(above); continue; }
      break; // nothing can reach it — leave it rather than loop
    }

    boxes.forEach((b) => {
      b.t.style.gridColumn = `${b.c + 1} / span ${b.w}`;
      b.t.style.gridRow = `${b.r + 1} / span ${b.h}`;
      b.t._at = { r: b.r, c: b.c, w: b.w, h: b.h, n };
    });
    fitSizes();
  }

  /* The HTML's `sizes` can only guess a tile's width: the packing above may widen or lengthen a tile,
     and a photo in a tile longer than itself is drawn wider than the tile (`object-fit: cover`). So once
     the wall stands, every photo is told the width it is actually drawn at — and the browser fetches a
     file sharp enough for that on this screen. Measured 2026-09-26: without it the wide photos were
     drawn from a file half as wide as they needed on a 2× screen. */
  function fitSizes() {
    const vw = innerWidth / 100;
    shown().forEach((t) => {
      const img = t.querySelector('img');
      const w = t.offsetWidth;
      const h = t.offsetHeight;
      if (!img || !w || !h) return;
      // the photo's own shape, from its attributes — `img.width` would be the tile's
      const drawn = Math.max(w, h * (+img.getAttribute('width') / +img.getAttribute('height') || 1));
      img.sizes = `${Math.ceil(drawn / vw)}vw`;
    });
  }

  pack();
  // the column count changes at the CSS breakpoints (4 → 3 → 2); re-pack only when it does. The row
  // height follows the screen width, so the drawn widths are re-told on every resize (after it settles).
  let packedFor = columns();
  let sizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(sizeTimer);
    sizeTimer = setTimeout(fitSizes, 200);
    const n = columns();
    if (n === packedFor) return;
    packedFor = n;
    pack();
  }, { passive: true });

  /* ---------------------------------------------------------------- 3. the Baukasten */
  // Every photo is a block that is SET into the wall: the first column swings in from the left like
  // a door on its hinge, the last from the right, the middle ones stand up from below — every second
  // row of them rises out of the depth instead. They land in reading order, a beat apart, and each
  // one arrives blurred and over-bright and settles sharp, while the photo inside eases back from
  // a close-up. An IntersectionObserver (not one ScrollTrigger per tile) decides WHEN, because it
  // stays right when the strip hides, shows and moves tiles — a trigger measured on a hidden tile
  // would have fired once and never again.
  const PERSP = 1100;
  function fromState(t) {
    const a = t._at || { r: 0, c: 0, w: 1, h: 1, n: 4 };
    const first = a.c === 0;
    const last = a.c + a.w === a.n;
    if (first && !last) return { xPercent: -46, rotationY: 30, transformOrigin: '0% 50%' };
    if (last && !first) return { xPercent: 46, rotationY: -30, transformOrigin: '100% 50%' };
    if (a.r % 2 && a.w < a.n) return { z: -520, rotationX: -10, transformOrigin: '50% 50%' };
    return { yPercent: 52, rotationX: 38, transformOrigin: '50% 100%' };
  }

  function build(t, delay) {
    t._queued = false;
    t._in = true;
    const img = t.querySelector('img');
    gsap.killTweensOf([t, img]);
    gsap.fromTo(t,
      { ...fromState(t), transformPerspective: PERSP, opacity: 0, filter: 'blur(14px) brightness(1.7)' },
      {
        xPercent: 0, yPercent: 0, z: 0, rotationX: 0, rotationY: 0, opacity: 1,
        filter: 'blur(0px) brightness(1)',
        duration: 1.35, delay, ease: 'expo.out',
        clearProps: 'transform,filter', // only opacity 1 stays — the tile is a flat grid item again
      });
    gsap.fromTo(img, { scale: 1.32 }, { scale: 1, duration: 1.8, delay, ease: 'expo.out', clearProps: 'transform' });
  }

  let queue = [];
  let flushing = 0;
  let firstBatch = true;
  function enqueue(t) {
    if (t._in || t._queued || t.hidden) return;
    t._queued = true;
    queue.push(t);
    if (!flushing) flushing = requestAnimationFrame(flush);
  }
  function flush() {
    flushing = 0;
    const batch = queue.splice(0).filter((t) => !t.hidden)
      .sort((p, q) => (p._at.r - q._at.r) || (p._at.c - q._at.c));
    const base = firstBatch ? 0.35 : 0;   // on arrival the head goes first
    firstBatch = false;
    batch.forEach((t, i) => build(t, base + Math.min(i * 0.085, 0.9)));
  }

  if (motion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((seen) => seen.forEach((e) => {
      if (e.isIntersecting) enqueue(e.target);
    }), { rootMargin: '0px 0px -5% 0px' });
    tiles.forEach((t) => io.observe(t));
  } else if (motion) {
    tiles.forEach((t) => { t.style.opacity = '1'; t._in = true; });
  }

  /* ---------------------------------------------------------------- 4. the strip */
  let group = 'alle';
  let pendingOut = null;
  const wanted = (t) => group === 'alle' || t.dataset.group === group;

  function filter(next) {
    if (next === group) return;
    // a second click while the first one's leavers are still dropping out: finish that one first
    if (pendingOut) pendingOut.progress(1);
    group = next;
    chips.forEach((c) => {
      const on = c.dataset.group === group;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (!motion) {
      tiles.forEach((t) => { t.hidden = !wanted(t); if (!t.hidden) t.style.opacity = '1'; });
      pack();
      return;
    }
    const leaving = tiles.filter((t) => !t.hidden && !wanted(t));
    const staying = tiles.filter((t) => !t.hidden && wanted(t));
    const coming = tiles.filter((t) => t.hidden && wanted(t));
    if (!leaving.length) { relayout(leaving, staying, coming); return; }
    gsap.killTweensOf(leaving);
    pendingOut = gsap.to(leaving, {
      opacity: 0, scale: 0.86, filter: 'blur(8px)', duration: 0.3, ease: 'power2.in', stagger: 0.012,
      onComplete: () => { pendingOut = null; relayout(leaving, staying, coming); },
    });
  }

  // the stayers glide from where they were to where they are now (FLIP); the newcomers are set to
  // their start and the observer builds the ones on screen in — the rest wait for the scroll
  function relayout(leaving, staying, coming) {
    // a stayer that was off the screen has nothing to glide FROM that anyone saw — sliding it up from
    // far below left the wall empty for half a second (measured 2026-09-26). It is built in instead.
    const seen = (t) => { const r = t.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
    coming = coming.concat(staying.filter((t) => !seen(t)));
    staying = staying.filter(seen);
    const before = new Map(staying.map((t) => [t, t.getBoundingClientRect()]));
    leaving.forEach((t) => {
      t.hidden = true;
      t._in = false;
      t._queued = false;
      gsap.set(t, { clearProps: 'transform,filter', opacity: 0 });
    });
    coming.forEach((t) => {
      t._in = false;
      t._queued = false;
      gsap.killTweensOf(t);
      gsap.set(t, { clearProps: 'transform,filter', opacity: 0 });
      t.hidden = false;
    });
    pack();
    staying.forEach((t) => {
      const a = before.get(t);
      const b = t.getBoundingClientRect();
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      gsap.fromTo(t, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.85, ease: 'expo.out', clearProps: 'x,y' });
    });
  }
  chips.forEach((c) => c.addEventListener('click', () => filter(c.dataset.group)));

  /* ---------------------------------------------------------------- 5. the opened photograph */
  const view = $('#ha-view');
  const viewImg = $('#ha-view-img');
  const viewCap = $('#ha-view-cap');
  const viewDet = $('#ha-view-det');
  const bg = $('.ha-view-bg', view);
  const ctls = $$('.ha-ctl', view);
  const cap = $('figcaption', view);
  const RADIUS = 14;
  let at = -1;
  let opener = null;
  let busy = false;

  // while a photo is open, everything behind it is `inert`: Tab stays on its three buttons and a
  // screen reader does not wander back into the wall (2026-09-26 — before, Tab walked out behind it)
  const behind = () => [...document.body.children].filter((el) => el !== view && el.tagName !== 'SCRIPT' && !el.classList.contains('ha-cursor'));
  const biggest = (p) => Math.max(...[...p.srcset.matchAll(/(\d+)w/g)].map((m) => +m[1]));
  const tileOf = (i) => tiles.find((t) => +t.dataset.i === i);

  /** Set photo i into the view at the size it will be shown: as large as the screen allows, never
      larger than its biggest file. The tile's own, already loaded file goes in first (so the zoom
      has a picture from the first frame); the sharp one replaces it once it has arrived. */
  function place(i) {
    const p = photos[i];
    const t = tileOf(i);
    const im = t.querySelector('img');
    at = i;
    viewCap.textContent = p.cap;
    viewDet.textContent = p.det;
    viewImg.alt = `${p.cap} — ${p.det}`;

    const ratio = +im.getAttribute('width') / +im.getAttribute('height');
    const cs = getComputedStyle(view);
    const maxW = view.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const maxH = Math.min(view.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      - cap.offsetHeight - 14, 900);
    let w = Math.min(maxW, biggest(p));
    let h = w / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    viewImg.style.width = `${Math.round(w)}px`;
    viewImg.style.height = `${Math.round(h)}px`;

    viewImg.removeAttribute('srcset');
    viewImg.src = im.currentSrc || p.src;
    const sharp = new Image();
    sharp.sizes = `${Math.round(w)}px`;
    sharp.srcset = p.srcset;
    sharp.src = p.src;
    const swap = () => { if (at === i && sharp.currentSrc) viewImg.src = sharp.currentSrc; };
    if (sharp.decode) sharp.decode().then(swap, () => {}); else sharp.onload = swap;
  }

  /** The transform that puts the view's photo exactly over tile t, cropped as the tile crops it. */
  function over(t) {
    const T = t.getBoundingClientRect();
    const F = viewImg.getBoundingClientRect();
    const pos = getComputedStyle(t.querySelector('img')).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
    const px = Number.isFinite(pos[0]) ? pos[0] : 0.5;
    const py = Number.isFinite(pos[1]) ? pos[1] : 0.5;
    const s = Math.max(T.width / F.width, T.height / F.height);
    const sw = F.width * s;
    const sh = F.height * s;
    const left = T.left - (sw - T.width) * px;
    const top = T.top - (sh - T.height) * py;
    const cw = F.width - T.width / s;
    const ch = F.height - T.height / s;
    return {
      x: left + sw / 2 - (F.left + F.width / 2),
      y: top + sh / 2 - (F.top + F.height / 2),
      scale: s,
      clipPath: `inset(${ch * py}px ${cw * (1 - px)}px ${ch * (1 - py)}px ${cw * px}px round 0px)`,
    };
  }
  const onScreen = (t) => {
    const r = t.getBoundingClientRect();
    return !t.hidden && r.bottom > 0 && r.top < innerHeight && r.width > 0;
  };

  function open(tile) {
    if (busy) return;
    opener = tile;
    view.hidden = false;
    view.setAttribute('aria-hidden', 'false');
    place(+tile.dataset.i);
    behind().forEach((el) => { el.inert = true; });
    document.body.style.overflow = 'hidden';
    $('.ha-close', view).focus({ preventScroll: true });
    if (!motion) return;
    busy = true;
    tile.style.visibility = 'hidden';   // the photo lifts OUT of the wall
    gsap.killTweensOf([viewImg, bg, ctls, cap]);
    gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    gsap.fromTo([...ctls, cap], { opacity: 0 }, { opacity: 1, duration: 0.4, delay: 0.38, ease: 'power2.out', stagger: 0.04 });
    gsap.fromTo(viewImg, over(tile), {
      x: 0, y: 0, scale: 1, clipPath: `inset(0px 0px 0px 0px round ${RADIUS}px)`,
      duration: 0.78, ease: 'expo.inOut',
      onComplete: () => { gsap.set(viewImg, { clearProps: 'clipPath' }); busy = false; },
    });
  }

  function finish() {
    view.hidden = true;
    view.setAttribute('aria-hidden', 'true');
    if (window.gsap) gsap.set([viewImg, bg, ...ctls, cap], { clearProps: 'all' });
    viewImg.style.width = '';
    viewImg.style.height = '';
    tiles.forEach((t) => { t.style.visibility = ''; });
    busy = false;
    at = -1;
  }

  function close() {
    if (view.hidden || busy) return;
    behind().forEach((el) => { el.inert = false; });
    document.body.style.overflow = '';
    const back = opener;
    opener = null;
    if (back) back.focus({ preventScroll: true });
    if (!motion) { finish(); return; }
    busy = true;
    gsap.killTweensOf([viewImg, bg, ctls, cap]);
    gsap.to([...ctls, cap], { opacity: 0, duration: 0.2, ease: 'power1.out' });
    gsap.to(bg, { opacity: 0, duration: 0.55, delay: 0.1, ease: 'power2.inOut' });
    if (back && onScreen(back)) {
      // fly home into the tile it came from (or the one the arrows ended on)
      gsap.set(viewImg, { clipPath: `inset(0px 0px 0px 0px round ${RADIUS}px)` });
      gsap.to(viewImg, { ...over(back), duration: 0.7, ease: 'expo.inOut', onComplete: finish });
    } else {
      gsap.to(viewImg, { opacity: 0, scale: 0.94, duration: 0.35, ease: 'power2.in', onComplete: finish });
    }
  }

  function step(d) {
    if (busy || at < 0) return;
    const list = shown();
    const k = list.findIndex((t) => +t.dataset.i === at);
    if (k < 0) return;
    const next = list[(k + d + list.length) % list.length];
    if (opener) opener.style.visibility = '';
    opener = next;
    if (!motion) { place(+next.dataset.i); return; }
    next.style.visibility = 'hidden';
    busy = true;
    gsap.killTweensOf([viewImg, cap]);
    gsap.to([viewImg, cap], {
      x: -d * 60, opacity: 0, duration: 0.2, ease: 'power2.in',
      onComplete: () => {
        place(+next.dataset.i);
        gsap.fromTo([viewImg, cap], { x: d * 60, opacity: 0 }, {
          x: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.05,
          onComplete: () => { busy = false; },
        });
      },
    });
  }

  tiles.forEach((t) => t.addEventListener('click', () => open(t)));
  $('.ha-close', view).addEventListener('click', close);
  $('.ha-nav--prev', view).addEventListener('click', () => step(-1));
  $('.ha-nav--next', view).addEventListener('click', () => step(1));
  // a click on the ground closes; a click on the photograph or a button does not
  view.addEventListener('click', (e) => { if (e.target === view || e.target === bg) close(); });

  addEventListener('keydown', (e) => {
    if (view.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  // on a phone: swipe sideways to the next photo, the way every photo viewer does
  let touch = null;
  view.addEventListener('touchstart', (e) => {
    const p = e.touches[0];
    touch = { x: p.clientX, y: p.clientY };
  }, { passive: true });
  view.addEventListener('touchend', (e) => {
    if (!touch) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - touch.x;
    const dy = p.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ---------------------------------------------------------------- 6. the Zoom cursor */
  // Only where there is a mouse, and only over the photos: everywhere else the normal pointer stays.
  // A round „Zoom" badge follows the pointer a little behind it, stretches in the direction it is
  // thrown and settles round again; the photo under it leans toward the pointer (CSS, from --px/--py).
  // Press: it sinks. Click: it swells and vanishes into the opening photo.
  if (motion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.documentElement.classList.add('ha-cur');
    const cur = document.createElement('div');
    cur.className = 'ha-cursor';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="ha-cursor-sq"><span class="ha-cursor-blob"></span></span>'
      + '<span class="ha-cursor-icon"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.25" />'
      + '<path d="M15.2 15.2 19.5 19.5M10.5 8v5M8 10.5h5" /></svg><b>Zoom</b></span>';
    document.body.appendChild(cur);
    const sq = $('.ha-cursor-sq', cur);
    const blob = $('.ha-cursor-blob', cur);
    const icon = $('.ha-cursor-icon', cur);
    gsap.set(cur, { x: -300, y: -300 });
    gsap.set([blob, icon], { scale: 0 });
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.5, ease: 'power3' });

    let px = -300;
    let py = -300;
    let placed = false;
    let on = false;
    let hovered = null;

    const setOn = (want) => {
      if (want === on) return;
      on = want;
      gsap.to([blob, icon], {
        scale: want ? 1 : 0, opacity: 1,
        duration: want ? 0.55 : 0.28, ease: want ? 'back.out(1.9)' : 'power2.in',
        stagger: want ? 0.05 : 0, overwrite: 'auto',
      });
    };
    const lean = (t) => {
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--px', ((px - r.left) / r.width - 0.5).toFixed(3));
      t.style.setProperty('--py', ((py - r.top) / r.height - 0.5).toFixed(3));
    };
    const setOver = (t) => {
      if (t !== hovered) {
        if (hovered) { hovered.style.removeProperty('--px'); hovered.style.removeProperty('--py'); }
        hovered = t;
      }
      lean(t);
      setOn(!!t && view.hidden);
    };
    const under = () => {
      const el = document.elementFromPoint(px, py);
      return el && el.closest ? el.closest('.ha-tile') : null;
    };

    document.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      px = e.clientX;
      py = e.clientY;
      if (!placed) { gsap.set(cur, { x: px, y: py }); placed = true; }
      xTo(px);
      yTo(py);
      setOver(e.target.closest ? e.target.closest('.ha-tile') : null);
    }, { passive: true });
    // the wall moves under a resting pointer while the page scrolls
    addEventListener('scroll', () => { if (placed) setOver(under()); }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => setOver(null));

    wall.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && on) gsap.to(blob, { scale: 0.82, duration: 0.18, ease: 'power2.out', overwrite: 'auto' });
    });
    wall.addEventListener('pointerup', () => { if (on) gsap.to(blob, { scale: 1, duration: 0.4, ease: 'back.out(2)', overwrite: 'auto' }); });
    tiles.forEach((t) => t.addEventListener('click', () => {
      on = false;
      gsap.to(blob, { scale: 2.6, opacity: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
      gsap.to(icon, { scale: 0.6, opacity: 0, duration: 0.25, ease: 'power2.in', overwrite: 'auto' });
    }));
    // after the view closes, pick up whatever photo is under the pointer again
    new MutationObserver(() => { if (view.hidden) setTimeout(() => setOver(under()), 60); })
      .observe(view, { attributes: true, attributeFilter: ['hidden'] });

    // the stretch: measured from the badge's own travel, so it follows the eye, not the raw mouse
    let lx = 0;
    let ly = 0;
    let st = 0;
    let ang = 0;
    gsap.ticker.add(() => {
      const cx = gsap.getProperty(cur, 'x');
      const cy = gsap.getProperty(cur, 'y');
      const dx = cx - lx;
      const dy = cy - ly;
      lx = cx;
      ly = cy;
      const v = Math.hypot(dx, dy);
      if (v > 0.6) ang = Math.atan2(dy, dx) * 180 / Math.PI;
      st += (Math.min(v / 55, 0.32) - st) * 0.18;
      gsap.set(sq, { rotation: ang, scaleX: 1 + st, scaleY: 1 - st * 0.55 });
    });
  }
})();
