import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Img from './Img';
import SplitText from './SplitText';
import { testimonials } from '../data/reviews';
import { LOCATIONS, OWNER, KERAMIK_DURABILITY_KM } from '../data/business';
import { MOBILE_SURCHARGE } from '../lib/pricing';
import { prefersReducedMotion } from '../lib/motion';
import { founderQuote, founderPhotos } from '../data/founder';

/**
 * The person behind the business.
 *
 * A detailing customer is really asking "do I trust this man with my expensive car?", and the site
 * answered that with a brand manifesto. Matthias appeared exactly once, as a small hover-labelled
 * tile on a subpage. This section is the answer to the question that is actually being asked.
 *
 * Two rules govern everything here:
 *
 *  1. **No invented quote.** `founderQuote` holds a clearly-flagged placeholder right now and a
 *     test fails until it is replaced with Matthias' real words (see below). Set it back to null
 *     and the section renders no owner quote at all rather than an empty hole — it borrows a real
 *     customer's voice instead, which is the honest fallback.
 *  2. **No invented facts.** No founding year: nothing in this repo records one. No vehicle count,
 *     no satisfaction percentage. The three facts in the list are read from the modules that own
 *     them, so they cannot drift.
 */

/**
 * Until then, a real customer speaks instead.
 *
 * Six of the fifteen hand-copied Google reviews name Matthias personally. Quoting one in full is
 * the one way to put a human voice in this section without anyone writing it — and a customer
 * saying it is worth more than the owner saying it anyway. Filtered rather than hard-coded so it
 * keeps working when the review list changes; rendered in full, because truncating a review to the
 * sentence that flatters him changes what the person actually said.
 */
const namedReviews = testimonials
    .filter((t) => /Matthias|Herr Kaufmann/.test(t.text))
    // Shortest first — a pull quote has to be readable at a glance, and the longest of these runs
    // to ninety words. This picks which review to show; it never edits one. Choosing a shorter
    // review is editing the page, choosing a shorter *sentence* would be editing the customer.
    .sort((a, b) => a.text.length - b.text.length);

const YOUTUBE_VIDEO_ID = 'QrwdgrPwF4c';

export default function Founder() {
    const sectionRef = useRef(null);
    const [playing, setPlaying] = useState(false);

    const quote = namedReviews[0];

    useEffect(() => {
        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            // Reveal from the bottom edge — the mirror of MobileService's reveal-from-the-left, so
            // the two rhyme without repeating. Nothing else on the page moves this way.
            gsap.from('.founder-photo', {
                scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
                clipPath: 'inset(0 0 100% 0)',
                duration: 1.2,
                ease: 'power4.out',
            });

            gsap.from('.founder-fact', {
                scrollTrigger: { trigger: '.founder-facts', start: 'top 88%' },
                y: 16,
                opacity: 0,
                duration: 0.7,
                stagger: 0.1,
                ease: 'power3.out',
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            id="ueber-uns"
            ref={sectionRef}
            className="relative bg-obsidian py-24 sm:py-32 overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24">
                {/* Deliberately unaligned: every other two-column block on this site is
                    items-center. This one is a magazine spread, not a feature row. */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">

                    {/* Photo column */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        <figure className="flex flex-col gap-3">
                            <div className="founder-photo relative overflow-hidden rounded-[2rem] aspect-[3/4] bg-slate">
                                <Img
                                    src={founderPhotos[0].src}
                                    sizes="(min-width: 1024px) 40vw, 100vw"
                                    alt={founderPhotos[0].alt}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{ objectPosition: '72% 38%' }}
                                    loading="lazy"
                                />
                            </div>
                            <figcaption className="font-mono text-[11px] text-ivory/40 uppercase tracking-[0.2em]">
                                {founderPhotos[0].caption}
                            </figcaption>
                        </figure>

                        {/* The showcase video, moved here from the old manifesto block — a video of
                            the work belongs beside the person doing it. Click-to-load keeps the
                            two-click privacy pattern and the youtube-nocookie host the CSP allows. */}
                        <div className="w-full aspect-video rounded-[1.5rem] overflow-hidden border border-slate/40 bg-obsidian">
                            {playing ? (
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
                                    title="Elité Auto Aufbereitung — Showcase"
                                    className="w-full h-full"
                                    style={{ border: 'none' }}
                                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                    allowFullScreen
                                />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setPlaying(true)}
                                    aria-label="Video abspielen: Elité Auto Aufbereitung Showcase"
                                    className="group relative block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne"
                                >
                                    <Img
                                        src="/assets/video-poster.jpg"
                                        sizes="(min-width: 1024px) 40vw, 100vw"
                                        alt=""
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    <span className="absolute inset-0 bg-obsidian/30 group-hover:bg-obsidian/40 transition-colors flex items-center justify-center">
                                        <span className="w-14 h-14 rounded-full bg-ivory/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                                            <svg viewBox="0 0 24 24" className="w-6 h-6 text-obsidian translate-x-0.5" fill="currentColor">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </span>
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Text column — offset down, so the two columns do not line up. */}
                    <div className="lg:col-span-6 lg:col-start-7 lg:mt-24 flex flex-col gap-6">
                        <span className="font-mono text-[11px] text-champagne uppercase tracking-[0.25em]">
                            Inhaber · Elité Auto Aufbereitung
                        </span>

                        {/* The site's one surviving SplitText, on the one heading where a
                            letter-by-letter reveal earns its place: a person's name. */}
                        <h2 className="font-drama italic text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-6xl text-ivory">
                            <span className="relative inline-block">
                                <SplitText type="chars" triggerStart="top 85%">
                                    {OWNER}
                                </SplitText>
                                <span className="underline-draw bg-champagne" />
                            </span>
                        </h2>

                        <p className="font-sans text-base text-ivory/70 leading-relaxed max-w-xl">
                            In einer Bürsten-Waschanlage läuft der Schmutz des Vorgängerfahrzeugs über
                            deinen Lack. Deshalb wird hier von Hand gewaschen: kontaktlose Vorwäsche,
                            zwei Eimer, pH-neutrales Shampoo, Trocknen mit warmer Luft und
                            Mikrofasertüchern. Vor jeder Politur wird die Lackdicke gemessen — so ist
                            klar, wie viel Klarlack noch da ist und wie viel abgetragen werden darf.
                        </p>

                        {/* Rendered only when Matthias has actually said something. */}
                        {founderQuote && (
                            <blockquote className="border-l-2 border-champagne/50 pl-5 flex flex-col gap-2">
                                <p className="font-drama italic text-xl text-ivory/90 leading-relaxed">
                                    „{founderQuote.text}&ldquo;
                                </p>
                                <cite className="not-italic font-sans text-xs text-ivory/40">
                                    {OWNER}, Inhaber
                                </cite>
                            </blockquote>
                        )}

                        {quote && (
                            <blockquote className="border-l-2 border-ivory/15 pl-5 flex flex-col gap-2">
                                <p className="font-drama italic text-lg sm:text-xl text-ivory/85 leading-relaxed">
                                    „{quote.text}&ldquo;
                                </p>
                                <cite className="not-italic font-sans text-xs text-ivory/40">
                                    {quote.name} · Google-Bewertung
                                </cite>
                            </blockquote>
                        )}

                        {/* A definition list with hairline rules, not a grid of glass cards. */}
                        <dl className="founder-facts mt-2 flex flex-col">
                            {[
                                {
                                    k: 'Standorte',
                                    v: `${LOCATIONS.feldkirch.city} · ${LOCATIONS.nueziders.city}`,
                                },
                                {
                                    k: 'Mobil',
                                    v: `ganz Vorarlberg, Anfahrtspauschale €${MOBILE_SURCHARGE}`,
                                },
                                { k: 'Keramik', v: `FIREBALL, hält ${KERAMIK_DURABILITY_KM}` },
                            ].map((f) => (
                                <div
                                    key={f.k}
                                    className="founder-fact flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 border-t border-ivory/10 py-3"
                                >
                                    <dt className="font-mono text-[11px] text-champagne uppercase tracking-[0.2em] sm:w-32 shrink-0">
                                        {f.k}
                                    </dt>
                                    <dd className="font-sans text-sm text-ivory/75">{f.v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>
        </section>
    );
}
