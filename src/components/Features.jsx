import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Droplets, ShieldCheck, CalendarCheck } from 'lucide-react';

export default function Features() {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Ensure positions are fresh after mount
        ScrollTrigger.refresh();

        const ctx = gsap.context(() => {
            gsap.fromTo('.feature-card',
                { y: 60, opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: 'top 80%',
                    },
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    stagger: 0.15,
                    ease: 'power3.out',
                    clearProps: 'all',
                }
            );
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
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const features = [
        {
            icon: Droplets,
            title: 'Kratzerfreie Präzisionswäsche',
            description: 'Jedes Fahrzeug wird mit professioneller 2-Eimer-Methode und kontaktloser Vorwäsche behandelt — für eine absolut kratzfreie Reinigung, die Waschstraßen niemals erreichen.',
            highlights: ['2-Eimer Methode', 'Kontaktlose Vorwäsche', 'pH-neutrale Produkte'],
            image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
        },
        {
            icon: ShieldCheck,
            title: 'Keramik-Schutzschild',
            description: 'FIREBALL Keramikversiegelung mit 40.000 – 60.000 km Garantie. Extremer Glanz, wasser- und schmutzabweisend, UV-Schutz — Ihr Lack bleibt makellos.',
            highlights: ['40.000 – 60.000 km Schutz', 'Hydrophobe Oberfläche', 'UV-Beständig'],
            image: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800&q=80',
        },
        {
            icon: CalendarCheck,
            title: 'Termin in 60 Sekunden',
            description: 'Online-Terminbuchung in Sekunden. Wählen Sie Ihr Paket und Ihren Wunschtermin — wir kümmern uns um den Rest.',
            highlights: ['Online buchen', 'Flexible Zeiten', 'Mo–Sa geöffnet'],
            image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
        },
    ];

    return (
        <section id="features" ref={containerRef} className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 xl:px-16 bg-background relative z-10">
            <div className="mx-auto flex flex-col gap-16">

                <div className="feature-header flex flex-col gap-2 items-center text-center">
                    <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest">
                        Warum Elité?
                    </h3>
                    <h2 className="font-drama italic text-[2.5rem] leading-[1.1] sm:text-5xl text-ivory">
                        Der Unterschied liegt im{' '}
                        <span className="text-accent relative inline-block">
                            Detail.
                            <span className="absolute bottom-1 left-0 w-full h-px bg-accent scale-x-100 origin-left" />
                        </span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div key={feature.title} className="feature-card glass-panel rounded-[2rem] flex flex-col overflow-hidden group hover:shadow-[0_0_50px_rgba(77,178,146,0.25)] transition-all duration-500">
                                {/* Image area */}
                                <div className="relative h-72 lg:h-80 overflow-hidden">
                                    <div className="absolute inset-0 bg-accent/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                    <img
                                        src={feature.image}
                                        alt={feature.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent z-10" />

                                    {/* Icon + highlights overlay */}
                                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end gap-5 pb-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center group-hover:bg-accent/30 group-hover:border-accent/40 group-hover:scale-110 transition-all duration-500 p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                                            <Icon className="w-10 h-10 text-ivory group-hover:text-accent drop-shadow-lg transition-colors duration-500" strokeWidth={1.5} />
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
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
