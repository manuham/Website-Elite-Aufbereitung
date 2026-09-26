/* ===================================================================================
   THE PRESS — every button on the site sinks under the finger.
   Manuel, 2026-09-22: „add the press effect to the other pages too."

   Written once, for all ten pages, and it deliberately does NOT do it in CSS.

   Two reasons, both measured on kontakt.html before this file existed:

     1. `transition` is a single property. A stylesheet loaded on top of the page's own
        cannot ADD `scale` to a transition — it can only replace the whole list, which
        would silently change every hover duration on the site.

     2. ⚠ GSAP 3.14 writes `translate: none; rotate: none; scale: none` as INLINE styles
        on every element it tweens, and an inline declaration beats any stylesheet rule.
        Every page here reveals with GSAP, so a CSS `:active { scale: … }` would do
        nothing on exactly the elements that had been revealed — which is most of them.

   A Web Animations effect sits ABOVE inline styles in the cascade, so it wins over
   GSAP's leftovers without touching them, and it never touches the page's transitions.

   Which elements: every <button>, and every <a> that LOOKS like a box — a background,
   a border, a shadow, or a picture inside it. A plain text link is left alone, because
   a shrinking line of text reads as a glitch, not as a key.
   =================================================================================== */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const DOWN = 90;    /* fast down … */
  const UP = 260;     /* … slow up. That asymmetry is what makes it feel mechanical. */
  const EASE = 'cubic-bezier(.16, 1, .3, 1)';
  const PILL = 0.955;
  const CARD = 0.982; /* a big surface needs a smaller number to travel the same distance */
  const BIG = 30000;  /* px² — above this an element is a card, not a button */

  const CANDIDATE = 'a[href], button, [role="button"]';

  /** A box, not a line of text. */
  const isBox = (el) => {
    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') return true;
    const cs = getComputedStyle(el);
    if (cs.boxShadow !== 'none') return true;
    if (parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0) return true;
    const bg = cs.backgroundColor;
    if (bg && bg !== 'transparent' && !/^rgba\(\s*0,\s*0,\s*0,\s*0\s*\)$/.test(bg)) return true;
    if (cs.backgroundImage !== 'none') return true;
    return !!el.querySelector('img, picture, svg');
  };

  const held = new Set();

  const stop = (el) => {
    el.getAnimations().forEach((a) => { if (a.id === 'press') a.cancel(); });
  };

  const run = (el, to, ms) => {
    stop(el);
    const a = el.animate([{ scale: to }], { duration: ms, easing: EASE, fill: 'forwards' });
    a.id = 'press';
    return a;
  };

  const down = (el) => {
    if (held.has(el) || el.disabled) return;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 20) return;
    held.add(el);
    run(el, r.width * r.height >= BIG ? CARD : PILL, DOWN);
  };

  const up = (el) => {
    if (!held.has(el)) return;
    held.delete(el);
    /* back to 1, then let go of the element entirely so nothing of ours is left behind */
    const a = run(el, 1, UP);
    a.addEventListener('finish', () => { if (!held.has(el)) stop(el); });
  };

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const el = e.target.closest(CANDIDATE);
    if (el && isBox(el)) down(el);
  }, true);

  for (const type of ['pointerup', 'pointercancel', 'dragstart', 'blur']) {
    document.addEventListener(type, () => held.forEach(up), true);
  }
  /* a finger that slides off the button must let it come back up */
  document.addEventListener('pointermove', (e) => {
    if (!held.size) return;
    const under = e.target.closest(CANDIDATE);
    held.forEach((el) => { if (el !== under) up(el); });
  }, true);
  addEventListener('blur', () => held.forEach(up));

  /* the keyboard presses too: Enter and Space on the focused control */
  document.addEventListener('keydown', (e) => {
    if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
    const el = document.activeElement;
    if (el && el.matches && el.matches(CANDIDATE) && isBox(el)) down(el);
  }, true);
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' || e.key === ' ') held.forEach(up);
  }, true);
})();
