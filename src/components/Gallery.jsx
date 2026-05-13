import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Instagram, Facebook } from 'lucide-react';
import SplitText from './SplitText';
import { useTilt } from '../hooks/useTilt';

function TiltItem({ children, className }) {
    const tiltRef = useTilt(5, 900, true);
    return (
        <div ref={tiltRef} className={className}>
            {children}
        </div>
    );
}

const galleryItems = [
    {
        src: '/assets/Autos/IMG_2195.jpg',
        alt: 'Lackaufbereitung Detail',
        label: 'Aufbereitung',
        span: 'col-span-1 row-span-2',
    },
    {
        src: '/assets/Außenreinigung/P1334645.jpg',
        alt: 'Lackpolitur Handwäsche',
        label: 'Lackpolitur',
        span: 'col-span-1 row-span-1',
    },
    {
        src: '/assets/Autos/IMG_2197.jpg',
        alt: 'Fahrzeugaufbereitung',
        label: 'Premium Finish',
        span: 'col-span-1 row-span-1',
    },
    {
        src: '/assets/Innenreinigung/P1334911.jpg',
        alt: 'Innenraum Detail',
        label: 'Innenreinigung',
        span: 'col-span-1 row-span-1',
    },
    {
        src: '/assets/Autos/IMG_2198.jpg',
        alt: 'Sportwagen Finish',
        label: 'Keramik Finish',
        span: 'col-span-1 row-span-1',
    },
    {
        src: '/assets/Autos/IMG_2374.jpg',
        alt: 'Glanz Detailansicht',
        label: 'Glanz Finish',
        span: 'col-span-1 row-span-1',
    },
    {
        src: '/assets/Ergebnisse/P1345330.jpg',
        alt: 'Keramikversiegelung Ergebnis',
        label: 'Keramik Finish',
        span: 'col-span-1 row-span-1',
    },
    {
        src: '/assets/Autos/IMG_3372.jpg',
        alt: 'Detailing',
        label: 'Detailing',
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
                            <SplitText type="words" triggerStart="top 85%">
                                Unsere
                            </SplitText>{' '}
                            <span className="text-champagne relative inline-block">
                                <SplitText type="chars" triggerStart="top 85%" delay={0.15}>
                                    Arbeit.
                                </SplitText>
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

                {/* Masonry-style Grid */}
                <div className="gallery-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[220px] sm:auto-rows-[220px]" style={{ perspective: '900px' }}>

                    {/* Tall featured image — left */}
                    <TiltItem className="gallery-item col-span-1 row-span-1 sm:row-span-2 relative group rounded-[1.5rem] overflow-hidden">
                        <img
                            src={galleryItems[0].src}
                            alt={galleryItems[0].alt}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                            <span className="font-sans text-sm font-semibold text-ivory tracking-wide">{galleryItems[0].label}</span>
                        </div>
                    </TiltItem>

                    {/* Regular images */}
                    {galleryItems.slice(1).map((item, i) => (
                        <TiltItem key={i} className="gallery-item col-span-1 row-span-1 relative group rounded-[1.5rem] overflow-hidden">
                            <img
                                src={item.src}
                                alt={item.alt}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                <span className="font-sans text-sm font-semibold text-ivory tracking-wide">{item.label}</span>
                            </div>
                        </TiltItem>
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
