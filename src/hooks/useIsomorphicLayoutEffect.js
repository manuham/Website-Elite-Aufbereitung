import { useEffect, useLayoutEffect } from 'react';

/**
 * useLayoutEffect in the browser, useEffect on the server.
 *
 * The routes are prerendered to real HTML at build time (scripts/prerender.mjs), so the page paints
 * before React hydrates. Anything that has to be true *before that first paint* — GSAP setting an
 * element's entrance state to opacity 0, the preloader deciding whether this is a return visit —
 * must run in a layout effect, or the user sees one frame of the un-set state.
 *
 * React warns if useLayoutEffect runs during server rendering, hence the swap.
 */
const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect;
