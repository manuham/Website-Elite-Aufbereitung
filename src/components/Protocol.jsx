import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Protocol() {
    const containerRef = useRef(null);

    const steps = [
        {
            num: "01",
            title: "Reinigung & Dekontamination",
            desc: "Kontaktlose Vorwäsche, sichere 2-Eimer-Handwäsche, Teer- und Flugrost-Entfernung. Die Grundlage für jede weitere Behandlung.",
            image: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=900&q=80",
        },
        {
            num: "02",
            title: "Politur & Lackkorrektur",
            desc: "Mehrstufiges Maschinenpolieren entfernt Kratzer, Hologramme und Oxidation. Ihr Lack erhält seinen ursprünglichen Tiefenglanz zurück.",
            image: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=900&q=80",
        },
        {
            num: "03",
            title: "Versiegelung & Schutz",
            desc: "FIREBALL Keramikversiegelung bildet eine unsichtbare Schutzschicht: wasserabweisend, UV-beständig und bis zu 40.000 – 60.000 km haltbar.",
            image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=900&q=80",
        }
    ];

    useEffect(() => {
        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.protocol-card');

            cards.forEach((card, i) => {
                ScrollTrigger.create({
                    trigger: card,
                    start: 'top top',
                    pin: true,
                    pinSpacing: false,
                    endTrigger: containerRef.current,
                    end: 'bottom bottom',
                });

                if (i < cards.length - 1) {
                    gsap.to(card.querySelector('.card-content'), {
                        scale: 0.9,
                        opacity: 0.5,
                        filter: 'blur(20px)',
                        scrollTrigger: {
                            trigger: cards[i + 1],
                            start: 'top bottom',
                            end: 'top top',
                            scrub: true,
                        }
                    });
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="protocol" ref={containerRef} className="relative w-full bg-slate pb-[10vh]">

            {/* Intro Header */}
            <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-32 pb-12">
                <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest mb-4">Unser Prozess</h3>
                <h2 className="font-drama italic text-[2.5rem] sm:text-5xl lg:text-6xl leading-[1.1] text-ivory max-w-2xl pb-4">
                    Drei Schritte zum <span className="text-champagne">perfekten Ergebnis.</span>
                </h2>
            </div>

            {/* Stacking Cards */}
            <div className="relative w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
                {steps.map((step, i) => (
                    <div key={i} className="protocol-card w-full h-screen flex items-center justify-center top-0">
                        <div className="card-content w-full h-[70vh] max-h-[650px] bg-obsidian rounded-[3rem] border border-slate/50 shadow-2xl flex flex-col md:flex-row overflow-hidden relative group">

                            {/* Text Content */}
                            <div className="flex-1 flex flex-col gap-6 justify-center p-10 sm:p-14 lg:p-16 relative z-10">
                                <div className="font-mono text-xl sm:text-2xl text-champagne">{step.num}</div>
                                <h3 className="font-drama italic text-3xl sm:text-4xl lg:text-5xl text-ivory leading-tight">{step.title}</h3>
                                <p className="font-sans text-base sm:text-lg text-ivory/60 max-w-lg leading-relaxed text-balance">
                                    {step.desc}
                                </p>
                            </div>

                            {/* Image */}
                            <div className="flex-1 w-full h-full relative overflow-hidden">
                                <img
                                    src={step.image}
                                    alt={step.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-obsidian via-obsidian/40 to-transparent" />
                            </div>

                        </div>
                    </div>
                ))}
            </div>

        </section>
    );
}
