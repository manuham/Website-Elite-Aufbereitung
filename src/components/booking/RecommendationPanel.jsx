import { useRef, useEffect } from 'react';
import { Plus, ArrowUp, Sparkles, ShieldCheck, Package, ChevronDown, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

const TYPE_CONFIG = {
    upgrade:    { label: 'Upgrade',        icon: ArrowUp,     color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/25' },
    complement: { label: 'Perfekte Kombi', icon: Plus,        color: 'text-accent',     bg: 'bg-accent/10',     border: 'border-accent/25' },
    addon:      { label: 'Beliebtes Extra',icon: Sparkles,    color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/25' },
    protect:    { label: 'Langzeitschutz', icon: ShieldCheck, color: 'text-sky-400',    bg: 'bg-sky-400/10',    border: 'border-sky-400/25' },
};

function RecommendationCard({ rec, onAdd, index }) {
    const { label, icon: Icon, color, bg, border } = TYPE_CONFIG[rec.type] || TYPE_CONFIG.addon;

    return (
        <div className="group relative bg-gradient-to-b from-slate/30 to-slate/10 border border-slate/40 hover:border-accent/50 rounded-[1.25rem] p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-[0_0_24px_rgba(77,178,146,0.12)] hover:-translate-y-0.5 cursor-pointer"
            onClick={() => onAdd(rec.service)}
        >
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 rounded-[1.25rem] bg-accent/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Badge */}
            <div className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full ${bg} ${border} border`}>
                <Icon className={`w-3 h-3 ${color}`} />
                <span className={`font-mono text-[10px] ${color} uppercase tracking-wider font-semibold`}>{label}</span>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-1">
                <span className="font-sans font-bold text-[15px] text-ivory leading-tight">{rec.service.name}</span>
                <span className="font-sans text-xs text-ivory/45 leading-relaxed">{rec.reason}</span>
            </div>

            {/* Price + Add button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate/30">
                <span className="font-mono text-lg font-bold text-accent">{rec.service.price}</span>
                <div className="flex items-center gap-2 bg-accent/15 group-hover:bg-accent group-hover:text-obsidian text-accent px-4 py-2 rounded-full transition-all duration-200">
                    <Plus className="w-3.5 h-3.5" />
                    <span className="font-sans font-bold text-xs">Hinzufügen</span>
                </div>
            </div>
        </div>
    );
}

function PackageSuggestionBanner({ suggestion, onAccept }) {
    const bannerRef = useRef(null);
    const pulseRef = useRef(null);

    useEffect(() => {
        if (!bannerRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(bannerRef.current,
                { opacity: 0, y: 15, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out' }
            );
            // Subtle pulse on the savings badge
            if (pulseRef.current) {
                gsap.fromTo(pulseRef.current,
                    { scale: 1 },
                    { scale: 1.05, duration: 0.8, ease: 'power1.inOut', yoyo: true, repeat: 2 }
                );
            }
        });
        return () => ctx.revert();
    }, []);

    return (
        <div ref={bannerRef} className="relative overflow-hidden bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 border border-accent/30 rounded-[1.5rem] p-6">
            {/* Background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Savings badge */}
                    <div ref={pulseRef} className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/40 flex flex-col items-center justify-center shrink-0">
                        <span className="font-mono text-lg font-black text-accent leading-none">€{suggestion.savings}</span>
                        <span className="font-mono text-[8px] text-accent/70 uppercase tracking-wider">gespart</span>
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-sans font-bold text-base text-ivory">
                            {suggestion.package.name}
                        </span>
                        <span className="font-sans text-xs text-ivory/40">
                            Alles in einem Paket für{' '}
                            <span className="font-mono text-accent font-bold">{suggestion.package.price}</span>{' '}
                            statt <span className="line-through text-ivory/30">€{suggestion.currentCost.toLocaleString('de-AT')},–</span>
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => onAccept(suggestion.package, suggestion.replaces)}
                    className="btn-magnetic bg-accent text-obsidian px-7 py-3 rounded-full font-sans font-bold text-sm whitespace-nowrap shadow-[0_0_20px_rgba(77,178,146,0.3)] flex items-center gap-2"
                >
                    Paket wählen
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default function RecommendationPanel({ recommendations, packageSuggestion, onAddService, onReplaceWithPackage }) {
    const containerRef = useRef(null);
    const gridRef = useRef(null);
    const arrowRef = useRef(null);

    // Animate the whole panel entrance + guide arrow
    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            // Guide arrow bounce
            if (arrowRef.current) {
                gsap.fromTo(arrowRef.current,
                    { y: -4, opacity: 0.4 },
                    { y: 4, opacity: 1, duration: 0.6, ease: 'power1.inOut', yoyo: true, repeat: -1 }
                );
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Animate recommendation cards on change
    useEffect(() => {
        if (!gridRef.current || recommendations.length === 0) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(gridRef.current.children,
                { opacity: 0, y: 25, scale: 0.96 },
                { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.1, ease: 'power2.out', clearProps: 'all' }
            );
        }, gridRef);

        return () => ctx.revert();
    }, [recommendations]);

    if (recommendations.length === 0 && !packageSuggestion) return null;

    return (
        <div ref={containerRef} className="flex flex-col gap-5 relative">
            {/* Guide arrow from selection above */}
            <div className="flex flex-col items-center gap-0">
                <div ref={arrowRef} className="flex flex-col items-center">
                    <ChevronDown className="w-5 h-5 text-accent/60" />
                </div>
                <div className="w-px h-3 bg-gradient-to-b from-accent/40 to-transparent" />
            </div>

            {/* Package savings banner */}
            {packageSuggestion && (
                <PackageSuggestionBanner
                    suggestion={packageSuggestion}
                    onAccept={onReplaceWithPackage}
                />
            )}

            {/* Contextual recommendations */}
            {recommendations.length > 0 && (
                <div>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="font-sans font-bold text-sm text-ivory/70">
                            Kunden buchen oft dazu
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-accent/20 to-transparent" />
                    </div>
                    <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {recommendations.map((rec, i) => (
                            <RecommendationCard
                                key={rec.recommend}
                                rec={rec}
                                onAdd={onAddService}
                                index={i}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
