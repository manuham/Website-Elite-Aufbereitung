import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitText from './SplitText';
import FloatingParticles from './FloatingParticles';

gsap.registerPlugin(ScrollTrigger);

export default function Protocol() {
    const containerRef = useRef(null);

    const steps = [
        {
            num: "01",
            title: "Reinigung & Dekontamination",
            desc: "Kontaktlose Vorwäsche, sichere 2-Eimer-Handwäsche, Teer- und Flugrost-Entfernung. Die Grundlage für jede weitere Behandlung.",
            image: "/assets/Außenreinigung/P1334438.jpg",
        },
        {
            num: "02",
            title: "Politur & Lackkorrektur",
            desc: "Mehrstufiges Maschinenpolieren entfernt Kratzer, Hologramme und Oxidation. Ihr Lack erhält seinen ursprünglichen Tiefenglanz zurück.",
            image: "/assets/Außenreinigung/P1334780.jpg",
        },
        {
            num: "03",
            title: "Versiegelung & Schutz",
            desc: "FIREBALL Keramikversiegelung bildet eine unsichtbare Schutzschicht: wasserabweisend, UV-beständig und bis zu 40.000 – 60.000 km haltbar.",
            image: "/assets/Produkte/P1345294-2.jpg",
        }
    ];

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Protocol header — horizontal slide in, reversible
            gsap.fromTo('.protocol-header',
                { x: -60, opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: '.protocol-header',
                        start: 'top 85%',
                        toggleActions: 'play reverse play reverse',
                    },
                    x: 0,
                    opacity: 1,
                    duration: 1,
                    ease: 'power3.out',
                }
            );

            const cards = gsap.utils.toArray('.protocol-card');

            cards.forEach((card, i) => {
                // Pin each card so they stack
                ScrollTrigger.create({
                    trigger: card,
                    start: 'top top',
                    pin: true,
                    pinSpacing: false,
                    endTrigger: containerRef.current,
                    end: 'bottom bottom',
                });

                // Shrink/blur previous cards as next card scrolls over (scrub = fully reversible)
                if (i < cards.length - 1) {
                    gsap.fromTo(card.querySelector('.card-content'),
                        { scale: 1, opacity: 1, filter: 'blur(0px)' },
                        {
                            scale: 0.92,
                            opacity: 0.4,
                            filter: 'blur(8px)',
                            scrollTrigger: {
                                trigger: cards[i + 1],
                                start: 'top bottom',
                                end: 'top top',
                                scrub: true,
                            },
                        }
                    );
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="protocol" ref={containerRef} className="relative w-full bg-slate pb-[10vh]">
            <FloatingParticles count={12} className="opacity-40" />

            {/* Intro Header */}
            <div className="protocol-header w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-32 pb-12">
                <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest mb-4">Unser Prozess</h3>
                <h2 className="font-drama italic text-[2.5rem] sm:text-5xl lg:text-6xl leading-[1.1] text-ivory max-w-2xl pb-4">
                    <SplitText type="words" triggerStart="top 85%">
                        Drei Schritte zum
                    </SplitText>{' '}
                    <span className="text-champagne">
                        <SplitText type="chars" triggerStart="top 85%" delay={0.2}>
                            perfekten Ergebnis.
                        </SplitText>
                    </span>
                </h2>
            </div>

            {/* Stacking Cards */}
            <div className="relative w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
                {steps.map((step, i) => (
                    <div key={i} className="protocol-card w-full h-screen flex items-center justify-center top-0">
                        <div className="card-content w-full h-[85vh] sm:h-[70vh] max-h-[650px] bg-obsidian rounded-[2rem] sm:rounded-[3rem] border border-slate/50 shadow-2xl flex flex-col md:flex-row overflow-hidden relative group">

                            {/* Text Content */}
                            <div className="flex-1 flex flex-col gap-4 sm:gap-6 justify-center p-6 sm:p-14 lg:p-16 relative z-10">
                                <div className="font-mono text-lg sm:text-2xl text-champagne">{step.num}</div>
                                <h3 className="font-drama italic text-2xl sm:text-4xl lg:text-5xl text-ivory leading-tight">{step.title}</h3>
                                <p className="font-sans text-sm sm:text-lg text-ivory/60 max-w-lg leading-relaxed text-balance">
                                    {step.desc}
                                </p>
                            </div>

                            {/* Image */}
                            <div className="flex-1 w-full min-h-[200px] md:h-full relative overflow-hidden">
                                <img
                                    src={step.image}
                                    alt={step.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/40 to-transparent hidden md:block" />
                                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent md:hidden" />
                            </div>

                        </div>
                    </div>
                ))}
            </div>

        </section>
    );
}
