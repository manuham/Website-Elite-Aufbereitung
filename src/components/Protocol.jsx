import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PadAnim = () => {
    return (
        <div className="w-full h-full flex items-center justify-center relative opacity-80">
            <svg width="200" height="200" viewBox="0 0 200 200" className="animate-[spin_10s_linear_infinite]">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#4DB292" strokeWidth="2" strokeDasharray="10 5" />
                <circle cx="100" cy="100" r="70" fill="none" stroke="#FAF8F5" strokeWidth="1" strokeOpacity="0.3" />
                <circle cx="100" cy="100" r="50" fill="none" stroke="#FAF8F5" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="5 5" />
                <circle cx="100" cy="100" r="20" fill="#4DB292" stroke="none" opacity="0.8" />
            </svg>
        </div>
    )
}

const ScannerAnim = () => {
    return (
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-[radial-gradient(#2A2A35_1px,transparent_1px)] [background-size:20px_20px] opacity-80">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_rgba(239,68,68,1)] animate-[scan_3s_ease-in-out_infinite_alternate]" />
            <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(200px); }
        }
      `}</style>
        </div>
    )
}

const WaveformAnim = () => {
    return (
        <div className="w-full h-full flex items-center justify-center relative opacity-80">
            <svg width="250" height="100" viewBox="0 0 250 100">
                <path
                    className="stroke-accent drop-shadow-[0_0_8px_rgba(77,178,146,0.8)]"
                    style={{
                        strokeDasharray: 600,
                        strokeDashoffset: 600,
                        animation: 'dash 4s linear infinite'
                    }}
                    d="M0 50 L50 50 L70 20 L90 80 L110 50 L180 50 L200 30 L220 50 L250 50"
                    fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                />
            </svg>
            <style>{`
        @keyframes dash {
          0% { stroke-dashoffset: 600; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -600; }
        }
      `}</style>
        </div>
    )
}

export default function Protocol() {
    const containerRef = useRef(null);

    const steps = [
        {
            num: "01",
            title: "Reinigung & Dekontamination",
            desc: "Kontaktlose Vorwäsche, sichere 2-Eimer-Handwäsche, Teer- und Flugrost-Entfernung. Die Grundlage für jede weitere Behandlung.",
            Anim: PadAnim
        },
        {
            num: "02",
            title: "Politur & Lackkorrektur",
            desc: "Mehrstufiges Maschinenpolieren entfernt Kratzer, Hologramme und Oxidation. Ihr Lack erhält seinen ursprünglichen Tiefenglanz zurück.",
            Anim: ScannerAnim
        },
        {
            num: "03",
            title: "Versiegelung & Schutz",
            desc: "FIREBALL Keramikversiegelung bildet eine unsichtbare Schutzschicht: wasserabweisend, UV-beständig und bis zu 5 Jahre haltbar.",
            Anim: WaveformAnim
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

                // Animation for cards underneath when a new card overlaps
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
            <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 pt-32 pb-12">
                <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest mb-4">Unser Prozess</h3>
                <h2 className="font-drama italic text-[2.5rem] sm:text-5xl lg:text-6xl leading-[1.1] text-ivory max-w-2xl pb-4">
                    Drei Schritte zum <span className="text-champagne">perfekten Ergebnis.</span>
                </h2>
            </div>

            {/* Stacking Cards */}
            <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-12">
                {steps.map((step, i) => (
                    <div key={i} className="protocol-card w-full h-screen flex items-center justify-center top-0">
                        <div className="card-content w-full h-[70vh] max-h-[600px] bg-obsidian rounded-[3rem] border border-slate/50 p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">

                            {/* Text Content */}
                            <div className="flex-1 flex flex-col gap-6 relative z-10 w-full">
                                <div className="font-mono text-xl sm:text-2xl text-champagne">{step.num}</div>
                                <h3 className="font-sans font-bold text-3xl sm:text-4xl text-ivory">{step.title}</h3>
                                <p className="font-sans text-base sm:text-lg text-ivory/60 max-w-md leading-relaxed text-balance">
                                    {step.desc}
                                </p>
                            </div>

                            {/* Animation Box */}
                            <div className="flex-1 w-full h-full min-h-[250px] relative z-10 bg-slate/20 rounded-2xl border border-slate/40 overflow-hidden flex items-center justify-center">
                                <step.Anim />
                            </div>

                        </div>
                    </div>
                ))}
            </div>

        </section>
    );
}
