import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Truck, Sparkles } from 'lucide-react';

export default function Hero() {
    const containerRef = useRef(null);
    const bgRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero-element', {
                y: 50,
                opacity: 0,
                duration: 1.2,
                stagger: 0.1,
                ease: 'power4.out',
                delay: 0.2
            });
            
            gsap.to(bgRef.current, {
                scale: 1.15,
                duration: 25,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const scrollToServices = () => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section ref={containerRef} className="relative h-[100dvh] w-full flex flex-col justify-end pb-24 sm:pb-32 px-6 sm:px-12 lg:px-24">
            {/* Background Image & Animated Blobs */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-obsidian pointer-events-none">
                <img
                    ref={bgRef}
                    src="/assets/home_bg.jpg"
                    alt="Dark luxury car detailing"
                    className="w-full h-full object-cover opacity-60 mix-blend-luminosity will-change-transform scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/90 to-obsidian/30" />
                
                {/* Animated Foam/Gloss Orbs (Apple-style abstract blobs) */}
                <div className="absolute inset-0 overflow-hidden mix-blend-screen opacity-60">
                    <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] sm:w-[800px] sm:h-[800px] bg-accent/20 rounded-full filter blur-[100px] sm:blur-[140px] animate-blob" />
                    <div className="absolute top-[20%] -right-[10%] w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-sky-500/10 rounded-full filter blur-[90px] animate-blob" style={{ animationDelay: '2s' }} />
                    <div className="absolute -bottom-[20%] left-[20%] w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] bg-accent-glow/10 rounded-full filter blur-[120px] animate-blob" style={{ animationDelay: '4s' }} />
                </div>
            </div>

            {/* Content Content pushed to bottom-left third */}
            <div className="relative z-10 w-full max-w-3xl flex flex-col items-start gap-6">
                <div className="flex flex-col relative w-full">
                    <h1 className="hero-element font-sans font-extrabold text-3xl sm:text-5xl lg:text-6xl text-ivory tracking-tight mb-0 sm:mb-1 text-balance">
                        Perfektion trifft
                    </h1>
                    <h2 className="hero-element font-drama italic text-[4rem] sm:text-7xl lg:text-[8rem] leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-ivory via-champagne to-ivory drop-shadow-2xl pr-4 relative">
                        Präzision.
                        {/* Inner glowing aura for the text */}
                        <div className="absolute inset-0 bg-champagne/20 blur-3xl opacity-40 mix-blend-screen pointer-events-none" />
                    </h2>
                </div>

                <p className="hero-element font-sans font-normal text-lg sm:text-xl text-ivory/90 max-w-xl leading-relaxed text-balance drop-shadow-md">
                    Professionelle Fahrzeugaufbereitung in Vorarlberg — Kratzerfreie Handwäsche, Politur & Keramikversiegelung.
                </p>

                <div className="hero-element flex items-center gap-2 mt-2 mb-1">
                    <Link to="/mobiler-service" className="bg-champagne/90 text-obsidian px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-sans text-[13px] sm:text-[14px] font-bold tracking-wide inline-flex items-center gap-2 sm:gap-3 shadow-[0_0_20px_rgba(77,178,146,0.3)] hover:shadow-[0_0_30px_rgba(77,178,146,0.6)] animate-pulse hover:scale-[1.02] transition-all duration-300">
                        <span className="bg-obsidian text-champagne px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest font-black">NEU</span>
                        <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                        Jetzt auch mobil — wir kommen zu Ihnen!
                    </Link>
                </div>

                <div className="hero-element flex flex-col sm:flex-row items-stretch sm:items-center gap-5 sm:gap-6 mt-8 w-full sm:w-auto">
                    <Link
                        to="/buchen"
                        className="btn-magnetic relative overflow-hidden group bg-accent backdrop-blur-md border border-accent/50 text-obsidian px-10 py-4 sm:py-5 rounded-full font-sans font-black tracking-wide text-base sm:text-lg shadow-[0_0_30px_rgba(77,178,146,0.5)] hover:shadow-[0_0_50px_rgba(77,178,146,0.8)] text-center w-full sm:w-auto transition-all duration-500"
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
