import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

const projects = [
    {
        img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&q=80',
        label: 'Keramikversiegelung',
        car: 'BMW 3er — Mineralgrau',
        tag: '5 Jahre Garantie',
    },
    {
        img: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=900&q=80',
        label: 'Vollpolitur',
        car: 'Mercedes C-Klasse — Obsidianschwarz',
        tag: 'Lackkorrektur',
    },
    {
        img: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=900&q=80',
        label: 'Premium Innenreinigung',
        car: 'Audi A4 — Cognacbraun Leder',
        tag: 'Innenaufbereitung',
    },
    {
        img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
        label: 'Felgenreinigung & Versiegelung',
        car: 'VW Golf R — 19" Felgen',
        tag: 'Detailing',
    },
    {
        img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&q=80',
        label: 'Lackkorrektur',
        car: 'Porsche Cayenne — Weißsilber',
        tag: 'Mehrstufige Politur',
    },
    {
        img: 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=900&q=80',
        label: 'Komplettaufbereitung',
        car: 'Tesla Model 3 — Perlweiß',
        tag: 'Elite Paket',
    },
];

function BeforeAfterSlider({ img, label, car, tag }) {
    const [pos, setPos] = useState(50);
    const containerRef = useRef(null);
    const dragging = useRef(false);

    const updatePos = useCallback((clientX) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
        setPos(x);
    }, []);

    const onMouseDown = (e) => { e.preventDefault(); dragging.current = true; };
    const onMouseMove = useCallback((e) => { if (dragging.current) updatePos(e.clientX); }, [updatePos]);
    const onMouseUp = useCallback(() => { dragging.current = false; }, []);
    const onTouchMove = useCallback((e) => { updatePos(e.touches[0].clientX); }, [updatePos]);

    useEffect(() => {
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);
        return () => {
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);
        };
    }, [onMouseUp, onMouseMove]);

    return (
        <div className="flex flex-col gap-4">
            {/* Slider */}
            <div
                ref={containerRef}
                className="relative overflow-hidden rounded-[1.75rem] cursor-ew-resize select-none aspect-[4/3] bg-slate"
                onTouchMove={onTouchMove}
                onTouchStart={(e) => updatePos(e.touches[0].clientX)}
            >
                {/* Before — desaturated/faded */}
                <img
                    src={img}
                    alt={`${label} vorher`}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'grayscale(0.75) contrast(0.85) brightness(0.78) saturate(0.4)' }}
                    loading="lazy"
                />

                {/* After — clipped to right of handle */}
                <div
                    className="absolute inset-0"
                    style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
                >
                    <img
                        src={img}
                        alt={`${label} nachher`}
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Divider line */}
                <div
                    className="absolute top-0 bottom-0 w-px bg-champagne/90 z-10 pointer-events-none"
                    style={{ left: `${pos}%` }}
                />

                {/* Drag handle */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 bg-champagne rounded-full z-20 flex items-center justify-center shadow-xl cursor-ew-resize"
                    style={{ left: `${pos}%` }}
                    onMouseDown={onMouseDown}
                    onTouchStart={(e) => { e.stopPropagation(); updatePos(e.touches[0].clientX); }}
                >
                    <ChevronLeft className="w-3.5 h-3.5 text-obsidian -mr-0.5" />
                    <ChevronRight className="w-3.5 h-3.5 text-obsidian -ml-0.5" />
                </div>

                {/* Vorher label */}
                <div className="absolute top-4 left-4 z-10 bg-obsidian/70 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none">
                    <span className="font-mono text-[10px] text-ivory/70 uppercase tracking-widest">Vorher</span>
                </div>

                {/* Nachher label */}
                <div className="absolute top-4 right-4 z-10 bg-champagne/90 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none">
                    <span className="font-mono text-[10px] text-obsidian font-semibold uppercase tracking-widest">Nachher</span>
                </div>
            </div>

            {/* Card info below slider */}
            <div className="flex items-start justify-between px-1">
                <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">{label}</span>
                    <p className="font-sans text-sm text-ivory/80">{car}</p>
                </div>
                <span className="text-[11px] font-sans text-ivory/40 bg-slate px-2.5 py-1 rounded-full border border-ivory/10 shrink-0 mt-0.5">
                    {tag}
                </span>
            </div>
        </div>
    );
}

export default function Projekte() {
    return (
        <div className="min-h-screen bg-obsidian text-ivory font-sans">

            {/* Back nav */}
            <div className="px-6 sm:px-12 lg:px-24 pt-10">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-ivory/50 hover:text-champagne transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zur Startseite
                </Link>
            </div>

            {/* Hero */}
            <div className="px-6 sm:px-12 lg:px-24 pt-16 pb-20 max-w-7xl mx-auto flex flex-col gap-5">
                <span className="font-mono text-xs text-champagne uppercase tracking-widest">Portfolio</span>
                <h1 className="font-drama text-5xl sm:text-6xl lg:text-7xl text-ivory leading-tight">
                    Vorher &{' '}
                    <span className="text-champagne italic">Nachher.</span>
                </h1>
                <p className="font-sans text-ivory/60 text-lg max-w-xl leading-relaxed">
                    Ziehen Sie den Regler und erleben Sie die Transformation — jedes Fahrzeug, das wir anfassen,
                    verlässt uns in neuem Glanz.
                </p>
            </div>

            {/* Grid */}
            <div className="px-6 sm:px-12 lg:px-24 pb-24 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                    {projects.map((p, i) => (
                        <BeforeAfterSlider key={i} {...p} />
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-slate mx-6 sm:mx-12 lg:mx-24 mb-16 rounded-[2.5rem] px-8 sm:px-16 py-16 flex flex-col sm:flex-row items-center justify-between gap-8 max-w-7xl lg:mx-auto">
                <div className="flex flex-col gap-2 text-center sm:text-left">
                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">Ihr Fahrzeug</span>
                    <h2 className="font-drama text-3xl sm:text-4xl text-ivory">Bereit für die Transformation?</h2>
                    <p className="font-sans text-sm text-ivory/50 max-w-sm">Buchen Sie Ihren Termin — wir kümmern uns um den Rest.</p>
                </div>
                <Link
                    to="/buchen"
                    className="shrink-0 bg-champagne text-obsidian px-8 py-4 rounded-full font-sans font-semibold text-sm whitespace-nowrap hover:brightness-110 transition-all"
                >
                    Jetzt Buchen
                </Link>
            </div>

            {/* Footer strip */}
            <div className="border-t border-ivory/10 px-6 sm:px-12 lg:px-24 py-8 text-center font-sans text-xs text-ivory/30">
                © 2026 Elité Auto Aufbereitung. Alle Rechte vorbehalten.
            </div>

        </div>
    );
}
