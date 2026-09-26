/* ===================================================================================
   The shared navbar — the phone menu, and nothing else.

   2026-09-20: written for arbeit.html, which is the first page that needs the navbar
   without loading a whole page script with it.
   ⚠ The same behaviour also lives inside `hero.js` (§ the navbar) and at the foot of
   `booking.js`. Those two were written before this file existed and still carry their
   own copy — do NOT also load nav.js on index.html or buchen.html, or every button
   would be bound twice. Unifying the three is worth doing once buchen.html has a
   verdict; until then this note is the record that they are the same code.
   =================================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const menu = $('#mobile-menu');
  const toggle = $('[data-nav-toggle]');
  if (!menu || !toggle) return;
  let open = false;
  let tl = null;

  function set(want) {
    if (want === open) return;
    open = want;
    document.body.style.overflow = want ? 'hidden' : '';
    menu.style.pointerEvents = want ? 'auto' : 'none';
    $('[data-icon="menu"]', toggle).hidden = want;
    $('[data-icon="x"]', toggle).hidden = !want;
    const gsap = window.gsap;
    if (!gsap) {
      menu.style.clipPath = want ? 'circle(150% at calc(100% - 2.5rem) 1.75rem)' : 'circle(0% at calc(100% - 2.5rem) 1.75rem)';
      return;
    }
    if (want) {
      tl = gsap.timeline();
      tl.fromTo(menu, { clipPath: 'circle(0% at calc(100% - 2.5rem) 1.75rem)' },
        { clipPath: 'circle(150% at calc(100% - 2.5rem) 1.75rem)', duration: 0.7, ease: 'power4.inOut' });
      tl.fromTo([...menu.querySelectorAll('.menu-item')],
        { y: 40, opacity: 0, scale: 0.95, filter: 'blur(8px)' },
        { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, stagger: 0.08, ease: 'power3.out' }, '-=0.3');
    } else if (tl) tl.timeScale(1.5).reverse();
  }

  toggle.addEventListener('click', () => set(!open));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  $('[data-nav-home]')?.addEventListener('click', () => { location.href = '/'; });
  addEventListener('scroll', () => { if (open) set(false); }, { passive: true });
})();
