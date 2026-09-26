/* Elité — hero prototype (2026-09-16)
 *
 * GSAP 3.14 + ScrollTrigger: the same library the live site already ships, so this ports to the
 * React Hero.jsx without a new dependency.
 *
 *   1. Navbar      — a straight port of Navbar.jsx (scrolled state, mobile menu, magnetic CTA).
 *   2. Triptych    — three photo columns; one column swaps at a time, left → right → middle → …
 *   3. Van reveal  — the stage is sticky; scrolling raises the van plate until it fills the screen.
 *                    The opening text is gone by the time the van covers 60 % (Manuel's rule).
 *   4. Slogan      — plays once the van has landed, reverses if you scroll back up.
 *   5. Stop        — a scroll that runs down into the landing is held there while the slogan plays.
 *   6. Strip       — section 2: a sideways strip of work photos slides in over the van and travels.
 *   7. Daylight    — section 3: warm white, the three steps in giant type with a photo inside the letters.
 *   8. Detail view — section 4: a work photo beside the spot under a gliding frame, twice as large.
 *   9. Before/after — section 5: one line sweeps across each row of real pairs; then the reviews.
 *  10. Price list   — section 6: the site's own prices, switched by vehicle size.
 */
(() => {
  'use strict';

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // ⚠ 2026-09-24 (found while moving the packages below the film): <html> carries Tailwind's
  // `scroll-smooth`, so the in-page links glide. But ScrollTrigger re-measures the page by scrolling it,
  // and with scroll-behavior: smooth that scroll glided instead of jumping — every trigger was measured
  // as if the reader stood at the very top. So after ANY refresh away from the top (a package tab, a FAQ
  // row, a window resize) all triggers were off by the whole scroll position and the one-time reveals
  // fired unseen: measured at the packages, 46 simple triggers → 26 left, 17 333 px off. With the glide
  // off while it measures: all 46, within 1 px. So the glide is switched off for exactly one refresh.
  const root = document.documentElement;
  ScrollTrigger.addEventListener('refreshInit', () => { root.style.scrollBehavior = 'auto'; });
  ScrollTrigger.addEventListener('refresh', () => { root.style.scrollBehavior = ''; });

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Where a masked line waits before it rises, as a share of its own height. ⚠ 2026-09-23 (Manuel:
  // „when you click on the site, you can see these white dots where the text is going to be“): it
  // was 115, and at 115 the tops of P, f, k, t and the i/ä dots of „Perfektion trifft / Präzision.“
  // stayed inside the mask as a row of white dots — for the whole font/photo wait on load (up to
  // 3 s) and the first 0.9 s of the intro. The line-height is tighter than the letters, so they stand
  // above their own line box, and the mask reaches .18em below it. Measured on every masked family
  // (letters' box vs the mask's window): the hero headline needs 153, the slogan 147, the section
  // headings 132. 160 clears all of them. Section 2 found the same bug on 2026-09-17 and moved to
  // 150 (hero.css, .hl-line-in) — it was never carried back here. hero.css parks at the same 160.
  // Since the code review of 2026-09-24 section 2 parks at PARK as well: it had kept its own 150,
  // written out five times, when everything else moved to 160 — one number for every masked line now.
  const PARK = 160;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  // hero.css parks the masked lines at translate 160 % (PARK) so nothing flashes before this runs.
  // Since 2026-09-25 every headline is WRITTEN in, letter by letter (write.js, Manuel's pick from
  // lab/text-motion.html): the line itself comes back to its place, its letters are hidden instead,
  // and the mask is opened. PARK is still what the CSS uses until this line has run.
  hxWrite.park('.hx-line-in, .hx-word-in');

  /* ============================================================ 1. navbar (port of Navbar.jsx) */

  const nav = $('#site-nav');
  // Scrolled / top states. Navbar.jsx had a dark pill (bg-obsidian/70, backdrop-blur-xl, all-round
  // border, shadow-xl); Manuel chose a full-width bar, "thinner and way more transparent"
  // (2026-09-16). A light hairline reads as a glass edge on a see-through bar, a dark one as dirt.
  // The lists sit here so Tailwind's content scan generates them.
  const NAV_SCROLLED = ['bg-obsidian/30', 'backdrop-blur-md', 'border-b', 'border-ivory/10'];
  const NAV_TOP = ['bg-transparent', 'border-b', 'border-transparent'];
  // Over section 3's warm white the see-through bar would put ivory links on ivory: the bar
  // turns nearly solid there instead (2026-09-17). Its links stay exactly as they are.
  const NAV_ON_LIGHT = ['bg-obsidian/85', 'backdrop-blur-md', 'border-b', 'border-ivory/10'];
  // …and over section 4's bright photo row (the white van), for the same reason.
  // …and over the hero's own van plate, white since 2026-09-23 (the Mercedes pass): once its top
  // edge reaches the bar, ivory links would sit on ivory. It stays counted for the rest of the
  // hero, while section 2's strip travels over it — a solid bar there reads the same as a
  // see-through one, and being wrong the other way would cost the links.
  const lightGrounds = $$('.hx-van, .hd, .hw-bright, .hb-row, .hr, .hk-in, .hm, .hq, .hf'); // + section 5's sunny photos, its reviews, section 6's ivory cards, sections 7 and 9 and the footer
  let navMode = null;

  function currentNavMode() {
    if (window.scrollY <= 50) return 'top';
    for (const ground of lightGrounds) {
      const r = ground.getBoundingClientRect();
      if (r.top < 56 && r.bottom > 0) return 'light';
    }
    return 'scrolled';
  }
  function updateNav() {
    const mode = currentNavMode();
    if (mode === navMode) return;
    navMode = mode;
    nav.classList.remove(...NAV_SCROLLED, ...NAV_TOP, ...NAV_ON_LIGHT);
    nav.classList.add(...(mode === 'top' ? NAV_TOP : mode === 'light' ? NAV_ON_LIGHT : NAV_SCROLLED));
  }

  const menu = $('#mobile-menu');
  const toggle = $('[data-nav-toggle]');
  let menuOpen = false;
  let menuTl = null;

  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    document.body.style.overflow = open ? 'hidden' : '';
    menu.style.pointerEvents = open ? 'auto' : 'none';
    $('[data-icon="menu"]', toggle).hidden = open;
    $('[data-icon="x"]', toggle).hidden = !open;

    if (open) {
      const items = $$('.menu-item', menu);
      menuTl = gsap.timeline();
      // Circle grows from the menu button: 2.5rem from the right, 1.75rem down (the bar is 56px on phones).
      menuTl.fromTo(menu,
        { clipPath: 'circle(0% at calc(100% - 2.5rem) 1.75rem)' },
        { clipPath: 'circle(150% at calc(100% - 2.5rem) 1.75rem)', duration: 0.7, ease: 'power4.inOut' });
      menuTl.fromTo(items,
        { y: 40, opacity: 0, scale: 0.95, filter: 'blur(8px)' },
        { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, stagger: 0.08, ease: 'power3.out' },
        '-=0.3');
    } else if (menuTl) {
      menuTl.timeScale(1.5).reverse();
    }
  }

  toggle.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  $('[data-nav-home]').addEventListener('click', () => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('scroll', () => {
    updateNav();
    if (menuOpen) setMenu(false);
  }, { passive: true });
  updateNav();

  // Magnetic buttons — port of useMagneticGlobal() in App.jsx.
  if (!('ontouchstart' in window)) {
    document.addEventListener('mousemove', (e) => {
      const el = e.target.closest && e.target.closest('.btn-magnetic');
      if (!el) return;
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - (r.left + r.width / 2)) * 0.25,
        y: (e.clientY - (r.top + r.height / 2)) * 0.25,
        duration: 0.3,
        ease: 'power2.out',
      });
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.classList && e.target.classList.contains('btn-magnetic')) {
        gsap.to(e.target, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      }
    });
  }

  /* ============================================================ 2. triptych slideshow */

  const ORDER = ['left', 'right', 'middle'];
  // Measured on frame strips (2026-09-16): with expo.inOut the edge crossed the column in
  // ~0.35 s and the screen then sat still for ~1.3 s — a snap and a pause, not a flow.
  // power3.inOut still left ~0.8 s of stillness per beat. power2.inOut spreads the travel over
  // ~70 % of the wipe, and starting the next column during the last one's slow tail leaves no
  // stretch where nothing moves.
  // Manuel, 2026-09-16, on 1.8 s / 1.25 s: "a tiny bit slower, but really just a little" → +14 %.
  const WIPE = 2.05;   // seconds one swap takes
  const STEP = 1.42;   // seconds between swap starts (overlaps the slow tail of the last swap)
  const EASE = 'power2.inOut';
  const SETTLE = STEP * ORDER.length + WIPE; // a photo zooms out for its whole time on screen

  const panels = {};
  $$('.hx-panel').forEach((el) => {
    panels[el.dataset.panel] = {
      idx: -1,
      busy: false,
      slides: $$('.hx-slide', el).map((s) => ({
        el: s,
        inner: $('.hx-slide-in', s),
        img: $('img', s),
        shade: $('.hx-slide-shade', s),
      })),
    };
  });

  const ready = (img) => img.complete && img.naturalWidth > 0;

  // One swap: the new photo wipes up from the bottom edge while rising a little inside its own
  // mask; the old photo is pushed up and dimmed underneath. The zoom is a separate, longer tween
  // (1.16 → 1 over the photo's whole time on screen), so the image never stops moving — a
  // second tween starting when the wipe ends would put a visible hitch in the zoom.
  function swap(panel, delay = 0) {
    const cur = panel.idx >= 0 ? panel.slides[panel.idx] : null;
    const nextIdx = (panel.idx + 1) % panel.slides.length;
    const next = panel.slides[nextIdx];
    panel.busy = true;

    gsap.killTweensOf(next.inner);
    gsap.set(next.el, { visibility: 'visible', zIndex: 2, yPercent: 100 });
    gsap.set(next.inner, { yPercent: -76, scale: 1.16 });
    gsap.set(next.shade, { opacity: 0 });
    if (cur) gsap.set(cur.el, { zIndex: 1 });

    const tl = gsap.timeline({
      delay,
      defaults: { duration: WIPE, ease: EASE },
      onComplete() {
        if (cur) {
          gsap.killTweensOf(cur.inner);
          gsap.set(cur.el, { visibility: 'hidden', zIndex: 0, yPercent: 0 });
          gsap.set(cur.inner, { yPercent: 0, scale: 1 });
          gsap.set(cur.shade, { opacity: 0 });
        }
        panel.idx = nextIdx;
        panel.busy = false;
      },
    });
    tl.to(next.el, { yPercent: 0 }, 0)
      .to(next.inner, { yPercent: 0 }, 0);
    if (cur) {
      tl.to(cur.inner, { yPercent: -24 }, 0)
        .to(cur.shade, { opacity: 0.6 }, 0);
    }
    gsap.to(next.inner, { scale: 1, duration: SETTLE, ease: 'power2.out', delay });
    return tl;
  }

  let turn = 0;
  let triCovered = false;

  function loop() {
    const panel = panels[ORDER[turn % ORDER.length]];
    const next = panel.slides[(panel.idx + 1) % panel.slides.length];
    // Nothing to see while the van covers the columns; and never swap to a photo that has not
    // arrived — retry the same column next beat instead of skipping it.
    if (!triCovered && !panel.busy && ready(next.img)) {
      swap(panel);
      turn += 1;
    }
    gsap.delayedCall(STEP, loop);
  }

  /* ============================================================ 3. van reveal on scroll */

  const hero = $('#hero');
  const tri = $('.hx-tri');
  const triDim = $('.hx-tri-dim');
  const van = $('.hx-van');
  const vanImg = $('.hx-van-img');
  const vanScrim = $('.hx-van-scrim');
  const copyMain = $('.hx-copy-main');
  const copySide = $('.hx-copy-side');
  const copyLede = $('.hx-lede-wrap');   // experiment 2026-09-19: the sentence under the headline

  let landAt = 0.85;
  function measure() {
    const cs = getComputedStyle(hero);
    const rise = parseFloat(cs.getPropertyValue('--hx-rise'));
    const hold = parseFloat(cs.getPropertyValue('--hx-hold'));
    if (rise > 0 && hold >= 0) landAt = rise / (rise + hold);
  }

  // Scroll-linked, so no time easing — just a soft landing on the last stretch.
  const landEase = (t) => 1 - Math.pow(1 - t, 1.9);

  function fade(el, opacity, lift) {
    el.style.opacity = opacity.toFixed(3);
    el.style.transform = `translate3d(0, ${(-lift).toFixed(1)}px, 0)`;
    el.style.visibility = opacity <= 0.002 ? 'hidden' : '';
  }

  let landed = false;

  function render(progress, dir = 0) {
    const r = clamp01(progress / landAt);
    const cover = reduced ? r : landEase(r); // share of the screen the van covers
    const rest = 1 - cover;

    van.style.transform = `translate3d(0, ${(rest * 100).toFixed(3)}%, 0)`;
    vanImg.style.transform = `translate3d(0, ${(-rest * 16).toFixed(3)}%, 0) scale(${(1 + rest * 0.14).toFixed(4)})`;
    vanScrim.style.opacity = (rest * 0.6).toFixed(3);

    tri.style.transform = `translate3d(0, ${(-cover * 12).toFixed(3)}vh, 0)`;
    triDim.style.opacity = (cover * 0.65).toFixed(3);

    // Fully covered: stop drawing the columns (opacity, not visibility — GSAP sets the current
    // slides to visibility:visible inline, and a visible child shows through a hidden parent).
    const covered = cover > 0.998;
    if (covered !== triCovered) {
      triCovered = covered;
      tri.style.opacity = covered ? '0' : '';
    }

    // The rule: the opening text is gone by the time the van covers 60 % of the screen.
    // The small print leaves first — the van's edge reaches it sooner, and half-faded body
    // copy over the white van read as a smudge on the frame strip.
    const lift = cover * 110;
    fade(copyMain, 1 - clamp01(cover / 0.6), lift);
    fade(copySide, 1 - clamp01(cover / 0.3), lift);
    // the small sentence under the headline sits lowest, so the van reaches it first: it leaves on
    // the small print's clock, not the headline's (no own lift — it already rides copyMain's)
    if (copyLede) fade(copyLede, 1 - clamp01(cover / 0.3), 0);

    if (!landed && r >= 0.999) {
      landed = true;
      showSlogan();
      if (dir > 0) startHold(); // only a scroll going down is caught; a refresh never is
    } else if (landed && r < 0.965) {
      landed = false;
      hideSlogan();
    }
  }

  /* ============================================================ 4. slogan */

  const vanCopy = $('.hx-van-copy');
  const slogan = gsap.timeline({
    paused: true,
    onReverseComplete: () => { vanCopy.style.visibility = 'hidden'; },
  });
  slogan
    .fromTo('.hx-van-floor', { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0)
    .add(hxWrite('.hx-word-in'), 0.1)
    // Apple's rise: 30px, the move done at ~78 % while the opacity finishes (measured 2026-09-16).
    .fromTo('.hx-van-side > *', { y: 30 }, { y: 0, duration: 0.735, ease: 'power1.inOut', stagger: 0.08 }, 0.5)
    .fromTo('.hx-van-side > *', { opacity: 0 }, { opacity: 1, duration: 0.94, ease: 'power1.inOut', stagger: 0.08 }, 0.5);

  function showSlogan() {
    warmStrip();
    vanCopy.style.visibility = 'visible';
    if (reduced) slogan.progress(1);
    else slogan.timeScale(1).play();
  }
  function hideSlogan() {
    if (reduced) {
      slogan.progress(0);
      vanCopy.style.visibility = 'hidden';
    } else {
      slogan.timeScale(2.2).reverse();
    }
  }

  // EXPERIMENT 2026-09-19 — „Perfektion trifft / Präzision." Manuel: the upper line "a line smaller
  // above and almost as long as the lower word". So both lines are measured at a probe size and set:
  // „Präzision." fills the text column (capped, and never taller than the screen allows), „Perfektion
  // trifft" gets whatever size makes it TOP_RATIO of that width. Inter's optical-size axis is at its
  // display cut above 32 px, so width scales linearly with size there — one probe is exact.
  const heroTitle = $('.hx-title--duo');
  const TOP_RATIO = 0.92;   // "almost as long"
  /* 2026-09-23, Manuel: „can we try to make this whole thig a little smaller". The headline filled
     94 % of the text column and was capped at 210 px — 196 px tall at 1440, 210 at 1920. Both knobs
     come down by about a sixth; the block keeps its proportions, it just stops shouting. */
  const BIG_FILL = 0.79;    // share of the text column „Präzision." may take (was .94)
  const BIG_CAP = 176;      // px (was 210 — the slogan's own cap is 180)
  function fitHero() {
    if (!heroTitle) return;
    const [top, big] = $$('.hx-line', heroTitle);
    const topIn = $('.hx-line-in', top);
    const bigIn = $('.hx-line-in', big);
    const probe = 100;
    top.style.fontSize = `${probe}px`;
    big.style.fontSize = `${probe}px`;
    const wTop = topIn.getBoundingClientRect().width;
    const wBig = bigIn.getBoundingClientRect().width;
    if (!wTop || !wBig) { top.style.fontSize = ''; big.style.fontSize = ''; return; }
    const col = copyMain.clientWidth;
    // height guard: the whole block (both lines ≈ 1.5 × the big size, plus label and sentence) stays
    // within about half of a short landscape screen
    const byHeight = (window.innerHeight * 0.5 - 120) / 1.35;
    const sBig = Math.max(36, Math.min((probe * col * BIG_FILL) / wBig, BIG_CAP, byHeight));
    let sTop = (sBig * wBig * TOP_RATIO) / wTop;
    big.style.fontSize = `${sBig.toFixed(2)}px`;
    top.style.fontSize = `${sTop.toFixed(2)}px`;
    // Second pass, measured at the real sizes: glyph advances are rounded per size, so the 100 px probe
    // lands about 2 % off (measured 0.90 for 0.92). One correction brings it onto the ratio.
    const realBig = bigIn.getBoundingClientRect().width;
    const realTop = topIn.getBoundingClientRect().width;
    if (realBig && realTop) {
      sTop *= (realBig * TOP_RATIO) / realTop;
      top.style.fontSize = `${sTop.toFixed(2)}px`;
    }
    spaceHero(top, topIn, big, bigIn, sTop);
  }

  // Optical spacing. Two different fonts at two sizes on one line-height leave gaps that depend on each
  // font's ascenders, not on the design (a serif italic's k and f reach far higher than Inter's). So the
  // INK is measured — canvas measureText gives each line's real ascent/descent — and the two gaps are set
  // in pixels: label → top of the first line's letters, bottom of the first line → top of „Präzision.".
  // Positions come from the line wrappers and offsetHeight, never from the words themselves: during the
  // intro those are still translated PARK % down inside their masks.
  const inkCtx = document.createElement('canvas').getContext('2d');
  function inkOf(line, inner) {
    const cs = getComputedStyle(line);
    inkCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const text = cs.textTransform === 'uppercase' ? inner.textContent.toUpperCase() : inner.textContent;
    const m = inkCtx.measureText(text);
    const lh = parseFloat(cs.lineHeight);
    const pad = parseFloat(cs.paddingTop);
    // inline-block, vertical-align top, one text line: its box starts at the padding edge and is lh tall;
    // the baseline sits where the font's own ascent lands inside that box
    const half = (lh - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
    const baseline = line.getBoundingClientRect().top + pad + half + m.fontBoundingBoxAscent;
    return { top: baseline - m.actualBoundingBoxAscent, bottom: baseline + m.actualBoundingBoxDescent };
  }
  function spaceHero(top, topIn, big, bigIn, sTop) {
    const label = $('.hx-label--ruled', copyMain);
    if (!label || !inkCtx.measureText('x').fontBoundingBoxAscent) return;
    heroTitle.style.marginTop = '';
    big.style.marginTop = '';
    const gapLabel = Math.max(14, Math.min(28, sTop * 0.16)); // label → first line's letters
    const gapLines = Math.max(8, sTop * 0.2);                  // first line → „Präzision."
    // label: its untransformed bottom = the head's top + its own height (it is the head's first child)
    const labelBottom = $('.hx-head', copyMain).getBoundingClientRect().top + label.offsetHeight;
    let a = inkOf(top, topIn);
    const mt = parseFloat(getComputedStyle(heroTitle).marginTop);
    heroTitle.style.marginTop = `${(mt + gapLabel - (a.top - labelBottom)).toFixed(1)}px`;
    a = inkOf(top, topIn);
    const b = inkOf(big, bigIn);
    const mb = parseFloat(getComputedStyle(big).marginTop);
    big.style.marginTop = `${(mb + gapLines - (b.top - a.bottom)).toFixed(1)}px`;
  }

  // Wide screens: size the slogan to fill its column (it shares the row with the small print on
  // the right, exactly like the opening headline), capped so it never outgrows the van.
  const sloganEl = $('.hx-slogan');
  const sloganCol = $('.hx-van-main');
  // 2026-09-24: a phone held sideways sets the words side by side as well (hero.css, „a phone held
  // sideways"), so its slogan is fitted to its column the same way — before, it was one 89–111 px block
  // stacked over the sentence, too tall for the picture
  const sideways = window.matchMedia('(orientation: landscape) and (max-height: 500px)');
  function fitSlogan() {
    sloganEl.style.fontSize = '';
    if (window.innerWidth < 1024 && !sideways.matches) return;
    const probe = 100;
    sloganEl.style.fontSize = `${probe}px`;
    const width = sloganEl.getBoundingClientRect().width; // inline-flex: shrink-wraps the words
    if (!width) return;
    const size = Math.min(180, (probe * sloganCol.clientWidth * 0.95) / width);
    sloganEl.style.fontSize = `${size.toFixed(2)}px`;
  }

  /* ============================================================ 5. the stop on the slogan */

  // Manuel, 2026-09-17: a fast scroll ran straight past „Sorgfalt fährt vor." before the words could
  // be read. So a scroll that runs DOWN into the landing is caught on the landed van and held there
  // while the slogan plays — only going down, only for HOLD_MS, and any move back up ends it at once.
  // Behind the landing sits the still --hx-hold zone, so putting an overshoot back is invisible.
  const HOLD_MS = 1600; // the words and the small print have all arrived by ~1.5 s (timeline above; the van label left it on 2026-09-23)
  const DOWN_KEYS = ['ArrowDown', 'PageDown', 'End', ' ', 'Spacebar'];
  const UP_KEYS = ['ArrowUp', 'PageUp', 'Home'];

  let landY = 0;      // scroll position where the van has fully landed — set on every refresh
  let holding = false;
  let holdTimer = 0;
  let touchY = null;
  let jumpUntil = 0;  // an in-page link is travelling (html is scroll-smooth); never catch that
  // Anchors whose landing is not simply the section's top (#philosophy lands mid-strip) register it here,
  // so the in-page link and an arrival from another page (index.html#…) land in the same place.
  const anchorTop = {};

  function toLanding() {
    // 'instant': <html> carries scroll-smooth, and a smooth correction would visibly glide back.
    if (window.scrollY > landY + 1) window.scrollTo({ top: landY, behavior: 'instant' });
  }

  function onHoldWheel(e) {
    if (e.deltaY < 0) endHold();
    else if (e.deltaY > 0) e.preventDefault();
  }
  function onHoldTouchStart(e) {
    touchY = e.touches[0].clientY;
  }
  function onHoldTouchMove(e) {
    const y = e.touches[0].clientY;
    const dy = touchY === null ? 0 : y - touchY; // a finger moving up (dy < 0) scrolls the page down
    touchY = y;
    if (dy > 0) endHold();
    else if (e.cancelable) e.preventDefault(); // a drag already scrolling cannot be cancelled; the scroll listener puts it back
  }
  function onHoldKey(e) {
    if (UP_KEYS.includes(e.key) || (e.key === ' ' && e.shiftKey)) endHold();
    else if (DOWN_KEYS.includes(e.key)) e.preventDefault();
  }

  function startHold() {
    if (performance.now() < jumpUntil) return;
    if (window.scrollY - landY > window.innerHeight * 0.6) return; // a jump landed far below: let it
    clearTimeout(holdTimer);
    if (!holding) {
      holding = true;
      touchY = null;
      // Blocking listeners exist only during the stop, so the rest of the page scrolls on the fast path.
      window.addEventListener('wheel', onHoldWheel, { passive: false });
      window.addEventListener('touchstart', onHoldTouchStart, { passive: true });
      window.addEventListener('touchmove', onHoldTouchMove, { passive: false });
      window.addEventListener('keydown', onHoldKey);
    }
    toLanding();
    holdTimer = setTimeout(endHold, HOLD_MS);
  }

  function endHold() {
    if (!holding) return;
    holding = false;
    clearTimeout(holdTimer);
    window.removeEventListener('wheel', onHoldWheel, { passive: false });
    window.removeEventListener('touchstart', onHoldTouchStart, { passive: true });
    window.removeEventListener('touchmove', onHoldTouchMove, { passive: false });
    window.removeEventListener('keydown', onHoldKey);
  }

  // Whatever still moves the page during the stop — a smooth wheel scroll already under way, touch
  // momentum, the scrollbar — goes back to the landing; going above the landing ends the stop.
  window.addEventListener('scroll', () => {
    if (!holding) return;
    if (window.scrollY < landY - 2) endHold();
    else toLanding();
  }, { passive: true });

  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', () => {
    endHold();
    jumpUntil = performance.now() + 2000;
  }));

  /* ============================================================ 6. section 2 · the strip (#philosophy) */

  // Manuel picked idea 1 of three (2026-09-17): the page holds, a strip of work photos slides
  // sideways with a giant „Keine …" line between them, and the last photo opens to full screen.
  // One scroll progress p (0 → 1, smoothed by scrub) drives five stretches:
  //   in      the strip slides in from the right over the landed van (the hero is still pinned)
  //   dwell   it rests while the claim turns — „Waschstraßen waschen Autos." steps back
  //   travel  it moves sideways; every picture drifts against the move and settles from a zoom
  //   grow    the last frame opens leftwards to full screen
  //   end     it rests on the closing sentence
  //   cover   it stays pinned one more screen while section 3's white rises over it (and darkens)
  // 2026-09-24, Manuel: „remove the text completly - when you scroll the pics start". The claim panel is
  // gone (markup in _archive/2026-09-24-section2-claim/), so the strip opens with the photos and there
  // is nothing to rest on: without the panel `dwell` is 0 and the claim's two timelines are not built.
  // Put the panel back and all three come back by themselves.
  const stripEl = $('#philosophy');
  const stripStage = $('.hl-stage');
  const track = $('.hl-track');
  const claim = $('.hl-head', track);
  const heroStage = $('.hx-stage');
  const stageDim = $('.hx-stage-dim');
  const stripDim = $('.hl-dim');
  const growLayer = $('.hl-grow');
  const lastPanel = $('.hl-last');
  const lastImg = $('.hl-grow .hl-img');
  const stripImgs = $$('.hl img');

  // The photos are lazy; once the van lands they are one scroll away, so fetch them then.
  let stripWarm = false;
  function warmStrip() {
    if (stripWarm) return;
    stripWarm = true;
    stripImgs.forEach((img) => {
      if (img.offsetParent === null && !img.closest('.hl-grow')) return; // phone-only picture on a desktop
      img.loading = 'eager';
    });
  }

  const frames = $$('.hl-panel', track).map((el) => ({
    el,
    imgs: $$('.hl-img', el).filter((img) => !img.closest('.hl-grow')), // the last picture moves with its clip
    say: $('.hl-say', el),
    tl: null,
    left: 0,
    width: 0,
    s: -1,
    shown: false,
  }));

  const geo = { W: 1, H: 1, travel: 0, R: 1, a: 0.2, b: 0.3, c: 0.7, d: 0.8, f: 0.85, growFrom: 0, lag: 0 };

  /** The closing sentence as exactly THREE lines, one per .hl-line, never wrapped (Manuel, 2026-09-23:
      it was wrapping to four; he asked for two, then three — this said „TWO" until the code review of
      2026-09-24). Same two passes as fitFilm: glyph advances round per pixel size, so one probe lands
      ~2 % off.
      ⚠ The measurement needs .is-fit ON: without it .hl-close carries max-width 15.5em, and each
      line's box is only as wide as that WRAPPED column, not as wide as its text. */
  function fitClose() {
    const close = $('.hl-close');
    if (!close) return;
    close.style.fontSize = '';
    close.classList.remove('is-fit');
    if (!matchMedia('(min-width: 700px)').matches) return;   // phones keep the wrap
    const room = growLayer.clientWidth - parseFloat(getComputedStyle(close).left) * 2;
    if (!(room > 0)) return;
    const lines = $$('.hl-line-in', close);
    close.classList.add('is-fit');
    let size = 80;
    close.style.fontSize = size + 'px';
    for (let i = 0; i < 2; i++) {
      const w = Math.max(...lines.map((e) => e.getBoundingClientRect().width));
      if (!w) break;
      size = Math.min(80, (size * room * 0.985) / w);
      close.style.fontSize = size.toFixed(2) + 'px';
    }
    // below this the sentence stops being a statement and starts being small print — wrap instead
    if (size < 30) { close.classList.remove('is-fit'); close.style.fontSize = ''; return; }

    // …and never over his hand (Manuel, 2026-09-23: „so you can see him but the hand does not
    // interfere with the text"). The photo is cover-fitted into a box 1.2× the screen wide, so the
    // hand lands lower the wider-and-shorter the window is: at 1920×950 three lines at the width's
    // size put the cloth straight on „Hand, Panel", at 1440×900 they clear it by 60 px. So the hand's
    // place is worked out from the crop and the block's height is capped to stay under it.
    // Layout sizes only (offsetWidth/Height): hero.js scales this picture while the frame opens.
    const img = $('.hl-last .hl-img img');
    if (!img) return;
    // the photo's own size, off its width/height attributes (the picture may not be loaded yet)
    const iw = +img.getAttribute('width');
    const ih = +img.getAttribute('height');
    if (!(iw > 0 && ih > 0)) return;
    const bw = img.offsetWidth;
    const bh = img.offsetHeight;
    const k = Math.max(bw / iw, bh / ih);                   // object-fit: cover
    const rh = ih * k;
    const py = parseFloat(getComputedStyle(img).objectPosition.split(' ')[1]) / 100;
    const handY = -py * (rh - bh) + LAST_HAND * rh + 18;   // + a little air above the type
    const textBottom = growLayer.clientHeight - parseFloat(getComputedStyle(close).bottom);
    const lead = parseFloat(getComputedStyle(close).lineHeight) / size;
    const cap = (textBottom - handY) / (lines.length * lead);
    // an ultra-wide, short window has no room under the hand at all — there the type keeps a
    // readable size and is allowed to cross the hand rather than shrink to nothing.
    // ⚠ The cap only ever makes the type SMALLER (code review 2026-09-24): it was `max(44, cap)`, and
    // where the width fit is already under 44 px — a phone on its side, 740×360 — that grew the type
    // past the width it had just been fitted to, and the first line ran 55 px out of the frame.
    if (cap < size) {
      size = Math.min(size, Math.max(44, cap));
      close.style.fontSize = size.toFixed(2) + 'px';
    }
  }
  // strip-side-2304.webp: where the cloth and fingers end, as a share of its height (measured on the
  // frame 2026-09-23 — the lowest point of the hand is at 50 %; .505 for safety). Another photo needs
  // its own measurement. The photo's size was copied in here too (LAST_W 2304, LAST_H 1536) until the
  // code review of 2026-09-24; fitClose now reads it off the <img>, so it can't drift from the markup.
  const LAST_HAND = 0.505;

  function measureStrip() {
    fitClose();
    const W = stripStage.clientWidth;
    const H = stripStage.clientHeight;
    const wide = W >= 1024;
    frames.forEach((f) => {
      f.left = f.el.offsetLeft; // layout position: transforms do not change it
      f.width = f.el.offsetWidth;
      f.s = -1;
    });
    const travel = Math.max(0, track.offsetWidth - W);
    const speed = wide ? 2.2 : W >= 700 ? 1.6 : 1.1; // sideways pixels per scrolled pixel
    const cover = parseFloat(getComputedStyle(hero).getPropertyValue('--hx-cover')) / 100;
    const len = {
      in: H * cover, // exactly the hero's --hx-cover: the van stays pinned until it is covered
      dwell: claim ? H * 0.28 : 0,   // a rest to read the claim — no claim, no rest
      travel: travel / speed,
      grow: H * (wide ? 0.5 : 0.3),
      end: H * 0.5,
      cover: H, // exactly one stage height: section 3 starts 100lvh up and needs that long to rise
    };
    const R = Math.round(len.in + len.dwell + len.travel + len.grow + len.end + len.cover);
    stripEl.style.setProperty('--hl-runway', `${R}px`);
    const say = $('.hl-say', track);
    Object.assign(geo, {
      W, H, travel, R,
      a: len.in / R,
      b: (len.in + len.dwell) / R,
      c: (len.in + len.dwell + len.travel) / R,
      d: (len.in + len.dwell + len.travel + len.grow) / R,
      f: (R - len.cover) / R,
      growFrom: Math.max(0, growLayer.offsetWidth - lastPanel.offsetWidth),
      lag: say ? Math.min(56, parseFloat(getComputedStyle(say).paddingLeft) * 1.4) : 0,
    });
  }

  const settleIn = (t) => 1 - Math.pow(1 - t, 2);
  const inOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  let headIn = null;
  let headTurn = null;
  let closeIn = null;
  const shown = { head: false, turn: false, close: false };

  // Reveals are played, not scrubbed: a half-risen line whenever the reader pauses reads as a glitch.
  function setShown(key, tl, on) {
    if (reduced || !tl || on === shown[key]) return;   // !tl: the claim's timelines exist only with the claim
    shown[key] = on;
    if (on) tl.timeScale(1).play();
    else tl.timeScale(1.8).reverse();
  }

  function renderStrip(p) {
    const { W, a, b, c, d, travel } = geo;
    const e = settleIn(clamp01(p / a));
    const t = clamp01((p - b) / Math.max(1e-6, c - b));
    const g = inOut(clamp01((p - c) / Math.max(1e-6, d - c)));
    const x = W * (1 - e) - travel * t;
    track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;

    // Behind it the van drifts left and darkens while it is being covered.
    heroStage.style.transform = e > 0 && !reduced ? `translate3d(${(-0.26 * W * e).toFixed(1)}px, 0, 0)` : '';
    stageDim.style.opacity = (0.72 * e).toFixed(3);

    for (const f of frames) {
      const s = clamp01((W - (x + f.left)) / (W + f.width)); // 0 entering on the right, 1 gone on the left
      if (Math.abs(s - f.s) < 0.0004) continue;
      f.s = s;
      if (reduced) continue;
      // the picture drifts against the travel and settles from a slight zoom as it crosses
      const shift = ((s - 0.5) * 14).toFixed(2);
      const zoom = (1.12 - 0.12 * s).toFixed(4);
      for (const img of f.imgs) img.style.transform = `translate3d(${shift}%, 0, 0) scale(${zoom})`;
      if (f.say) f.say.style.transform = `translate3d(${((s - 0.5) * geo.lag).toFixed(1)}px, 0, 0)`; // the words linger
      if (f.tl) {
        // rise as soon as the frame shows its edge: a word band still empty at a fifth of the way in
        // read as a black hole on the contact sheet
        if (!f.shown && s > 0.05) { f.shown = true; f.tl.timeScale(1).play(); }
        else if (f.shown && s < 0.015) { f.shown = false; f.tl.timeScale(1.8).reverse(); }
      }
    }

    // The claim rises while its panel is still sliding in: started at half-way (first build), the
    // filmstrip showed a black panel covering two thirds of the screen for half a second.
    if (e > 0.06) setShown('head', headIn, true);
    else if (e < 0.02) setShown('head', headIn, false);
    if (p > a + (b - a) * 0.2) setShown('turn', headTurn, true);
    else if (p < a) setShown('turn', headTurn, false);

    growLayer.style.clipPath = `inset(0 0 0 ${(geo.growFrom * (1 - g)).toFixed(1)}px)`;
    if (!reduced) lastImg.style.transform = `scale(${(1.1 - 0.1 * g).toFixed(4)})`;
    // The closing sentence starts while the frame is still opening, so it stands before the strip lets go.
    if (g > 0.55) setShown('close', closeIn, true);
    else if (g < 0.4) setShown('close', closeIn, false);

    // Section 3 rises over the last photo: it steps back into the dark.
    stripDim.style.opacity = (0.5 * clamp01((p - geo.f) / Math.max(1e-6, 1 - geo.f))).toFixed(3);
  }

  function setupStrip() {
    hxWrite.park('.hl-line-in');
    if (claim) {
      headIn = gsap.timeline({ paused: true })
        .fromTo('.hl-head .hl-reveal', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut', stagger: 0.08 }, 0)
        .add(hxWrite('.hl-title .hl-line-in'), 0.1);
      headTurn = gsap.timeline({ paused: true })
        .fromTo('.hl-them', { opacity: 1 }, { opacity: 0.34, duration: 1.1, ease: 'power2.inOut' });
    }
    closeIn = gsap.timeline({ paused: true })
      .fromTo('.hl-last-floor', { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power2.out' }, 0)
      // a three-line sentence: the lines overlap more than a two-word heading, so it is not slow
      .add(hxWrite('.hl-close .hl-line-in', { flow: 0.5 }), 0.1);
    frames.forEach((f) => {
      const lines = $$('.hl-say .hl-line-in', f.el);
      if (!lines.length) return;
      f.tl = hxWrite(lines, { paused: true });
    });
    if (reduced) {
      // Everything readable as authored; only the strip itself follows the scroll.
      [headIn, headTurn, closeIn, ...frames.map((f) => f.tl)].forEach((tl) => tl && tl.progress(1));
    }

    measureStrip();
    ScrollTrigger.addEventListener('refreshInit', measureStrip);

    const prog = { p: 0 };
    const tween = gsap.to(prog, {
      p: 1,
      ease: 'none',
      onUpdate: () => renderStrip(prog.p),
      scrollTrigger: {
        trigger: stripEl,
        start: 'top top',
        end: () => `+=${geo.R}`,
        scrub: reduced ? true : 0.6,
        invalidateOnRefresh: true,
        onRefresh: () => renderStrip(prog.p),
      },
    });
    renderStrip(0);

    // "Warum wir" (#philosophy): land where the claim can be read — strip in place, van covered.
    // (Without the claim, since 2026-09-24: land the moment the strip stands in place — a and b are equal.)
    anchorTop['#philosophy'] = () => {
      const st = tween.scrollTrigger;
      return st.start + geo.R * (geo.a + (geo.b - geo.a) * 0.6);
    };
    $$('a[href="#philosophy"]').forEach((link) => link.addEventListener('click', (ev) => {
      ev.preventDefault();
      window.scrollTo({ top: anchorTop['#philosophy'](), behavior: 'smooth' });
    }));
  }

  /* ============================================================ 7. section 3 · daylight (#prozess) */

  // Manuel picked idea 2 of three (2026-09-17): the ground turns warm white, each step is giant type
  // across the width with a work photo inside the letters, the step's text rises underneath.
  // Nothing here holds the page — hero and strip are its two pinned scenes — so every effect runs
  // on the step's own pass through the screen:
  //   · every line is fitted to the content width, capped at --hd-cap (short words would be absurd)
  //   · the lines slide in from their own side and settle by a third of the pass
  //   · the photo is laid out once for the whole title and stays put while the letters travel, so the
  //     words move across one still picture; it drifts slowly upwards over the whole pass
  const craft = $('#prozess');
  const craftSteps = craft ? $$('.hd-step', craft).map((el) => {
    const title = $('.hd-title', el);
    const [iw, ih] = title.dataset.size.split(' ').map(Number);
    const [fx, fy] = title.dataset.focus.split(' ').map(Number);
    const widths = (title.dataset.widths || '900 1536').split(' ').map(Number);
    return {
      el,
      title,
      win: $('.hd-window', el),
      winImg: $('.hd-window img', el),
      text: $('.hd-text', el),
      iw, ih, fx, fy, widths,
      base: title.dataset.photo,
      rows: $$('.hd-row', title).map((row) => ({ el: row, end: row.classList.contains('hd-row--end'), left: 0, top: 0 })),
      box: { w: 0, h: 0, bw: 0, bh: 0, ox: 0, oy: 0 },
      q: -1,
    };
  }) : [];

  function fitCraft() {
    if (!craft) return;
    const cs = getComputedStyle(craft);
    const width = craft.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const dpr = window.devicePixelRatio || 1;
    for (const step of craftSteps) {
      for (const row of step.rows) {
        row.el.style.fontSize = '';
        row.el.style.transform = '';
      }
      const cap = parseFloat(getComputedStyle(step.rows[0].el).fontSize); // --hd-cap, resolved
      for (const row of step.rows) {
        row.el.style.fontSize = '100px';
        const rs = getComputedStyle(row.el);
        const natural = row.el.scrollWidth - parseFloat(rs.paddingLeft) - parseFloat(rs.paddingRight); // the letters only
        row.el.style.fontSize = `${Math.min(cap, (100 * width * 0.995) / natural).toFixed(2)}px`;
      }
      // One cover box for the whole title, a fifth taller than it so the picture has room to drift.
      const w = step.title.clientWidth;
      const h = step.title.clientHeight;
      const scale = Math.max(w / step.iw, (h * 1.2) / step.ih);
      const bw = step.iw * scale;
      const bh = step.ih * scale;
      step.box = { w, h, bw, bh, ox: (w - bw) * step.fx, oy: (h - bh) * step.fy };
      const size = `${bw.toFixed(1)}px ${bh.toFixed(1)}px`;
      const need = bw * dpr;
      const pick = step.widths.find((w) => w >= need) || step.widths[step.widths.length - 1];
      const src = `${step.base}-${pick}.webp`;
      step.title.style.setProperty('--hd-photo', `url('${src}')`);
      for (const row of step.rows) {
        row.left = row.el.offsetLeft - step.title.offsetLeft; // both measured from the step; transforms ignored
        row.top = row.el.offsetTop - step.title.offsetTop;
        row.el.style.backgroundSize = size;
      }
      layoutStep(step);
      step.q = -1;
    }
  }

  // Inter's vertical metrics at line-height .86: the baseline sits .7938em below the top of a line
  // box and capitals are .7273em tall, so cap tops start .0665em down.
  const BASELINE = 0.7938;
  const CAP = 0.7273;

  function layoutStep(step) {
    const { el, win, text } = step;
    el.classList.remove('has-window', 'has-tuck');
    const content = step.title.clientWidth;
    const gap = Math.round(Math.max(20, content * 0.03));
    const titleTop = step.title.offsetTop; // the step is the offset parent
    const first = step.rows[0];
    const last = step.rows[step.rows.length - 1];
    const fsFirst = parseFloat(first.el.style.fontSize);
    const fsLast = parseFloat(last.el.style.fontSize);
    // a line's box is padded around its letters (room for descenders): measure from the letters
    const firstPad = getComputedStyle(first.el);
    const lastPad = getComputedStyle(last.el);

    // the photo, in colour, beside the first line: from its cap tops to its baseline
    const firstRight = Math.min(content, first.left + first.el.offsetWidth - parseFloat(firstPad.paddingRight));
    const winW = content - firstRight - gap;
    if (win && !first.end && winW >= 260) {
      el.style.setProperty('--hd-win-x', `${firstRight + gap}px`);
      el.style.setProperty('--hd-win-y', `${(titleTop + first.top + parseFloat(firstPad.paddingTop) + (BASELINE - CAP) * fsFirst).toFixed(1)}px`);
      el.style.setProperty('--hd-win-w', `${winW}px`);
      el.style.setProperty('--hd-win-h', `${(CAP * fsFirst).toFixed(1)}px`);
      el.classList.add('has-window');
    }

    // the step's text before the last line, standing on that line's baseline
    const textW = last.end && step.rows.length > 1 ? last.left + parseFloat(lastPad.paddingLeft) - gap : 0;
    if (text && textW >= 300) {
      el.style.setProperty('--hd-text-w', `${textW}px`);
      el.classList.add('has-tuck');
      const baseline = titleTop + last.top + parseFloat(lastPad.paddingTop) + BASELINE * fsLast;
      el.style.setProperty('--hd-text-b', `${(el.offsetHeight - baseline).toFixed(1)}px`);
      // taller than the line it sits beside would reach into the line above: back under the title
      if (text.offsetHeight > CAP * fsLast * 1.25) el.classList.remove('has-tuck');
    }
  }

  const arriveEase = (t) => 1 - Math.pow(1 - t, 3);

  function renderCraft(step, q) {
    if (Math.abs(q - step.q) < 0.0004) return;
    step.q = q;
    const { h, bh, ox, oy } = step.box;
    const room = bh - h;
    // A slow drift of a quarter of the title's height — not a pan through the whole photo: on a wide
    // title the portrait picture has a lot of room, and panning it walked the letters over the wash
    // shot's hub badge.
    const y = Math.min(0, Math.max(-room, oy + (0.5 - q) * h * 0.24));
    const arrive = reduced ? 1 : arriveEase(clamp01(q / 0.34));
    const push = window.innerWidth * 0.14;
    step.rows.forEach((row, i) => {
      const x = (1 - arrive) * push * (row.end ? 1 : -1) * (1 + i * 0.35);
      row.el.style.transform = Math.abs(x) > 0.05 ? `translate3d(${x.toFixed(1)}px, 0, 0)` : '';
      // subtract the row's own travel: the picture stays where it is while the letters move over it
      row.el.style.backgroundPosition = `${(ox - row.left - x).toFixed(1)}px ${(y - row.top).toFixed(1)}px`;
    });
    // the colour photo drifts inside its window, the same slow way the picture drifts in the letters
    if (step.winImg && !reduced) step.winImg.style.transform = `translate3d(0, ${((q - 0.5) * -14).toFixed(2)}%, 0)`;
  }

  function setupCraft() {
    if (!craft) return;
    fitCraft();
    ScrollTrigger.addEventListener('refreshInit', fitCraft);
    craftSteps.forEach((step) => {
      ScrollTrigger.create({
        trigger: step.el,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => renderCraft(step, self.progress),
        onRefresh: (self) => { step.q = -1; renderCraft(step, self.progress); },
      });
      renderCraft(step, 0);
    });
    if (reduced) {
      gsap.set('.hd-reveal', { opacity: 1, y: 0 });
      return;
    }
    // Each colour window opens from its left edge, like the strip's last frame.
    craftSteps.forEach((step) => {
      if (!step.win) return;
      gsap.fromTo(step.win, { clipPath: 'inset(0% 100% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.25,
        ease: 'power3.inOut',
        scrollTrigger: { trigger: step.win, start: 'top 88%', toggleActions: 'play none none reverse' },
      });
    });
    // The label and every paragraph: Apple's rise, 30 px, the move done before the fade.
    $$('.hd-reveal', craft).forEach((el) => {
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } })
        .fromTo(el, { y: 30 }, { y: 0, duration: 0.735, ease: 'power1.inOut' }, 0)
        .fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.94, ease: 'power1.inOut' }, 0);
    });
  }

  /* ============================================================ 8. section 4 · detail view (#gallery) */

  // Manuel picked idea 1 of three (2026-09-17): a work photo fills one half of a row, the other half
  // shows the spot under a marked frame at exactly twice the scale — the detail view of a technical
  // drawing („Detail A · 2 : 1"). Nothing holds the page: while a row passes through the screen its
  // frame glides along a path over the photo (data-path) and the detail follows it on every frame.
  // The frame is always half the detail's width and height, so the printed scale is true on every screen.
  const ZOOM = 2; // printed on the page as „2 : 1" — change both or neither
  const work = $('#gallery');
  const workTitle = work ? $('.hw-title', work) : null;
  // 2026-09-23 (Manuel: „a more premium solution … round the edges … slight darkening … a better
  // solution for the lines"): each row's drawing is built here. Back to front: the dim over the photo
  // with a rounded hole where the frame is; the frame with a soft dark edge under it; ONE leader — an
  // S-curve that leaves the frame's side level, sweeps across and meets the label level — with a small
  // node where it leaves the frame. It fades a little towards the label (a gradient in page units,
  // re-aimed every frame). First try that afternoon was two straight projection lines from the frame to
  // the detail's two seam corners: they end on the row's own top and bottom edge, so a frame near the
  // seam left two slivers on screen. A curve has no bad position.
  // The gradient takes its colour from hero.css (.hw-lead-stop → --hx-paper), the same token as the
  // frame and the node; only the two opacities live here. Until the code review of 2026-09-24 the hex
  // was copied in (IVORY '#FAF8F5') and would not have followed a change of the paper colour.
  function buildDrawing(svg, id) {
    svg.innerHTML = `<defs><linearGradient id="${id}g" gradientUnits="userSpaceOnUse">`
      + '<stop class="hw-lead-stop" offset="0" stop-opacity=".95"/><stop class="hw-lead-stop" offset="1" stop-opacity=".55"/>'
      + '</linearGradient></defs>'
      + '<path class="hw-dim" fill-rule="evenodd"/>'
      + '<rect class="hw-halo"/><rect class="hw-frame"/>'
      + `<path class="hw-lead-halo"/><path class="hw-lead" stroke="url(#${id}g)"/><circle class="hw-node" r="3.5"/>`;
    return {
      dim: $('.hw-dim', svg),
      // `curve`, not `lead`: the row object also carried a number `lead: 0`, which overwrote this element
      // (80 page errors per pass, 2026-09-23). That field is gone; the draw-in state is row.draw.lead.
      curve: $('.hw-lead', svg),
      leadHalo: $('.hw-lead-halo', svg),
      node: $('.hw-node', svg),
      grad: $(`#${id}g`, svg),
    };
  }
  const workRows = work ? $$('.hw-row', work).map((el, i) => {
    const [iw, ih] = el.dataset.size.split(' ').map(Number);
    const drawing = buildDrawing($('.hw-draw', el), `hwd${i}`);
    return {
      ...drawing,
      curveD: '',      // the curve's path as last set
      leadLen: -1,     // its length; -1 = not measured since it last moved
      done: false,     // frame and curve stand whole and are painted so: nothing left to write
      el, iw, ih,
      path: el.dataset.path.split(',').map((pt) => pt.trim().split(/\s+/).map(Number)),
      photo: $('.hw-photo', el),
      img: $('.hw-img', el),
      detail: $('.hw-detail', el),
      zoom: $('.hw-zoom', el),
      cap: $('.hw-cap', el),
      tag: $('.hw-tag', el),
      rects: $$('rect', el), // dark edge + frame
      g: null,
      q: -1,
      qNow: 0,
      // zoom 0 → the detail shows what the photo shows; 1 → the framed spot at 2 : 1
      draw: { zoom: reduced ? 1 : 0, frame: reduced ? 1 : 0, lead: reduced ? 1 : 0 },
      tl: null,
    };
  }) : [];

  // A section heading set as wide as its content box allows — one size for the whole title (the title is
  // `width: max-content`, so its offsetWidth is the text's own width; two lines on phones).
  function fitTitle(title) {
    title.style.fontSize = '100px';
    const box = title.parentElement;
    const bs = getComputedStyle(box);
    const width = box.clientWidth - parseFloat(bs.paddingLeft) - parseFloat(bs.paddingRight);
    title.style.fontSize = `${Math.min(window.innerHeight * 0.22, (100 * width * 0.995) / title.offsetWidth).toFixed(2)}px`;
  }

  function fitWork() {
    if (!work) return;
    fitTitle(workTitle);

    for (const row of workRows) {
      const pw = row.photo.clientWidth;
      const ph = row.photo.clientHeight;
      const s = Math.max(pw / row.iw, ph / row.ih); // object-fit: cover
      const dw = row.iw * s;
      const dh = row.ih * s;
      const [fx, fy] = getComputedStyle(row.img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
      const pl = row.photo.offsetLeft; // the row is the offset parent; transforms are ignored
      const pt = row.photo.offsetTop;
      const dl = row.detail.offsetLeft;
      const dt = row.detail.offsetTop;
      const side = dt > pt + 1 ? 'below' : dl > pl ? 'right' : 'left';
      // the leader ends on the edge of the label that faces the photo
      const cl = dl + row.cap.offsetLeft;
      const ct = dt + row.cap.offsetTop;
      const cw = row.cap.offsetWidth;
      const ch = row.cap.offsetHeight;
      const cap = side === 'right' ? [cl, ct + ch / 2] : side === 'left' ? [cl + cw, ct + ch / 2] : [cl + cw / 2, ct];
      row.g = {
        pw, ph, dw, dh, pl, pt, side, cap, dl, dt,
        rw: row.el.clientWidth,
        rh: row.el.clientHeight,
        dW: row.detail.clientWidth,
        dH: row.detail.clientHeight,
        fw: row.detail.clientWidth / ZOOM,
        fh: row.detail.clientHeight / ZOOM,
        ox: (pw - dw) * fx,
        oy: (ph - dh) * fy,
      };
      // the frame's corner: a share of its short side, kept between 8 and 18 px
      row.g.r = Math.max(8, Math.min(18, 0.07 * Math.min(row.g.fw, row.g.fh)));
      row.zoom.style.width = `${(dw * ZOOM).toFixed(1)}px`;
      row.zoom.style.height = `${(dh * ZOOM).toFixed(1)}px`;
      for (const r of row.rects) {
        r.setAttribute('width', row.g.fw.toFixed(1));
        r.setAttribute('height', row.g.fh.toFixed(1));
        r.setAttribute('rx', row.g.r.toFixed(1));
        r.setAttribute('ry', row.g.r.toFixed(1));
      }
      row.q = -1;
    }
  }

  // Catmull-Rom through the path's points: the frame passes each of them without stopping.
  function pathAt(pts, t) {
    const n = pts.length - 1;
    if (n < 1) return pts[0];
    const f = Math.min(n - 1e-6, Math.max(0, t) * n);
    const i = Math.floor(f);
    const s = f - i;
    const a = pts[Math.max(0, i - 1)];
    const b = pts[i];
    const c = pts[i + 1];
    const d = pts[Math.min(n, i + 2)];
    const cr = (k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * s + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * s * s
      + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * s * s * s);
    return [cr(0), cr(1)];
  }

  const glide = (t) => t * t * (3 - 2 * t);

  function renderWork(row, q) {
    const g = row.g;
    row.qNow = q;
    if (!g || Math.abs(q - row.q) < 0.0004) return;
    row.q = q;
    // the frame travels while the row is on screen and rests at both ends of its path
    const t = reduced ? 0.5 : glide(clamp01((q - 0.14) / 0.72));
    const [u, v] = pathAt(row.path, t);
    const x = Math.min(g.pw - g.fw - 1, Math.max(1, g.ox + u * g.dw - g.fw / 2));
    const y = Math.min(g.ph - g.fh - 1, Math.max(1, g.oy + v * g.dh - g.fh / 2));
    // The detail shows a "view" of the photo half: at zoom 1 exactly the frame (so twice the scale),
    // at zoom 0 the whole photo half — the row's reveal dives from one into the other.
    const k = row.draw.zoom;
    const w0 = g.pw;
    const h0 = Math.min(g.ph, (g.pw * g.dH) / g.dW);
    const y0 = Math.min(g.ph - h0, Math.max(0, y + g.fh / 2 - h0 / 2));
    const vx = x * k;
    const vy = y0 + (y - y0) * k;
    const m = g.dW / (w0 + (g.fw - w0) * k); // detail px per photo px: 1 → 2
    const scale = m / ZOOM;
    row.zoom.style.transform = `translate3d(${((g.ox - vx) * m).toFixed(1)}px, ${((g.oy - vy) * m).toFixed(1)}px, 0)${scale < 0.9999 ? ` scale(${scale.toFixed(4)})` : ''}`;
    const X = g.pl + x;
    const Y = g.pt + y;
    for (const r of row.rects) {
      r.setAttribute('x', X.toFixed(1));
      r.setAttribute('y', Y.toFixed(1));
    }
    // The leader: from the middle of the frame's side that faces the detail to the label's facing
    // edge. Both ends leave level (horizontal tangents; vertical when the detail sits below), so the
    // curve is a calm S at any distance.
    const R = g.r;
    const kc = R * (1 - Math.SQRT1_2);
    const f = (n) => n.toFixed(1);
    const p0 = g.side === 'right' ? [X + g.fw, Y + g.fh / 2]
      : g.side === 'left' ? [X, Y + g.fh / 2]
      : [X + g.fw / 2, Y + g.fh];
    const p3 = g.cap;
    let c1, c2;
    if (g.side === 'below') {
      const dy = (p3[1] - p0[1]) * 0.55;
      c1 = [p0[0], p0[1] + dy]; c2 = [p3[0], p3[1] - dy];
    } else {
      const dx = (p3[0] - p0[0]) * 0.55;
      c1 = [p0[0] + dx, p0[1]]; c2 = [p3[0] - dx, p3[1]];
    }
    const d = `M${f(p0[0])} ${f(p0[1])}C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p3[0])} ${f(p3[1])}`;
    if (d !== row.curveD) {
      row.curveD = d;
      row.curve.setAttribute('d', d);
      row.leadHalo.setAttribute('d', d);
      row.leadLen = -1;   // it moved: paintWork measures it again, and only if it is still drawing in
    }
    row.grad.setAttribute('x1', f(p0[0])); row.grad.setAttribute('y1', f(p0[1]));
    row.grad.setAttribute('x2', f(p3[0])); row.grad.setAttribute('y2', f(p3[1]));
    row.node.setAttribute('cx', f(p0[0]));
    row.node.setAttribute('cy', f(p0[1]));
    // the dim: the whole photo, with a rounded hole exactly where the frame is (even-odd fill)
    const px = g.pl;
    const py = g.pt;
    row.dim.setAttribute('d', `M${f(px)} ${f(py)}H${f(px + g.pw)}V${f(py + g.ph)}H${f(px)}Z`
      + `M${f(X + R)} ${f(Y)}H${f(X + g.fw - R)}A${f(R)} ${f(R)} 0 0 1 ${f(X + g.fw)} ${f(Y + R)}`
      + `V${f(Y + g.fh - R)}A${f(R)} ${f(R)} 0 0 1 ${f(X + g.fw - R)} ${f(Y + g.fh)}`
      + `H${f(X + R)}A${f(R)} ${f(R)} 0 0 1 ${f(X)} ${f(Y + g.fh - R)}V${f(Y + R)}A${f(R)} ${f(R)} 0 0 1 ${f(X + R)} ${f(Y)}Z`);
    // the round badge sits on the frame's top corner AWAY from the detail, clear of the leader (which
    // leaves from the middle of the side facing the detail); kept whole on screen when that corner
    // touches the row's edge
    const tx = Math.min(g.rw - 14, Math.max(14, g.side === 'left' ? X + g.fw - kc : X + kc));
    const ty = Math.min(g.rh - 14, Math.max(14, Y + kc));
    row.tag.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
    paintWork(row);
  }

  // Draw-in: each stroke is dashed to its own length and uncovered from its start.
  // Code review 2026-09-24: after the draw-in this kept running on every scroll frame of the section —
  // the curve measured again, ten styles written again, all to the same values. Now a whole drawing is
  // painted once, and the curve is measured only while it is still drawing in (it moves with the
  // frame, so then again after every move).
  function paintWork(row) {
    const g = row.g;
    if (!g) return;
    const { frame, lead } = row.draw;
    const done = frame >= 1 && lead >= 1;
    if (done && row.done) return;
    row.done = done;
    const per = 2 * (g.fw + g.fh) - (8 - 2 * Math.PI) * g.r; // rounded corners shorten the way round
    for (const r of row.rects) {
      r.style.strokeDasharray = frame >= 1 ? '' : `${per.toFixed(1)} ${per.toFixed(1)}`;
      r.style.strokeDashoffset = frame >= 1 ? '' : (per * (1 - frame)).toFixed(1);
    }
    if (lead < 1 && row.leadLen < 0) row.leadLen = row.curve.getTotalLength();
    const len = row.leadLen;
    for (const l of [row.curve, row.leadHalo]) {
      l.style.strokeDasharray = lead >= 1 ? '' : `${len.toFixed(1)} ${(len + 2).toFixed(1)}`;
      l.style.strokeDashoffset = lead >= 1 ? '' : (len * (1 - lead)).toFixed(1);
    }
    row.node.style.opacity = Math.min(1, lead * 4).toFixed(3);
    row.dim.style.opacity = frame.toFixed(3);
  }

  function setupWork() {
    if (!work) return;
    fitWork();
    ScrollTrigger.addEventListener('refreshInit', fitWork);
    workRows.forEach((row) => {
      ScrollTrigger.create({
        trigger: row.el,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => renderWork(row, self.progress),
        onRefresh: (self) => { row.q = -1; renderWork(row, self.progress); },
      });
      renderWork(row, 0);
    });
    if (reduced) {
      gsap.set('.hw-reveal', { opacity: 1, y: 0 });
      // y too: GSAP reads the stylesheet's 160 % as pixels (see the top of this file) — without it the
      // heading stayed hidden in its mask under reduced motion (caught on the first contact sheet)
      gsap.set('.hw-line-in', { y: 0, yPercent: 0 });
      return;
    }

    hxWrite.park('.hw-line-in');
    gsap.timeline({ scrollTrigger: { trigger: '.hw-head', start: 'top 85%', toggleActions: 'play none none reverse' } })
      .fromTo('.hw-head .hw-reveal', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut' }, 0)
      .add(hxWrite('.hw-title .hw-line-in'), 0.1);

    // Each row, played as it comes in: the detail starts as a second copy of the photo and dives into the
    // framed spot while the frame draws itself; then the tag lands on its corner, the leader runs to the
    // label, and the label — true only now — appears. (First build opened the detail out of the seam: it
    // left a black half on screen under the row above.) Scrolling back above reverses it.
    workRows.forEach((row) => {
      gsap.set([row.tag, row.cap], { opacity: 0 });
      const zoomed = () => { row.q = -1; renderWork(row, row.qNow); };
      row.tl = gsap.timeline({ paused: true })
        .to(row.draw, { zoom: 1, duration: 1.25, ease: 'power3.inOut', onUpdate: zoomed }, 0)
        .to(row.draw, { frame: 1, duration: 0.9, ease: 'power2.inOut', onUpdate: () => paintWork(row) }, 0.2)
        .to(row.tag, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 1.0)
        .to(row.draw, { lead: 1, duration: 0.55, ease: 'power2.inOut', onUpdate: () => paintWork(row) }, 1.05)
        .fromTo(row.cap, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power1.inOut' }, 1.35);
      ScrollTrigger.create({
        trigger: row.el,
        start: 'top 92%',
        onEnter: () => row.tl.timeScale(1).play(),
        onLeaveBack: () => row.tl.timeScale(1.8).reverse(),
      });
    });

    // The line under the rows: Apple's rise, like section 3's paragraphs.
    $$('.hw-more .hw-reveal', work).forEach((el, i) => {
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' } })
        .fromTo(el, { y: 30 }, { y: 0, duration: 0.735, ease: 'power1.inOut', delay: i * 0.08 }, 0)
        .fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.94, ease: 'power1.inOut', delay: i * 0.08 }, 0);
    });
  }

  /* ============================================================ 9. section 5 · before / after + reviews */

  // Manuel picked idea 3 (2026-09-17) and sent the photos for it. Each row of pairs has one line that
  // sweeps across the whole row while the row passes through the screen: left of it „Nachher", right of
  // it „Vorher". The reveal is transforms only — the after-layer slides left inside its frame while its
  // photo slides right by the same amount, so it stays put — no clip-path repaint per frame.
  // 2026-09-23: a timed version (the sweep played by itself once the row stood whole on screen) was built
  // and rolled back the same day — Manuel: „no go back to how it was, just speed up the scroll effect".
  const beforeAfter = $('#vorher-nachher');
  const baTitle = beforeAfter ? $('.hb-title', beforeAfter) : null;
  const baRows = beforeAfter ? $$('.hb-row', beforeAfter).map((el) => ({
    el,
    pairs: $$('.hb-pair', el).map((p) => ({ el: p, after: $('.hb-after', p), img: $('.hb-after .hb-img', p), left: 0, w: 0 })),
    rule: $('.hb-rule', el),
    tagAfter: $('.hb-tag--after', el),
    tagBefore: $('.hb-tag--before', el),
    W: 0,
    tags: [0, 0],
    q: -1,
  })) : [];

  function measureBa() {
    if (!beforeAfter) return;
    fitTitle(baTitle);
    for (const row of baRows) {
      row.W = row.el.clientWidth;
      for (const p of row.pairs) {
        p.left = p.el.offsetLeft; // the row is the offset parent (the wide row's frame sits at 0)
        p.w = p.el.offsetWidth;
      }
      row.tags = [row.tagAfter.offsetWidth, row.tagBefore.offsetWidth];
      row.q = -1;
    }
  }

  // The sweep's stretch of the row's pass (0 = row top at the screen's foot, 1 = row foot at the top).
  // Was .24 → .74, half the pass. 2026-09-23, Manuel: „just speed up the scroll effect" — now a quarter,
  // twice as fast, centred on .48, the middle of the stretch where the big row is most on screen (its
  // top just under the bar). Measured at 1887×922, 1440×900 and 390×844: at the new start and end
  // 75–87 % of the big row is on screen (was 48–58 %), the wide row 100 % (was 63–100 %).
  // SWEEP_LEN is the one number for faster (smaller) or slower (larger).
  const SWEEP_MID = 0.48;
  const SWEEP_LEN = 0.25;
  function renderBa(row, q) {
    if (!row.W || Math.abs(q - row.q) < 0.0004) return;
    row.q = q;
    // reduced motion: both halves, still
    const w = reduced ? 0.5 : inOut(clamp01((q - (SWEEP_MID - SWEEP_LEN / 2)) / SWEEP_LEN));
    const L = w * row.W;
    for (const p of row.pairs) {
      const off = p.w - Math.min(p.w, Math.max(0, L - p.left)); // how much of this frame is still „Vorher"
      p.after.style.transform = off > 0.05 ? `translate3d(${(-off).toFixed(1)}px, 0, 0)` : '';
      p.img.style.transform = off > 0.05 ? `translate3d(${off.toFixed(1)}px, 0, 0)` : '';
    }
    row.rule.style.transform = `translate3d(${L.toFixed(1)}px, 0, 0)`;
    // a tag only shows where it fits beside the line
    row.tagAfter.style.opacity = L > row.tags[0] + 24 ? '1' : '0';
    row.tagBefore.style.opacity = row.W - L > row.tags[1] + 24 ? '1' : '0';
  }

  // Reviews — 2026-09-20: two marquee rows, so there is nothing left for JS to lay out. The old
  // code dealt the quotes into the shortest of three columns, hid all but six behind a „Weitere
  // Bewertungen" button on the phone, and drifted the columns on scroll. All three are superseded:
  // the rows run in CSS, every review is on screen, and the only thing still measured is the title.
  const reviews = $('#reviews');
  const reviewTitle = reviews ? $('.hr-title', reviews) : null;
  const reviewRows = reviews ? $$('.hr-row', reviews) : [];

  function layoutReviews() {
    if (!reviews) return;
    fitTitle(reviewTitle);
  }

  function setupBeforeAfter() {
    if (!beforeAfter && !reviews) return;
    measureBa();
    layoutReviews();
    ScrollTrigger.addEventListener('refreshInit', () => { measureBa(); layoutReviews(); });

    baRows.forEach((row) => {
      ScrollTrigger.create({
        trigger: row.el,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => renderBa(row, self.progress),
        onRefresh: (self) => { row.q = -1; renderBa(row, self.progress); },
      });
      renderBa(row, 0);
    });

    // (the „Weitere Bewertungen" handler stood here — removed with the marquee rows, 2026-09-20)

    if (reduced) {
      gsap.set('.hb-reveal, .hr-reveal, .hr-row', { opacity: 1, y: 0 });
      gsap.set('#vorher-nachher .hb-line-in, #reviews .hb-line-in', { y: 0, yPercent: 0 });
      return;
    }

    // Both headings: label and lines rise, as in section 4.
    [[beforeAfter, '.hb-head', '.hb-reveal'], [reviews, '.hr-head', '.hr-reveal']].forEach(([sec, head, label]) => {
      if (!sec) return;
      const lines = $$('.hb-line-in', $(head, sec));
      gsap.timeline({ scrollTrigger: { trigger: $(head, sec), start: 'top 85%', toggleActions: 'play none none reverse' } })
        .fromTo($(label, sec), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut' }, 0)
        .add(hxWrite(lines), 0.1);
    });

    if (!reviews) return;
    // The two rows rise as the block arrives — the same reveal every other section uses. After that
    // they are the CSS marquee’s business and JS never touches them again.
    reviewRows.forEach((row, i) => {
      gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 94%', toggleActions: 'play none none reverse' } })
        .fromTo(row, { y: 30 }, { y: 0, duration: 0.735, ease: 'power1.inOut' }, 0)
        .fromTo(row, { opacity: 0 }, { opacity: 1, duration: 0.94, ease: 'power1.inOut' }, 0);
    });
  }

  /* ============================================================ 10. section 6 · Leistungen & Preise (#preise) */

  // Third build (2026-09-17). Manuel wanted the live site's shape back — tabs on top, air between the cards,
  // rounded corners, and "when you select them you get to the other cards in darker style" — in this
  // prototype's material, "with beautiful animations so its not boring". The motion, in order:
  //   · the head reveals like every other section;
  //   · one white pill SLIDES from the old tab to the new one (it is a single element, not a class swap);
  //   · the outgoing panel drops away, the panel box eases to the new height so nothing jumps, and the new
  //     cards deal in one after another: colour band unrolls from the top, the lines rise, the ticks DRAW;
  //   · hovering a card lifts it 7 px and its button fills with the card's own colour.
  // The cards themselves are generated by `_build/packages.mjs`. No pinning — the page keeps moving.
  const packs = $('#preise');
  const packTitle = packs ? $('.hk-title', packs) : null;
  const packTabs = packs ? $$('.hk-tab', packs) : [];
  const packInd = packs ? $('.hk-ind', packs) : null;
  const packPanels = packs ? $$('.hk-panel', packs) : [];
  const packLeads = packs ? $$('.hk-lead', packs) : [];
  const packBox = packs ? $('.hk-panels', packs) : null;
  const dealt = new WeakSet();
  let tabIdx = 0;

  const cardParts = (card) => ({
    band: $('.hk-band', card),
    flag: $('.hk-flag', card),
    body: $$('.hk-body > *', card),
  });

  /** Put one panel's cards back to the state the deal-in starts from. */
  function prepPanel(panel) {
    $$('.hk-card', panel).forEach((card) => {
      const p = cardParts(card);
      if (p.band) gsap.set(p.band, { scaleY: 0 });
      if (p.flag) gsap.set(p.flag, { opacity: 0, y: 12 });
      gsap.set(p.body, { opacity: 0, y: 20 });
    });
  }

  /** Deal one panel's cards in, left to right. `gap` is how far apart two cards start —
      capped for the long tabs, or Zusatzpakete's 17 cards would take two seconds to finish. */
  function dealPanel(panel, gap = 0.07) {
    dealt.add(panel);
    const cards = $$('.hk-card', panel);
    gap = Math.min(gap, 0.55 / Math.max(1, cards.length - 1));
    const tl = gsap.timeline();
    cards.forEach((card, i) => {
      const p = cardParts(card);
      const at = i * gap;
      if (p.band) tl.to(p.band, { scaleY: 1, duration: 0.55, ease: 'power3.out' }, at);
      if (p.flag) tl.to(p.flag, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, at + 0.06);
      tl.to(p.body, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.04 }, at + 0.1);
      // (the ticks used to draw themselves in here — removed with option B, 2026-09-20)
    });
    return tl;
  }

  /** The white pill behind the active tab. Measured, never hard-coded — the labels are data. */
  function moveInd(instant) {
    if (!packInd || !packTabs.length) return;
    const tab = packTabs[tabIdx];
    const to = { x: tab.offsetLeft, width: tab.offsetWidth };
    if (instant || reduced) gsap.set(packInd, to);
    else gsap.to(packInd, { ...to, duration: 0.5, ease: 'power3.out' });
  }

  function showTab(i, animate) {
    if (!packs || i === tabIdx) return;
    const from = packPanels[tabIdx];
    const to = packPanels[i];
    tabIdx = i;

    packTabs.forEach((t, k) => {
      t.classList.toggle('is-on', k === i);
      t.setAttribute('aria-selected', k === i ? 'true' : 'false');
    });
    packLeads.forEach((p, k) => { p.hidden = k !== i; });
    moveInd(!animate);

    if (!animate || reduced) {
      from.hidden = true;
      to.hidden = false;
      if (!dealt.has(to)) { if (reduced) showPanelStatic(to); else prepPanel(to), dealPanel(to, 0.05); }
      ScrollTrigger.refresh();
      return;
    }

    // hold the box at the old height, swap, then ease to the new one so the page never jumps
    const h0 = packBox.offsetHeight;
    gsap.to(from, {
      opacity: 0, y: -12, duration: 0.2, ease: 'power2.in',
      onComplete: () => {
        from.hidden = true;
        gsap.set(from, { opacity: 1, y: 0 });
        to.hidden = false;
        prepPanel(to);
        const h1 = packBox.offsetHeight;
        gsap.fromTo(packBox, { height: h0 }, {
          height: h1, duration: 0.45, ease: 'power2.inOut',
          onComplete: () => { packBox.style.height = ''; ScrollTrigger.refresh(); },
        });
        dealPanel(to, 0.05);
      },
    });
  }

  function showPanelStatic(panel) {
    dealt.add(panel);
    gsap.set($$('.hk-band', panel), { scaleY: 1 });
    gsap.set($$('.hk-body > *, .hk-flag', panel), { opacity: 1, y: 0 });
  }

  function measurePacks() {
    if (!packs) return;
    fitTitle(packTitle);
    moveInd(true);
  }

  function setupPackages() {
    if (!packs) return;
    measurePacks();
    ScrollTrigger.addEventListener('refreshInit', measurePacks);
    packTabs.forEach((t, i) => t.addEventListener('click', () => {
      showTab(i, true);
      // on a phone the pills are one sideways strip: bring the one that was tapped fully into view
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    }));

    if (reduced) {
      gsap.set('.hk-reveal', { opacity: 1, y: 0 });
      gsap.set('#preise .hb-line-in', { y: 0, yPercent: 0 });
      packPanels.forEach(showPanelStatic);
      return;
    }

    const head = $('.hk-head', packs);
    const lines = $$('.hb-line-in', head);
    gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 85%', toggleActions: 'play none none reverse' } })
      .fromTo($('.hk-label', head), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut' }, 0)
      .add(hxWrite(lines), 0.1);

    // the tabs and the first panel arrive together, the moment the block comes up
    gsap.set(packTabs, { opacity: 0, y: 18 });
    gsap.set(packInd, { opacity: 0 });
    prepPanel(packPanels[0]);
    ScrollTrigger.create({
      trigger: packBox,
      start: 'top 86%',
      once: true,
      onEnter: () => {
        gsap.to(packTabs, { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.04 });
        gsap.to(packInd, { opacity: 1, duration: 0.4, delay: 0.1 });
        dealPanel(packPanels[0]);
      },
    });
  }
  /* ============================================================ 11. section 7 · Die Route (#mobil) */

  // Manuel picked idea 1 (2026-09-19): one line draws itself down the section — from the studio in Feldkirch
  // through the three steps, forking at the foot into „Im Studio" / „Bei Ihnen". The path is BUILT from
  // where the pin, the stops and the two tiles really sit (offsets, so the reveal transforms never skew it),
  // and on every scroll the line is drawn exactly down to the point that is at TIP_AT of the screen height:
  // the tip is always in the same place on screen, and a row opens the moment the tip reaches its stop —
  // line and reveals cannot drift apart. The reveals themselves are CSS transitions on .is-on, so scrolling
  // back up simply plays them backwards. No pinning.
  const routeSec = $('#mobil');
  const routeArea = routeSec ? $('.hm-route', routeSec) : null;
  const R = routeArea ? {
    title: $('.hm-title', routeSec),
    svg: $('.hm-svg', routeArea),
    planMain: $('.hm-plan--main', routeArea),
    lineMain: $('.hm-line--main', routeArea),
    planL: $('.hm-plan--l', routeArea),
    lineL: $('.hm-line--l', routeArea),
    planR: $('.hm-plan--r', routeArea),
    lineR: $('.hm-line--r', routeArea),
    tip: $('.hm-tip', routeArea),
    start: $('.hm-start', routeArea),
    pin: $('.hm-pin', routeArea),
    rows: $$('.hm-row', routeArea),
    stops: $$('.hm-stop', routeArea),
    fork: $('.hm-fork', routeArea),
    dests: $$('.hm-dest', routeArea),
  } : null;
  const TIP_AT = 0.68;
  let routeGeo = null;

  /** An element's untransformed box inside the route area (offset chains ignore CSS transforms). */
  function inRoute(el) {
    let x = 0;
    let y = 0;
    let n = el;
    while (n && n !== routeArea) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
  }

  // a curve that leaves and arrives vertically — the road swings smoothly between two points
  const bend = (a, b) => {
    const dy = b.y - a.y;
    return `C ${a.x.toFixed(1)} ${(a.y + dy * 0.5).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - dy * 0.5).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  };

  function buildRoute() {
    if (!R) return;
    const W = routeArea.offsetWidth;
    const H = routeArea.offsetHeight;
    R.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const pin = inRoute(R.pin);
    const stops = R.stops.map(inRoute);
    const fork = inRoute(R.fork);
    const dests = R.dests.map(inRoute);
    const gap = parseFloat(getComputedStyle(R.fork).marginTop) || 120;
    const narrow = dests.length > 1 && Math.abs(dests[0].y - dests[1].y) > 10;   // tiles stacked: phone/tablet

    const pts = [{ x: pin.cx, y: pin.cy }, ...stops.map((s) => ({ x: s.cx, y: s.cy }))];
    const F = narrow ? { x: pts[pts.length - 1].x, y: fork.y - gap * 0.45 } : { x: fork.cx, y: fork.y - gap * 0.55 };
    pts.push(F);
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += ` ${bend(pts[i - 1], pts[i])}`;

    // the two branches: into the tops of the tiles side by side, or hooking into their left edges when stacked
    const branch = (t) => {
      if (!narrow) return `M ${F.x.toFixed(1)} ${F.y.toFixed(1)} ${bend(F, { x: t.cx, y: t.y })}`;
      const my = t.cy;
      const r = 18;
      return `M ${F.x.toFixed(1)} ${F.y.toFixed(1)} L ${F.x.toFixed(1)} ${(my - r).toFixed(1)} Q ${F.x.toFixed(1)} ${my.toFixed(1)} ${(F.x + r).toFixed(1)} ${my.toFixed(1)} L ${t.x.toFixed(1)} ${my.toFixed(1)}`;
    };
    const dL = branch(dests[0]);
    const dR = branch(dests[1]);
    R.planMain.setAttribute('d', d);
    R.lineMain.setAttribute('d', d);
    R.planL.setAttribute('d', dL);
    R.lineL.setAttribute('d', dL);
    R.planR.setAttribute('d', dR);
    R.lineR.setAttribute('d', dR);

    const total = R.lineMain.getTotalLength();
    const lenL = R.lineL.getTotalLength();
    const lenR = R.lineR.getTotalLength();
    [[R.lineMain, total], [R.lineL, lenL], [R.lineR, lenR]].forEach(([p, l]) => {
      p.style.strokeDasharray = `${l.toFixed(1)} ${l.toFixed(1)}`;
    });
    // sampled once per build: y is monotonic along the road, so "how far is drawn" is a lookup, not a search
    const samples = [];
    const n = Math.max(40, Math.ceil(total / 6));
    for (let i = 0; i <= n; i++) {
      const l = (total * i) / n;
      const p = R.lineMain.getPointAtLength(l);
      samples.push({ l, x: p.x, y: p.y });
    }
    const branchEnd = Math.max(dests[0].y, narrow ? dests[1].cy : dests[1].y);
    // a row OPENS when the tip reaches its top edge (so it is never an empty stretch on screen) and its stop
    // turns green when the tip actually arrives there
    const rowOpen = R.rows.map((row) => { const b = inRoute(row); return b.y + b.h * 0.12; });
    routeGeo = { total, lenL, lenR, samples, rowOpen, stopY: stops.map((s) => s.cy), forkY: F.y, branchSpan: Math.max(1, branchEnd - F.y) };
  }

  function atY(y) {
    const s = routeGeo.samples;
    if (y <= s[0].y) return s[0];
    if (y >= s[s.length - 1].y) return s[s.length - 1];
    let lo = 0;
    let hi = s.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (s[mid].y < y) lo = mid; else hi = mid; }
    const a = s[lo];
    const b = s[hi];
    const t = (y - a.y) / Math.max(1e-6, b.y - a.y);
    return { l: a.l + (b.l - a.l) * t, x: a.x + (b.x - a.x) * t, y };
  }

  function renderRoute() {
    if (!routeGeo) return;
    const top = routeArea.getBoundingClientRect().top;          // the area itself never moves by transform
    const target = reduced ? Infinity : window.innerHeight * TIP_AT - top;
    const at = atY(target);
    const drawn = reduced ? routeGeo.total : at.l;
    R.lineMain.style.strokeDashoffset = (routeGeo.total - drawn).toFixed(1);
    const moving = !reduced && drawn > 1 && drawn < routeGeo.total - 1;
    R.tip.style.opacity = moving ? '1' : '0';
    if (moving) R.tip.style.transform = `translate3d(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px, 0)`;

    R.start.classList.toggle('is-on', reduced || top < window.innerHeight * 0.92);
    R.rows.forEach((row, i) => {
      row.classList.toggle('is-on', reduced || target >= routeGeo.rowOpen[i]);
      row.classList.toggle('is-hit', reduced || target >= routeGeo.stopY[i] - 2);
    });
    const b = reduced ? 1 : clamp01((target - routeGeo.forkY) / routeGeo.branchSpan);
    R.lineL.style.strokeDashoffset = (routeGeo.lenL * (1 - b)).toFixed(1);
    R.lineR.style.strokeDashoffset = (routeGeo.lenR * (1 - b)).toFixed(1);
    R.fork.classList.toggle('is-on', reduced || b > 0.5);
  }

  function measureRoute() {
    if (!R) return;
    fitTitle(R.title);
  }

  function setupRoute() {
    if (!R) return;
    measureRoute();
    ScrollTrigger.addEventListener('refreshInit', measureRoute);

    if (reduced) {
      gsap.set('.hm-reveal', { opacity: 1, y: 0 });
      gsap.set('#mobil .hb-line-in', { y: 0, yPercent: 0 });
    } else {
      const head = $('.hm-head', routeSec);
      const lines = $$('.hb-line-in', head);
      gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 85%', toggleActions: 'play none none reverse' } })
        .fromTo($('.hm-label', head), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut' }, 0)
        .add(hxWrite(lines), 0.1);
    }

    ScrollTrigger.create({
      trigger: routeSec,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: renderRoute,
      onRefresh: () => { buildRoute(); renderRoute(); },
    });
    buildRoute();
    renderRoute();
  }

  /* ============================================================ 12. section 8 · Der Film (#statement) */

  // Manuel picked idea 1 (2026-09-20) and corrected it the same evening: the window must NOT go edge to
  // edge — it opens from a strip to an almost full-screen frame with Apple-sized rounded corners, standing
  // on a near-black graded ground, and the press is YouTube's own red button. A scrubbed mask, not a pin.
  // The film itself is only fetched from YouTube after that press (the live site's two-click rule, kept).
  const film = $('#statement');
  const F = film ? {
    stage: $('.hs-stage', film),
    frame: $('.hs-film', film),
    amb: $('.hs-amb', film),
    poster: $('.hs-poster', film),
    sheen: $('.hs-sheen', film),
    play: $('.hs-play', film),
    words: $('.hs-words', film),
    big: $('.hs-b', film),
    // every masked line of the big sentence — it was one line („Sie sehen Ihres.") until 2026-09-24, and
    // with `$` only the first of the three new lines would ever have risen
    bigIn: $$('.hs-b .hb-line-in', film),
    foot: $('.hs-foot', film),
    dev: $('.hs-dev', film),
  } : null;

  /** The big sentence as wide as the frame allows — „Sie sehen Ihres." until 2026-09-24, „Ihr Fahrzeug
      erstrahlt / in neuem Glanz." since (Manuel's pick B). The heading is `width: max-content`, so its
      width is its widest line, and that line is what gets fitted. Two passes: glyph advances round per
      pixel size, so one probe lands about 2 % off. */
  function fitFilm() {
    if (!F || !F.big) return;
    const cs = getComputedStyle(F.words);
    // since 2026-09-26 the line takes only a share of the frame (--hs-fit, hero.css) — „smaller", Manuel
    const fit = parseFloat(cs.getPropertyValue('--hs-fit')) || 1;
    const room = (F.words.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) * fit;
    if (!(room > 0)) return;
    let size = 100;
    F.big.style.maxWidth = 'none';        // it carries max-width:100%, which would clamp the measurement
    F.big.style.fontSize = `${size}px`;
    for (let i = 0; i < 2; i++) {
      const w = F.big.getBoundingClientRect().width;
      if (!w) break;
      size = Math.min(170, (size * room * 0.985) / w);
      F.big.style.fontSize = `${size.toFixed(2)}px`;
    }
    F.big.style.maxWidth = '';
  }

  function setupStatement() {
    if (!F) return;
    fitFilm();
    ScrollTrigger.addEventListener('refreshInit', fitFilm);

    // YouTube will not play an embed on a page served from a bare IP address — it answers
    // „Dieses Video ist nicht verfügbar". Only ever true for this local preview, so say so on screen
    // instead of letting it look like a broken video.
    if (F.dev && /^\d{1,3}(\.\d{1,3}){3}$/.test(location.hostname)) F.dev.hidden = false;

    // the press that loads YouTube — nothing reaches it before this
    F.play.addEventListener('click', () => {
      const id = F.play.dataset.video;
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      frame.title = 'Elité Auto Aufbereitung — Film';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      F.frame.append(frame);
      film.classList.add('is-playing');
      ScrollTrigger.refresh();            // the phone frame turns 4:3 → 16:9, so the page got shorter
    });

    // the corner the window ends on, straight out of the stylesheet
    let rEnd = 30;
    // read it off the element, not off the variable: `--hs-r` is unregistered, so getPropertyValue
    // returns the literal `clamp(...)` text and parseFloat would give NaN
    const readR = () => {
      const inline = F.frame.style.borderRadius;
      F.frame.style.borderRadius = '';
      rEnd = parseFloat(getComputedStyle(F.frame).borderTopLeftRadius) || 30;
      F.frame.style.borderRadius = inline;
    };
    readR();
    ScrollTrigger.addEventListener('refreshInit', readR);

    if (reduced) {
      film.classList.add('is-open');
      F.foot.classList.add('is-on');
      gsap.set(F.bigIn, { y: 0, yPercent: 0 });
      F.frame.style.clipPath = `inset(0 0 0 0 round ${rEnd}px)`;
      F.amb.style.opacity = '.55';
      return;
    }

    const bigWrite = hxWrite(F.bigIn, { paused: true });
    let written = false;
    ScrollTrigger.create({
      trigger: film,
      start: 'top bottom',
      end: 'top 18%',
      scrub: true,
      onUpdate: (self) => {
        const o = self.progress;                   // 0 = a strip in the middle, 1 = the open window
        const e = 1 - (1 - o) * (1 - o);           // most of the opening happens early, then it settles
        const k = 1 - e;
        const t = (k * 30).toFixed(2);             // top/bottom of the mask, in %
        const x = (k * 22).toFixed(2);
        const r = (rEnd + k * 22).toFixed(1);      // rounder while small, Apple-sized when open
        F.frame.style.clipPath = `inset(${t}% ${x}% ${t}% ${x}% round ${r}px)`;
        F.frame.style.borderRadius = `${r}px`;     // keeps the hairline on the same corner
        F.poster.style.transform = `scale(${(1 + k * 0.12).toFixed(4)})`;
        F.amb.style.opacity = (e * 0.6).toFixed(3);
        F.sheen.style.transform = `translate3d(${(-130 + e * 260).toFixed(1)}%, 0, 0)`;
        film.classList.toggle('is-open', o > 0.25);
        // three lines since 2026-09-24, written in like every other heading (write.js, 2026-09-25). One
        // timeline played forwards and back, so a quick scroll back simply turns the writing round.
        if (o > 0.55 && !written) {
          written = true;
          bigWrite.timeScale(1).play();
        } else if (o < 0.5 && written) {
          written = false;
          bigWrite.timeScale(2.2).reverse();
        }
      },
    });

    ScrollTrigger.create({
      trigger: F.foot,
      start: 'top 92%',
      onToggle: (self) => F.foot.classList.toggle('is-on', self.isActive),
    });
  }

  /* ============================================================ 13. section 9 · Das Register (#faq) */

  // Manuel picked idea 3 (2026-09-20): the FAQ as the back pages of a printed manual. Every rule draws
  // itself left to right as its row arrives, the number sets in the accent, one hairline spine runs down
  // between the numbers and the text as you read, and an answer is written across rather than faded in.
  // One row open at a time — the register stays the same shape however much you read.
  const faq = $('#faq');
  const foot = $('.hf');
  const Q = faq ? {
    title: $('.hq-title', faq),
    reg: $('.hq-reg', faq),
    spine: $('.hq-spine', faq),
    rows: $$('.hq-row', faq),
    grps: $$('.hq-grp', faq),
    cats: $$('.hq-cat', faq),
  } : null;

  /** open or close one row, animating its measured height (never `auto`, which cannot be tweened) */
  function turnRow(row, on) {
    const panel = $('.hq-a', row);
    const inner = $('.hq-a-in', row);
    const btn = $('.hq-btn', row);
    if (!panel || !inner) return;
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    row.classList.toggle('is-open', on);
    gsap.killTweensOf(panel);
    const to = on ? inner.offsetHeight : 0;
    if (!on) panel.style.height = `${panel.offsetHeight}px`;   // leave `auto` before closing
    if (reduced) {
      gsap.set(panel, { height: on ? 'auto' : 0 });
      return;
    }
    gsap.to(panel, {
      height: to,
      duration: on ? 0.74 : 0.44,
      ease: on ? 'expo.out' : 'power2.inOut',
      onComplete: () => { if (on) panel.style.height = 'auto'; ScrollTrigger.refresh(); },
    });
  }

  function setupRegister() {
    if (!Q || !Q.rows.length) return;
    // the head is held at the top of the screen while the register runs past it, so the rail and every
    // group anchor have to hang exactly under it — and its height moves with the fitted title
    const head = $('.hq-head', faq);
    const syncHead = () => faq.style.setProperty('--hq-head-h', `${head.offsetHeight}px`);
    fitTitle(Q.title);
    syncHead();
    ScrollTrigger.addEventListener('refreshInit', () => { fitTitle(Q.title); syncHead(); });
    window.addEventListener('resize', syncHead);
    // „Fragen & Antworten" is written in like every other heading (2026-09-25; before, it just stood there)
    gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 85%', toggleActions: 'play none none reverse' } })
      .add(hxWrite(Q.title));

    // one open at a time; the first one stands open, the way the live site's accordion does
    Q.rows.forEach((row, i) => {
      const btn = $('.hq-btn', row);
      const panel = $('.hq-a', row);
      btn.addEventListener('click', () => {
        const isOpen = row.classList.contains('is-open');
        Q.rows.forEach((other) => { if (other !== row && other.classList.contains('is-open')) turnRow(other, false); });
        turnRow(row, !isOpen);
      });
      if (i === 0) {
        row.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.height = 'auto';
      }
    });

    // the rules draw themselves, in the order you meet them
    [...Q.rows, ...Q.grps, ...$$('.hf-row, .hf-end', foot || document)].forEach((el) => {
      if (reduced) { el.classList.add('is-in'); return; }
      ScrollTrigger.create({ trigger: el, start: 'top 94%', once: true, onEnter: () => el.classList.add('is-in') });
    });

    // the strip marks the group you are reading
    Q.grps.forEach((g, i) => {
      const cat = Q.cats.find((c) => c.dataset.cat === g.dataset.cat);
      if (!cat) return;
      const next = Q.grps[i + 1];
      ScrollTrigger.create({
        trigger: g,
        start: 'top 38%',
        endTrigger: next || Q.reg,
        end: next ? 'top 38%' : 'bottom 38%',
        onToggle: (self) => cat.classList.toggle('is-now', self.isActive),
      });
    });

    // the spine grows down the page while you read the register
    if (Q.spine) {
      if (reduced) {
        Q.spine.style.transform = 'scaleY(1)';
      } else {
        Q.spine.style.transform = 'scaleY(0)';
        ScrollTrigger.create({
          trigger: Q.reg,
          start: 'top 84%',
          end: 'bottom 64%',
          scrub: true,
          onUpdate: (self) => { Q.spine.style.transform = `scaleY(${self.progress.toFixed(4)})`; },
        });
      }
    }
  }

  /* ============================================================ boot */

  function intro() {
    const GAP = 0.18;
    ORDER.forEach((name, i) => swap(panels[name], i * GAP));
    // One short establishing beat once all three photos stand, then the loop never stops.
    gsap.delayedCall(GAP * (ORDER.length - 1) + WIPE + 0.6, loop);

    gsap.timeline()
      .fromTo('.hx-copy-main .hx-label', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut' }, 0.8)
      .add(hxWrite('.hx-line-in'), 0.9)
      // the sentence under the headline (experiment 2026-09-19) follows the words, before the buttons
      .fromTo('.hx-copy-main .hx-lede', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut' }, 1.15)
      .fromTo('.hx-copy-side .hx-reveal', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut', stagger: 0.09 }, 1.3);
  }

  function showStatic() {
    Object.values(panels).forEach((p) => {
      p.idx = 0;
      gsap.set(p.slides[0].el, { visibility: 'visible', zIndex: 2 });
    });
    gsap.set('.hx-line-in', { yPercent: 0 });
    gsap.set('.hx-reveal', { opacity: 1, y: 0 });
  }

  const firstImages = ORDER.map((name) => panels[name].slides[0].img);
  const decoded = Promise.all(firstImages.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())));
  const timeout = new Promise((resolve) => setTimeout(resolve, 2500));

  // The display weight must be in before fitSlogan measures, or it fits the fallback face.
  // The headline is two faces since 2026-09-19 (Playfair Display Italic over Inter 700): both must be in
  // before fitHero measures, or it sizes the fallback. Playfair comes from Google Fonts (the phone menu
  // already loads it), so it can be slower than the 3 s race below — see the late refit after boot.
  const HEAD_TOP = 'italic 400 100px "Playfair Display"';
  const fontsIn = Promise.all([
    document.fonts.ready,
    document.fonts.load('650 100px Inter', 'Sorgfalt fährt vor.').catch(() => {}),
    document.fonts.load('700 100px Inter', 'Präzision.').catch(() => {}),
    document.fonts.load(HEAD_TOP, 'Perfektion trifft').catch(() => {}),
  ]);
  Promise.all([Promise.race([decoded, timeout]), Promise.race([fontsIn, new Promise((r) => setTimeout(r, 3000))])])
    .then(() => {
      measure();
      fitSlogan();
      fitHero();
      // a hook for type tests (the font lab of 2026-09-19 used it; archived in _archive/2026-09-19-fontlab/)
      window.hxFitHero = fitHero;
      window.dispatchEvent(new Event('hx:ready'));
      // if the serif lost the 3 s race, fit again the moment it lands (the lines are still masked or
      // just revealing then — a resize is not visible as a jump)
      if (!document.fonts.check(HEAD_TOP, 'Perfektion trifft')) {
        document.fonts.load(HEAD_TOP, 'Perfektion trifft').then(() => fitHero()).catch(() => {});
      }
      // The van's range ends where the cover phase begins: rise + hold, in stage heights (the
      // stage is 100lvh, so this stays right on phones whose toolbar changes the viewport).
      const stageEl = $('.hx-stage');
      const travel = () => {
        const cs = getComputedStyle(hero);
        const vh = parseFloat(cs.getPropertyValue('--hx-rise')) + parseFloat(cs.getPropertyValue('--hx-hold'));
        return (vh / 100) * stageEl.offsetHeight;
      };
      const setLanding = (self) => { landY = Math.round(self.start + (self.end - self.start) * landAt); };
      const heroTrigger = ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: () => `+=${travel()}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => render(self.progress, self.direction),
        onRefresh: (self) => {
          measure();
          fitSlogan();
          fitHero();
          setLanding(self);
          render(self.progress);
        },
      });
      setLanding(heroTrigger);
      render(0);
      setupStrip();
      setupCraft();
      setupWork();
      setupBeforeAfter();
      setupPackages();
      setupRoute();
      setupStatement();
      setupRegister();
      ScrollTrigger.refresh(); // the strip set its own height, sections 3–6 fitted their type: re-read the page
      if (reduced) showStatic();
      else intro();

      // ⚠ 2026-09-25, Manuel: „The FAQ button in the navigation bar does not work." On every other page it
      // is `index.html#faq` — and this file starts with scrollTo(0, 0) (manual restoration), so the browser's
      // own jump to the anchor was undone and the home page opened on the hero. Now that the pins have
      // their height, go to the anchor ourselves — instantly: gliding 11 000 px through the hero is not arriving.
      const hash = location.hash;
      let target = null;
      try { target = hash.length > 1 && document.getElementById(decodeURIComponent(hash.slice(1))); } catch { /* a malformed hash: stay on the hero */ }
      if (target) {
        // The page still settles for a moment after this (late refits, a refresh): measured 81 px of drift
        // at 1905×916, enough to hide the first FAQ question under its sticky heading. So aim again on
        // every refresh and once more after the settle, then let go.
        const go = () => {
          jumpUntil = performance.now() + 2000;
          const top = anchorTop[hash] ? anchorTop[hash]() : target.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top, behavior: 'instant' });
        };
        go();
        ScrollTrigger.addEventListener('refresh', go);
        setTimeout(() => { go(); ScrollTrigger.removeEventListener('refresh', go); }, 1200);
      }

      // Warm the rest of the photos so the first swaps never wait on the network.
      $$('.hx-slide img').forEach((img) => img.decode && img.decode().catch(() => {}));
    });
})();
