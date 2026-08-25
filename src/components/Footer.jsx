import { Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import Img from './Img';
import {
    LOCATIONS,
    PHONE_DISPLAY,
    PHONE_HREF,
    EMAIL,
    INSTAGRAM_URL,
    FACEBOOK_URL,
} from '../data/business';

/**
 * Service links, with honest destinations.
 *
 * These were five <button onClick={scrollToSection('pricing')}> — not links. Five pieces of
 * high-value anchor text ("FIREBALL Keramikversiegelung", "Maschinenpolitur") that no crawler
 * could follow, on all nine prerendered pages. <Link> renders a real <a href>, so they are
 * crawlable, middle-clickable and keyboard-native, and /elite-endstufe finally gets descriptive
 * internal links pointing at it.
 */
const serviceLinks = [
    { label: 'Premium Handwäsche', to: '/#pricing' },
    { label: 'Innenreinigung', to: '/#pricing' },
    { label: 'Maschinenpolitur', to: '/elite-endstufe' },
    { label: 'FIREBALL Keramikversiegelung', to: '/elite-endstufe' },
    { label: 'Zusatzpakete (Felgen, Fenster)', to: '/#pricing' },
];

export default function Footer() {
    return (
        <footer id="footer" className="bg-slate rounded-t-[3rem] sm:rounded-t-[4rem] px-6 sm:px-12 lg:px-24 pt-20 pb-10 flex flex-col gap-16 relative z-10 border-t border-slate/50 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.5)]">

            {/* Grid */}
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                {/* Col 1 */}
                <div className="flex flex-col gap-6">
                    <Link to="/" className="flex items-center gap-1 w-fit rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne">
                        <Img src="/assets/logo-new2.png" sizes="176px" alt="Elité Auto Aufbereitung" className="h-28 sm:h-36 lg:h-44 w-auto object-contain -ml-2 drop-shadow-xl" />
                    </Link>
                    <p className="font-sans text-sm text-ivory/50 leading-relaxed text-balance">
                        Kratzfreie Handwäsche, mehrstufige Lackpolitur und FIREBALL-Keramikversiegelung. Studio in Feldkirch, mobiler Service in ganz Vorarlberg.
                    </p>
                    <p className="font-sans text-xs text-ivory/35 leading-relaxed text-balance">
                        Wir betreuen Kunden aus ganz Vorarlberg — von Bludenz über Feldkirch und Dornbirn bis Bregenz, Lustenau, Hohenems, Götzis und Rankweil.
                    </p>
                </div>

                {/* Col 2 */}
                <div className="flex flex-col gap-6">
                    <h4 className="font-sans font-bold text-sm text-ivory uppercase tracking-widest">Leistungen</h4>
                    <ul className="flex flex-col gap-3">
                        {serviceLinks.map((link) => (
                            <li key={link.label}>
                                <Link to={link.to} className="font-sans text-sm text-ivory/60 hover:text-champagne transition-colors link-lift inline-block">{link.label}</Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Col 3 */}
                <div className="flex flex-col gap-6">
                    <h4 className="font-sans font-bold text-sm text-ivory uppercase tracking-widest">Kontakt</h4>
                    <address className="not-italic">
                        <ul className="flex flex-col gap-3 font-sans text-sm text-ivory/60">
                            <li>{LOCATIONS.nueziders.street}</li>
                            <li>{LOCATIONS.nueziders.postalCode} {LOCATIONS.nueziders.city}, {LOCATIONS.nueziders.country}</li>
                            <li>Studio {LOCATIONS.feldkirch.city}: {LOCATIONS.feldkirch.street}</li>
                            <li className="mt-2"><a href={PHONE_HREF} className="hover:text-champagne transition-colors">{PHONE_DISPLAY}</a></li>
                            <li><a href={`mailto:${EMAIL}`} className="hover:text-champagne transition-colors break-all">{EMAIL}</a></li>
                            <li className="mt-2 flex items-center gap-2">
                                <span className="bg-champagne/20 text-champagne px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Neu</span>
                                <span className="text-ivory/60">Mobiler Service verfügbar</span>
                            </li>
                        </ul>
                    </address>
                </div>

                {/* Col 4 */}
                <div className="flex flex-col gap-6">
                    <h4 className="font-sans font-bold text-sm text-ivory uppercase tracking-widest">Folge uns</h4>
                    <div className="flex items-center gap-5">
                        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-obsidian flex items-center justify-center text-ivory hover:bg-champagne hover:text-obsidian transition-colors group shadow-md hover:shadow-lg">
                            <Instagram className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                        </a>
                        <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-obsidian flex items-center justify-center text-ivory hover:bg-champagne hover:text-obsidian transition-colors group shadow-md hover:shadow-lg">
                            <Facebook className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                        </a>
                    </div>

                    {/* Was a pulsing green dot reading "Studio Betriebsbereit" — a SaaS
                        "All Systems Operational" badge on a detailing business. Replaced with two
                        lines that are true today and cannot go stale: every route is prerendered,
                        so anything computed from "now" freezes to the build date. */}
                    <div className="mt-4 flex flex-col gap-1">
                        <span className="font-sans text-sm text-ivory/80">Termine nach Vereinbarung</span>
                        <span className="font-sans text-xs text-ivory/40">
                            {LOCATIONS.feldkirch.city} &amp; {LOCATIONS.nueziders.city} · mobil in ganz Vorarlberg
                        </span>
                    </div>
                </div>

            </div>

            <div className="max-w-7xl mx-auto w-full pt-8 border-t border-ivory/10 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 font-sans text-xs text-ivory/40">
                    <p>© 2026 Elité Auto Aufbereitung. Alle Rechte vorbehalten.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link to="/impressum" className="hover:text-ivory transition-colors">Impressum</Link>
                        <Link to="/datenschutz" className="hover:text-ivory transition-colors">Datenschutz</Link>
                        <Link to="/agb" className="hover:text-ivory transition-colors">AGB</Link>
                        <Link to="/widerruf" className="hover:text-ivory transition-colors">Widerruf</Link>
                    </div>
                </div>
                <p className="text-center font-sans text-[11px] text-ivory/30">
                    Webdesign von{' '}
                    <a href="https://www.hmmr.digital/" target="_blank" rel="noreferrer" className="text-ivory/50 hover:text-champagne transition-colors font-medium">
                        HMMR Digital
                    </a>
                </p>
            </div>

        </footer>
    );
}
