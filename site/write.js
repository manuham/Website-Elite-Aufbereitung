/* ===================================================================================
   „Schreiben" — how a headline arrives, on all ten pages.

   Manuel, 2026-09-25, on the old reveal (each line rising out of a hidden slot): „I want the
   animations of how the text appears to be more amazing and not boring." From three candidates
   in lab/text-motion.html he picked C („Fokus": big and blurred, then sharp) with one change:
   „make the text come from below and like its written so letter for letter but fast".

   So: every letter rises from just below the line, fades in and pulls sharp out of a blur, one
   after the other, fast; a second line carries on where the first one stopped, like a hand that
   keeps writing. Tune the whole site here — the five numbers below are the effect.

   ⚠ The letters are INLINE elements (<hx-l>, position: relative + `top`), never inline-block. A box per
   letter drops the font's kerning: measured 2026-09-25, „Vorher. Nachher." set 3.25 % wider
   as inline-block and 0.01 % as inline. Inline boxes cannot take a transform, so the rise is
   `top` and the focus is `filter` — fine for the one or two seconds a headline takes.

   API (needs gsap):
     hxWrite(targets, opts)  → a timeline that writes the targets in (one target = one line)
     hxWrite.park(targets)   → the hidden start state; also opens the old line mask (see below)
   =================================================================================== */
(() => {
  const RISE = 0.42;   // em below its place where a letter starts
  const BLUR = 12;     // px of blur a letter starts with
  const DUR = 0.62;    // one letter's own time
  const STEP = 0.026;  // the gap between two letters — „fast"
  const MAX = 0.8;     // a long line never takes longer than this to START its last letter

  const DONE = 'data-hx-split';
  // „reduce motion": no letters, no blur — the line is just shown where it belongs
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Wrap every visible character in its own inline span, leaving the element structure
      (em, br, the hyphen spans of „Massen-abfertigung") exactly as it was. */
  function splitNode(node, out) {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of n.textContent) {
          if (/\s/.test(ch)) { frag.append(ch); continue; } // spaces stay text, so lines still wrap there
          // not a <span>: the pages' own CSS has rules like `.ko-title span { display: block }` that
          // would catch every letter (caught 2026-09-25 — „So erreichen" stood one letter per line).
          // An unknown element is inline by default and no stylesheet here targets it.
          const s = document.createElement('hx-l');
          s.className = 'hx-ch';
          s.style.position = 'relative';
          s.textContent = ch;
          frag.append(s);
          out.push(s);
        }
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        splitNode(n, out);
      }
    });
  }

  function letters(el) {
    if (!el.hasAttribute(DONE)) {
      // a screen reader should hear the words, not one letter per span
      if (!el.closest('[aria-hidden="true"]') && !el.hasAttribute('aria-label')) {
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        if (text) el.setAttribute('aria-label', text);
      }
      const list = [];
      splitNode(el, list);
      el.setAttribute(DONE, '');
      el.hxLetters = list;
    }
    return el.hxLetters;
  }

  const from = () => ({ opacity: 0, top: `${RISE}em`, filter: `blur(${BLUR}px)` });

  /** The old reveal hid each line inside a mask (`.xx-line`, overflow hidden) and parked it 160 %
      down. Here the line itself stays put and its letters are hidden instead — and the mask is
      opened, or it would cut the blur and the rise off at a hard edge. */
  function park(targets) {
    const els = gsap.utils.toArray(targets);
    els.forEach((el) => {
      gsap.set(el, { y: 0, yPercent: 0 });
      if (reduced) return;
      gsap.set(letters(el), from());
      // a mask is a clipping wrapper around this line alone (.hx-line, .hb-line, .hx-word …)
      const mask = el.parentElement;
      if (mask && mask.children.length === 1 && /hidden|clip/.test(getComputedStyle(mask).overflow)) mask.style.overflow = 'visible';
    });
  }

  function hxWrite(targets, opts = {}) {
    const els = gsap.utils.toArray(targets);
    park(els);
    const tl = gsap.timeline(opts.paused ? { paused: true } : {});
    if (reduced) return tl;
    let at = 0;
    els.forEach((el) => {
      const ls = letters(el);
      const step = Math.min(STEP, MAX / Math.max(1, ls.length));
      tl.fromTo(ls, from(), {
        opacity: 1, top: '0em', filter: 'blur(0px)',
        duration: DUR, ease: 'power3.out', stagger: step,
      }, at);
      at += Math.min(ls.length * step, MAX) * (opts.flow ?? 0.85); // the next line picks up as this one ends
    });
    return tl;
  }
  hxWrite.park = park;
  window.hxWrite = hxWrite;

  // The same safety net every page script has: if the animation frame never fires (a paused tab, a
  // throttled preview — gsap.ticker.frame stays 0), no headline may stay invisible.
  setTimeout(() => {
    if (!window.gsap || gsap.ticker.frame > 0) return;
    document.querySelectorAll('.hx-ch').forEach((s) => { s.style.opacity = '1'; s.style.top = '0'; s.style.filter = 'none'; });
  }, 2500);
})();
