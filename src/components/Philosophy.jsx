import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
const stats = [
    { value: '500+', label: 'Fahrzeuge aufbereitet' },
    { value: '60k', label: 'km Keramik-Garantie' },
    { value: '100%', label: 'Kundenzufriedenheit' },
];

export default function Philosophy() {
    const containerRef = useRef(null);
    const textRef = useRef(null);

    useEffect(() => {
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

            gsap.from('.stat-item', {
                scrollTrigger: {
                    trigger: '.stats-row',
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
        <section id="philosophy" ref={containerRef} className="relative w-full py-24 sm:py-36 overflow-hidden bg-obsidian">

            {/* Parallax background texture */}
            <div className="absolute inset-0 z-0">
                <div className="parallax-bg absolute -top-[10vh] left-0 w-full h-[120vh]">
                    <img
                        src="/assets/ueberuns-background.jpg"
                        alt="Elite Aufbereitung Hintergrund"
                        className="w-full h-full object-cover opacity-15 mix-blend-luminosity"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-transparent to-obsidian" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 flex flex-col gap-20" ref={textRef}>

                {/* Manifesto Block */}
                <div className="flex flex-col gap-6 max-w-3xl">
                    <p className="reveal-text font-sans text-base sm:text-lg text-ivory/50 tracking-wide">
                        Die meisten Autowäschen setzen auf Geschwindigkeit und Masse.
                    </p>
                    <h2 className="reveal-text font-drama italic text-[2.5rem] leading-[1.1] sm:text-5xl lg:text-6xl text-ivory">
                        Wir setzen auf{' '}
                        <span className="text-champagne">Perfektion</span>{' '}
                        und{' '}
                        <span className="text-champagne">Leidenschaft.</span>
                    </h2>
                    <p className="reveal-text font-sans text-base text-ivory/60 max-w-xl leading-relaxed">
                        Mit Liebe zum Detail und höchstem Qualitätsanspruch setzen wir alles daran,
                        jedes Auto in neuem Glanz erstrahlen zu lassen.
                        Vertrauen Sie uns Ihr Fahrzeug an — und erleben Sie den Unterschied.
                    </p>
                    <Link
                        to="/buchen"
                        className="reveal-text mt-2 inline-block btn-magnetic bg-champagne text-obsidian px-8 py-3.5 rounded-full font-sans font-bold text-sm shadow-[0_0_20px_rgba(77,178,146,0.25)] w-fit whitespace-nowrap"
                    >
                        Jetzt Buchen
                    </Link>
                </div>

                {/* Stats Row */}
                <div className="stats-row grid grid-cols-3 gap-6 sm:gap-12 max-w-2xl">
                    {stats.map((s) => (
                        <div key={s.label} className="stat-item flex flex-col gap-1">
                            <span className="font-mono text-3xl sm:text-4xl font-bold text-champagne">{s.value}</span>
                            <span className="font-sans text-xs sm:text-sm text-ivory/80 leading-snug">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Showcase Video */}
                <div className="reveal-text w-full max-w-4xl aspect-video rounded-[2rem] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-slate/40 bg-obsidian">
                    <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/Oimr36RdIx4"
                        title="Elite Auto Aufbereitung Showcase"
                        style={{ border: 'none' }}
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        className="w-full h-full"
                    />
                </div>

            </div>
        </section>
    );
}
