import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SplitText from './SplitText';
import Img from './Img';
import { prefersReducedMotion } from '../lib/motion';

/**
 * The WHY, and the thing Elité is arguing against.
 *
 * Was `Philosophy.jsx`, sitting fifth. Same shell, same GSAP, same section id — the id is
 * load-bearing (Navbar's first item targets `#philosophy` and resolves it with optional
 * chaining, so a rename would fail silently).
 *
 * What replaced the old stats row is the point of the rewrite. It used to read
 * "500+ Fahrzeuge aufbereitet / 60k km Keramik-Garantie / 100% Kundenzufriedenheit". None of
 * those had a source anywhere in the repo, "100% Kundenzufriedenheit" is unverifiable by
 * construction, and *Garantie* is a binding undertaking under § 9b KSchG rather than a word
 * for "it lasts a while" — docs/context/open-questions.md still has that one open. Three
 * claims about what we refuse to do are both true and a better argument.
 */
const antiClaims = ['Keine Bürsten.', 'Keine Massenabfertigung.', 'Keine Kompromisse.'];

export default function Manifest() {
    const containerRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            gsap.to('.parallax-bg', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
                y: 150,
                ease: 'none'
            });

            gsap.from('.reveal-text', {
                scrollTrigger: {
                    trigger: textRef.current,
                    start: 'top 80%',
                },
                y: 40,
                opacity: 0,
                duration: 1.2,
                stagger: 0.18,
                ease: 'power3.out'
            });

            gsap.from('.claim-item', {
                scrollTrigger: {
                    trigger: '.claims-row',
                    start: 'top 85%',
                },
                y: 20,
                opacity: 0,
                duration: 0.8,
                stagger: 0.12,
                ease: 'power3.out'
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="philosophy" ref={containerRef} className="relative w-full py-24 sm:py-32 overflow-hidden bg-obsidian">

            {/* Parallax background texture.
                A photograph of a roof being buffed by hand — it makes the section's argument
                before a word of it is read. Landscape, so it fills a full-width band instead of
                being a portrait stretched across one. Lazy because this section sits second and
                a decorative 15%-opacity texture must not compete with the hero for the LCP. */}
            <div className="absolute inset-0 z-0">
                <div className="parallax-bg absolute -top-[10vh] left-0 w-full h-[120vh]">
                    <Img
                        src="/assets/Außenreinigung/P1334869.jpg"
                        sizes="100vw"
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover opacity-15 mix-blend-luminosity"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-transparent to-obsidian" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 flex flex-col gap-16" ref={textRef}>

                {/* Manifesto Block */}
                <div className="flex flex-col gap-6 max-w-3xl">
                    <p className="reveal-text font-sans font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-ivory/45">
                        Unsere Haltung
                    </p>

                    {/* Kept verbatim. This one sentence was the best thing on the site and it
                        was five sections down; the whole reorder exists to put it here. */}
                    <p className="reveal-text font-sans text-base sm:text-lg text-ivory/50 tracking-wide">
                        Die meisten Autowäschen setzen auf Geschwindigkeit und Masse.
                    </p>

                    {/* „Wir kümmern uns um Ihres", not „um sie": in German that `sie` reads as
                        them / her / you-formal all at once, and the sentence needs the contrast
                        to land on the visitor's own car. */}
                    <h2 className="reveal-text font-drama italic text-[2.5rem] leading-[1.1] sm:text-5xl lg:text-6xl text-ivory">
                        <SplitText type="words" triggerStart="top 80%">
                            Waschstraßen waschen Autos.
                        </SplitText>{' '}
                        <span className="relative inline-block">
                            <SplitText
                                className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-glow"
                                type="chars" triggerStart="top 80%" delay={0.25}
                                animation="clipReveal"
                            >
                                Wir kümmern uns um Ihres.
                            </SplitText>
                        </span>
                    </h2>

                    <p className="reveal-text font-sans text-base text-ivory/60 max-w-xl leading-relaxed">
                        Ein Auto, das Ihnen etwas bedeutet, verdient mehr als fünf Minuten und
                        rotierende Bürsten. Wir arbeiten von Hand, Panel für Panel — und geben
                        das Fahrzeug erst zurück, wenn es uns selbst gefällt.
                    </p>
                </div>

                {/* Three refusals, in the grid the unsourced counters used to occupy.
                    No CTA in this section on purpose: asking for the booking here is asking
                    before the work has been shown. The ask comes at the pricing and at the
                    closing statement. */}
                <div className="claims-row grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 max-w-3xl border-t border-ivory/10 pt-8">
                    {antiClaims.map((claim) => (
                        <span
                            key={claim}
                            className="claim-item font-mono text-xs sm:text-sm uppercase tracking-widest text-ivory/45"
                        >
                            {claim}
                        </span>
                    ))}
                </div>

            </div>
        </section>
    );
}
