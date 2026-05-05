import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Clock, ShieldCheck, MapPin, Wrench, Sparkles, ArrowRight, Phone, CheckCircle } from 'lucide-react';

const steps = [
    { num: '01', title: 'Termin buchen', desc: 'Wählen Sie online Ihren Wunschtermin und die gewünschten Services aus.', icon: Clock },
    { num: '02', title: 'Wir kommen zu Ihnen', desc: 'Unser voll ausgestatteter Aufbereitungs-Van fährt direkt zu Ihrem Standort.', icon: Truck },
    { num: '03', title: 'Ergebnis genießen', desc: 'Lehnen Sie sich zurück — Ihr Fahrzeug erstrahlt in neuem Glanz.', icon: Sparkles },
];

const services = [
    { title: 'Premium Handwäsche', desc: 'Schonende Reinigung mit pH-neutralen Produkten und Mikrofasertüchern.', icon: Sparkles },
    { title: 'Innenreinigung', desc: 'Tiefenreinigung aller Oberflächen, Polster und Teppiche — wie neu.', icon: ShieldCheck },
    { title: 'Maschinenpolitur', desc: 'Entfernung von Kratzern und Swirls für spiegelnden Hochglanz.', icon: Wrench },
    { title: 'Keramikversiegelung', desc: 'Langzeitschutz mit FIREBALL Keramik — bis zu 60.000 km Garantie.', icon: ShieldCheck },
];

const benefits = [
    { title: 'Kein Weg, kein Stress', desc: 'Sparen Sie sich die Anfahrt — wir arbeiten bei Ihnen vor Ort.' },
    { title: 'Flexible Termine', desc: 'Mo–Sa, auch nach Feierabend. Wir richten uns nach Ihrem Zeitplan.' },
    { title: 'Professionelles Equipment', desc: 'Unser Van ist voll ausgestattet — identische Qualität wie im Studio.' },
    { title: 'Ganz Vorarlberg', desc: 'Wir sind in Vorarlberg und Umgebung für Sie unterwegs.' },
];


export default function MobilerService() {
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
            <div className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center overflow-hidden">
                {/* Background image */}
                <img
                    src="/assets/VAN.png"
                    alt="Mobiler Aufbereitungsservice — Elité kommt zu Ihnen"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {/* Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-obsidian/85 via-obsidian/60 to-obsidian/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian/40" />

                <div className="relative z-10 px-6 sm:px-12 lg:px-24 py-24 sm:py-32 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col gap-6 max-w-2xl">
                        <div className="flex items-center gap-3">
                            <span className="bg-champagne text-obsidian px-4 py-1.5 rounded-full font-sans font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(77,178,146,0.4)] animate-pulse">
                                Neu
                            </span>
                            <span className="font-mono text-xs text-champagne uppercase tracking-widest">Mobiler Service</span>
                        </div>
                        <h1 className="font-drama italic text-5xl sm:text-6xl lg:text-7xl text-ivory leading-tight">
                            Wir kommen{' '}
                            <span className="text-champagne">zu Ihnen.</span>
                        </h1>
                        <p className="font-sans text-lg text-ivory/70 leading-relaxed max-w-lg">
                            Ab sofort bietet Elité Auto Aufbereitung den kompletten Service auch mobil an.
                            Unser professionell ausgestatteter Van kommt direkt zu Ihnen nach Hause,
                            ins Büro oder an jeden gewünschten Standort in Vorarlberg.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2">
                            <Link
                                to="/buchen?service=mobil"
                                className="btn-magnetic inline-flex items-center gap-2 bg-champagne text-obsidian px-8 py-4 rounded-full font-sans font-bold text-sm shadow-[0_0_20px_rgba(77,178,146,0.3)]"
                            >
                                Jetzt Buchen
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="tel:+436642546078"
                                className="inline-flex items-center gap-2 border border-ivory/30 hover:border-champagne/50 text-ivory/80 hover:text-ivory px-8 py-4 rounded-full font-sans text-sm transition-colors backdrop-blur-sm"
                            >
                                <Phone className="w-4 h-4" />
                                Anrufen
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className="px-6 sm:px-12 lg:px-24 py-24 sm:py-32 bg-slate/20">
                <div className="max-w-7xl mx-auto flex flex-col gap-16">
                    <div className="flex flex-col gap-4 text-center">
                        <span className="font-mono text-xs text-champagne uppercase tracking-widest">So funktioniert's</span>
                        <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory">
                            In drei Schritten zum <span className="text-champagne">Glanz.</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
                        {steps.map((step) => (
                            <div key={step.num} className="flex flex-col gap-5 text-center items-center">
                                <div className="w-16 h-16 rounded-2xl bg-champagne/10 border border-champagne/30 flex items-center justify-center">
                                    <step.icon className="w-7 h-7 text-champagne" strokeWidth={1.5} />
                                </div>
                                <span className="font-mono text-xs text-champagne/60 uppercase tracking-widest">{step.num}</span>
                                <h3 className="font-sans font-bold text-xl text-ivory">{step.title}</h3>
                                <p className="font-sans text-sm text-ivory/50 leading-relaxed max-w-xs">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Services available mobile */}
            <div className="px-6 sm:px-12 lg:px-24 py-24 sm:py-32">
                <div className="max-w-7xl mx-auto flex flex-col gap-16">
                    <div className="flex flex-col gap-4">
                        <span className="font-mono text-xs text-champagne uppercase tracking-widest">Unser Angebot</span>
                        <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory">
                            Kompletter Service, <span className="text-champagne">mobil.</span>
                        </h2>
                        <p className="font-sans text-ivory/60 text-lg max-w-xl leading-relaxed">
                            Alle Leistungen, die Sie aus unserem Studio kennen — jetzt auch direkt bei Ihnen vor Ort.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {services.map((s) => (
                            <div key={s.title} className="bg-slate/30 border border-slate/50 rounded-[2rem] p-8 flex flex-col gap-4 hover:border-champagne/30 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-champagne/10 border border-champagne/30 flex items-center justify-center">
                                    <s.icon className="w-6 h-6 text-champagne" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-sans font-bold text-xl text-ivory">{s.title}</h3>
                                <p className="font-sans text-sm text-ivory/50 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Van gallery */}
            <div className="px-6 sm:px-12 lg:px-24 py-24 sm:py-32 bg-slate/20">
                <div className="max-w-7xl mx-auto flex flex-col gap-16">
                    <div className="flex flex-col gap-4">
                        <span className="font-mono text-xs text-champagne uppercase tracking-widest">Unser Fahrzeug</span>
                        <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory">
                            Der Elité <span className="text-champagne">Van.</span>
                        </h2>
                        <p className="font-sans text-ivory/60 text-lg max-w-xl leading-relaxed">
                            Voll ausgestattet mit allem, was wir für eine professionelle Aufbereitung brauchen — vom
                            Hochdruckreiniger über die Poliermaschine bis hin zu unseren Premium-Produkten von FIREBALL.
                        </p>
                    </div>

                    {/* Editorial magazine layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4 lg:h-[600px]">

                        {/* Main — spans 2 cols & 2 rows */}
                        <div className="lg:col-span-2 lg:row-span-2 rounded-[1.75rem] overflow-hidden relative group h-[360px] lg:h-full">
                            <img
                                src="/assets/VAN.png"
                                alt="Der Elité Aufbereitungs-Van"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/10 to-transparent" />
                            <div className="absolute bottom-6 left-6 flex flex-col gap-1">
                                <span className="font-mono text-[10px] text-champagne uppercase tracking-widest">Der Van</span>
                                <span className="font-sans font-bold text-ivory text-lg leading-tight">Voll ausgestattet.<br />Bereit für alles.</span>
                            </div>
                            <div className="absolute top-5 right-5 bg-obsidian/60 backdrop-blur-sm border border-champagne/20 px-3 py-1.5 rounded-full">
                                <span className="font-mono text-[10px] text-champagne uppercase tracking-widest">Elité Mobile</span>
                            </div>
                        </div>

                        {/* Top right */}
                        <div className="rounded-[1.75rem] overflow-hidden relative group h-[280px] lg:h-full">
                            <img
                                src="/assets/VAN_Auto.jpg"
                                alt="Fahrzeugaufbereitung vor Ort"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
                            <div className="absolute bottom-5 left-5">
                                <span className="font-mono text-[10px] text-champagne uppercase tracking-widest">Service</span>
                                <p className="font-sans text-sm text-ivory/80 mt-0.5">Direkt zu Ihnen</p>
                            </div>
                        </div>

                        {/* Bottom right */}
                        <div className="rounded-[1.75rem] overflow-hidden relative group h-[280px] lg:h-full">
                            <img
                                src="/assets/VAN_Matthias.jpg"
                                alt="Matthias — Ihr Aufbereitungsexperte"
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
                            <div className="absolute bottom-5 left-5">
                                <span className="font-mono text-[10px] text-champagne uppercase tracking-widest">Team</span>
                                <p className="font-sans text-sm text-ivory/80 mt-0.5">Matthias, Ihr Experte</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Benefits */}
            <div className="px-6 sm:px-12 lg:px-24 py-24 sm:py-32">
                <div className="max-w-7xl mx-auto flex flex-col gap-16">
                    <div className="flex flex-col gap-4 text-center">
                        <span className="font-mono text-xs text-champagne uppercase tracking-widest">Ihre Vorteile</span>
                        <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory">
                            Warum <span className="text-champagne">mobil?</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {benefits.map((b) => (
                            <div key={b.title} className="bg-slate/30 border border-slate/50 rounded-[1.5rem] p-6 flex flex-col gap-3 text-center items-center hover:border-champagne/30 transition-colors">
                                <CheckCircle className="w-6 h-6 text-champagne" strokeWidth={1.5} />
                                <h3 className="font-sans font-bold text-base text-ivory">{b.title}</h3>
                                <p className="font-sans text-xs text-ivory/50 leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Service area */}
            <div className="px-6 sm:px-12 lg:px-24 py-16 bg-slate/20">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
                    <MapPin className="w-6 h-6 text-champagne shrink-0" strokeWidth={1.5} />
                    <p className="font-sans text-lg text-ivory/70">
                        Wir sind in ganz <span className="text-ivory font-semibold">Vorarlberg & Umgebung</span> für Sie unterwegs.
                    </p>
                </div>
            </div>

            {/* CTA */}
            <div className="bg-slate mx-6 sm:mx-12 lg:mx-24 my-16 rounded-[2.5rem] px-8 sm:px-16 py-16 flex flex-col sm:flex-row items-center justify-between gap-8 max-w-7xl lg:mx-auto">
                <div className="flex flex-col gap-3 text-center sm:text-left">
                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">Bereit?</span>
                    <h2 className="font-drama italic text-3xl sm:text-4xl text-ivory">
                        Jetzt mobilen Termin buchen.
                    </h2>
                    <p className="font-sans text-sm text-ivory/50 max-w-md">
                        Wählen Sie Ihren Wunschtermin online — wir kommen mit allem, was wir brauchen, direkt zu Ihnen.
                    </p>
                </div>
                <Link
                    to="/buchen?service=mobil"
                    className="shrink-0 btn-magnetic inline-flex items-center gap-2 bg-champagne text-obsidian px-10 py-4 rounded-full font-sans font-bold text-sm shadow-[0_0_20px_rgba(77,178,146,0.3)] hover:brightness-110 transition-all"
                >
                    Jetzt Buchen
                    <Truck className="w-5 h-5" />
                </Link>
            </div>

            {/* Footer strip */}
            <div className="border-t border-ivory/10 px-6 sm:px-12 lg:px-24 py-8 text-center font-sans text-xs text-ivory/30">
                © 2026 Elité Auto Aufbereitung. Alle Rechte vorbehalten.
            </div>

        </div>
    );
}
