import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Truck, Sparkles } from 'lucide-react';
import FloatingParticles from './FloatingParticles';
import Img from './Img';
import useIsomorphicLayoutEffect from '../hooks/useIsomorphicLayoutEffect';
import { prefersReducedMotion } from '../lib/motion';

export default function Hero({ entranceReady = true }) {
    const containerRef = useRef(null);
    const bgRef = useRef(null);

    // Mouse-reactive parallax — hero layers shift toward cursor
    useEffect(() => {
        if ('ontouchstart' in window) return;
        const container = containerRef.current;
        if (!container) return;

        const bg = container.querySelector('.hero-bg-layer');
        const blobs = container.querySelector('.hero-blob-layer');
        const content = container.querySelector('.hero-content-layer');

        // Only animate X to avoid conflict with scroll-triggered Y parallax
        const moveBgX = gsap.quickTo(bg, 'x', { duration: 0.8, ease: 'power2.out' });
        const moveBlobsX = gsap.quickTo(blobs, 'x', { duration: 0.6, ease: 'power2.out' });
        const moveContentX = gsap.quickTo(content, 'x', { duration: 0.4, ease: 'power2.out' });

        const onMouseMove = (e) => {
            const cx = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 to 1

            moveBgX(cx * -10);       // background: opposite, subtle
            moveBlobsX(cx * -18);    // blobs: more movement
            moveContentX(cx * 8);    // content: follows slightly
        };

        container.addEventListener('mousemove', onMouseMove);
        return () => container.removeEventListener('mousemove', onMouseMove);
    }, []);

    // Layout effect, not an ordinary one: the homepage is prerendered, so the hero text is already
    // in the HTML and painted before React runs. Hiding it after paint would flash it.
    useIsomorphicLayoutEffect(() => {
        // The two gsap.set calls below are the only place on the site that hides content
        // outright rather than revealing it. With reduced motion we must not run them at all —
        // the matching entrance tween is skipped too, so anything hidden here would stay
        // hidden and the hero would be an empty full-height band.
        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            // Hide entrance elements until the preloader has lifted (see entrance effect below)
            gsap.set('.hero-badge', { scale: 0, opacity: 0 });
            gsap.set('.hero-fade', { y: 40, opacity: 0 });

            // Background breathing — kept subtle: on wide viewports the visible band
            // of the portrait photo barely fits the whole van, so a strong zoom
            // crops it down to wheels/grille
            gsap.fromTo(bgRef.current,
                { scale: 1.02, transformOrigin: '55% 48%' },
                {
                    scale: 1.09,
                    duration: 25,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut',
                }
            );

            // --- Depth layers: multi-speed scroll parallax ---
            // Background image: moves slowest (0.3x)
            gsap.to('.hero-bg-layer', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                },
                y: 200,
                ease: 'none',
            });

            // Blobs: mid-speed (0.5x)
            gsap.to('.hero-blob-layer', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                },
                y: 120,
                ease: 'none',
            });

            // Content: scrolls normally but fades out
            gsap.to('.hero-content-layer', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: '60% top',
                    scrub: true,
                },
                y: -60,
                opacity: 0,
                ease: 'none',
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Entrance — gated on the preloader finishing so the animation isn't
    // played invisibly behind the preloader overlay on first visit
    useEffect(() => {
        if (!entranceReady) return;
        // Paired with the guard on the set-up effect above: nothing was hidden, so there is
        // nothing to reveal.
        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            // Badge bounces in
            gsap.to('.hero-badge', {
                scale: 1,
                opacity: 1,
                duration: 0.6,
                ease: 'back.out(2)',
                delay: 0.3,
            });

            // Subtitle + locations + buttons stagger in
            gsap.to('.hero-fade', {
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.12,
                ease: 'power3.out',
                delay: 0.8,
            });
        }, containerRef);

        return () => ctx.revert();
    }, [entranceReady]);

    // The secondary CTA is <Link to="/#pricing"> now — a real, crawlable, copyable href.
    // HomePage's hash effect (src/App.jsx) owns the scroll, and it picks 'auto' over 'smooth'
    // under reduced motion. That also removes a wart: pricing sits several viewports down,
    // and a smooth scroll over that distance takes seconds and reads as a broken page.

    // The section clips: overflow-hidden keeps the two overscanned parallax layers below from
    // reaching page layout, rather than relying on body's overflow-x-hidden to mop up.
    return (
        <section ref={containerRef} className="relative h-[100dvh] w-full overflow-hidden flex flex-col justify-end pb-28 sm:pb-36 lg:pb-44 [@media(max-height:900px)]:!pb-24 px-6 sm:px-12 lg:px-24">
            {/* Background Image — depth layer (slowest parallax)

                Overscanned 16px a side. The mouse parallax shifts this whole layer up to ±10px, and
                at exactly inset-0 that uncovered a bare strip of the section behind it — a hard
                vertical band down one edge of the hero.

                The overscan must stay larger than the biggest translation in the mousemove handler
                above (currently 10). Deliberately px, not rem: the translation is in px, so a rem
                overscan would shrink below it on a browser with a smaller root font size and the
                band would come back as a hairline. */}
            <div className="hero-bg-layer absolute inset-y-0 -inset-x-[16px] z-0 overflow-hidden bg-obsidian pointer-events-none will-change-transform">
                {/* The ref lands on the inner <img> — that is the element GSAP scales in the
                    breathing tween above. */}
                <Img
                    ref={bgRef}
                    src="/assets/VAN/VAN.png"
                    sizes="100vw"
                    alt="Elite Aufbereitung mobiler Service Van"
                    className="w-full h-full object-cover object-[center_48%] opacity-70 mix-blend-luminosity brightness-110 contrast-105 will-change-transform"
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                />
                {/* Vertical: darken the sky/houses at the top, keep the van zone open, ground the bottom for text */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-obsidian/75" />
                {/* Horizontal: legibility behind the bottom-left headline while the van side stays bright */}
                <div className="absolute inset-0 bg-gradient-to-r from-obsidian/75 via-obsidian/25 to-transparent" />
            </div>

            {/* Floating dust particles */}
            <FloatingParticles count={15} className="z-[3] opacity-60" />

            {/* Animated Blobs — mid-depth layer (medium parallax)
                Overscanned by 28px a side. This layer moves ±18px and its own overflow-hidden was
                travelling with it, so the clip edge sliced the blurred blobs into a visible vertical
                line. Wider than the translation, so the cut always happens off-screen. */}
            <div className="hero-blob-layer absolute inset-y-0 -inset-x-[28px] z-[1] overflow-hidden pointer-events-none will-change-transform">
                <div className="absolute inset-0 mix-blend-screen opacity-30">
                    <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] sm:w-[800px] sm:h-[800px] bg-accent/20 rounded-full filter blur-[100px] sm:blur-[140px] animate-blob" />
                    <div className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-sky-500/10 rounded-full filter blur-[90px] animate-blob" style={{ animationDelay: '2s' }} />
                    <div className="absolute -bottom-[20%] left-[20%] w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] bg-accent-glow/10 rounded-full filter blur-[120px] animate-blob" style={{ animationDelay: '4s' }} />
                </div>
            </div>

            {/* Content — foreground layer (fades out on scroll) */}
            <div className="hero-content-layer relative z-10 w-full max-w-3xl flex flex-col items-start gap-4 will-change-transform">
                <div className="hero-badge">
                    <Link to="/mobiler-service" className="bg-emerald-500/90 text-obsidian px-5 py-2.5 sm:px-7 sm:py-3 rounded-full font-sans text-[13px] sm:text-[15px] font-bold tracking-wide inline-flex items-center gap-2 sm:gap-3 shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] hover:-translate-y-0.5 transition-all duration-300">
                        <span className="bg-obsidian text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] uppercase tracking-widest font-black animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]">NEU</span>
                        <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                        Jetzt auch mobil — wir kommen zu Ihnen!
                    </Link>
                </div>

                <div className="hero-fade flex items-center gap-3 w-full">
                    <div className="h-px flex-1 bg-accent/40 max-w-[2rem]" />
                    <span className="font-sans font-semibold text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-ivory/45">
                        Autoaufbereitung in Vorarlberg
                    </span>
                    <div className="h-px bg-accent/40 w-8" />
                </div>

                {/* One heading, two lines. The wrapper is the <h1> and each line is a <span>, so
                    „Mehr als eine schnelle Wäsche." reads as one sentence to a crawler and a
                    screen reader. Every class string is unchanged and both lines keep .hero-fade,
                    so the layout and the GSAP stagger are exactly what they were.

                    The belief this states in full — „Wir glauben, dass ein besonderes Auto mehr
                    verdient als eine schnelle Wäsche" — is 79 characters and cannot render at
                    12rem Playfair, so it lives in the paragraph below. What the headline keeps is
                    the half that only works big: the refusal.

                    The previous line („Perfektion trifft / Präzision.") carried no service term
                    and no location either — it was the builder.md hero pattern filled in — so
                    this costs nothing in search. The keyword load sits in the eyebrow above, the
                    paragraph below and the location chips, and all three stay. */}
                <h1 className="flex flex-col relative w-full -mt-1">
                    <span className="hero-fade font-drama italic text-2xl sm:text-4xl lg:text-5xl text-ivory/75 leading-tight mb-0">
                        Mehr als eine
                    </span>
                {/* „schnelle Wäsche." is 16 characters where „Präzision." was 10, so the old
                        3.5rem/12rem ramp wrapped it onto two lines at 390px. The hero is
                        h-[100dvh] with justify-end, so a taller block grows upward — straight
                        into the fixed navbar. Sized to fit on one line at 390px. */}
                    <span className="hero-fade font-drama italic text-[2.5rem] sm:text-[5rem] lg:text-[7rem] xl:text-[8.5rem] leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-ivory via-ivory/95 to-ivory/70 drop-shadow-2xl -ml-1">
                        schnelle Wäsche.
                    </span>
                </h1>

                <p className="hero-fade font-sans font-normal text-base sm:text-xl text-ivory/90 max-w-xl leading-relaxed text-balance drop-shadow-md">
                    Wir glauben, dass ein besonderes Auto mehr verdient als fünf Minuten und
                    rotierende Bürsten. Handwäsche, Politur und Keramikversiegelung in Vorarlberg.
                </p>

                <div className="hero-fade flex flex-wrap items-center gap-2 sm:gap-3">
                    {['Feldkirch', 'Nüziders', 'Mobiler Service'].map((loc) => (
                        <span key={loc} className="font-sans text-[11px] sm:text-xs font-semibold text-ivory/70 bg-ivory/5 border border-ivory/10 backdrop-blur-sm px-3 py-1.5 rounded-full tracking-wide">
                            {loc}
                        </span>
                    ))}
                </div>

                <div className="hero-fade flex flex-col sm:flex-row items-stretch sm:items-center gap-5 sm:gap-6 mt-8 w-full sm:w-auto">
                    <Link
                        to="/buchen"
                        className="btn-magnetic relative overflow-hidden group bg-accent backdrop-blur-md border border-accent/50 text-obsidian px-10 py-4 sm:py-5 rounded-full font-sans font-black tracking-wide text-base sm:text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 text-center w-full sm:w-auto transition-all duration-500"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            Jetzt Buchen
                            <Sparkles className="w-5 h-5 text-obsidian" />
                        </span>
                        {/* Shimmer sweep effect */}
                        <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                    </Link>

                    {/* Points at the work, not the price list. The argument on this page is
                        "look at what we do" before "here is what it costs" — and the price
                        list is still one click away in the navbar, which is fixed and always
                        on screen. */}
                    <Link
                        to="/#gallery"
                        className="group flex items-center justify-center gap-2 font-sans font-medium text-ivory/90 hover:text-ivory transition-colors link-lift w-full sm:w-auto py-3 sm:py-0"
                    >
                        Unsere Arbeit ansehen
                        <span className="group-hover:translate-x-1 transition-transform duration-300 inline-block translate-y-[1px]">→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
