import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Instagram, Facebook } from 'lucide-react';
import { useTilt } from '../hooks/useTilt';
import Img from './Img';

function TiltItem({ children, className }) {
    const tiltRef = useTilt(5, 900, true);
    return (
        <div ref={tiltRef} className={className}>
            {children}
        </div>
    );
}

/**
 * Real vehicles, named only where the badge is in the frame.
 *
 * The labels here used to be outcome-adjectives with no referent — "Premium Finish", "Glanz
 * Finish", "Keramik Finish" (twice), "Detailing". They read as placeholder content because that is
 * effectively what they were: nothing in them pointed at a specific car or a specific job.
 *
 * `vehicle` is set only when the model is identifiable from the photograph itself. `work` comes
 * from the asset folder the file lives in, which is an honest signal for the service category.
 * Neither invents anything, and no claim is made about which coating or polish was used — that
 * has to come from Matthias.
 *
 * Vehicle identifications confirmed by the client 2026-08-25.
 * TODO(Matthias): what was actually done to each, if you want the work named as well as the car.
 */
const galleryItems = [
    {
        src: '/assets/Autos/IMG_2195.jpg',
        alt: 'Roter Ferrari Mondial t Cabriolet nach der Aufbereitung',
        vehicle: 'Ferrari Mondial t',
    },
    {
        src: '/assets/Außenreinigung/P1334645.jpg',
        alt: 'Handwäsche mit Mikrofaser am nassen Lack',
        work: 'Handwäsche',
    },
    {
        src: '/assets/Autos/IMG_3372.jpg',
        alt: 'Schwarzer BMW M5 nach der Aufbereitung',
        vehicle: 'BMW M5',
    },
    {
        src: '/assets/Innenreinigung/P1334911.jpg',
        alt: 'Gereinigter Fahrzeuginnenraum',
        work: 'Innenreinigung',
    },
    {
        src: '/assets/Autos/IMG_2198.jpg',
        alt: 'Heck eines roten Ferrari Mondial t Cabriolet',
        vehicle: 'Ferrari Mondial t',
    },
    {
        src: '/assets/Autos/IMG_2374.jpg',
        alt: 'Roter Ferrari 488 GTB nach der Aufbereitung',
        vehicle: 'Ferrari 488 GTB',
    },
    {
        src: '/assets/Ergebnisse/P1345330.jpg',
        alt: 'Gereinigte rot-schwarze Ledersitzbank im Fond',
        work: 'Lederreinigung',
    },
    {
        src: '/assets/Außenreinigung/P1334780.jpg',
        alt: 'Lackfläche nach der Politur',
        work: 'Politur',
    },
];

export default function Gallery() {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.gallery-header', {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 85%',
                },
                y: 30,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
            });

            // Clip-path reveal + scale for gallery items
            gsap.fromTo('.gallery-item',
                { clipPath: 'inset(0 0 100% 0)', scale: 0.92, opacity: 0 },
                {
                    scrollTrigger: {
                        trigger: '.gallery-grid',
                        start: 'top 80%',
                    },
                    clipPath: 'inset(0 0 0% 0)',
                    scale: 1,
                    opacity: 1,
                    duration: 1,
                    stagger: { each: 0.08, from: 'random' },
                    ease: 'power3.out',
                    clearProps: 'clipPath',
                }
            );

            // Parallax on gallery images — subtle depth effect
            gsap.utils.toArray('.gallery-item img').forEach((img, i) => {
                gsap.to(img, {
                    scrollTrigger: {
                        trigger: img.closest('.gallery-item'),
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                    },
                    y: i % 2 === 0 ? -25 : -15,
                    ease: 'none',
                });
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="gallery" ref={containerRef} className="py-24 sm:py-32 px-6 sm:px-12 lg:px-24 bg-slate relative z-10">
            <div className="max-w-7xl mx-auto flex flex-col gap-16">

                {/* Header */}
                <div className="gallery-header flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div className="flex flex-col gap-2">
                        <span className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest">
                            Portfolio
                        </span>
                        <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory">
                            Unsere{' '}
                            <span className="text-champagne relative inline-block">
                                Arbeit.
                                <span className="underline-draw bg-champagne" />
                            </span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <a
                            href="https://www.instagram.com/eliteaufbereitung/"
                            target="_blank"
                            rel="noreferrer"
                            className="btn-magnetic flex items-center gap-2.5 border border-ivory/20 hover:border-champagne/60 text-ivory/70 hover:text-champagne px-5 py-2.5 rounded-full font-sans text-sm font-medium transition-all duration-300 w-fit"
                        >
                            <Instagram className="w-4 h-4" />
                            Instagram
                        </a>
                        <a
                            href="https://www.facebook.com/people/Elit%C3%A9-Autoaufbereitung/61555761685065/"
                            target="_blank"
                            rel="noreferrer"
                            className="btn-magnetic flex items-center gap-2.5 border border-ivory/20 hover:border-champagne/60 text-ivory/70 hover:text-champagne px-5 py-2.5 rounded-full font-sans text-sm font-medium transition-all duration-300 w-fit"
                        >
                            <Facebook className="w-4 h-4" />
                            Facebook
                        </a>
                    </div>
                </div>

                {/* True masonry via CSS columns, not a row grid.
                    A row grid forces every tile to one aspect ratio, which is what made this read
                    as a component rather than a contact sheet — and the previous tall-first-tile
                    trick left a dead gap under its neighbours once the fixed auto-rows went away.
                    Columns let each photograph keep its own shape: the portrait shots of cars run
                    tall, the landscape process shots run wide, and the rag falls where it falls.

                    Captions sit under each tile instead of inside a group-hover overlay. The old
                    ones were opacity-0 until hover, so a touch visitor never saw a single label. */}
                <div className="gallery-grid columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:balance]" style={{ perspective: '900px' }}>
                    {galleryItems.map((item) => (
                        <figure key={item.src} className="break-inside-avoid mb-8 flex flex-col gap-3">
                            <TiltItem className="gallery-item relative group rounded-[1.5rem] overflow-hidden">
                                <Img
                                    src={item.src}
                                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                    alt={item.alt}
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                />
                            </TiltItem>
                            <figcaption className="px-1">
                                {item.vehicle ? (
                                    <span className="font-sans text-sm text-ivory/90">{item.vehicle}</span>
                                ) : (
                                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">
                                        {item.work}
                                    </span>
                                )}
                            </figcaption>
                        </figure>
                    ))}
                </div>

                {/* CTA below grid */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <p className="font-sans text-sm text-ivory/50 text-center">
                        Noch mehr Ergebnisse auf unseren Kanälen
                    </p>
                    <div className="flex items-center gap-3">
                        <a
                            href="https://www.instagram.com/eliteaufbereitung/"
                            target="_blank"
                            rel="noreferrer"
                            className="btn-magnetic flex items-center gap-2 bg-champagne text-obsidian px-6 py-2.5 rounded-full font-sans font-semibold text-sm"
                        >
                            <Instagram className="w-4 h-4" />
                            Instagram
                        </a>
                        <a
                            href="https://www.facebook.com/people/Elit%C3%A9-Autoaufbereitung/61555761685065/"
                            target="_blank"
                            rel="noreferrer"
                            className="btn-magnetic flex items-center gap-2 border border-champagne text-champagne hover:bg-champagne hover:text-obsidian px-6 py-2.5 rounded-full font-sans font-semibold text-sm transition-colors duration-300"
                        >
                            <Facebook className="w-4 h-4" />
                            Facebook
                        </a>
                    </div>
                </div>

            </div>
        </section>
    );
}
