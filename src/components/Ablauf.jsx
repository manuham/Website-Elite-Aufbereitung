import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CalendarCheck, Truck, Sparkles } from 'lucide-react';
import SplitText from './SplitText';
import { useTilt } from '../hooks/useTilt';
import Img from './Img';
import { prefersReducedMotion } from '../lib/motion';

function TiltCard({ children, className }) {
    const tiltRef = useTilt(6, 800, true);
    return (
        <div ref={tiltRef} className={className}>
            {children}
        </div>
    );
}

export default function Ablauf() {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        ScrollTrigger.refresh();

        if (prefersReducedMotion()) return;

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

            // The desktop horizontal-scroll pin used to live here. It was removed: the track
            // is three lg:max-w-[420px] cards plus two gap-8 gutters ≈ 1324px, and the
            // container's inner width at 1440px is ≈ 1312px — so `track.scrollWidth -
            // track.offsetWidth` was about 12px. The section pinned the viewport, took over
            // the scroll, and travelled a dozen pixels; at some widths `getScrollAmount() <= 0`
            // made it silently do nothing at all. Pinning also forces a pin-spacer wrapper that
            // has to be remeasured on every ScrollTrigger.refresh() — and refresh fires on
            // mount, again when the preloader unlocks the body, and on every resize.
            //
            // The cards are a plain lg:grid-cols-3 now. Nothing was lost but the pin.

            // Vertical parallax on the card images. This was inside a
            // matchMedia('(max-width: 1023px)') branch only because the pin owned desktop;
            // with the pin gone the layout is the same vertical scroll at every width, so
            // the branch is gone too.
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
        }, containerRef);

        return () => ctx.revert();
    }, []);

    /**
     * The customer's three steps, not ours.
     *
     * These cards used to be "Warum Elité?" — three reasons to choose the business. That
     * argument now runs across the whole page above (the Manifest states it, the Protocol
     * proves it, the Gallery shows it), so repeating it here was the page making its case
     * twice. What was missing was the practical question a convinced visitor actually has:
     * what do I have to do?
     *
     * Two claims from the old cards are deliberately not carried over. "40.000 – 60.000 km
     * Garantie" — Garantie is a binding undertaking under § 9b KSchG and nobody has confirmed
     * one exists in writing (docs/context/open-questions.md). And "Mo–Sa geöffnet" — the
     * booking flow sells Saturday slots, but whether Saturday is actually open is still an
     * open question, so this section stops asserting it.
     */
    const features = [
        {
            icon: CalendarCheck,
            title: 'Termin auswählen',
            description: 'Paket wählen, Wunschtermin klicken, fertig. Keine Rückrufschleife, keine Warteliste — Sie sehen freie Zeiten sofort.',
            highlights: ['Online buchen', 'Studio oder mobil', 'Wunschtermin wählen'],
            image: '/assets/Autos/IMG_2195.jpg',
        },
        {
            icon: Truck,
            title: 'Wir übernehmen',
            description: 'Sie bringen das Fahrzeug — oder wir kommen zu Ihnen. Ab da liegt alles bei uns: Handwäsche, Innenraum, Politur, Schutz.',
            highlights: ['Studio oder vor Ort', 'Handarbeit', 'Ohne Aufwand für Sie'],
            image: '/assets/Außenreinigung/P1334323.jpg',
        },
        {
            icon: Sparkles,
            title: 'Fahrzeug neu erleben',
            description: 'Wir geben das Fahrzeug erst zurück, wenn es uns selbst gefällt. Persönliche Übergabe, kein anonymer Schlüsselkasten.',
            highlights: ['Persönliche Übergabe', 'Sichtbares Ergebnis', 'Langfristiger Schutz'],
            image: '/assets/Ergebnisse/P1345324.jpg',
        },
    ];

    return (
        <section id="ablauf" ref={containerRef} className="bg-background relative z-10 overflow-hidden">
            {/* Legacy anchor. Nothing in this repo links to #features, but the id shipped for
                months and could be in an Instagram bio or an old Ads destination URL. Keeping
                it costs one empty span; a dead inbound link costs a visitor. */}
            <span id="features" aria-hidden="true" />

            {/* Header — always visible, not part of scroll track */}
            <div className="feature-header flex flex-col gap-2 items-center text-center pt-24 sm:pt-32 pb-12 px-4 sm:px-8 lg:px-12 xl:px-16">
                <p className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest">
                    So läuft es ab
                </p>
                <h2 className="font-drama italic text-[2.5rem] leading-[1.1] sm:text-5xl text-ivory">
                    <SplitText type="words" triggerStart="top 85%">
                        Drei Schritte.
                    </SplitText>{' '}
                    <span className="text-accent relative inline-block">
                        <SplitText type="chars" triggerStart="top 85%" delay={0.3}>
                            Mehr müssen Sie nicht tun.
                        </SplitText>
                        <span className="underline-draw bg-accent" />
                    </span>
                </h2>
            </div>

            {/* Cards — one column on mobile, three across from lg. Was a horizontal scroll
                track driven by a pinned ScrollTrigger; see the effect above for why not. */}
            <div
                className="grid grid-cols-1 gap-6 px-4 sm:px-8 pb-24 sm:pb-32
                           lg:grid-cols-3 lg:gap-8 lg:px-12 xl:px-16 lg:pb-24"
                style={{ perspective: '800px' }}
            >
                {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                        <TiltCard
                            key={feature.title}
                            className="feature-card glass-panel rounded-[2rem] flex flex-col overflow-hidden group hover:shadow-2xl transition-shadow duration-500"
                        >
                            {/* Image area */}
                            <div className="relative h-72 lg:h-80 overflow-hidden">
                                <div className="absolute inset-0 bg-accent/20 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                <Img
                                    src={feature.image}
                                    sizes="(min-width: 1024px) 33vw, 100vw"
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
