import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ExternalLink } from 'lucide-react';
import { deriveReviewsState, buildMarqueeTrack } from '../lib/reviewsState';
import { GOOGLE_PROFILE_URL } from '../data/business';
import { prefersReducedMotion } from '../lib/motion';

function GoogleLogo({ className = 'w-5 h-5' }) {
    return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

function StarRating({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill={star <= rating ? '#FBBC05' : '#3a3a48'}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function ReviewCard({ review }) {
    return (
        <div className="review-card flex-shrink-0 w-[320px] sm:w-[360px] md:w-[400px] bg-[#1a1a24] border border-slate/60 rounded-2xl p-6 flex flex-col gap-4 hover:border-champagne/30 transition-colors duration-300">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <span className="font-sans font-semibold text-sm text-ivory">
                        {review.name}
                    </span>
                    <StarRating rating={review.rating} />
                </div>
                <GoogleLogo className="w-6 h-6 shrink-0" />
            </div>

            {/* No line-clamp. Every review was truncated to exactly four lines, which made a
                90-word review and a 20-word one render as the same rectangle — the uniformity is
                the thing that reads as fake, not the scrolling. */}
            <p className="font-sans text-sm text-ivory/70 leading-relaxed">
                {review.text}
            </p>

            {review.timeAgo && (
                <span className="font-sans text-xs text-ivory/40 mt-auto">
                    {review.timeAgo}
                </span>
            )}
        </div>
    );
}


export default function GoogleReviews() {
    const containerRef = useRef(null);
    /**
     * Derived once, synchronously, from the curated testimonials.
     *
     * This used to fetch /api/reviews on mount. That endpoint was deliberately deleted (commit
     * 883f052, "testimonials-only is the decision") and the routing tests assert it 404s — so the
     * call failed on every single page load, logged a console error, and, because `loading`
     * started true, meant the SERVER rendered three skeleton cards. Fifteen real German reviews
     * full of the exact vocabulary this site wants to rank for were absent from every prerendered
     * page, invisible to crawlers, to AI answer engines and to anyone with JS off.
     *
     * deriveReviewsState(null) is a pure function over a static import, so server and client
     * compute the identical tree and hydration is clean. rating/total stay null by construction:
     * an unsourced rating under a Google logo is a claim about Google's data, not a placeholder.
     */
    const state = deriveReviewsState(null);


    useEffect(() => {
        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            // Scale + fade for header (different from other sections)
            gsap.from('.reviews-header', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 85%',
                },
                scale: 0.95,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                clearProps: 'transform',
            });

            // Clip-path reveal from bottom for marquee
            gsap.fromTo('.reviews-marquee-wrapper',
                { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top 75%',
                    },
                    clipPath: 'inset(0% 0 0 0)',
                    opacity: 1,
                    duration: 1.2,
                    delay: 0.2,
                    ease: 'power4.out',
                    clearProps: 'clipPath',
                }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const displayReviews = buildMarqueeTrack(state.reviews);

    return (
        <section
            id="reviews"
            ref={containerRef}
            className="py-24 sm:py-32 bg-obsidian relative overflow-hidden"
        >
            <div className="reviews-header flex flex-col gap-4 items-center text-center px-6 sm:px-12 lg:px-24 mb-16">
                <div className="flex items-center gap-3">
                    <GoogleLogo className="w-7 h-7" />
                    <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest">
                        Google Bewertungen
                    </h3>
                </div>
                <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory">
                    Was unsere Kunden{' '}
                    <span className="text-champagne relative inline-block">
                        sagen.
                        <span className="underline-draw bg-champagne" />
                    </span>
                </h2>
                {/* Only rendered when the numbers actually came from Google. Never seeded, never
                    defaulted: an unsourced rating under a Google logo is a claim about Google's
                    data, not a placeholder. No data -> no row. */}
                {/* One link, not one per card: reviews.js has no per-review permalink, so 30
                    identical hrefs would imply a deep link that does not exist — and 30 tab stops
                    inside an auto-scrolling strip is a keyboard trap. Renders nothing at all while
                    GOOGLE_PROFILE_URL is empty, which is its honest state until Matthias sends it. */}
                {GOOGLE_PROFILE_URL && (
                    <a
                        href={GOOGLE_PROFILE_URL}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Alle Bewertungen auf Google ansehen (öffnet in einem neuen Tab)"
                        className="mt-2 inline-flex items-center gap-2 font-sans text-sm text-ivory/60 hover:text-champagne transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                    >
                        Alle Bewertungen auf Google ansehen
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )}

                {state.rating !== null && (
                    <div className="flex items-center gap-2 mt-2">
                        <StarRating rating={Math.round(state.rating)} />
                        <span className="font-mono text-sm text-ivory/60">
                            {state.rating.toFixed(1)} Sterne
                        </span>
                        {state.total !== null && (
                            <>
                                <span className="text-ivory/30">|</span>
                                <span className="font-sans text-sm text-ivory/60">
                                    {state.total} Bewertungen
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="reviews-marquee-wrapper relative group">
                <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-obsidian to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-obsidian to-transparent z-10 pointer-events-none" />

                {/* items-start, so a short review is a short card. Default stretch forced every
                    card to the tallest one's height. */}
                <div className="marquee-track flex items-start gap-6 w-fit">
                    {displayReviews.map((review, index) => (
                        <ReviewCard key={index} review={review} />
                    ))}
                </div>
            </div>
        </section>
    );
}
