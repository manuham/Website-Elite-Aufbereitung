import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Img from '../components/Img';
import { useTilt } from '../hooks/useTilt';
import { prefersReducedMotion } from '../lib/motion';

/**
 * What this page shows, and what it stopped claiming.
 *
 * It used to render a before/after slider for each of six entries. It was not a before/after:
 * both halves were the *same file*, and the "before" was manufactured at render time with
 * `filter: grayscale(0.75) contrast(0.85) brightness(0.78) saturate(0.4)`, with the two halves
 * given alt text calling them two different photographs. There are no before/after pairs in
 * public/assets and there never were.
 *
 * The six captions were invented too. Verified against the actual image files:
 *   IMG_2374.jpg    was "Tesla Model 3 — Perlweiß"          → it is a red Ferrari 488
 *   P1345324.jpg    was "BMW 3er — Mineralgrau"             → Mercedes G-Klasse centre console
 *   P1334477-2.jpg  was "VW Golf R — 19\" Felgen"            → a Mercedes wheel
 *   P1345330.jpg    was "Porsche Cayenne — Weißsilber"      → red/black leather rear seats,
 *                        and it was labelled "Lackkorrektur" — on an interior photograph
 *   P1335024-2.jpg  was "Audi A4 — Cognacbraun Leder"       → red and black quilted seats
 *
 * So: no model names, no colours, no service history. Each caption now describes what is
 * visible in the frame and nothing more. That is a weaker claim and a true one.
 */
const projects = [
    {
        img: '/assets/Außenreinigung/P1334869.jpg',
        label: 'Politur von Hand',
        detail: 'Dach, mit Mikrofasertuch nachgearbeitet',
    },
    {
        img: '/assets/Außenreinigung/P1334477-2.jpg',
        label: 'Felgenreinigung',
        detail: 'Felge einzeln mit der Bürste gereinigt',
    },
    {
        img: '/assets/Innenreinigung/P1335024-2.jpg',
        label: 'Innenreinigung im Detail',
        detail: 'Sitze und Nähte, mit Stirnlampe gearbeitet',
    },
    {
        img: '/assets/Ergebnisse/P1345330.jpg',
        label: 'Leder & Ziernaht',
        detail: 'Rücksitzbank nach der Innenaufbereitung',
    },
    {
        img: '/assets/Ergebnisse/P1345324.jpg',
        label: 'Mittelkonsole',
        detail: 'Armaturen, Lüftungen und Zierteile',
    },
    {
        img: '/assets/Autos/IMG_2374.jpg',
        label: 'Ferrari 488',
        detail: 'Front nach der Aufbereitung',
    },
];

/**
 * Real before/after pairs, when they exist. Empty on purpose.
 *
 * The section below renders only when this array has entries, so the page cannot show a
 * comparison it does not have. To turn it on: shoot one job at intake and at handover from
 * the same position in the same light, add both files, run `npm run images:optimize`, and
 * push one entry here:
 *
 *   { before: '/assets/.../xyz-vorher.jpg', after: '/assets/.../xyz-nachher.jpg',
 *     label: 'Lackkorrektur', detail: '3-Gang Politur' }
 *
 * Tracked in docs/context/open-questions.md.
 */
const beforeAfterPairs = [];

function ProjectCard({ img, label, detail }) {
    const tiltRef = useTilt(6, 900, true);

    return (
        <div ref={tiltRef} className="project-card flex flex-col gap-4">
            <div className="relative rounded-[1.75rem] overflow-hidden aspect-[4/3] group">
                <Img
                    src={img}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    alt={`${label} — ${detail}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="flex flex-col gap-1 px-1">
                <span className="font-sans font-semibold text-base text-ivory">{label}</span>
                <span className="font-sans text-sm text-ivory/50">{detail}</span>
            </div>
        </div>
    );
}

export default function Projekte() {
    const gridRef = useRef(null);

    useEffect(() => {
        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            gsap.from('.project-card', {
                scrollTrigger: { trigger: gridRef.current, start: 'top 85%' },
                y: 30,
                opacity: 0,
                duration: 0.9,
                stagger: 0.1,
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
                <span className="font-mono text-xs text-champagne uppercase tracking-widest">Portfolio</span>
                <h1 className="font-drama text-5xl sm:text-6xl lg:text-7xl text-ivory leading-tight">
                    Unsere{' '}
                    <span className="text-champagne italic">Arbeit.</span>
                </h1>
                <p className="font-sans text-ivory/60 text-lg max-w-xl leading-relaxed">
                    Aufnahmen aus dem Studio und von fertigen Fahrzeugen — Handwäsche, Politur,
                    Innenaufbereitung und Versiegelung. Keine Renderings, keine Stockfotos.
                </p>
            </div>

            {/* Grid */}
            <div ref={gridRef} className="px-6 sm:px-12 lg:px-24 pb-24 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10" style={{ perspective: '900px' }}>
                    {projects.map((p, i) => (
                        <ProjectCard key={i} {...p} />
                    ))}
                </div>
            </div>

            {/* Before/after — renders only once real pairs exist (see beforeAfterPairs above). */}
            {beforeAfterPairs.length > 0 && (
                <div className="px-6 sm:px-12 lg:px-24 pb-24 max-w-7xl mx-auto">
                    <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory mb-10">
                        Vorher & Nachher.
                    </h2>
                    {/* BeforeAfterSlider intentionally not implemented until there is data to
                        put in it. Whoever builds it: it needs role="slider", tabIndex,
                        aria-valuenow/min/max and ArrowLeft/ArrowRight handling — the version
                        that used to live here had none of that, so it could not be operated by
                        keyboard at all. */}
                </div>
            )}

            {/* CTA */}
            <div className="bg-slate mx-6 sm:mx-12 lg:mx-24 mb-16 rounded-[2.5rem] px-8 sm:px-16 py-16 flex flex-col sm:flex-row items-center justify-between gap-8 max-w-7xl lg:mx-auto">
                <div className="flex flex-col gap-2 text-center sm:text-left">
                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">Ihr Fahrzeug</span>
                    <h2 className="font-drama text-3xl sm:text-4xl text-ivory">Bereit für Ihren Termin?</h2>
                    <p className="font-sans text-sm text-ivory/50 max-w-sm">Buchen Sie online — wir kümmern uns um den Rest.</p>
                </div>
                <Link
                    to="/buchen"
                    className="shrink-0 bg-champagne text-obsidian px-8 py-4 rounded-full font-sans font-semibold text-sm whitespace-nowrap hover:brightness-110 transition-all"
                >
                    Jetzt Buchen
                </Link>
            </div>

            <Footer />
        </div>
    );
}
