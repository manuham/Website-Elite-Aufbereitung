/**
 * Motion preferences, in one place.
 *
 * The site animates almost everything with GSAP, and until now none of it asked whether the
 * visitor wants motion. CSS respects the preference in three places (src/index.css), but a
 * `gsap.from(...)` runs regardless — and the two animations that *pre-hide* their target
 * (the hero entrance, SplitText's slideUp) would leave a reduced-motion visitor looking at a
 * blank hero if they were simply skipped without care.
 *
 * The rule this file encodes:
 *   - `gsap.from` / `fromTo` reveals END at the visible state, so not running them is correct.
 *   - Anything that SETS a hidden state up front must be guarded, or content never appears.
 *
 * Mirrors the helper that already lives in src/components/booking/WeekCalendar.jsx, which was
 * the only reduced-motion-aware JS on the site.
 */
export function prefersReducedMotion() {
    return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}
