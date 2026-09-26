/* ===================================================================================
   „Die Akte" — the four legal pages.

   Almost nothing moves here on purpose: a page of legal text is for reading, not for
   watching. Only two things happen.

     1. The page arrives with the site's own reveal (Apple's 30 px / 940 ms), header
        first, then the rails, then each section as it comes up.
     2. The left rail marks the section you are actually looking at.

   The safety net is the same one arbeit.js, endstufe.js and mobil.js carry — measured
   once in a preview pane that pauses requestAnimationFrame, where `gsap.ticker.frame`
   stayed at 0 and the page read as blank. On a legal page that failure is the worst of
   all, so it is also the reason the reveal is gated on `.hx-js` in the stylesheet: with
   JavaScript off, nothing was ever hidden.
   =================================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const main = $('.rc');
  if (!main) return;

  /* ---------------------------------------------------------------- the rail marker */

  const links = new Map($$('.rc-rail-l a[data-rail]').map((a) => [a.dataset.rail, a]));
  const sections = $$('.rc-s');

  if (links.size && sections.length && 'IntersectionObserver' in window) {
    let here = null;
    const mark = (id) => {
      if (id === here) return;
      here = id;
      links.forEach((a, key) => a.classList.toggle('is-here', key === id));
    };

    /* Whichever section has crossed the top band most recently is the one being read. */
    const seen = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target.id);
          else seen.delete(e.target.id);
        }
        const first = sections.find((s) => seen.has(s.id));
        if (first) mark(first.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    mark(sections[0].id);
  }

  /* ---------------------------------------------------------------- the reveal */

  const showAll = () => $$('.rc-reveal').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });

  if (reduced || !window.gsap) { showAll(); return; }
  gsap.registerPlugin(ScrollTrigger);

  // the title („Impressum", „Datenschutzerklärung" …) is WRITTEN in, letter by letter (write.js,
  // 2026-09-25); it carries `.rc-reveal` in the markup, so it is shown and its letters hidden instead
  const title = $('.rc-head .rc-title');
  const head = $$('.rc-head .rc-reveal').filter((el) => el !== title);
  gsap.fromTo(head, { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.94, ease: 'power1.inOut', stagger: 0.09, delay: 0.12 });
  if (title) {
    gsap.set(title, { opacity: 1 });
    gsap.timeline({ delay: 0.12 }).add(hxWrite(title));
  }

  gsap.fromTo($$('.rc-rail, .rc-docs'), { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, ease: 'power1.inOut', stagger: 0.08, delay: 0.3 });

  /* The closing strip gets `top bottom`, not `top 88%`, and the difference is not taste:
     measured at 1440x900 it is about 90 px tall, so at the very end of the page its top sits
     at 810 px — below the 792 px that `88%` means. It never fired, and the strip with the way
     back to the home page stayed invisible on every desktop screen. */
  $$('.rc-s').forEach((el) => {
    gsap.fromTo(el, { y: 26, opacity: 0 }, {
      y: 0,
      opacity: 1,
      duration: 0.9,
      ease: 'power1.inOut',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  const end = $('.rc-end');
  if (end) {
    gsap.fromTo(end, { y: 26, opacity: 0 }, {
      y: 0,
      opacity: 1,
      duration: 0.9,
      ease: 'power1.inOut',
      scrollTrigger: { trigger: end, start: 'top bottom', once: true },
    });
  }

  setTimeout(() => { if (!window.gsap || gsap.ticker.frame === 0) showAll(); }, 2000);
})();
