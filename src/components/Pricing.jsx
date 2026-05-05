import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { serviceCategories, allInOnePackages } from '../data/services';

const ALL_IN_ONE_TAB = 'allinone';

export default function Pricing() {
    const [activeTab, setActiveTab] = useState(serviceCategories[0].id);
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
        ...serviceCategories.map(c => ({ id: c.id, title: c.title })),
        { id: ALL_IN_ONE_TAB, title: '✦ All-in-One' },
    ];

    const packages = isAllInOne ? allInOnePackages : (activeCategory?.packages || []);

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

                {/* Pricing Cards Grid */}
                <div
                    ref={contentRef}
                    className={`grid grid-cols-1 gap-12 md:gap-6 lg:gap-8 w-full items-stretch mt-4 ${isAllInOne
                        ? 'md:grid-cols-2 lg:grid-cols-4'
                        : 'md:grid-cols-2 lg:grid-cols-3'
                        }`}
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

                                {/* Includes tags for All-in-One */}
                                {pkg.includes && (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {pkg.includes.map(inc => (
                                            <span key={inc} className="font-mono text-[10px] text-ivory/60 bg-white/5 border border-ivory/10 rounded-full px-3 py-1 shadow-inner">{inc}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-end gap-3 mt-3">
                                    <div className="font-mono text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-glow font-black drop-shadow-md">
                                        {pkg.price}
                                    </div>
                                    {pkg.savings && (
                                        <span className="font-sans text-xs font-bold text-accent/90 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full mb-1 sm:mb-2">{pkg.savings}</span>
                                    )}
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

                <div className="w-full bg-slate/30 border border-slate/50 rounded-2xl p-6 sm:p-8 mt-12 text-center">
                    <p className="font-sans text-[13px] sm:text-sm text-ivory/60 leading-relaxed mx-auto max-w-3xl">
                        <strong className="text-ivory/80 block mb-2">Wichtiger Hinweis zu unseren Preisen:</strong>
                        Alle angegebenen Preise verstehen sich inklusive MwSt und sind Richtpreise. Die Einstiegspreise gelten für durchschnittlich verschmutzte Stadtautos und Pkws. Größere Fahrzeuge wie SUVs, Kombis und Vans erfordern aufgrund der größeren Flächen einen Aufpreis. Transporter, LKWs oder Extremverschmutzungen kalkulieren wir gerne individuell auf Anfrage. Der finale Endpreis basiert stets auf dem tatsächlichen Arbeitsaufwand und Verschmutzungsgrad Ihres Fahrzeugs.
                    </p>
                    <p className="font-sans text-[13px] sm:text-sm text-ivory/60 leading-relaxed mx-auto max-w-3xl mt-3">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-obsidian px-3 py-1 rounded-full font-sans text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse mr-2">NEU</span>
                        Alle Services sind auch als <strong className="text-ivory/80">Mobiler Service</strong> verfügbar — wir kommen mit unserem voll ausgestatteten Van direkt zu Ihnen.
                    </p>
                </div>

            </div>
        </section>
    );
}
