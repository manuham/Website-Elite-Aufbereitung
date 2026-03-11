import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { MousePointer2 } from 'lucide-react';

const DiagnosticShuffler = () => {
    const [cards, setCards] = useState([
        { id: 1, text: "2-Eimer Methode — Null Kratzer" },
        { id: 2, text: "Kontaktlose Vorwäsche" },
        { id: 3, text: "pH-neutrale Profi-Produkte" }
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCards(prev => {
                const next = [...prev];
                const first = next.shift();
                next.push(first);
                return next;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-48 relative flex items-center justify-center w-full px-4 perspective-[1000px]">
            {cards.map((card, i) => {
                const isFront = i === 0;
                const isMiddle = i === 1;
                return (
                    <div
                        key={card.id}
                        className="absolute w-full max-w-[260px] p-4 rounded-2xl border border-slate/50 bg-slate backdrop-blur-sm transition-all duration-700 font-mono text-xs sm:text-sm text-center flex items-center justify-center text-ivory"
                        style={{
                            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                            transform: isFront
                                ? 'translateY(20px) scale(1) translateZ(0)'
                                : isMiddle
                                    ? 'translateY(0px) scale(0.9) translateZ(-50px)'
                                    : 'translateY(-20px) scale(0.8) translateZ(-100px)',
                            opacity: isFront ? 1 : isMiddle ? 0.6 : 0.3,
                            zIndex: 3 - i,
                            boxShadow: isFront ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none'
                        }}
                    >
                        {card.text}
                    </div>
                );
            })}
        </div>
    );
};

const TelemetryTypewriter = () => {
    const messages = [
        "> FIREBALL Keramik wird aufgetragen...",
        "> Härtungsphase gestartet — 24h Aushärtung",
        "> Hydrophober Schutz aktiv: 2–5 Jahre Standzeit",
        "> UV-Schutz: ████████████ 100%",
        "> Wasserabweisung: ████████████ 100%",
        "> Kratzresistenz: ██████████░░ 85%",
        "> Beschichtung abgeschlossen. Garantie: 5 Jahre."
    ];

    const [currentIdx, setCurrentIdx] = useState(0);
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let timeout;
        if (displayedText.length < messages[currentIdx].length) {
            timeout = setTimeout(() => {
                setDisplayedText(messages[currentIdx].slice(0, displayedText.length + 1));
            }, 45);
        } else {
            timeout = setTimeout(() => {
                setDisplayedText('');
                setCurrentIdx((prev) => (prev + 1) % messages.length);
            }, 2000);
        }
        return () => clearTimeout(timeout);
    }, [displayedText, currentIdx]);

    return (
        <div className="h-48 w-full bg-obsidian border border-slate/50 rounded-2xl p-4 flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 border-b border-slate/50 pb-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-[10px] text-ivory/50 uppercase tracking-wider">Live Feed</span>
            </div>
            <div className="font-mono text-xs text-accent leading-relaxed flex-1">
                {displayedText}<span className="inline-block w-2.5 h-3 bg-accent ml-0.5 animate-pulse" />
            </div>
        </div>
    );
};

const CursorProtocolScheduler = () => {
    const days = ['S', 'M', 'D', 'M', 'D', 'F', 'S'];
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

            gsap.set('.sim-cursor', { x: 0, y: 150, opacity: 0 });
            gsap.set('.day-cell', { backgroundColor: 'transparent', color: '#FAF8F5' });
            gsap.set('.save-btn', { scale: 1 });

            tl.to('.sim-cursor', { opacity: 1, duration: 0.3 })
                .to('.sim-cursor', { x: 120, y: 30, duration: 1, ease: 'power2.inOut' })
                .to('.sim-cursor', { scale: 0.8, duration: 0.1 })
                .to('.day-cell-4', { backgroundColor: '#4DB292', color: '#0D0D12', duration: 0.1 }, '<')
                .to('.sim-cursor', { scale: 1, duration: 0.1 })
                .to('.sim-cursor', { x: 100, y: 105, duration: 0.8, ease: 'power2.inOut', delay: 0.3 })
                .to('.sim-cursor', { scale: 0.8, duration: 0.1 })
                .to('.save-btn', { scale: 0.95, duration: 0.1 }, '<')
                .to('.sim-cursor', { scale: 1, duration: 0.1 })
                .to('.save-btn', { scale: 1, duration: 0.1 }, '<')
                .to('.sim-cursor', { x: 200, y: 200, opacity: 0, duration: 0.8, ease: 'power2.inOut', delay: 0.4 });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div className="h-48 w-full flex flex-col items-center justify-center relative select-none" ref={containerRef}>
            <div className="w-full relative z-0 flex flex-col items-center gap-4 bg-obsidian rounded-2xl p-4 border border-slate/50">
                <div className="font-sans text-[10px] text-ivory/50 uppercase tracking-widest text-center w-full pb-2 border-b border-slate/50">
                    Verfügbare Termine
                </div>
                <div className="flex gap-2">
                    {days.map((day, i) => (
                        <div
                            key={i}
                            className={`day-cell day-cell-${i} w-8 h-8 rounded-lg border border-slate flex items-center justify-center font-mono text-xs transition-colors`}
                        >
                            {day}
                        </div>
                    ))}
                </div>
                <button className="save-btn w-3/4 py-1.5 rounded-lg bg-champagne text-obsidian font-sans font-semibold text-xs">
                    Jetzt Buchen
                </button>
            </div>
            <div className="sim-cursor absolute top-0 left-0 z-10 pointer-events-none drop-shadow-xl">
                <MousePointer2 className="text-ivory w-6 h-6 fill-obsidian" strokeWidth={1.5} />
            </div>
        </div>
    );
};

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

                    <div className="feature-card bg-slate/30 border border-slate/50 p-8 rounded-[2rem] shadow-2xl flex flex-col gap-6 hover:border-slate transition-colors group">
                        <DiagnosticShuffler />
                        <div className="flex flex-col gap-3">
                            <h4 className="font-sans font-bold text-xl text-ivory group-hover:text-accent transition-colors">Kratzerfreie Präzisionswäsche</h4>
                            <p className="font-sans text-sm text-ivory/60 leading-relaxed text-balance">
                                Jedes Fahrzeug wird mit professioneller 2-Eimer-Methode und kontaktloser Vorwäsche behandelt — für eine absolut kratzfreie Reinigung, die Waschstraßen niemals erreichen.
                            </p>
                        </div>
                    </div>

                    <div className="feature-card bg-slate/30 border border-slate/50 p-8 rounded-[2rem] shadow-2xl flex flex-col gap-6 hover:border-slate transition-colors group">
                        <TelemetryTypewriter />
                        <div className="flex flex-col gap-3">
                            <h4 className="font-sans font-bold text-xl text-ivory group-hover:text-accent transition-colors">Keramik-Schutzschild</h4>
                            <p className="font-sans text-sm text-ivory/60 leading-relaxed text-balance">
                                FIREBALL Keramikversiegelung mit bis zu 5 Jahren Garantie. Extremer Glanz, wasser- und schmutzabweisend, UV-Schutz — Ihr Lack bleibt makellos.
                            </p>
                        </div>
                    </div>

                    <div className="feature-card bg-slate/30 border border-slate/50 p-8 rounded-[2rem] shadow-2xl flex flex-col gap-6 hover:border-slate transition-colors group">
                        <CursorProtocolScheduler />
                        <div className="flex flex-col gap-3">
                            <h4 className="font-sans font-bold text-xl text-ivory group-hover:text-accent transition-colors">Termin in 60 Sekunden</h4>
                            <p className="font-sans text-sm text-ivory/60 leading-relaxed text-balance">
                                Online-Terminbuchung in Sekunden. Wählen Sie Ihr Paket und Ihren Wunschtermin — wir kümmern uns um den Rest.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
