/* ===================================================================================
   „Kontakt" — kontakt.html, „Die Tür".

   Three things move, and nothing else:
     1. the way in reveals (Apple's 30 px / 940 ms, the reveal the whole site uses);
     2. the two addresses arrive one after the other, because they are read as a pair;
     3. the photograph drifts a little against the scroll.

   Same safety net as arbeit.js, endstufe.js, mobil.js and recht.js: everything starts
   hidden and only a tween shows it, so a paused animation frame must never leave a
   telephone number invisible. The closing strip and the last band use `top bottom`,
   not a percentage — measured on the legal pages, a short element at the end of a page
   never reaches `top 88%` and stays hidden forever.
   =================================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const head = $('.ko-head');
  if (!head) return;

  const showAll = () => $$('.ko-reveal').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });

  if (reduced || !window.gsap) { showAll(); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* `freeScale` used to live here, stripping GSAP's inline `scale: none` so a CSS `:active`
     rule could work. `press.js` animates with the Web Animations API instead, which sits above
     inline styles in the cascade, so nothing has to be stripped any more. */
  const freeScale = () => {};

  /* 1 — the way in. ⚠ 2026-09-25, Manuel: „when you click on Kontakt, you get to a black page". This
     tween was missing — the header's three `.ko-reveal`s started hidden and nothing ever showed them,
     so the page opened on an empty black band above the addresses. Same numbers as mobil.js/endstufe.js. */
  /* The headlines are WRITTEN in, letter by letter (write.js, 2026-09-25). They carry `.ko-reveal` in
     the markup, which CSS starts at opacity 0 — so they are taken out of the fades and shown, and their
     letters are hidden instead. */
  const HEADS = '.ko-title, .ko-h, .ko-area-h, .ko-end-t';
  const fades = (root) => $$('.ko-reveal', root).filter((el) => !el.matches(HEADS));
  const writeIn = (root) => { const hs = $$(HEADS, root); gsap.set(hs, { opacity: 1 }); return hxWrite(hs); };

  gsap.fromTo(fades(head), { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut', stagger: 0.09, delay: 0.15 });
  gsap.timeline({ delay: 0.2 }).add(hxWrite($$('.ko-title > span', head)));
  gsap.set($('.ko-title', head), { opacity: 1 });

  /* 2 — the two addresses, then every other band as it arrives */
  ['.ko-where', '.ko-when', '.ko-ways', '.ko-area'].forEach((sel) => {
    const sec = $(sel);
    if (!sec) return;
    const els = fades(sec);
    gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 80%', once: true }, onComplete: () => freeScale(els) })
      .fromTo(els, { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power1.inOut', stagger: 0.1 })
      .add(writeIn(sec), 0.05);
  });

  const end = $('.ko-end');
  if (end) {
    const els = fades(end);
    gsap.timeline({ scrollTrigger: { trigger: end, start: 'top bottom', once: true }, onComplete: () => freeScale(els) })
      .fromTo(els, { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power1.inOut', stagger: 0.08 })
      .add(writeIn(end), 0.05);
  }

  /* 3 — the photograph drifts against the scroll. Apple's amount, not a funfair's. */
  const shot = $('.ko-shot');
  const img = shot && $('.ko-shot-img', shot);
  if (img) {
    gsap.fromTo(img, { yPercent: -3 }, {
      yPercent: 3,
      ease: 'none',
      scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    });
  }

  /* the safety net — measured once in a preview pane that pauses requestAnimationFrame:
     `gsap.ticker.frame` stayed at 0 and the page read as blank. */
  setTimeout(() => { if (!window.gsap || gsap.ticker.frame === 0) showAll(); }, 2000);
})();
