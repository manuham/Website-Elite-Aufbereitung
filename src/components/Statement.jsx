import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import SplitText from './SplitText';
import Img from './Img';
import FloatingParticles from './FloatingParticles';
import { prefersReducedMotion } from '../lib/motion';

const YOUTUBE_VIDEO_ID = 'QrwdgrPwF4c';

/**
 * The closing brand moment: the last thing before the FAQ, and the only section that returns
 * to the WHY after the page has spent its middle on process and price.
 *
 * Deliberately breaks the `py-24 / max-w-7xl / left-aligned` shell every other section shares.
 * It is a full-bleed centred frame — the one place the page stops arguing and just states
 * something.
 *
 * Background is /assets/home_bg.jpg, the only 2:1 landscape frame the business owns. It was
 * already in the image manifest and already the og:image / twitter:image / JSON-LD image
 * (index.html), but no page rendered it. So the picture people see when the site is shared is
 * now also the picture that closes it.
 *
 * No pin. Protocol owns the page's single pinned section, and a second one would mean two
 * pin-spacers to remeasure on every ScrollTrigger.refresh().
 */
export default function Statement() {
    const containerRef = useRef(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            gsap.to('.statement-bg', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
                y: 100,
                ease: 'none',
            });

            // gsap.from, never gsap.set-then-reveal. `from` ends at the visible state, so the
            // reduced-motion bail above simply leaves the content on screen. A set-to-hidden
            // would leave an empty 85svh band for anyone who asked for less motion.
            gsap.from('.statement-cta', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 70%',
                },
                y: 30,
                opacity: 0,
                duration: 1,
                stagger: 0.12,
                ease: 'power3.out',
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            id="statement"
            ref={containerRef}
            className="relative w-full min-h-[85svh] flex items-center justify-center overflow-hidden bg-obsidian py-24"
        >
            <div className="statement-bg absolute inset-y-[-10%] inset-x-0 z-0">
                <Img
                    src="/assets/home_bg.jpg"
                    sizes="100vw"
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover opacity-45 mix-blend-luminosity"
                />
            </div>
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-obsidian via-obsidian/70 to-obsidian/85" />
            <FloatingParticles count={10} className="opacity-50" />

            <div className="relative z-10 w-full max-w-4xl px-6 sm:px-12 flex flex-col items-center text-center gap-8">

                <h2 className="font-drama italic text-[2.5rem] sm:text-5xl lg:text-7xl leading-[1.05]">
                    <span className="block text-ivory/45">
                        <SplitText type="words" triggerStart="top 80%">
                            Manche sehen ein Auto.
                        </SplitText>
                    </span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-br from-ivory via-ivory/95 to-ivory/70">
                        <SplitText type="words" triggerStart="top 80%" delay={0.3}>
                            Sie sehen Ihres.
                        </SplitText>
                    </span>
                </h2>

                <p className="statement-cta font-sans text-base sm:text-lg text-ivory/60 max-w-xl leading-relaxed">
                    Deshalb behandeln wir jedes Fahrzeug so, als wäre es unser eigenes.
                </p>

                <div className="statement-cta flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-2">
                    <Link
                        to="/buchen"
                        className="btn-magnetic bg-accent text-obsidian px-10 py-4 sm:py-5 rounded-full font-sans font-black tracking-wide text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Jetzt Buchen
                    </Link>
                    <a
                        href="tel:+436642546078"
                        className="font-sans text-sm sm:text-base text-ivory/60 hover:text-ivory transition-colors link-lift"
                    >
                        Oder rufen Sie uns an — +43 664 2546078
                    </a>
                </div>

                {/* Moved here from the Manifest section. It is real footage of real work, and
                    this is the page's cinematic beat — it belongs at the close, not in the
                    middle of the argument. Two-click pattern kept: the poster stands in until
                    the visitor asks for the player, so YouTube is never contacted otherwise. */}
                <div className="statement-cta w-full max-w-3xl aspect-video rounded-[2rem] overflow-hidden shadow-2xl border border-slate/40 bg-obsidian mt-4">
                    {playing ? (
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
                            title="Elite Auto Aufbereitung Showcase"
                            className="w-full h-full"
                            style={{ border: 'none' }}
                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                            allowFullScreen
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setPlaying(true)}
                            aria-label="Video abspielen: Elite Auto Aufbereitung Showcase"
                            className="group relative block w-full h-full"
                        >
                            <Img
                                src="/assets/video-poster.jpg"
                                sizes="(min-width: 1024px) 50vw, 100vw"
                                alt="Elite Auto Aufbereitung Showcase"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                            <span className="absolute inset-0 bg-obsidian/30 group-hover:bg-obsidian/40 transition-colors flex items-center justify-center">
                                <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-ivory/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                                    <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8 text-obsidian translate-x-0.5" fill="currentColor">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </span>
                            </span>
                        </button>
                    )}
                </div>

            </div>
        </section>
    );
}
