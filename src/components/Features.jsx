import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Droplets, ShieldCheck, CalendarCheck } from 'lucide-react';
import SplitText from './SplitText';
import { useTilt } from '../hooks/useTilt';

function TiltCard({ children, className }) {
    const tiltRef = useTilt(6, 800, true);
    return (
        <div ref={tiltRef} className={className}>
            {children}
        </div>
    );
}

export default function Features() {
    const containerRef = useRef(null);
    const trackRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        ScrollTrigger.refresh();

        const ctx = gsap.context(() => {
            // Header entrance
            gsap.fromTo('.feature-header',
                { y: 30, opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top 90%',
                    },
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: 'power3.out',
                    clearProps: 'all',
                }
            );

            // Clip-path reveal for feature cards
            gsap.fromTo('.feature-card',
                { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top 80%',
                    },
                    clipPath: 'inset(0% 0 0 0)',
                    opacity: 1,
                    duration: 1.2,
                    stagger: 0.18,
                    ease: 'power4.out',
                    clearProps: 'clipPath',
                }
            );

            // --- Horizontal scroll on desktop (lg+) ---
            const mm = gsap.matchMedia();

            mm.add('(min-width: 1024px)', () => {
                const track = trackRef.current;
                if (!track) return;

                const getScrollAmount = () => track.scrollWidth - track.offsetWidth;

                if (getScrollAmount() <= 0) return;

                gsap.to(track, {
                    x: () => -getScrollAmount(),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top top',
                        end: () => `+=${getScrollAmount()}`,
                        pin: true,
                        scrub: 1,
                        invalidateOnRefresh: true,
                    },
                });
            });

            // Mobile: keep vertical parallax on images
            mm.add('(max-width: 1023px)', () => {
                gsap.utils.toArray('.feature-card-img').forEach(img => {
                    gsap.to(img, {
                        scrollTrigger: {
                            trigger: img.closest('.feature-card'),
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: true,
                        },
                        y: -40,
                        ease: 'none',
                    });
                });
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const features = [
        {
            icon: Droplets,
            title: 'Kratzerfreie Präzisionswäsche',
            description: 'Jedes Fahrzeug wird mit professioneller 2-Eimer-Methode und kontaktloser Vorwäsche behandelt — für eine absolut kratzfreie Reinigung, die Waschstraßen niemals erreichen.',
            highlights: ['2-Eimer Methode', 'Kontaktlose Vorwäsche', 'pH-neutrale Produkte'],
            image: '/assets/Außenreinigung/P1334323.jpg',
        },
        {
            icon: ShieldCheck,
            title: 'Keramik-Schutzschild',
            description: 'FIREBALL Keramikversiegelung mit 40.000 – 60.000 km Garantie. Extremer Glanz, wasser- und schmutzabweisend, UV-Schutz — Ihr Lack bleibt makellos.',
            highlights: ['40.000 – 60.000 km Schutz', 'Hydrophobe Oberfläche', 'UV-Beständig'],
            image: '/assets/Produkte/P1345270.jpg',
        },
        {
            icon: CalendarCheck,
            title: 'Termin in 60 Sekunden',
            description: 'Online-Terminbuchung in Sekunden. Wählen Sie Ihr Paket und Ihren Wunschtermin — wir kümmern uns um den Rest.',
            highlights: ['Online buchen', 'Flexible Zeiten', 'Mo–Sa geöffnet'],
            image: '/assets/Autos/IMG_2195.jpg',
        },
    ];

    return (
        <section id="features" ref={containerRef} className="bg-background relative z-10 overflow-hidden">
            {/* Header — always visible, not part of scroll track */}
            <div className="feature-header flex flex-col gap-2 items-center text-center pt-24 sm:pt-32 pb-12 px-4 sm:px-8 lg:px-12 xl:px-16">
                <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest">
                    Warum Elité?
                </h3>
                <h2 className="font-drama italic text-[2.5rem] leading-[1.1] sm:text-5xl text-ivory">
                    <SplitText type="words" triggerStart="top 85%">
                        Der Unterschied liegt im
                    </SplitText>{' '}
                    <span className="text-accent relative inline-block">
                        <SplitText type="chars" triggerStart="top 85%" delay={0.3}>
                            Detail.
                        </SplitText>
                        <span className="underline-draw bg-accent" />
                    </span>
                </h2>
            </div>

            {/* Cards — horizontal scroll track on lg, vertical grid on mobile */}
            <div
                ref={trackRef}
                className="grid grid-cols-1 gap-6 px-4 sm:px-8 pb-24 sm:pb-32
                           lg:flex lg:flex-nowrap lg:justify-center lg:gap-8 lg:px-12 xl:px-16 lg:pb-24"
                style={{ perspective: '800px' }}
            >
                {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                        <TiltCard
                            key={feature.title}
                            className="feature-card glass-panel rounded-[2rem] flex flex-col overflow-hidden group hover:shadow-2xl transition-shadow duration-500
                                       lg:min-w-[min(420px,80vw)] lg:max-w-[420px] lg:flex-shrink-0"
                        >
                            {/* Image area */}
                            <div className="relative h-72 lg:h-80 overflow-hidden">
                                <div className="absolute inset-0 bg-accent/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                <img
                                    src={feature.image}
                                    alt={feature.title}
                                    className="feature-card-img absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 will-change-transform"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent z-10" />

                                {/* Icon + highlights overlay */}
                                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end gap-5 pb-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center group-hover:bg-accent/30 group-hover:border-accent/40 group-hover:scale-110 transition-all duration-500 p-4 shadow-xl">
                                        <Icon className="w-10 h-10 text-ivory group-hover:text-accent drop-shadow-md transition-colors duration-500" strokeWidth={1.5} />
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 px-6">
                                        {feature.highlights.map((h, i) => (
                                            <span key={h} className="font-mono text-[10px] sm:text-[11px] text-ivory/90 glass-card px-4 py-1.5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0" style={{ transitionDelay: `${i * 75}ms` }}>
                                                {h}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Text area */}
                            <div className="flex flex-col gap-4 p-8 lg:p-10 relative z-20">
                                <h4 className="font-sans font-bold text-2xl lg:text-3xl text-ivory group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent group-hover:to-accent-glow transition-all duration-500">{feature.title}</h4>
                                <p className="font-sans text-sm lg:text-[15px] text-ivory/50 leading-relaxed text-balance group-hover:text-ivory/80 transition-colors duration-500">
                                    {feature.description}
                                </p>
                            </div>
                        </TiltCard>
                    );
                })}
            </div>
        </section>
    );
}
