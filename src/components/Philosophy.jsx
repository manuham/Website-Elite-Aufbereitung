import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitText from './SplitText';
const stats = [
    { value: '500+', label: 'Fahrzeuge aufbereitet' },
    { value: '60k', label: 'km Keramik-Garantie' },
    { value: '100%', label: 'Kundenzufriedenheit' },
];

const YOUTUBE_VIDEO_ID = 'QrwdgrPwF4c';

export default function Philosophy() {
    const containerRef = useRef(null);
    const textRef = useRef(null);
    const [thumbnailFailed, setThumbnailFailed] = useState(false);

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

            // Stat items fade in
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

            // Number counter animation — counts up from 0
            const counters = containerRef.current.querySelectorAll('.stat-counter');
            counters.forEach(el => {
                const target = el.getAttribute('data-target');
                const isK = target.includes('k');
                const isPercent = target.includes('%');
                const numericTarget = parseInt(target.replace(/[^0-9]/g, ''));
                const suffix = target.replace(/[0-9]/g, '');

                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 85%',
                    once: true,
                    onEnter: () => {
                        const proxy = { val: 0 };
                        gsap.to(proxy, {
                            val: numericTarget,
                            duration: 2,
                            ease: 'power2.out',
                            onUpdate: () => {
                                el.textContent = Math.round(proxy.val) + suffix;
                            }
                        });
                    }
                });
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
                        src="/assets/Außenreinigung/P1334666.jpg"
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
                        <SplitText type="words" triggerStart="top 80%">
                            Wir setzen auf
                        </SplitText>{' '}
                        <SplitText
                            className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-glow"
                            type="chars" triggerStart="top 80%" delay={0.2}
                            animation="clipReveal"
                        >
                            Perfektion
                        </SplitText>{' '}
                        <SplitText type="words" triggerStart="top 80%" delay={0.3}>
                            und
                        </SplitText>{' '}
                        <SplitText
                            className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-glow"
                            type="chars" triggerStart="top 80%" delay={0.4}
                            animation="clipReveal"
                        >
                            Leidenschaft.
                        </SplitText>
                    </h2>
                    <p className="reveal-text font-sans text-base text-ivory/60 max-w-xl leading-relaxed">
                        Mit Liebe zum Detail und höchstem Qualitätsanspruch setzen wir alles daran,
                        jedes Auto in neuem Glanz erstrahlen zu lassen.
                        Vertrauen Sie uns Ihr Fahrzeug an — und erleben Sie den Unterschied.
                    </p>
                    <Link
                        to="/buchen"
                        className="reveal-text mt-4 inline-flex items-center gap-3 btn-magnetic glass-card hover:bg-ivory hover:text-obsidian text-ivory px-10 py-4 sm:py-5 rounded-full font-sans font-black tracking-wide text-sm sm:text-base shadow-lg hover:shadow-xl w-fit transition-all duration-300 group"
                    >
                        Jetzt Buchen
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>

                {/* Stats Row */}
                <div className="stats-row grid grid-cols-3 gap-6 sm:gap-12 max-w-2xl">
                    {stats.map((s) => (
                        <div key={s.label} className="stat-item flex flex-col gap-1">
                            <span className="stat-counter font-mono text-3xl sm:text-4xl font-bold text-champagne" data-target={s.value}>0</span>
                            <span className="font-sans text-xs sm:text-sm text-ivory/80 leading-snug">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Showcase Video */}
                <div className="reveal-text flex flex-col gap-3 w-full max-w-4xl">
                    <a
                        href={`https://www.youtube.com/watch?v=${YOUTUBE_VIDEO_ID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Video ansehen: Elite Auto Aufbereitung Showcase (öffnet auf YouTube)"
                        className="group relative block w-full aspect-video rounded-[2rem] overflow-hidden shadow-2xl border border-slate/40 bg-obsidian"
                    >
                        {!thumbnailFailed && (
                            <img
                                src={`https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`}
                                alt="Elite Auto Aufbereitung Showcase"
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={() => setThumbnailFailed(true)}
                            />
                        )}
                        <div className="absolute inset-0 bg-obsidian/30 group-hover:bg-obsidian/40 transition-colors flex items-center justify-center">
                            <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-ivory/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                                <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8 text-obsidian translate-x-0.5" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </span>
                        </div>
                    </a>
                    <span className="text-xs text-ivory/40">
                        Öffnet auf YouTube in einem neuen Tab
                    </span>
                </div>

            </div>
        </section>
    );
}
