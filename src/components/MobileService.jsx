import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Truck, Clock, ShieldCheck } from 'lucide-react';

const benefits = [
    { icon: Truck, title: 'Wir kommen zu Ihnen', desc: 'Kein Weg, kein Stress' },
    { icon: Clock, title: 'Flexible Termine', desc: 'Mo–Sa, auch nach Feierabend' },
    { icon: ShieldCheck, title: 'Gleicher Service', desc: 'Identische Qualität & Produkte' },
];

export default function MobileService() {
    const containerRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.mobile-badge', {
                scrollTrigger: { trigger: containerRef.current, start: 'top 80%' },
                scale: 0, opacity: 0, duration: 0.6, ease: 'back.out(2)',
            });
            gsap.from('.mobile-image', {
                scrollTrigger: { trigger: containerRef.current, start: 'top 80%' },
                x: -60, opacity: 0, duration: 1.2, ease: 'power3.out',
            });
            gsap.from('.mobile-text', {
                scrollTrigger: { trigger: containerRef.current, start: 'top 75%' },
                y: 40, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
            });
            gsap.from('.mobile-benefit', {
                scrollTrigger: { trigger: containerRef.current, start: 'top 65%' },
                y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            id="mobile-service"
            ref={containerRef}
            className="py-24 sm:py-32 px-6 sm:px-12 lg:px-24 bg-obsidian relative overflow-hidden"
        >
            {/* Subtle radial glow & Premium Light Leaks */}
            <div className="absolute inset-x-0 inset-y-[-20%] pointer-events-none overflow-hidden mix-blend-screen opacity-30">
                <div className="absolute top-1/2 left-[10%] -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />
                <div className="absolute top-1/3 right-[10%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">

                {/* Left — Image */}
                <div className="mobile-image relative rounded-[2rem] overflow-hidden h-[360px] sm:h-[420px] lg:h-[500px] shadow-2xl group transform-gpu border border-ivory/5">
                    <img
                        src="/assets/VAN/VAN.png"
                        alt="Mobiler Aufbereitungsservice"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 via-obsidian/20 to-transparent mix-blend-multiply" />
                    <span className="mobile-badge absolute top-6 left-6 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md text-emerald-400 px-5 py-2 rounded-full font-sans font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse">
                        Neu
                    </span>
                </div>

                {/* Right — Content */}
                <div className="flex flex-col gap-8 relative z-10">
                    <div className="flex flex-col gap-4">
                        <span className="mobile-text font-sans text-[11px] sm:text-xs uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-glow font-black drop-shadow-sm">
                            Neu bei Elite
                        </span>
                        <h2 className="mobile-text font-drama italic text-4xl sm:text-5xl lg:text-6xl text-ivory">
                            Wir kommen{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-glow relative inline-block drop-shadow-lg">
                                zu Ihnen.
                            </span>
                        </h2>
                        <p className="mobile-text font-sans text-sm sm:text-base text-ivory/60 leading-relaxed max-w-lg">
                            Ab sofort bieten wir unseren kompletten Service auch mobil an.
                            Unser voll ausgestatteter Aufbereitungs-Van kommt direkt zu Ihnen
                            nach Hause oder ins Büro — <strong className="font-medium text-ivory/80">bequem und ohne Aufwand.</strong>
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {benefits.map((b) => (
                            <div
                                key={b.title}
                                className="mobile-benefit glass-card rounded-xl p-5 flex flex-col gap-3 group/benefit hover:-translate-y-1 transition-transform duration-300"
                            >
                                <b.icon className="w-6 h-6 text-accent group-hover/benefit:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                                <div className="flex flex-col gap-1 mt-1">
                                    <span className="font-sans font-bold text-[13px] text-ivory group-hover/benefit:text-accent transition-colors">{b.title}</span>
                                    <span className="font-sans text-[11px] text-ivory/50 leading-snug">{b.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Anfahrtspauschale */}
                    <div className="mobile-benefit bg-accent/5 border border-accent/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                        <span className="font-mono text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-glow shrink-0">50 €</span>
                        <div className="flex flex-col gap-1">
                            <span className="font-sans font-bold text-sm text-ivory">Anfahrtspauschale</span>
                            <span className="font-sans text-[13px] text-ivory/60 leading-relaxed">
                                Du sparst dir 2 Autofahrten, Wartezeit und den Nachmittag. Wir arbeiten, während du arbeitest.
                            </span>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mobile-text mt-2 sm:mt-4 w-full sm:w-auto">
                        <Link
                            to="/mobiler-service"
                            className="btn-magnetic relative overflow-hidden group/btn bg-accent backdrop-blur-md border border-accent/50 text-obsidian px-10 py-4 sm:py-5 rounded-full font-sans font-black tracking-wide text-sm sm:text-[15px] shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-3 w-full sm:w-fit transition-all duration-500"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Mobilen Termin Buchen
                                <Truck className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-20deg] group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
