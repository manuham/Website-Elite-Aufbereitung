import { Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer id="footer" className="bg-slate rounded-t-[3rem] sm:rounded-t-[4rem] px-6 sm:px-12 lg:px-24 pt-20 pb-10 flex flex-col gap-16 relative z-10 border-t border-slate/50 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.5)]">

            {/* Grid */}
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                {/* Col 1 */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img src="/assets/logo-new.png" alt="Elité Auto Aufbereitung" className="h-28 sm:h-36 lg:h-44 w-auto object-contain -ml-2 drop-shadow-xl" />
                    </div>
                    <p className="font-sans text-sm text-ivory/50 leading-relaxed text-balance">
                        Professionelle Fahrzeugaufbereitung in Vorarlberg. Perfektion bis ins Detail.
                    </p>
                </div>

                {/* Col 2 */}
                <div className="flex flex-col gap-6">
                    <h4 className="font-sans font-bold text-sm text-ivory uppercase tracking-widest">Leistungen</h4>
                    <ul className="flex flex-col gap-3">
                        {[
                            "Premium Handwäsche",
                            "Innenreinigung",
                            "Maschinenpolitur",
                            "FIREBALL Keramikversiegelung",
                            "Zusatzpakete (Felgen, Fenster)"
                        ].map((link, i) => (
                            <li key={i}>
                                <a href="#pricing" className="font-sans text-sm text-ivory/60 hover:text-champagne transition-colors link-lift inline-block">{link}</a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Col 3 */}
                <div className="flex flex-col gap-6">
                    <h4 className="font-sans font-bold text-sm text-ivory uppercase tracking-widest">Kontakt</h4>
                    <ul className="flex flex-col gap-3 font-sans text-sm text-ivory/60">
                        <li>Bundesstraße 2a</li>
                        <li>6714 Nüziders, Österreich</li>
                        <li className="mt-2"><a href="tel:+436642546078" className="hover:text-champagne transition-colors">+43 664 2546078</a></li>
                        <li><a href="mailto:info.eliteaufbereitung@gmail.com" className="hover:text-champagne transition-colors">info.eliteaufbereitung@gmail.com</a></li>
                        <li className="mt-2 flex items-center gap-2">
                            <span className="bg-champagne/20 text-champagne px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Neu</span>
                            <span className="text-ivory/60">Mobiler Service verfügbar</span>
                        </li>
                    </ul>
                </div>

                {/* Col 4 */}
                <div className="flex flex-col gap-6">
                    <h4 className="font-sans font-bold text-sm text-ivory uppercase tracking-widest">Folgen Sie uns</h4>
                    <div className="flex items-center gap-5">
                        <a href="https://www.instagram.com/eliteaufbereitung/" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-obsidian flex items-center justify-center text-ivory hover:bg-champagne hover:text-obsidian transition-colors group shadow-md hover:shadow-lg">
                            <Instagram className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                        </a>
                        <a href="https://www.facebook.com/people/Elit%C3%A9-Autoaufbereitung/61555761685065/" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-obsidian flex items-center justify-center text-ivory hover:bg-champagne hover:text-obsidian transition-colors group shadow-md hover:shadow-lg">
                            <Facebook className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                        </a>
                    </div>

                    <div className="mt-4 flex items-center gap-3 bg-obsidian/50 px-4 py-2 rounded-full border border-slate/50 w-fit">
                        <div className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </div>
                        <span className="font-mono text-[10px] text-ivory/80 uppercase tracking-widest">Studio Betriebsbereit</span>
                    </div>
                </div>

            </div>

            <div className="max-w-7xl mx-auto w-full pt-8 border-t border-ivory/10 flex flex-col sm:flex-row justify-between items-center gap-4 font-sans text-xs text-ivory/40">
                <p>© 2026 Elité Auto Aufbereitung. Alle Rechte vorbehalten.</p>
                <div className="flex gap-4">
                    <Link to="/impressum" className="hover:text-ivory transition-colors">Impressum</Link>
                    <Link to="/datenschutz" className="hover:text-ivory transition-colors">Datenschutz</Link>
                </div>
            </div>

        </footer>
    );
}
