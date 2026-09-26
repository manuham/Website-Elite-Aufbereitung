/* ===================================================================================
   The site footer on the sub-pages — its two behaviours, nothing else.

   2026-09-26, Manuel: every page ends with the home page's footer now (see _build/footer.mjs).
   On „/" hero.js does both of these jobs itself — do NOT load this file on index.html.

     1. the footer's hairlines draw themselves left to right as they arrive — hero.css hides
        them under `.hx-js` until `.is-in`, so without this they would never appear;
     2. the navbar stays readable over a light ground. It is 30 % ink over the page; over the
        warm-white footer, and over the light closing sheets of endstufe / mobil / kontakt,
        that put ivory links on ivory. There it turns nearly solid — the swap hero.js makes on „/".
        (2026-09-26: also over the light half of the split screen on mobil.html.)

   No GSAP needed: an IntersectionObserver and one scroll listener, so it also works on
   buchen.html, which loads GSAP without ScrollTrigger.
   =================================================================================== */
(() => {
  const foot = document.querySelector('.hf');
  if (!foot) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1 ─ the rules: the same moment hero.js uses (`top 94%`) */
  const rules = [...foot.querySelectorAll('.hf-row, .hf-end')];
  if (reduced || !('IntersectionObserver' in window)) {
    rules.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((seen) => seen.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -6% 0px' });
    rules.forEach((el) => io.observe(el));
  }

  /* 2 ─ the navbar over light ground */
  const bar = document.getElementById('site-nav');
  if (!bar) return;
  const grounds = [...document.querySelectorAll('.hf, .he-end, .mo-end, .ko-end, .mo-half--b')];
  let light = null;
  const check = () => {
    const now = grounds.some((g) => {
      const r = g.getBoundingClientRect();
      return r.top < 56 && r.bottom > 0;
    });
    if (now === light) return;
    light = now;
    bar.classList.toggle('bg-obsidian/30', !now);
    bar.classList.toggle('bg-obsidian/85', now);
  };
  addEventListener('scroll', check, { passive: true });
  addEventListener('resize', check, { passive: true });
  check();
})();
