/* ===================================================================================
   „Élite Endstufe" — endstufe.html, the cinematic rebuild (Manuel's picks, 2026-09-26).

     1. the light sweep   — the paint lies in the dark; a studio lamp glides across it once on
                             arrival while the name is written in, and back again as you scroll
     2. word by word      — the promise is pinned and lights up one word at a time
     3. stacked screens   — four sticky sheets; the one being covered goes back and quiet,
                             the one arriving settles its photograph and writes its title
     4. spotlight         — pinned; „Was ist enthalten?" fills the screen, then the eight inclusions
                             one after the other, the photograph behind
                             cross-fading, a counter and a rail; it snaps to each inclusion
     5. unboxing          — pinned; the lid of a lit box lifts, the four items rise out of it
     6. lights on         — the light comes up with the scroll, the page turns light, the price lands

   Reduced motion, a missing GSAP, or an animation frame that never fires: `html.es-static`,
   and the page is a plain, fully readable document (endstufe.css, last block).
   =================================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const open = $('.es-open');
  if (!open) return;
  const statik = () => root.classList.add('es-static');
  if (reduced || !window.gsap || !window.ScrollTrigger || !window.hxWrite) {
    statik();
    // the reel does not play by itself here — it gets its controls, and the person starts it
    const v = $('.es-reel-v');
    if (v) { v.src = v.dataset.src; v.controls = true; }
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const BAR = 55;

  /* ---------------------------------------------------------------- 1. the light sweep */
  const lit = $('.es-plate-lit', open);
  const beam = $('.es-beam', open);
  const plate = $('.es-plate', open);
  const base = $('.es-plate-base', open);
  /* Where the lamp stands, in % of the screen's width. TWO positions, one per pass: the scrubbed
     timeline renders its own start the moment it is made, and when both passes shared one number
     the arrival pass then ran from its end to its end — no light at all (measured 2026-09-26).
     The arrival pass drives the lamp until the scroll pass has moved off its start. */
  const arrival = { s: -40 };
  const PARK = 68;                                // the arrival pass ends here, on the man: a key light that stays
  const scrolled = { s: PARK };
  let byScroll = false;
  const setLamp = () => {
    const s = byScroll ? scrolled.s : arrival.s;
    lit.style.setProperty('--sweep', `${s}%`);
    gsap.set(beam, { x: (s / 100) * innerWidth - beam.offsetWidth / 2, skewX: -14 });
  };
  setLamp();
  addEventListener('resize', setLamp, { passive: true });

  const title = $$('.es-title-l', open);    // „Die" · „Endstufe." — one hand writing both
  gsap.fromTo(base, { opacity: 0 }, { opacity: 1, duration: 1.8, ease: 'power2.out', delay: 0.1 });
  // the first pass: slow in, slow out, and the name is written while the light crosses it
  const introLamp = gsap.to(arrival, { s: PARK, duration: 2.6, ease: 'power3.inOut', delay: 0.2, onUpdate: setLamp });
  gsap.timeline({ delay: 1.2 })   // the lamp crosses the name between ~1.3 and 1.8 s
    .add(hxWrite(title))
    .fromTo($$('.es-fade', open), { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut', stagger: 0.1 }, 0.45);

  // the second pass is yours: pinned, the scroll carries the lamp back across and the plate settles
  gsap.timeline({ scrollTrigger: { trigger: open, start: 'top top', end: '+=75%', pin: true, scrub: 0.6 } })
    .fromTo(scrolled, { s: PARK }, {
      s: -40, ease: 'none',
      onUpdate() {
        byScroll = this.progress() > 0.01;   // not 0: at the very top the scrub settles a hair off zero (measured)
        if (byScroll && introLamp.isActive()) introLamp.kill();
        setLamp();
      },
    }, 0)
    .fromTo(plate, { scale: 1.08 }, { scale: 1, ease: 'none' }, 0)
    .to($('.es-open-in', open), { y: () => -innerHeight * 0.07, ease: 'none' }, 0)
    .to(plate, { opacity: 0.45, ease: 'power1.in', duration: 0.4 }, 0.6);

  /* ---------------------------------------------------------------- 2. word by word, beside the reel */
  // 2026-09-26: the client's own reel stands beside the words. On a wide screen the section is held while
  // the words light up one by one and the reel rises in; on a narrow one the reel sits under the words
  // and nothing is held — the words light as the section passes.
  const wordsSec = $('.es-words');
  if (wordsSec) {
    const w = $$('.es-w', wordsSec);
    const reel = $('.es-reel', wordsSec);
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (min-height: 600px)', () => {
      gsap.timeline({ scrollTrigger: { trigger: wordsSec, start: 'top top', end: '+=120%', pin: true, scrub: 0.5 } })
        .fromTo(reel, { y: 70, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, 0)
        .to(w, { opacity: 1, duration: 0.35, ease: 'none', stagger: 0.12 }, 0.1)
        .to({}, { duration: 0.6 });                 // a beat with every word lit before the pin lets go
    });
    mm.add('(max-width: 899px), (max-height: 599px)', () => {
      gsap.timeline({ scrollTrigger: { trigger: wordsSec, start: 'top 75%', end: 'bottom 70%', scrub: 0.5 } })
        .to(w, { opacity: 1, duration: 0.35, ease: 'none', stagger: 0.12 }, 0)
        .fromTo(reel, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.4);
    });

    // the reel: its file is fetched only when the section comes near, it plays only while it is on screen,
    // and it starts muted (no browser lets a page start with sound) — the round button turns the sound on
    const video = $('.es-reel-v', wordsSec);
    const snd = $('.es-reel-snd', wordsSec);
    const bar = $('.es-reel-bar i', wordsSec);
    if (video && 'IntersectionObserver' in window) {
      const load = () => {
        if (video.src) return;
        video.src = video.dataset.src;
        video.load();
      };
      new IntersectionObserver((seen) => seen.forEach((e) => { if (e.isIntersecting) load(); }), { rootMargin: '600px 0px' }).observe(video);
      new IntersectionObserver((seen) => seen.forEach((e) => {
        if (e.isIntersecting) { load(); video.play().catch(() => {}); } else video.pause();
      }), { threshold: 0.35 }).observe(video);
      if (snd) {
        snd.addEventListener('click', () => {
          load();
          video.muted = !video.muted;
          snd.setAttribute('aria-pressed', video.muted ? 'false' : 'true');
          snd.setAttribute('aria-label', video.muted ? 'Ton einschalten' : 'Ton ausschalten');
          video.play().catch(() => {});
        });
      }
      // a click on the picture itself pauses and resumes it
      video.addEventListener('click', () => { if (video.paused) video.play().catch(() => {}); else video.pause(); });
      if (bar) video.addEventListener('timeupdate', () => { bar.style.transform = `scaleX(${video.duration ? video.currentTime / video.duration : 0})`; });
    }
  }

  /* ---------------------------------------------------------------- 3. stacked screens */
  const stepsHead = $('.es-steps-head');
  if (stepsHead) {
    gsap.timeline({ scrollTrigger: { trigger: stepsHead, start: 'top 80%', once: true } })
      .add(hxWrite($$('.es-h2-l', stepsHead)), 0);
  }
  const marks = $$('.es-card-at');
  const cards = $$('.es-card');
  const stuckAt = (card) => parseFloat(getComputedStyle(card).top) || BAR;   // the sheet's own sticky top, px
  cards.forEach((card, k) => {
    const mark = marks[k];
    const img = $('.es-card-img', card);
    // the photograph settles as its sheet slides up into place
    gsap.fromTo(img, { scale: 1.2 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: mark, start: 'top bottom', end: () => `top top+=${stuckAt(card)}`, scrub: 0.6, invalidateOnRefresh: true },
    });
    // its title is written, its words follow, once it is most of the way up
    const copy = $$('.es-ticks, .es-card-d, .es-card-notes', card);
    gsap.set(copy, { opacity: 0, y: 18 });
    gsap.timeline({ scrollTrigger: { trigger: mark, start: 'top 55%', once: true } })
      .add(hxWrite($('.es-card-t', card)))
      .to(copy, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08 }, 0.2);
    // …and it goes back and quiet while the next one covers it
    const next = cards[k + 1];
    if (!next) return;
    gsap.fromTo(card, { scale: 1, '--dim': 0 }, {
      scale: 0.93, '--dim': 0.62, ease: 'none',
      scrollTrigger: { trigger: marks[k + 1], start: 'top bottom', end: () => `top top+=${stuckAt(next)}`, scrub: true, invalidateOnRefresh: true },
    });
  });

  /* ---------------------------------------------------------------- 4. spotlight */
  // 2026-09-26, Manuel: „before these cards pop up almost fullscreen: Was ist enthalten?" — so the pin opens
  // on the question, over a dark veil; the first scroll throws the question past you (it grows, blurs and
  // goes), the veil lifts off the first photograph, and the eight follow one at a time.
  const spot = $('.es-spot');
  if (spot) {
    const items = $$('.es-spot-item', spot);
    const bgs = $$('.es-spot-bg', spot);
    const imgs = bgs.map((b) => $('img', b));
    const rail = $$('.es-spot-rail li', spot);
    const count = $('.es-spot-count b', spot);
    const ask = $('.es-ask', spot);
    const veil = $('.es-spot-veil', spot);
    const chrome = $$('.es-spot-head, .es-spot-rail', spot);
    const n = items.length;
    items.forEach((it) => it.classList.remove('is-on'));
    bgs.forEach((b) => b.classList.remove('is-on'));
    gsap.set(items, { autoAlpha: 0 });
    gsap.set(bgs, { opacity: 0 });
    gsap.set(bgs[0], { opacity: 1 });

    let shown = -1;
    const mark = (k) => {
      if (k === shown) return;
      shown = k;
      count.textContent = String(k + 1);
      rail.forEach((li, j) => li.classList.toggle('is-on', j <= k));
    };
    mark(0);

    // unit 0 is the question; inclusion k rests at k + 1; every change happens between two whole numbers
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: spot, start: 'top top', end: () => `+=${Math.round(innerHeight * 0.55 * (n + 0.4))}`,
        pin: true, scrub: 0.6, invalidateOnRefresh: true,
        snap: { snapTo: 'labels', duration: { min: 0.25, max: 0.7 }, delay: 0.06, ease: 'power2.inOut' },
      },
      // a plain function: GSAP may call it while the timeline is still being made, before `tl` exists
      onUpdate() { mark(Math.min(n - 1, Math.max(0, Math.floor(this.time() + 0.45) - 1))); },
    });
    tl.addLabel('ask', 0);
    for (let k = 0; k < n; k++) tl.addLabel(`i${k}`, k + 1);
    tl.fromTo(ask, { scale: 1, autoAlpha: 1, filter: 'blur(0px)' }, { scale: 1.45, autoAlpha: 0, filter: 'blur(12px)', duration: 0.45, ease: 'power2.in' }, 0.3)
      .fromTo(veil, { opacity: 1 }, { opacity: 0, duration: 0.5, ease: 'none' }, 0.32)
      .fromTo(chrome, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'none' }, 0.6)
      .fromTo(items[0], { autoAlpha: 0, y: 70, filter: 'blur(10px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.42, ease: 'power3.out' }, 0.55);
    imgs.forEach((im, k) => tl.fromTo(im, { scale: 1.14 }, { scale: 1, duration: 1.6, ease: 'none' }, Math.max(0, k + 0.4)));
    for (let k = 0; k < n - 1; k++) {
      const at = k + 1;
      tl.to(items[k], { autoAlpha: 0, y: -46, filter: 'blur(8px)', duration: 0.28, ease: 'power2.in' }, at + 0.3)
        .to(bgs[k], { opacity: 0, duration: 0.5, ease: 'none' }, at + 0.3)
        .fromTo(bgs[k + 1], { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'none', immediateRender: false }, at + 0.3)
        .fromTo(items[k + 1], { autoAlpha: 0, y: 70, filter: 'blur(10px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.42, ease: 'power3.out', immediateRender: false }, at + 0.52);
    }
    tl.to({}, { duration: 0.001 }, n);

    // the question is written in as the section arrives
    gsap.timeline({ scrollTrigger: { trigger: spot, start: 'top 60%', once: true } })
      .add(hxWrite($('.es-ask-l', spot)));
  }

  /* ---------------------------------------------------------------- 5. unboxing */
  const gift = $('.es-gift');
  if (gift) {
    const box = $('.es-box', gift);
    const giftT = $('.es-gift-t', gift);
    gsap.timeline({ scrollTrigger: { trigger: gift, start: 'top 70%', once: true } })
      .add(hxWrite(giftT), 0);
    gsap.timeline({
      scrollTrigger: { trigger: gift, start: 'top top', end: '+=110%', pin: true, scrub: 0.6, invalidateOnRefresh: true },
    })
      .fromTo($('.es-box-lid', gift), { y: 0 }, { y: () => -box.clientHeight, duration: 1, ease: 'power2.inOut' }, 0)
      .fromTo($('.es-box-glow', gift), { opacity: 0, scaleY: 0.25 }, { opacity: 1, scaleY: 1, duration: 1, ease: 'power2.out' }, 0.1)
      .fromTo($$('.es-gift-l span', gift), { yPercent: 130, opacity: 0.2, filter: 'blur(8px)' },
        { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out', stagger: 0.32 }, 0.45)
      .fromTo($('.es-gift-d', gift), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power1.out' }, 1.75)
      .to({}, { duration: 0.35 });
  }

  /* ---------------------------------------------------------------- 6. lights on */
  // The light comes up WITH the scroll, smoothly — dark to light over the section's approach, and back
  // down if you scroll back up. ⚠ 2026-09-26: it first came on with two „studio tube" stutters (opacity
  // .7 → .1 → .85 → .3 → 1 in 0.3 s). Manuel: „when i scroll to the white page, the screen flickers" —
  // and a full-screen dark/white flash is also a seizure risk (WCAG 2.3.1). No flashes, ever.
  const end = $('.es-end');
  if (end) {
    const light = $('.es-end-light', end);
    const lines = $$('.es-end-t .es-h2-l', end);
    const rest = $$('.es-end-d, .es-end-p, .es-end-btns, .es-home', end);
    gsap.fromTo(light, { opacity: 0 }, {
      opacity: 1, ease: 'power1.inOut',
      scrollTrigger: { trigger: end, start: 'top 90%', end: 'top 30%', scrub: 0.6 },
    });
    // the words once the room is lit
    gsap.timeline({ scrollTrigger: { trigger: end, start: 'top 45%', once: true } })
      .add(hxWrite(lines))
      .fromTo(rest, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.09 }, 0.35);
  }

  // the pins' lengths depend on the type, which may still be loading
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  /* the safety net — measured once in a preview pane that pauses requestAnimationFrame:
     `gsap.ticker.frame` stayed at 0 and a page that starts hidden read as blank. Undo the pins and
     show the plain page instead. */
  setTimeout(() => {
    if (gsap.ticker.frame > 0) return;
    ScrollTrigger.getAll().forEach((t) => t.kill(true));
    statik();
  }, 2000);
})();
