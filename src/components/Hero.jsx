import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Truck, Sparkles } from 'lucide-react';
import FloatingParticles from './FloatingParticles';

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

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hide entrance elements until the preloader has lifted (see entrance effect below)
            gsap.set('.hero-badge', { scale: 0, opacity: 0 });
            gsap.set('.hero-fade', { y: 40, opacity: 0 });

            // Background breathing — base zoom keeps the van large in frame,
            // origin sits on the van (right-of-center, lower half)
            gsap.fromTo(bgRef.current,
                { scale: 1.12, transformOrigin: '60% 65%' },
                {
                    scale: 1.24,
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

    const scrollToServices = () => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section ref={containerRef} className="relative h-[100dvh] w-full flex flex-col justify-end pb-28 sm:pb-36 lg:pb-44 px-6 sm:px-12 lg:px-24">
            {/* Background Image — depth layer (slowest parallax) */}
            <div className="hero-bg-layer absolute inset-0 z-0 overflow-hidden bg-obsidian pointer-events-none will-change-transform">
                <img
                    ref={bgRef}
                    src="/assets/VAN/VAN.png"
                    alt="Elite Aufbereitung mobiler Service Van"
                    className="w-full h-full object-cover object-[center_60%] opacity-70 mix-blend-luminosity brightness-110 contrast-105 will-change-transform"
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

            {/* Animated Blobs — mid-depth layer (medium parallax) */}
            <div className="hero-blob-layer absolute inset-0 z-[1] overflow-hidden pointer-events-none will-change-transform">
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

                <div className="flex flex-col relative w-full -mt-1">
                    <h1 className="hero-fade font-drama italic text-2xl sm:text-4xl lg:text-5xl text-ivory/75 leading-tight mb-0">
                        Perfektion trifft
                    </h1>
                    <p className="hero-fade font-drama italic text-[5.5rem] sm:text-[8rem] lg:text-[10rem] xl:text-[12rem] leading-[0.88] text-transparent bg-clip-text bg-gradient-to-br from-ivory via-ivory/95 to-ivory/70 drop-shadow-2xl -ml-1">
                        Präzision.
                    </p>
                </div>

                <p className="hero-fade font-sans font-normal text-lg sm:text-xl text-ivory/90 max-w-xl leading-relaxed text-balance drop-shadow-md">
                    Professionelle Fahrzeugaufbereitung in Vorarlberg — Kratzerfreie Handwäsche, Politur & Keramikversiegelung.
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

                    <button
                        onClick={scrollToServices}
                        className="group flex items-center justify-center gap-2 font-sans font-medium text-ivory/90 hover:text-ivory transition-colors link-lift w-full sm:w-auto py-3 sm:py-0"
                    >
                        Unsere Leistungen
                        <span className="group-hover:translate-x-1 transition-transform duration-300 inline-block translate-y-[1px]">→</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
