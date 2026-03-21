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
                                ? 'bg-accent text-obsidian shadow-[0_0_20px_rgba(77,178,146,0.3)]'
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
                    {packages.map((pkg, i) => (
                        <div
                            key={`${activeTab}-${i}`}
                            className={`relative flex flex-col gap-8 rounded-[2rem] p-6 sm:p-8 md:p-10 transition-transform duration-500 group ${pkg.popular
                                ? 'bg-obsidian border-2 border-accent shadow-[0_10px_40px_-5px_rgba(77,178,146,0.3)] lg:scale-105 z-10'
                                : pkg.badge
                                    ? 'bg-obsidian border-2 border-champagne shadow-[0_10px_40px_-5px_rgba(77,178,146,0.2)] lg:scale-105 z-10'
                                    : 'bg-slate/40 border border-slate/80 hover:border-slate/100 z-0'
                                }`}
                        >
                            {pkg.popular && !pkg.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-obsidian px-5 py-1.5 rounded-full font-sans font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                                    Beliebtestes Paket
                                </div>
                            )}

                            {pkg.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-obsidian px-5 py-1.5 rounded-full font-sans font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                                    {pkg.badge}
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <h3 className="font-sans font-bold text-2xl sm:text-3xl text-ivory tracking-tight">{pkg.name}</h3>

                                {/* Includes tags for All-in-One */}
                                {pkg.includes && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {pkg.includes.map(inc => (
                                            <span key={inc} className="font-mono text-[10px] text-ivory/50 border border-slate/60 rounded-full px-2.5 py-0.5">{inc}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-end gap-3 mt-2">
                                    <div className="font-mono text-3xl sm:text-4xl text-accent font-bold">
                                        {pkg.price}
                                    </div>
                                    {pkg.savings && (
                                        <span className="font-sans text-xs text-accent/80 bg-accent/10 px-3 py-1 rounded-full mb-1">{pkg.savings}</span>
                                    )}
                                </div>
                            </div>

                            <ul className="flex flex-col gap-4 flex-1">
                                {pkg.features.map((feat, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" strokeWidth={2.5} />
                                        <span className="font-sans text-sm text-ivory/80 leading-relaxed font-medium">{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                to="/buchen"
                                className={`w-full py-4 rounded-full font-sans font-bold text-sm transition-all shadow-lg text-center block ${pkg.popular || pkg.badge
                                    ? 'bg-accent text-obsidian hover:bg-ivory hover:text-obsidian'
                                    : 'bg-transparent text-ivory border border-ivory/20 hover:border-ivory/80 hover:bg-ivory/5'
                                    }`}
                            >
                                Termin Vereinbaren
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="w-full bg-slate/30 border border-slate/50 rounded-2xl p-6 sm:p-8 mt-12 text-center">
                    <p className="font-sans text-[13px] sm:text-sm text-ivory/60 leading-relaxed mx-auto max-w-3xl">
                        <strong className="text-ivory/80 block mb-2">Wichtiger Hinweis zu unseren Preisen:</strong>
                        Alle angegebenen Preise verstehen sich inklusive MwSt und sind Richtpreise. Die Einstiegspreise gelten für durchschnittlich verschmutzte Stadtautos und Pkws. Größere Fahrzeuge wie SUVs, Kombis und Vans erfordern aufgrund der größeren Flächen einen Aufpreis. Transporter, LKWs oder Extremverschmutzungen kalkulieren wir gerne individuell auf Anfrage. Der finale Endpreis basiert stets auf dem tatsächlichen Arbeitsaufwand und Verschmutzungsgrad Ihres Fahrzeugs.
                    </p>
                    <p className="font-sans text-[13px] sm:text-sm text-ivory/60 leading-relaxed mx-auto max-w-3xl mt-3">
                        <span className="inline-flex items-center gap-1.5 bg-champagne text-obsidian px-3 py-1 rounded-full font-sans text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(77,178,146,0.6)] animate-pulse mr-2">NEU</span>
                        Alle Services sind auch als <strong className="text-ivory/80">Mobiler Service</strong> verfügbar — wir kommen mit unserem voll ausgestatteten Van direkt zu Ihnen.
                    </p>
                </div>

            </div>
        </section>
    );
}
