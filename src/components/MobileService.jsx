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
            {/* Subtle radial glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-champagne/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">

                {/* Left — Image */}
                <div className="mobile-image relative rounded-[2rem] overflow-hidden h-[360px] sm:h-[420px] lg:h-[500px]">
                    <img
                        src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900&q=80"
                        alt="Mobiler Aufbereitungsservice"
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/60 via-transparent to-transparent" />
                    <span className="mobile-badge absolute top-6 left-6 inline-flex items-center gap-2 bg-champagne text-obsidian px-4 py-2 rounded-full font-sans font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(77,178,146,0.4)] animate-pulse">
                        Neu
                    </span>
                </div>

                {/* Right — Content */}
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <span className="mobile-text font-sans text-xs uppercase tracking-widest text-champagne font-bold">
                            Neu bei Elite
                        </span>
                        <h2 className="mobile-text font-drama italic text-4xl sm:text-5xl text-ivory">
                            Wir kommen{' '}
                            <span className="text-champagne relative inline-block">
                                zu Ihnen.
                                <span className="absolute bottom-1 left-0 w-full h-px bg-champagne" />
                            </span>
                        </h2>
                        <p className="mobile-text font-sans text-base text-ivory/60 leading-relaxed max-w-lg">
                            Ab sofort bieten wir unseren kompletten Service auch mobil an.
                            Unser voll ausgestatteter Aufbereitungs-Van kommt direkt zu Ihnen
                            nach Hause oder ins Büro — bequem und ohne Aufwand.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {benefits.map((b) => (
                            <div
                                key={b.title}
                                className="mobile-benefit bg-slate/30 border border-slate/50 rounded-xl p-4 flex flex-col gap-2"
                            >
                                <b.icon className="w-5 h-5 text-champagne" strokeWidth={1.5} />
                                <span className="font-sans font-bold text-sm text-ivory">{b.title}</span>
                                <span className="font-sans text-xs text-ivory/50">{b.desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mobile-text">
                        <Link
                            to="/mobiler-service"
                            className="btn-magnetic inline-flex items-center gap-2 bg-champagne text-obsidian px-8 py-4 rounded-full font-sans font-bold text-sm shadow-[0_0_20px_rgba(77,178,146,0.3)]"
                        >
                            Mobilen Termin Buchen
                            <Truck className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
