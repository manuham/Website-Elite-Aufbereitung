import { useRef, useEffect } from 'react';
import { Plus, ArrowUp, Sparkles, ShieldCheck, Package } from 'lucide-react';
import gsap from 'gsap';

const TYPE_CONFIG = {
    upgrade:    { label: 'Upgrade',    icon: ArrowUp },
    complement: { label: 'Ergänzung',  icon: Plus },
    addon:      { label: 'Extra',      icon: Sparkles },
    protect:    { label: 'Schutz',     icon: ShieldCheck },
};

function RecommendationCard({ rec, onAdd }) {
    const { label, icon: Icon } = TYPE_CONFIG[rec.type] || TYPE_CONFIG.addon;

    return (
        <div className="group bg-slate/20 border border-accent/15 hover:border-accent/40 rounded-[1.25rem] p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-[0_0_12px_rgba(77,178,146,0.08)]">
            {/* Badge */}
            <div className="flex items-center gap-1.5">
                <Icon className="w-3 h-3 text-accent/70" />
                <span className="font-mono text-[10px] text-accent/70 uppercase tracking-wider">{label}</span>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-1.5">
                <span className="font-sans font-semibold text-sm text-ivory leading-tight">{rec.service.name}</span>
                <span className="font-sans text-xs text-ivory/40 leading-relaxed">{rec.reason}</span>
            </div>

            {/* Price + Add button */}
            <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-sm font-bold text-accent">{rec.service.price}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onAdd(rec.service); }}
                    className="w-8 h-8 rounded-full bg-accent/15 hover:bg-accent/30 flex items-center justify-center transition-colors"
                >
                    <Plus className="w-4 h-4 text-accent" />
                </button>
            </div>
        </div>
    );
}

function PackageSuggestionBanner({ suggestion, onAccept }) {
    const bannerRef = useRef(null);

    useEffect(() => {
        if (!bannerRef.current) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(bannerRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
            );
        });
        return () => ctx.revert();
    }, []);

    return (
        <div ref={bannerRef} className="bg-accent/5 border border-accent/25 rounded-[1.5rem] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-accent" />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-sans font-bold text-sm text-ivory">
                        €{suggestion.savings},– sparen mit dem {suggestion.package.name}
                    </span>
                    <span className="font-sans text-xs text-ivory/40">
                        Alle gewählten Services in einem Paket für nur{' '}
                        <span className="font-mono text-accent">{suggestion.package.price}</span>{' '}
                        statt €{suggestion.currentCost.toLocaleString('de-AT')},–
                    </span>
                </div>
            </div>
            <button
                onClick={() => onAccept(suggestion.package, suggestion.replaces)}
                className="btn-magnetic bg-accent text-obsidian px-6 py-2.5 rounded-full font-sans font-bold text-xs whitespace-nowrap shadow-[0_0_12px_rgba(77,178,146,0.2)]"
            >
                Paket wählen
            </button>
        </div>
    );
}

export default function RecommendationPanel({ recommendations, packageSuggestion, onAddService, onReplaceWithPackage }) {
    const gridRef = useRef(null);

    // Animate recommendation cards on change
    useEffect(() => {
        if (!gridRef.current || recommendations.length === 0) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(gridRef.current.children,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', clearProps: 'all' }
            );
        }, gridRef);

        return () => ctx.revert();
    }, [recommendations]);

    if (recommendations.length === 0 && !packageSuggestion) return null;

    return (
        <div className="flex flex-col gap-4">
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
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-accent" />
                        <span className="font-sans font-bold text-xs text-ivory/50 uppercase tracking-widest">
                            Passend zu Ihrer Auswahl
                        </span>
                    </div>
                    <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {recommendations.map(rec => (
                            <RecommendationCard
                                key={rec.recommend}
                                rec={rec}
                                onAdd={onAddService}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
