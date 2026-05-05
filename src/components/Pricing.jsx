import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Gift } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { serviceCategories, tierPackages } from '../data/services';

const ALL_IN_ONE_TAB = 'allinone';

export default function Pricing() {
    const [activeTab, setActiveTab] = useState(ALL_IN_ONE_TAB);
    const contentRef = useRef(null);
    const tabsRef = useRef(null);

    const isAllInOne = activeTab === ALL_IN_ONE_TAB;
    const activeCategory = serviceCategories.find(cat => cat.id === activeTab);

    // Animate content when tab changes
    useEffect(() => {
        if (!contentRef.current) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(contentRef.current.children,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", clearProps: "all" }
            );
        }, contentRef);

        return () => ctx.revert();
    }, [activeTab]);

    const tabs = [
        { id: ALL_IN_ONE_TAB, title: '✦ Pakete' },
        ...serviceCategories.map(c => ({ id: c.id, title: c.title })),
    ];

    const packages = isAllInOne ? [] : (activeCategory?.packages || []);

    return (
        <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 xl:px-16 bg-background relative overflow-hidden">
            <div className="mx-auto flex flex-col gap-16 items-center">

                {/* Header */}
                <div className="flex flex-col gap-4 items-center text-center">
                    <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest">Unsere Pakete</h3>
                    <h2 className="font-drama italic text-4xl sm:text-5xl lg:text-6xl text-ivory">
                        Services & <span className="text-accent relative inline-block">Preise<span className="absolute bottom-1 left-0 w-full h-px bg-accent" /></span>
                    </h2>
                </div>

                {/* Tab Navigation */}
                <div
                    ref={tabsRef}
                    className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-3 w-full overflow-x-auto pb-4 md:pb-0 px-2 md:px-0 snap-x hide-scrollbar"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap shrink-0 snap-center px-6 py-3 rounded-full font-sans font-bold text-sm transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-accent text-obsidian shadow-md'
                                : 'bg-slate/50 text-ivory/70 border border-ivory/10 hover:border-ivory/30 hover:text-ivory'
                                }`}
                        >
                            {tab.title}
                        </button>
                    ))}
                </div>

                {/* Subtitle / Description for the active category */}
                {isAllInOne && (
                    <div className="text-center font-sans text-ivory/70 max-w-2xl mx-auto -mt-6">
                        Kombinieren & sparen — unsere beliebtesten Leistungen im Paket.
                    </div>
                )}
                {activeCategory?.subtitle && (
                    <div className="text-center font-sans text-ivory/70 max-w-2xl mx-auto -mt-6">
                        {activeCategory.subtitle}
                    </div>
                )}

                {/* Tier Packages (All-in-One tab) */}
                {isAllInOne && (
                    <div
                        ref={contentRef}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-5 w-full items-start mt-4"
                    >
                        {tierPackages.map((pkg) => {
                            const isElite = pkg.id === 'tier-elite';
                            return (
                                <div
                                    key={pkg.id}
                                    className={`relative flex flex-col rounded-[1.5rem] overflow-hidden transition-all duration-700 ease-out hover:-translate-y-2 group ${isElite ? 'shadow-xl shadow-accent/10 border border-accent/30' : 'border border-ivory/10'} bg-ivory`}
                                >
                                    {/* Colored Header */}
                                    <div className={`px-6 pt-6 pb-5 bg-gradient-to-br ${pkg.headerGradient}`}>
                                        <div className="flex items-center gap-1.5 mb-3">
                                            {pkg.dots > 0 ? (
                                                Array.from({ length: pkg.dots }).map((_, i) => (
                                                    <span key={i} className="w-2.5 h-2.5 rounded-full bg-white/80" />
                                                ))
                                            ) : (
                                                <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                                            )}
                                            <span className="font-sans font-black text-xs uppercase tracking-widest text-white/90 ml-1">{pkg.tier}</span>
                                        </div>
                                        <h3 className="font-drama italic text-3xl sm:text-4xl text-white leading-tight">{pkg.name}</h3>
                                        <p className="font-sans text-[13px] text-white/70 mt-1.5 leading-snug">{pkg.subtitle}</p>
                                    </div>

                                    {/* Price */}
                                    <div className="px-6 pt-6 pb-4 border-b border-obsidian/10">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className={`font-mono text-3xl sm:text-4xl font-black ${isElite ? 'text-accent' : 'text-obsidian'}`}>
                                                {pkg.price}
                                            </span>
                                            <span className="font-sans text-xs text-obsidian/50">€ zzgl. MwSt.</span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <ul className="flex flex-col gap-3 px-6 pt-5 pb-6 flex-1">
                                        {pkg.features.map((feat, idx) => {
                                            if (feat.section) {
                                                return (
                                                    <li key={idx} className="font-sans font-bold text-xs uppercase tracking-widest text-bronze mt-2 first:mt-0">
                                                        {feat.section}
                                                    </li>
                                                );
                                            }
                                            return (
                                                <li key={idx} className="flex items-start gap-2.5">
                                                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isElite ? 'text-accent' : 'text-obsidian/40'}`} strokeWidth={2.5} />
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className={`font-sans text-[13px] leading-snug ${feat.bold ? 'font-bold text-obsidian' : feat.muted ? 'text-obsidian/40' : 'text-obsidian/80'}`}>
                                                            {feat.text}
                                                            {feat.badge && (
                                                                <span className="inline-block ml-2 font-mono text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded align-middle">
                                                                    {feat.badge}
                                                                </span>
                                                            )}
                                                        </span>
                                                        {feat.sub && (
                                                            <span className="font-sans text-[11px] text-obsidian/50 leading-snug">{feat.sub}</span>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {/* Gift (Elite only) */}
                                    {pkg.gift && (
                                        <div className="mx-5 mb-4 bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
                                            <Gift className="w-8 h-8 text-accent shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="font-sans font-bold text-sm text-accent">{pkg.gift.title}</span>
                                                <span className="font-sans text-[11px] text-obsidian/50">{pkg.gift.description}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* CTA */}
                                    <div className="px-5 pb-6">
                                        <Link
                                            to={isElite ? '/mobiler-service' : '/buchen'}
                                            className={`relative w-full py-3.5 rounded-full font-sans font-bold text-[14px] transition-all duration-500 overflow-hidden text-center block ${isElite
                                                ? 'bg-accent text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                                                : 'bg-transparent text-obsidian border border-obsidian/20 hover:border-obsidian/50 hover:bg-obsidian/5'
                                            } group/btn`}
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {pkg.ctaLabel || 'Buchen'}
                                                <span className="group-hover/btn:translate-x-1 transition-transform">↗</span>
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Individual Service Cards (other tabs) */}
                {!isAllInOne && (
                    <div
                        ref={contentRef}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-6 lg:gap-8 w-full items-stretch mt-4"
                    >
                        {packages.map((pkg, i) => {
                            const isPremium = pkg.popular || pkg.badge;
                            return (
                            <div
                                key={`${activeTab}-${i}`}
                                className={`relative flex flex-col gap-8 rounded-[2rem] p-6 sm:p-8 md:p-10 transition-all duration-700 ease-out hover:-translate-y-2 group ${isPremium
                                    ? 'bg-gradient-to-b from-slate/60 to-obsidian border border-accent/40 shadow-xl lg:scale-105 z-10 hover:shadow-2xl hover:border-accent'
                                    : 'glass-card border-slate/50 hover:border-ivory/20 hover:bg-slate/30 z-0'
                                    }`}
                            >
                                {isPremium && (
                                    <div className="absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 bg-accent/10 border border-accent/30 backdrop-blur-md text-accent px-5 py-1.5 rounded-full font-sans font-black text-[10px] sm:text-xs uppercase tracking-widest whitespace-nowrap shadow-sm">
                                        {pkg.popular ? 'Beliebtestes Paket' : pkg.badge}
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    <h3 className="font-sans font-extrabold text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-ivory to-ivory/70 tracking-tight">{pkg.name}</h3>

                                    <div className="flex items-end gap-3 mt-3">
                                        <div className="font-mono text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-glow font-black drop-shadow-md">
                                            {pkg.price}
                                        </div>
                                    </div>
                                </div>

                                <ul className="flex flex-col gap-4 flex-1 mt-2">
                                    {pkg.features.map((feat, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" strokeWidth={2.5} />
                                            <span className="font-sans text-sm text-ivory/80 leading-relaxed font-medium">{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    to="/buchen"
                                    className={`relative mt-4 w-full py-4 rounded-full font-sans font-bold text-[15px] transition-all duration-500 overflow-hidden text-center block ${isPremium
                                        ? 'bg-accent text-obsidian shadow-lg hover:shadow-xl hover:scale-[1.02]'
                                        : 'bg-transparent text-ivory border border-ivory/20 hover:border-ivory/60 hover:bg-ivory/10'
                                        } group/btn`}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Termin Vereinbaren
                                        <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                                    </span>
                                    {isPremium && (
                                        <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                                    )}
                                </Link>
                            </div>
                        );})}
                    </div>
                )}

                <div className="w-full bg-slate/30 border border-slate/50 rounded-2xl p-6 sm:p-8 mt-12 text-center">
                    <p className="font-sans text-[13px] sm:text-sm text-ivory/60 leading-relaxed mx-auto max-w-3xl">
                        <strong className="text-ivory/80 block mb-2">Wichtiger Hinweis zu unseren Preisen:</strong>
                        Alle angegebenen Preise verstehen sich inklusive MwSt und sind Richtpreise. Die Einstiegspreise gelten für durchschnittlich verschmutzte Stadtautos und Pkws. Größere Fahrzeuge wie SUVs, Kombis und Vans erfordern aufgrund der größeren Flächen einen Aufpreis. Transporter, LKWs oder Extremverschmutzungen kalkulieren wir gerne individuell auf Anfrage. Der finale Endpreis basiert stets auf dem tatsächlichen Arbeitsaufwand und Verschmutzungsgrad Ihres Fahrzeugs.
                    </p>
                    <p className="font-sans text-[13px] sm:text-sm text-ivory/60 leading-relaxed mx-auto max-w-3xl mt-3">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-obsidian px-3 py-1 rounded-full font-sans text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse mr-2">NEU</span>
                        Alle Services sind auch als <strong className="text-ivory/80">Mobiler Service</strong> verfügbar — wir kommen mit unserem voll ausgestatteten Van direkt zu Ihnen.
                        <strong className="text-ivory/80"> Anfahrtspauschale: 50 €.</strong>
                    </p>
                </div>

            </div>
        </section>
    );
}
