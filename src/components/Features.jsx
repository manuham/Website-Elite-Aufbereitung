import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Droplets, ShieldCheck, CalendarCheck } from 'lucide-react';

export default function Features() {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.feature-card', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 75%',
                },
                y: 60,
                opacity: 0,
                duration: 1,
                stagger: 0.15,
                ease: 'power3.out'
            });
            gsap.from('.feature-header', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 85%',
                },
                y: 30,
                opacity: 0,
                duration: 1,
                ease: 'power3.out'
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
            image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80',
        },
        {
            icon: ShieldCheck,
            title: 'Keramik-Schutzschild',
            description: 'FIREBALL Keramikversiegelung mit bis zu 5 Jahren Garantie. Extremer Glanz, wasser- und schmutzabweisend, UV-Schutz — Ihr Lack bleibt makellos.',
            highlights: ['Bis zu 5 Jahre Schutz', 'Hydrophobe Oberfläche', 'UV-Beständig'],
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
        <section id="features" ref={containerRef} className="py-24 sm:py-32 px-6 sm:px-12 lg:px-24 bg-background relative z-10">
            <div className="max-w-7xl mx-auto flex flex-col gap-16">

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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div key={feature.title} className="feature-card rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate/50 hover:border-accent/40 transition-colors group">

                                {/* Image area */}
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={feature.image}
                                        alt={feature.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/20" />

                                    {/* Icon + highlights overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
                                        <div className="w-16 h-16 rounded-2xl bg-obsidian/60 backdrop-blur-sm border border-accent/30 flex items-center justify-center group-hover:bg-accent/20 group-hover:border-accent/50 transition-all duration-300">
                                            <Icon className="w-8 h-8 text-accent" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-2 px-4">
                                            {feature.highlights.map((h) => (
                                                <span key={h} className="font-mono text-[10px] text-ivory/70 bg-obsidian/50 backdrop-blur-sm border border-ivory/10 rounded-full px-3 py-1">
                                                    {h}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Text area */}
                                <div className="flex flex-col gap-3 p-8 bg-slate/30">
                                    <h4 className="font-sans font-bold text-xl text-ivory group-hover:text-accent transition-colors">{feature.title}</h4>
                                    <p className="font-sans text-sm text-ivory/60 leading-relaxed text-balance">
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
