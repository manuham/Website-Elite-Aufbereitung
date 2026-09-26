/* ===================================================================================
   „Mobiler Service" — mobil.html, the cinematic rebuild (Manuel's picks, 2026-09-26).

     1. drive-in        — the van pulls up to the edge of the screen on arrival, its lights on,
                          while the headline is written; the scroll rolls it the rest of the way in
                          and parks it (pinned on a wide screen)
     2. phone rises     — the reel climbs up out of the floor in a phone and straightens (pinned)
     3. one per screen  — Einfahrt · Stellplatz · Haustür: one line at a time, the still behind
                          wiping up to the next; it snaps to each (pinned)
     4. laid out        — the three tools land side by side, each on its own shadow (pinned)
     5. split screen    — the two halves slide in from both edges and meet; then the words (pinned)
     6. lights on       — the light comes up WITH the scroll, smoothly; never a flash

   Reduced motion, a missing GSAP, or an animation frame that never fires: `html.mo-static`,
   and the page is a plain, fully readable document (mobil.css, last block).
   =================================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const open = $('.mo-open');
  if (!open) return;
  const statik = () => root.classList.add('mo-static');
  if (reduced || !window.gsap || !window.ScrollTrigger || !window.hxWrite) {
    statik();
    // the reel does not play by itself here — it gets its controls, and the person starts it
    const v = $('.mo-phone-v');
    if (v) { v.src = v.dataset.src; v.controls = true; }
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const WIDE = '(min-width: 900px) and (min-height: 600px)';
  const NARROW = '(max-width: 899px), (max-height: 599px)';
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------------------------------------------------------------- 1. drive-in */
  const van = $('.mo-van', open);
  gsap.timeline({ delay: 0.35 }).add(hxWrite($$('.mo-title .mo-l', open)));

  /* Three places for the van: OFF (beyond the right edge), WAIT (pulled up to the edge, only its
     front in the picture, a little further away) and PARK (where the CSS puts it, centred). x is in
     px from PARK, measured on every draw, so a resized window keeps the same picture. Two numbers
     drive it, one per pass, exactly like the lamp on endstufe.js: the scrubbed timeline renders its
     own start the moment it is made, and with one shared number the arrival would run from its end
     to its end. */
  const mmOpen = gsap.matchMedia();
  mmOpen.add({ wide: 'not all and (max-aspect-ratio: 4/5)', narrow: '(max-aspect-ratio: 4/5)' }, (ctx) => {
    const { wide } = ctx.conditions;
    const w = () => van.offsetWidth;
    const toEdge = () => innerWidth - (van.offsetLeft + w());      // PARK's right side → the screen's edge
    const OFF = () => ({ x: toEdge() + w() + 40, y: -3, s: 0.8 });
    // on a phone there is no pin: the arrival parks it
    // about two thirds of it already in: the first film showed half a van and a screen of empty dark
    const WAIT = () => (wide ? { x: toEdge() + w() * 0.34, y: -1.5, s: 0.92 } : { x: 0, y: 0, s: 1 });
    const PARK = () => ({ x: 0, y: 0, s: 1 });
    const arrival = { p: 0 };
    const scrolled = { p: 0 };
    let byScroll = false;
    const draw = () => {
      const [a, b, t] = byScroll ? [WAIT(), PARK(), scrolled.p] : [OFF(), WAIT(), arrival.p];
      // the nose dips a hair as it brakes into the parking spot, and comes back up
      const dip = byScroll ? Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.82) / 0.18))) : 0;
      gsap.set(van, {
        x: lerp(a.x, b.x, t),
        yPercent: lerp(a.y, b.y, t),
        scale: lerp(a.s, b.s, t),
        rotation: -0.45 * dip,
      });
    };
    addEventListener('resize', draw, { passive: true });
    draw();
    const intro = gsap.to(arrival, { p: 1, duration: wide ? 1.9 : 1.7, ease: 'power3.out', delay: 0.15, onUpdate: draw });
    if (!wide) return () => { intro.kill(); removeEventListener('resize', draw); };
    const tl = gsap.timeline({ scrollTrigger: { trigger: open, start: 'top top', end: '+=100%', pin: true, scrub: 0.6 } })
      .fromTo(scrolled, { p: 0 }, {
        p: 1, ease: 'power2.inOut',
        onUpdate() {
          byScroll = this.progress() > 0.01;   // not 0: at the very top the scrub settles a hair off zero
          if (byScroll && intro.isActive()) intro.progress(1).kill();
          draw();
        },
      }, 0);
    return () => { intro.kill(); tl.kill(); removeEventListener('resize', draw); };
  });

  /* ---------------------------------------------------------------- 2. the phone rises */
  const reelSec = $('.mo-reel');
  if (reelSec) {
    const phone = $('.mo-phone', reelSec);
    const say = $('.mo-reel-t', reelSec);
    gsap.timeline({ scrollTrigger: { trigger: reelSec, start: 'top 62%', once: true } })
      .add(hxWrite($$('.mo-h2 .mo-l', reelSec)))
      .fromTo(say, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power2.out' }, 0.5);
    const mm = gsap.matchMedia();
    mm.add(WIDE, () => {
      // out of the floor, tipped back, then upright and still
      gsap.timeline({ scrollTrigger: { trigger: reelSec, start: 'top top', end: '+=100%', pin: true, scrub: 0.6 } })
        .fromTo(phone, { yPercent: 78, rotationX: 26, scale: 0.9 },
          { yPercent: 0, rotationX: 0, scale: 1, duration: 1, ease: 'power2.out' }, 0)
        .to({}, { duration: 0.45 });                // a beat with the phone upright before the pin lets go
    });
    mm.add(NARROW, () => {
      gsap.fromTo(phone, { yPercent: 26, rotationX: 18, scale: 0.94 }, {
        yPercent: 0, rotationX: 0, scale: 1, ease: 'power2.out',
        scrollTrigger: { trigger: phone, start: 'top 98%', end: 'top 45%', scrub: 0.6 },
      });
    });

    // its file is fetched only when the section comes near, it plays only while it is on screen, and it
    // starts muted (no browser lets a page start with sound) — the round button turns the sound on
    const video = $('.mo-phone-v', reelSec);
    const snd = $('.mo-snd', reelSec);
    const bar = $('.mo-bar i', reelSec);
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

  /* ---------------------------------------------------------------- 3. one per screen */
  const where = $('.mo-where');
  if (where) {
    const items = $$('.mo-where-item', where);
    const pics = $$('.mo-where-pic', where);
    const imgs = pics.map((p) => $('img', p));
    const n = items.length;
    items.forEach((it) => it.classList.remove('is-on'));
    gsap.set(items, { autoAlpha: 0 });
    gsap.set(items[0], { autoAlpha: 1 });
    hxWrite.park($$('.mo-l', items[0]));
    pics.forEach((p, k) => gsap.set(p, { clipPath: k ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 0% 0%)' }));

    // place k rests at k; every change happens between two whole numbers
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: where, start: 'top top', end: () => `+=${Math.round(innerHeight * 0.75 * (n - 0.4))}`,
        pin: true, scrub: 0.6, invalidateOnRefresh: true,
        snap: { snapTo: 'labels', duration: { min: 0.25, max: 0.7 }, delay: 0.06, ease: 'power2.inOut' },
      },
    });
    for (let k = 0; k < n; k++) tl.addLabel(`p${k}`, k);
    imgs.forEach((im, k) => tl.fromTo(im, { scale: 1.16 }, { scale: 1, duration: 1, ease: 'none' }, Math.max(0, k - 0.6)));
    for (let k = 0; k < n - 1; k++) {
      tl.to(items[k], { autoAlpha: 0, y: -60, filter: 'blur(8px)', duration: 0.28, ease: 'power2.in' }, k + 0.3)
        .fromTo(pics[k + 1], { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power2.inOut', immediateRender: false }, k + 0.3)
        .fromTo(items[k + 1], { autoAlpha: 0, y: 80, filter: 'blur(10px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.42, ease: 'power3.out', immediateRender: false }, k + 0.55);
    }
    /* ⚠ the pin's end is a label too. Measured 2026-09-26: with the labels at the three places only, the
       snap pulled every scroll back to „Haustür" and the page could not be left. */
    tl.to({}, { duration: 0.4 }, n - 1).addLabel('out');

    // the first line is written as the section arrives
    gsap.timeline({ scrollTrigger: { trigger: where, start: 'top 55%', once: true } })
      .add(hxWrite($$('.mo-l', items[0])));
  }

  /* ---------------------------------------------------------------- 4. laid out */
  const kit = $('.mo-kit');
  if (kit) {
    const tools = $$('.mo-tool', kit);
    const pics = tools.map((t) => $('.mo-tool-pic', t));
    const shadows = tools.map((t) => $('.mo-tool-shadow', t));
    const names = tools.map((t) => $('.mo-tool-t', t));
    const tilt = [-5, 4, -3];
    gsap.timeline({ scrollTrigger: { trigger: kit, start: 'top 68%', once: true } })
      .add(hxWrite($$('.mo-kit-h .mo-l', kit)));
    const mm = gsap.matchMedia();
    mm.add(WIDE, () => {
      // the first tool lands while the section comes up — the first film opened the pin on an empty floor
      const pre = gsap.timeline({ scrollTrigger: { trigger: kit, start: 'top 75%', end: 'top top', scrub: 0.6 } });
      const tl = gsap.timeline({ scrollTrigger: { trigger: kit, start: 'top top', end: '+=75%', pin: true, scrub: 0.6 } });
      tools.forEach((_, k) => {
        const on = k ? tl : pre;
        const at = k ? 0.05 + (k - 1) * 0.42 : 0.1;
        on.fromTo(pics[k], { y: -150, rotation: tilt[k], scale: 1.05, autoAlpha: 0 },
          { y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 0.55, ease: 'power3.out' }, at)
          .fromTo(shadows[k], { opacity: 0, scaleX: 0.55 }, { opacity: 1, scaleX: 1, duration: 0.5, ease: 'power2.out' }, at + 0.06)
          .fromTo(names[k], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, at + 0.34);
      });
      tl.to({}, { duration: 0.35 });
    });
    mm.add(NARROW, () => {
      tools.forEach((t, k) => {
        gsap.timeline({ scrollTrigger: { trigger: t, start: 'top 92%', end: 'top 50%', scrub: 0.6 } })
          .fromTo(pics[k], { y: -70, rotation: tilt[k], autoAlpha: 0 }, { y: 0, rotation: 0, autoAlpha: 1, duration: 1, ease: 'power3.out' }, 0)
          .fromTo(names[k], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.5);
      });
    });
  }

  /* ---------------------------------------------------------------- 5. split screen */
  const split = $('.mo-split');
  if (split) {
    const [a, b] = $$('.mo-half', split);
    const qs = $$('.mo-half-q .mo-l', split);
    const answers = $$('.mo-half-a', split);
    hxWrite.park(qs);
    let said = false;
    const say = () => {
      if (said) return;
      said = true;
      gsap.timeline()
        .add(hxWrite(qs))
        .fromTo(answers, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.18 }, 0.45);
    };
    const mm = gsap.matchMedia();
    mm.add(WIDE, () => {
      // the halves travel while the section comes up (a pin that opened on two empty edges read as a
      // blank screen in the first film), meet as it reaches the top, and the pin holds them for the words
      gsap.timeline({ scrollTrigger: { trigger: split, start: 'top 65%', end: 'top top', scrub: 0.6 } })
        .fromTo(a, { xPercent: -100 }, { xPercent: 0, duration: 1, ease: 'power2.out' }, 0)
        .fromTo(b, { xPercent: 100 }, { xPercent: 0, duration: 1, ease: 'power2.out' }, 0);
      ScrollTrigger.create({ trigger: split, start: 'top top', end: '+=60%', pin: true, onEnter: say });
    });
    mm.add(NARROW, () => {
      gsap.fromTo(a, { xPercent: -45, opacity: 0.3 }, { xPercent: 0, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: a, start: 'top 95%', end: 'top 45%', scrub: 0.6 } });
      gsap.fromTo(b, { xPercent: 45, opacity: 0.3 }, { xPercent: 0, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: b, start: 'top 95%', end: 'top 45%', scrub: 0.6 } });
      ScrollTrigger.create({ trigger: split, start: 'top 55%', once: true, onEnter: say });
    });
  }

  /* ---------------------------------------------------------------- 6. lights on */
  // The light comes up WITH the scroll, smoothly — dark to light over the section's approach, and back
  // down if you scroll back up. No flashes, ever (the Endstufe flicker, 2026-09-26; WCAG 2.3.1).
  const end = $('.mo-end');
  if (end) {
    const light = $('.mo-end-light', end);
    const lines = $$('.mo-end-t .mo-l', end);
    const rest = $$('.mo-end-d, .mo-end-row, .mo-end-x, .mo-home', end);
    gsap.fromTo(light, { opacity: 0 }, {
      opacity: 1, ease: 'power1.inOut',
      scrollTrigger: { trigger: end, start: 'top 95%', end: 'top 40%', scrub: 0.6 },
    });
    gsap.timeline({ scrollTrigger: { trigger: end, start: 'top 62%', once: true } })
      .add(hxWrite(lines))
      .fromTo(rest, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.09 }, 0.35);
  }

  // the pins' lengths depend on the type, which may still be loading
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  /* the safety net — a preview pane that pauses requestAnimationFrame left `gsap.ticker.frame` at 0
     and a page that starts hidden read as blank (measured on endstufe.html). Undo the pins and show
     the plain page instead. */
  setTimeout(() => {
    if (gsap.ticker.frame > 0) return;
    ScrollTrigger.getAll().forEach((t) => t.kill(true));
    statik();
  }, 2000);
})();
