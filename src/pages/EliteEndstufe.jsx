import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Gift, Shield, Sparkles, ArrowRight, Phone, Clock, Droplets, Star, Gem, Car, CircleDot, Handshake } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { tierPackages } from '../data/services';

gsap.registerPlugin(ScrollTrigger);

const elite = tierPackages.find(p => p.id === 'tier-elite');

// Map feature text to icons for visual interest
const featureIcons = {
    '3-Gang Politur': Sparkles,
    'FIREBALL Keramikbeschichtung': Shield,
    'Felgen zerlegt, poliert & beschichtet': CircleDot,
    'Bremssättel beschichtet': Car,
    'Einstiege poliert & beschichtet': Gem,
    'Ledersitze Keramikbeschichtung': Star,
    'Kunststoffteile beschichtet (UV-Schutz)': Shield,
    'Stoff- & Textilbeschichtung': Droplets,
    'Persönliche Übergabe & Pflegeberatung': Handshake,
};

const processSteps = [
    { num: '01', title: 'Beratung', description: 'Persönliche Analyse Ihres Fahrzeugs und individuelle Abstimmung aller Details.', icon: Phone },
    { num: '02', title: 'Vorbereitung', description: 'Dekontamination, Tonbehandlung und professionelle Tiefenreinigung innen & aussen.', icon: Droplets },
    { num: '03', title: 'Aufbereitung', description: '3-Gang Politur, FIREBALL Keramikbeschichtung, Felgen, Leder — jedes Detail perfektioniert.', icon: Sparkles },
    { num: '04', title: 'Übergabe', description: 'Persönliche Übergabe mit Pflegeberatung und Ihrem exklusiven Pflegegeschenk.', icon: Gift },
];

export default function EliteEndstufe() {
    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const galleryRef = useRef(null);
    const processRef = useRef(null);
    const giftRef = useRef(null);
    const ctaRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero animations
            gsap.from('.hero-anim', {
                y: 40, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.3,
            });

            // Section reveals
            const sections = [featuresRef, galleryRef, processRef, giftRef, ctaRef];
            sections.forEach(ref => {
                if (!ref.current) return;
                gsap.from(ref.current.querySelectorAll('.reveal'), {
                    scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true },
                    y: 50, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
                });
            });
        });
        return () => ctx.revert();
    }, []);

    const activeFeatures = elite.features.filter(f => !f.section && !f.muted);

    return (
        <div className="min-h-screen bg-obsidian text-ivory font-sans overflow-hidden">
            <Navbar />

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background image */}
                <div className="absolute inset-0">
                    <img
                        src="/assets/Autos/P1345640.jpg"
                        alt="Elite Aufbereitung Ergebnis"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-obsidian/95 via-obsidian/75 to-obsidian/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian/50" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 py-32 flex flex-col gap-8">
                    <div className="flex flex-col gap-6 max-w-2xl">
                        <div className="hero-anim flex items-center gap-3">
                            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                            <span className="font-mono text-xs text-champagne uppercase tracking-widest">Élite Exklusiv</span>
                        </div>

                        <h1 className="hero-anim font-drama italic text-5xl sm:text-6xl lg:text-8xl leading-[1.05]">
                            Die <span className="text-champagne">Endstufe.</span>
                        </h1>

                        <p className="hero-anim font-sans text-lg sm:text-xl text-ivory/60 leading-relaxed max-w-lg">
                            {elite.subtitle} — Das ultimative Aufbereitungspaket für Ihr Fahrzeug. Kein Detail bleibt unberührt.
                        </p>

                        <div className="hero-anim flex items-baseline gap-3">
                            <span className="font-mono text-4xl sm:text-5xl font-black text-champagne">{elite.price}</span>
                            <span className="font-sans text-sm text-ivory/40">€ Endpreis</span>
                        </div>

                        <div className="hero-anim flex flex-wrap gap-4 mt-2">
                            <Link
                                to="/buchen"
                                className="btn-magnetic inline-flex items-center gap-2 bg-champagne text-obsidian px-8 py-4 rounded-full font-sans font-bold text-sm shadow-[0_0_30px_rgba(77,178,146,0.3)] hover:brightness-110 transition-all"
                            >
                                Jetzt Buchen <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="tel:+436642546078"
                                className="inline-flex items-center gap-2 border border-ivory/30 hover:border-champagne/50 text-ivory/80 hover:text-ivory px-8 py-4 rounded-full font-sans text-sm transition-colors backdrop-blur-sm"
                            >
                                <Phone className="w-4 h-4" /> Anrufen
                            </a>
                        </div>
                    </div>

                    {/* Floating stats */}
                    <div className="hero-anim flex flex-wrap gap-6 mt-8">
                        {[
                            { value: '40.000+', label: 'km Schutz' },
                            { value: '3-Gang', label: 'Politur' },
                            { value: '100%', label: 'Handarbeit' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-obsidian/50 backdrop-blur-sm border border-ivory/10 rounded-2xl px-6 py-4">
                                <span className="font-mono text-2xl font-bold text-champagne block">{stat.value}</span>
                                <span className="font-sans text-xs text-ivory/50">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
                    <span className="font-mono text-[10px] text-ivory/30 uppercase tracking-widest">Entdecken</span>
                    <div className="w-px h-8 bg-gradient-to-b from-champagne/60 to-transparent" />
                </div>
            </section>

            {/* ── Gold-Paket Callout ───────────────────────────────────── */}
            <section className="px-6 sm:px-12 lg:px-24 py-16">
                <div className="max-w-5xl mx-auto">
                    <div className="reveal bg-gradient-to-r from-[#996515]/20 via-[#B8860B]/10 to-[#DAA520]/20 border border-[#B8860B]/30 rounded-[2rem] px-8 py-6 flex items-center gap-6 flex-wrap">
                        <div className="w-12 h-12 rounded-xl bg-[#B8860B]/20 border border-[#B8860B]/40 flex items-center justify-center shrink-0">
                            <Check className="w-6 h-6 text-[#DAA520]" strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                            <span className="font-sans font-bold text-lg text-ivory">Beinhaltet das komplette Gold-Paket</span>
                            <span className="font-sans text-sm text-ivory/50">Alle Leistungen aus Bronze, Silber & Gold sind bereits inkludiert — plus exklusive Extras.</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features Grid ─────────────────────────────────────── */}
            <section ref={featuresRef} className="px-6 sm:px-12 lg:px-24 py-24 sm:py-32">
                <div className="max-w-7xl mx-auto">
                    <div className="reveal flex flex-col gap-3 mb-16">
                        <span className="font-mono text-xs text-champagne uppercase tracking-widest">Was ist enthalten</span>
                        <h2 className="font-drama italic text-4xl sm:text-5xl lg:text-6xl">
                            Alles. Ohne <span className="text-champagne">Kompromiss.</span>
                        </h2>
                        <p className="font-sans text-ivory/50 text-lg max-w-2xl mt-2">
                            Jede Oberfläche wird perfektioniert, jedes Material geschützt. Von der 3-Gang Politur bis zur FIREBALL Keramikbeschichtung — hier wird nichts dem Zufall überlassen.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeFeatures.map((feat, idx) => {
                            const IconComp = featureIcons[feat.text] || Sparkles;
                            return (
                                <div
                                    key={idx}
                                    className="reveal bg-slate/30 border border-slate/50 rounded-[2rem] p-8 flex flex-col gap-4 hover:border-champagne/30 transition-colors group"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-champagne/10 border border-champagne/30 flex items-center justify-center group-hover:bg-champagne/20 transition-colors">
                                        <IconComp className="w-7 h-7 text-champagne" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="font-sans font-bold text-xl text-ivory">{feat.text}</h3>
                                    {feat.sub && (
                                        <p className="font-sans text-sm text-ivory/50 leading-relaxed">{feat.sub}</p>
                                    )}
                                    {feat.badge && (
                                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold bg-champagne/10 text-champagne border border-champagne/30 px-3 py-1 rounded-full w-fit">
                                            <Shield className="w-3 h-3" /> {feat.badge}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Gallery ───────────────────────────────────────────── */}
            <section ref={galleryRef} className="px-6 sm:px-12 lg:px-24 py-24 sm:py-32 bg-slate/20">
                <div className="max-w-7xl mx-auto">
                    <div className="reveal flex flex-col gap-3 mb-16">
                        <span className="font-mono text-xs text-champagne uppercase tracking-widest">Ergebnisse</span>
                        <h2 className="font-drama italic text-4xl sm:text-5xl lg:text-6xl">
                            Perfektion im <span className="text-champagne">Detail.</span>
                        </h2>
                    </div>

                    <div className="reveal grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:h-[600px]">
                        {/* Main large image */}
                        <div className="lg:col-span-2 lg:row-span-2 rounded-[1.75rem] overflow-hidden relative group">
                            <img
                                src="/assets/Ergebnisse/P1345324.jpg"
                                alt="Elite Aufbereitung Ergebnis"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/10 to-transparent" />
                            <div className="absolute bottom-6 left-6">
                                <span className="font-mono text-[10px] text-champagne uppercase tracking-widest">3-Gang Politur</span>
                                <p className="font-sans font-bold text-xl text-ivory mt-1">Maximaler Glanz, maximaler Schutz</p>
                            </div>
                        </div>

                        {/* Top right */}
                        <div className="rounded-[1.75rem] overflow-hidden relative group">
                            <img
                                src="/assets/Ergebnisse/P1345330.jpg"
                                alt="Keramikbeschichtung Ergebnis"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/10 to-transparent" />
                            <div className="absolute bottom-4 left-4">
                                <span className="font-mono text-[10px] text-champagne uppercase tracking-widest">FIREBALL Keramik</span>
                            </div>
                        </div>

                        {/* Bottom right */}
                        <div className="rounded-[1.75rem] overflow-hidden relative group">
                            <img
                                src="/assets/Produkte/P1345425.jpg"
                                alt="Premium Produkte"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/10 to-transparent" />
                            <div className="absolute bottom-4 left-4">
                                <span className="font-mono text-[10px] text-champagne uppercase tracking-widest">Premium Produkte</span>
                            </div>
                        </div>
                    </div>

                    {/* Secondary image row */}
                    <div className="reveal grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {[
                            { src: '/assets/Ergebnisse/P1345319.jpg', label: 'Lackperfektion' },
                            { src: '/assets/Innenreinigung/P1345270.jpg', label: 'Interieur' },
                            { src: '/assets/Ergebnisse/P1345333.jpg', label: 'Spiegelglanz' },
                            { src: '/assets/Produkte/P1345452.jpg', label: 'Detailarbeit' },
                        ].map(img => (
                            <div key={img.label} className="rounded-[1.25rem] overflow-hidden relative group aspect-square">
                                <img
                                    src={img.src}
                                    alt={img.label}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 to-transparent" />
                                <span className="absolute bottom-3 left-3 font-mono text-[10px] text-champagne uppercase tracking-widest">{img.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Process ───────────────────────────────────────────── */}
            <section ref={processRef} className="px-6 sm:px-12 lg:px-24 py-24 sm:py-32">
                <div className="max-w-7xl mx-auto">
                    <div className="reveal flex flex-col gap-3 mb-16">
                        <span className="font-mono text-xs text-champagne uppercase tracking-widest">Der Ablauf</span>
                        <h2 className="font-drama italic text-4xl sm:text-5xl lg:text-6xl">
                            Vier Schritte zur <span className="text-champagne">Perfektion.</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {processSteps.map(step => (
                            <div key={step.num} className="reveal flex flex-col gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-champagne/10 border border-champagne/30 flex items-center justify-center">
                                    <step.icon className="w-7 h-7 text-champagne" strokeWidth={1.5} />
                                </div>
                                <span className="font-mono text-xs text-champagne/60 uppercase tracking-widest">{step.num}</span>
                                <h3 className="font-sans font-bold text-xl text-ivory">{step.title}</h3>
                                <p className="font-sans text-sm text-ivory/50 leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Gift Section ──────────────────────────────────────── */}
            <section ref={giftRef} className="px-6 sm:px-12 lg:px-24 py-24 sm:py-32 bg-slate/20">
                <div className="max-w-5xl mx-auto">
                    <div className="reveal bg-gradient-to-br from-obsidian via-slate/50 to-obsidian border border-champagne/20 rounded-[2.5rem] overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                            {/* Image */}
                            <div className="aspect-square md:aspect-auto md:h-full relative overflow-hidden">
                                <img
                                    src="/assets/Produkte/P1345517.jpg"
                                    alt="Pflegegeschenk"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-obsidian/30 md:bg-gradient-to-l md:from-transparent md:to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="p-10 sm:p-14 flex flex-col gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-champagne/10 border border-champagne/30 flex items-center justify-center">
                                    <Gift className="w-8 h-8 text-champagne" strokeWidth={1.5} />
                                </div>
                                <span className="font-mono text-xs text-champagne uppercase tracking-widest">Exklusiv für Sie</span>
                                <h3 className="font-drama italic text-3xl sm:text-4xl">
                                    {elite.gift.title}
                                </h3>
                                <p className="font-sans text-ivory/50 leading-relaxed">
                                    Als Dankeschön für Ihr Vertrauen erhalten Sie ein hochwertiges Pflegeset zur Heimanwendung — damit Ihr Fahrzeug auch zwischen den Aufbereitungen in Bestform bleibt.
                                </p>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {['Shampoo', 'Quickdetailer', 'Mikrofasertücher', 'Pflegeanleitung'].map(item => (
                                        <span key={item} className="font-mono text-[10px] text-champagne border border-champagne/30 rounded-full px-3 py-1 uppercase tracking-widest">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Final CTA ─────────────────────────────────────────── */}
            <section ref={ctaRef} className="px-6 sm:px-12 lg:px-24 py-24 sm:py-32">
                <div className="max-w-5xl mx-auto">
                    <div className="reveal bg-slate rounded-[2.5rem] px-8 sm:px-14 py-14 sm:py-20 flex flex-col lg:flex-row items-center justify-between gap-10 text-center lg:text-left">
                        <div className="flex flex-col gap-4 max-w-lg">
                            <span className="font-mono text-xs text-champagne uppercase tracking-widest">Bereit?</span>
                            <h2 className="font-drama italic text-4xl sm:text-5xl">
                                Bereit für die <span className="text-champagne">Endstufe?</span>
                            </h2>
                            <p className="font-sans text-ivory/50 leading-relaxed">
                                Vereinbaren Sie jetzt Ihren Termin und erleben Sie, was möglich ist, wenn kein Kompromiss gemacht wird.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                            <Link
                                to="/buchen"
                                className="btn-magnetic inline-flex items-center justify-center gap-2 bg-champagne text-obsidian px-10 py-4 rounded-full font-sans font-bold text-sm shadow-[0_0_30px_rgba(77,178,146,0.3)] hover:brightness-110 transition-all"
                            >
                                Jetzt Buchen <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="tel:+436642546078"
                                className="inline-flex items-center justify-center gap-2 border border-ivory/30 hover:border-champagne/50 text-ivory/80 hover:text-ivory px-10 py-4 rounded-full font-sans text-sm transition-colors"
                            >
                                <Phone className="w-4 h-4" /> +43 664 2546078
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
