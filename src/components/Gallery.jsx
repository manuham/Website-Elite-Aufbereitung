import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram } from 'lucide-react';

// Real Unsplash images matching the automotive detailing aesthetic
const galleryItems = [
    {
        src: 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800&q=80',
        alt: 'Keramikversiegelung Wasserabweisung',
        label: 'Keramikversiegelung',
        span: 'col-span-1 row-span-2',
    },
    {
        src: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=80',
        alt: 'Schwarzes Fahrzeug nach Politur',
        label: 'Lackpolitur',
        span: 'col-span-1 row-span-1',
    },
    {
        src: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80',
        alt: 'Detailing Innenraum Leder',
        label: 'Innenreinigung',
        span: 'col-span-1 row-span-1',
    },
    {
        src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
        alt: 'Handwäsche Felgen',
        label: 'Felgenreinigung',
        span: 'col-span-1 row-span-1',
    },
    {
        src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
        alt: 'Luxusauto Glanz nach Aufbereitung',
        label: 'Premium Finish',
        span: 'col-span-1 row-span-1',
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

            gsap.from('.gallery-item', {
                scrollTrigger: {
                    trigger: '.gallery-grid',
                    start: 'top 80%',
                },
                y: 50,
                opacity: 0,
                duration: 0.9,
                stagger: 0.1,
                ease: 'power3.out',
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
                        <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest">
                            Portfolio
                        </h3>
                        <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory">
                            Unsere{' '}
                            <span className="text-champagne relative inline-block">
                                Arbeit.
                                <span className="absolute bottom-1 left-0 w-full h-px bg-champagne" />
                            </span>
                        </h2>
                    </div>
                    <a
                        href="https://www.instagram.com/eliteaufbereitung/"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-magnetic flex items-center gap-2.5 border border-ivory/20 hover:border-champagne/60 text-ivory/70 hover:text-champagne px-5 py-2.5 rounded-full font-sans text-sm font-medium transition-all duration-300 w-fit shrink-0"
                    >
                        <Instagram className="w-4 h-4" />
                        @eliteaufbereitung
                    </a>
                </div>

                {/* Masonry-style Grid */}
                <div className="gallery-grid grid grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[220px]">

                    {/* Tall featured image — left */}
                    <div className="gallery-item col-span-1 row-span-2 relative group rounded-[1.5rem] overflow-hidden">
                        <img
                            src={galleryItems[0].src}
                            alt={galleryItems[0].alt}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                            <span className="font-sans text-sm font-semibold text-ivory tracking-wide">{galleryItems[0].label}</span>
                        </div>
                    </div>

                    {/* Regular images */}
                    {galleryItems.slice(1).map((item, i) => (
                        <div key={i} className="gallery-item col-span-1 row-span-1 relative group rounded-[1.5rem] overflow-hidden">
                            <img
                                src={item.src}
                                alt={item.alt}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <span className="font-sans text-sm font-semibold text-ivory tracking-wide">{item.label}</span>
                            </div>
                        </div>
                    ))}

                </div>

                {/* CTA below grid */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <p className="font-sans text-sm text-ivory/50 text-center">
                        Noch mehr Ergebnisse auf unserem Instagram
                    </p>
                    <a
                        href="https://www.instagram.com/eliteaufbereitung/"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-magnetic flex items-center gap-2 bg-champagne text-obsidian px-6 py-2.5 rounded-full font-sans font-semibold text-sm"
                    >
                        <Instagram className="w-4 h-4" />
                        Mehr ansehen
                    </a>
                </div>

            </div>
        </section>
    );
}
