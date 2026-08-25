import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Img from '../components/Img';
import { prefersReducedMotion } from '../lib/motion';

/**
 * Real work, captioned only with what the photograph actually shows.
 *
 * This page used to claim six vehicles that are not in the pictures — a Ferrari 488 was labelled
 * "Tesla Model 3 — Perlweiß", a Mercedes-AMG G-Klasse interior was "BMW 3er — Mineralgrau", a
 * Mercedes wheel was "VW Golf R". It also presented a Vorher/Nachher slider whose "before" was the
 * same file as the "after" with a CSS grayscale filter on it. Both are gone: a portfolio that can
 * be falsified by the customer standing next to the car is worse than no portfolio.
 *
 * The rule for every entry below: `vehicle` only when the badge, the wheel centre or an
 * unmistakable model feature is visible in the frame; `work` only when the action or the product
 * is visible. Anything else — how many hours it took, which polish, which coating, whose car it
 * was — has to come from Matthias. Fields left out simply do not render.
 *
 * Vehicle identifications confirmed by the client 2026-08-25.
 * TODO(Matthias): treatment details (Arbeitsschritte, Dauer, verwendete Produkte) for any of these
 * you want shown as a full case study — the fields already exist and simply do not render.
 */
const projects = [
    {
        img: '/assets/Ergebnisse/P1345324.jpg',
        // Three differential locks on the console and the AMG clock — G-Klasse, unambiguously.
        vehicle: 'Mercedes-AMG G-Klasse',
        work: 'Innenraum',
        alt: 'Gereinigte Mittelkonsole einer Mercedes-AMG G-Klasse mit den drei Differentialsperren',
    },
    {
        img: '/assets/Innenreinigung/P1335024-2.jpg',
        vehicle: 'Mercedes-AMG G-Klasse',
        work: 'Ledersitze von Hand',
        alt: 'Aufbereiter reinigt mit Stirnlampe und Handschuhen den roten Ledersitz einer Mercedes-AMG G-Klasse',
    },
    {
        img: '/assets/Ergebnisse/P1345330.jpg',
        vehicle: 'Mercedes-AMG G-Klasse',
        work: 'Rücksitzbank',
        alt: 'Gereinigte rot-schwarze Ledersitzbank im Fond einer Mercedes-AMG G-Klasse',
    },
    {
        img: '/assets/Außenreinigung/P1334477-2.jpg',
        work: 'Felgenreinigung',
        // The purple bloom is the iron remover reacting with brake dust — visible in the frame,
        // so it can be named.
        note: 'Flugrost-Entferner reagiert sichtbar',
        alt: 'Detailbürste an einer Mercedes-Felge, der Flugrost-Entferner färbt sich violett',
    },
    {
        img: '/assets/Autos/IMG_2195.jpg',
        vehicle: 'Ferrari Mondial t Cabriolet',
        alt: 'Roter Ferrari Mondial t Cabriolet nach der Aufbereitung',
    },
    {
        img: '/assets/Autos/IMG_3372.jpg',
        vehicle: 'BMW M5',
        alt: 'Schwarzer BMW M5 nach der Aufbereitung',
    },
    {
        img: '/assets/Autos/IMG_2374.jpg',
        vehicle: 'Ferrari 488 GTB',
        alt: 'Roter Ferrari 488 GTB nach der Aufbereitung',
    },
    {
        img: '/assets/Außenreinigung/P1334869.jpg',
        work: 'Handarbeit im Studio',
        alt: 'Aufbereiter trocknet das Dach eines schwarzen Fahrzeugs mit einem Mikrofasertuch ab',
    },
];

function ProjectCard({ img, vehicle, work, note, alt }) {
    return (
        <figure className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-[1.75rem] aspect-[4/3] bg-slate">
                <Img
                    src={img}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    alt={alt}
                    className="project-img absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                />
            </div>

            {/* Caption sits below the image and is always visible — the old labels only appeared
                on :hover, so touch visitors and the prerendered HTML never had them at all. */}
            <figcaption className="flex flex-col gap-0.5 px-1">
                {vehicle && <p className="font-sans text-sm text-ivory/90">{vehicle}</p>}
                {work && (
                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">
                        {work}
                    </span>
                )}
                {note && <p className="font-sans text-xs text-ivory/40">{note}</p>}
            </figcaption>
        </figure>
    );
}

export default function Projekte() {
    const gridRef = useRef(null);

    useEffect(() => {
        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            gsap.from('.project-card', {
                scrollTrigger: { trigger: gridRef.current, start: 'top 85%' },
                y: 28,
                opacity: 0,
                duration: 0.9,
                stagger: 0.08,
                ease: 'power3.out',
            });
        }, gridRef);

        return () => ctx.revert();
    }, []);

    return (
        <div className="min-h-screen bg-obsidian text-ivory font-sans overflow-hidden">
            <Navbar />

            {/* Hero */}
            <div className="px-6 sm:px-12 lg:px-24 pt-32 sm:pt-36 pb-20 max-w-7xl mx-auto flex flex-col gap-5">
                <span className="font-mono text-xs text-champagne uppercase tracking-widest">Arbeiten</span>
                <h1 className="font-drama text-5xl sm:text-6xl lg:text-7xl text-ivory leading-tight">
                    Fahrzeuge, die bei uns{' '}
                    <span className="text-champagne italic">standen.</span>
                </h1>
                <p className="font-sans text-ivory/60 text-lg max-w-xl leading-relaxed">
                    Eigene Aufnahmen aus dem Studio und vom mobilen Einsatz. Beschriftet ist nur, was
                    auf dem Bild zu sehen ist.
                </p>
            </div>

            {/* Grid */}
            <div ref={gridRef} className="px-6 sm:px-12 lg:px-24 pb-24 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                    {projects.map((p) => (
                        <div key={p.img} className="project-card">
                            <ProjectCard {...p} />
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-slate mx-6 sm:mx-12 lg:mx-24 mb-16 rounded-[2.5rem] px-8 sm:px-16 py-16 flex flex-col sm:flex-row items-center justify-between gap-8 max-w-7xl lg:mx-auto">
                <div className="flex flex-col gap-2 text-center sm:text-left">
                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">Dein Fahrzeug</span>
                    <h2 className="font-drama text-3xl sm:text-4xl text-ivory">Sollen wir uns das ansehen?</h2>
                    <p className="font-sans text-sm text-ivory/50 max-w-sm">
                        Wähl Leistung und Wunschtermin — im Studio oder mobil bei dir.
                    </p>
                </div>
                <Link
                    to="/buchen"
                    className="shrink-0 bg-champagne text-obsidian px-8 py-4 rounded-full font-sans font-semibold text-sm whitespace-nowrap hover:brightness-110 transition-all"
                >
                    Termin anfragen
                </Link>
            </div>

            <Footer />
        </div>
    );
}
