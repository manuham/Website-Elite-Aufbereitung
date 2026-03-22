import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Truck } from 'lucide-react';

export default function Hero() {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero-element', {
                y: 40,
                opacity: 0,
                duration: 1,
                stagger: 0.08,
                ease: 'power3.out',
                delay: 0.2
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const scrollToServices = () => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section ref={containerRef} className="relative h-[100dvh] w-full flex flex-col justify-end pb-24 sm:pb-32 px-6 sm:px-12 lg:px-24">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/assets/home_bg.jpg"
                    alt="Dark luxury car detailing"
                    className="w-full h-full object-cover opacity-80 mix-blend-luminosity"
                />
                {/* Heavy primary-to-black gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-obsidian/20" />
            </div>

            {/* Content Content pushed to bottom-left third */}
            <div className="relative z-10 w-full max-w-3xl flex flex-col items-start gap-6">
                <div className="flex flex-col">
                    <h1 className="hero-element font-sans font-bold text-3xl sm:text-5xl lg:text-6xl text-ivory tracking-tight mb-1 sm:mb-2 text-balance">
                        Perfektion trifft
                    </h1>
                    <h2 className="hero-element font-drama italic text-[3.5rem] sm:text-6xl lg:text-[7rem] leading-[1.1] text-champagne pr-4">
                        Präzision.
                    </h2>
                </div>

                <p className="hero-element font-sans font-normal text-lg sm:text-xl text-ivory/90 max-w-xl leading-relaxed text-balance drop-shadow-md">
                    Professionelle Fahrzeugaufbereitung in Vorarlberg — Kratzerfreie Handwäsche, Politur & Keramikversiegelung.
                </p>

                <div className="hero-element flex items-center gap-2 mt-3 mb-2">
                    <Link to="/buchen?service=mobil" className="bg-gradient-to-r from-champagne to-[#2ce09a] text-obsidian px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-sans text-[15px] sm:text-[17px] font-black tracking-tight inline-flex items-center gap-2 sm:gap-3 shadow-[0_0_40px_rgba(77,178,146,0.7)] hover:shadow-[0_0_60px_rgba(77,178,146,1)] animate-[pulse_2s_ease-in-out_infinite] hover:scale-[1.03] transition-all duration-300">
                        <span className="bg-obsidian text-[#2ce09a] px-3 py-1 rounded-full text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold">NEU</span>
                        <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
                        Jetzt auch mobil — wir kommen zu Ihnen!
                    </Link>
                </div>

                <div className="hero-element flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 mt-6 w-full sm:w-auto">
                    <Link
                        to="/buchen"
                        className="btn-magnetic bg-champagne text-obsidian px-8 py-4 rounded-full font-sans font-bold text-base shadow-[0_0_20px_rgba(77,178,146,0.3)] text-center w-full sm:w-auto"
                    >
                        Jetzt Buchen
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
