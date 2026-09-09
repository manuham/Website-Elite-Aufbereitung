/**
 * Motion preferences, in one place.
 *
 * The site animates almost everything with GSAP, and none of it asked whether the visitor
 * wants motion. CSS respects the preference in four places (src/index.css: the grain overlay,
 * the particles, the marquee, the slot hover), but a `gsap.from(...)` runs regardless.
 *
 * The rule this file encodes:
 *   - `gsap.from` / `fromTo` reveals END at the visible state, so not running them is correct
 *     and the content is simply there.
 *   - Anything that SETS a hidden state up front must be guarded, or the content never appears
 *     at all. On this site that is the hero entrance (`gsap.set('.hero-fade', {opacity: 0})`)
 *     and SplitText, whose slideUp/clipReveal park every unit at `yPercent: 130` before the
 *     ScrollTrigger fires. Skipping those two without care is worse than not guarding at all —
 *     it leaves a reduced-motion visitor looking at a blank hero and empty headings.
 *
 * Mirrors the helper that already lived in src/components/booking/WeekCalendar.jsx, which was
 * the only reduced-motion-aware JS on the site. That copy now imports this one.
 *
 * Called at effect time rather than read once at module scope: these pages are prerendered, so
 * module scope runs in Node where `window` does not exist, and a visitor can change the OS
 * setting without reloading.
 */
export function prefersReducedMotion() {
    return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}
