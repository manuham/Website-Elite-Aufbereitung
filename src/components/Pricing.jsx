import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { serviceCategories } from '../data/services';

export default function Pricing() {
    const [activeTab, setActiveTab] = useState(serviceCategories[0].id);
    const contentRef = useRef(null);
    const tabsRef = useRef(null);

    // Get the currently selected category object
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

    return (
        <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-12 lg:px-24 bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col gap-16 items-center">

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
                    className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-3 w-full max-w-4xl overflow-x-auto pb-4 md:pb-0 px-2 md:px-0 snap-x hide-scrollbar"
                >
                    {serviceCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`whitespace-nowrap shrink-0 snap-center px-6 py-3 rounded-full font-sans font-bold text-sm transition-all duration-300 ${activeTab === cat.id
                                ? 'bg-accent text-obsidian shadow-[0_0_20px_rgba(77,178,146,0.3)]'
                                : 'bg-slate/50 text-ivory/70 border border-ivory/10 hover:border-ivory/30 hover:text-ivory'
                                }`}
                        >
                            {cat.title}
                        </button>
                    ))}
                </div>

                {/* Subtitle / Description for the active category */}
                {activeCategory?.subtitle && (
                    <div className="text-center font-sans text-ivory/70 max-w-2xl mx-auto -mt-6">
                        {activeCategory.subtitle}
                    </div>
                )}

                {/* Pricing Cards Grid */}
                <div
                    ref={contentRef}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-8 w-full max-w-6xl items-stretch mt-4"
                >
                    {activeCategory?.packages.map((pkg, i) => (
                        <div
                            key={`${activeTab}-${i}`}
                            className={`relative flex flex-col gap-8 rounded-[2rem] p-6 sm:p-8 md:p-10 transition-transform duration-500 group ${pkg.popular
                                ? 'bg-obsidian border-2 border-accent shadow-[0_10px_40px_-5px_rgba(77,178,146,0.3)] lg:scale-105 z-10'
                                : 'bg-slate/40 border border-slate/80 hover:border-slate/100 z-0'
                                }`}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-obsidian px-5 py-1.5 rounded-full font-sans font-bold text-xs uppercase tracking-wider whitespace-nowrap">
                                    Beliebtestes Paket
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <h3 className="font-sans font-bold text-2xl sm:text-3xl text-ivory tracking-tight">{pkg.name}</h3>
                                <div className="font-mono text-3xl sm:text-4xl text-accent font-bold mt-2">
                                    {pkg.price}
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
                                className={`w-full py-4 rounded-full font-sans font-bold text-sm transition-all shadow-lg text-center block ${pkg.popular
                                    ? 'bg-accent text-obsidian hover:bg-ivory hover:text-obsidian'
                                    : 'bg-transparent text-ivory border border-ivory/20 hover:border-ivory/80 hover:bg-ivory/5'
                                    }`}
                            >
                                Termin Vereinbaren
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="w-full max-w-4xl bg-slate/30 border border-slate/50 rounded-2xl p-6 sm:p-8 mt-12 text-center">
                    <p className="font-sans text-[13px] sm:text-sm text-ivory/60 leading-relaxed mx-auto max-w-3xl">
                        <strong className="text-ivory/80 block mb-2">Wichtiger Hinweis zu unseren Preisen:</strong>
                        Alle angegebenen Preise verstehen sich inklusive MwSt und sind Richtpreise. Die Einstiegspreise gelten für durchschnittlich verschmutzte Stadtautos und Pkws. Größere Fahrzeuge wie SUVs, Kombis und Vans erfordern aufgrund der größeren Flächen einen Aufpreis. Transporter, LKWs oder Extremverschmutzungen kalkulieren wir gerne individuell auf Anfrage. Der finale Endpreis basiert stets auf dem tatsächlichen Arbeitsaufwand und Verschmutzungsgrad Ihres Fahrzeugs.
                    </p>
                </div>

            </div>
        </section>
    );
}
