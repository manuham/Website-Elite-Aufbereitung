import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Truck, Sparkles } from 'lucide-react';
import SplitText from './SplitText';
import FloatingParticles from './FloatingParticles';

export default function Hero() {
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
            // Badge bounces in
            gsap.from('.hero-badge', {
                scale: 0,
                opacity: 0,
                duration: 0.6,
                ease: 'back.out(2)',
                delay: 0.3,
            });

            // Subtitle + locations + buttons stagger in with clip-path
            gsap.from('.hero-fade', {
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.12,
                ease: 'power3.out',
                delay: 0.8,
            });

            // Background breathing
            gsap.to(bgRef.current, {
                scale: 1.15,
                duration: 25,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

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

    const scrollToServices = () => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section ref={containerRef} className="relative h-[100dvh] w-full flex flex-col justify-end pb-24 sm:pb-32 px-6 sm:px-12 lg:px-24">
            {/* Background Image — depth layer (slowest parallax) */}
            <div className="hero-bg-layer absolute inset-0 z-0 overflow-hidden bg-obsidian pointer-events-none will-change-transform">
                <img
                    ref={bgRef}
                    src="/assets/VAN/VAN.png"
                    alt="Elite Aufbereitung mobiler Service Van"
                    className="w-full h-full object-cover opacity-60 mix-blend-luminosity will-change-transform scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/90 to-obsidian/30" />
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
            <div className="hero-content-layer relative z-10 w-full max-w-3xl flex flex-col items-start gap-6 will-change-transform">
                <div className="hero-badge">
                    <Link to="/mobiler-service" className="bg-emerald-500/90 text-obsidian px-5 py-2.5 sm:px-7 sm:py-3 rounded-full font-sans text-[13px] sm:text-[15px] font-bold tracking-wide inline-flex items-center gap-2 sm:gap-3 shadow-[0_0_20px_rgba(16,185,129,0.6)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] hover:-translate-y-0.5 transition-all duration-300">
                        <span className="bg-obsidian text-emerald-400 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] uppercase tracking-widest font-black animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]">NEU</span>
                        <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                        Jetzt auch mobil — wir kommen zu Ihnen!
                    </Link>
                </div>

                <div className="flex flex-col relative w-full">
                    <SplitText
                        as="h1"
                        className="font-sans font-extrabold text-3xl sm:text-5xl lg:text-6xl text-ivory tracking-tight mb-0 sm:mb-1 text-balance"
                        type="words"
                        trigger="load"
                        delay={0.4}
                        duration={1}
                        animation="slideUp"
                    >
                        Perfektion trifft
                    </SplitText>
                    <SplitText
                        as="h2"
                        className="font-drama italic text-[2.75rem] sm:text-7xl lg:text-[8rem] leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-ivory via-champagne to-ivory drop-shadow-2xl pr-4 relative"
                        type="chars"
                        trigger="load"
                        delay={0.6}
                        duration={0.9}
                        stagger={0.04}
                        animation="slideUp"
                    >
                        Präzision.
                    </SplitText>
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
