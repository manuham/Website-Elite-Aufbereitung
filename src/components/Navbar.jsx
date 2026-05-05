import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Menu } from 'lucide-react';

const navLinks = [
    { label: 'Leistungen', id: 'pricing' },
    { label: 'Über Uns', id: 'philosophy' },
    { label: 'Unsere Arbeit', href: '/projekte' },
    { label: 'Kontakt', id: 'footer' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [visible, setVisible] = useState(true);
    const hideTimer = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 50);
            setVisible(true);

            if (hideTimer.current) clearTimeout(hideTimer.current);

            if (y > 50) {
                hideTimer.current = setTimeout(() => setVisible(false), 1500);
            }

            if (menuOpen) setMenuOpen(false);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (hideTimer.current) clearTimeout(hideTimer.current);
        };
    }, [menuOpen]);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    const scrollTo = (id) => {
        setMenuOpen(false);
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    };

    return (
        <>
            <nav
                className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-full px-5 sm:px-8 py-2.5 flex items-center justify-between gap-4 lg:gap-6 xl:gap-10 w-[calc(100%-2rem)] max-w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl ${scrolled
                    ? 'bg-obsidian/70 backdrop-blur-xl border border-slate/40 shadow-xl'
                    : 'bg-transparent border border-transparent'
                    } ${visible ? 'translate-y-0 opacity-100' : '-translate-y-[calc(100%+3rem)] opacity-0 pointer-events-none'}`}
            >
                {/* Logo */}
                <div
                    className="flex items-center shrink-0 cursor-pointer py-1"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <img
                        src="/assets/logo-new2.png"
                        alt="Elité Auto Aufbereitung"
                        className="h-[6.5rem] sm:h-[8rem] lg:h-[10rem] w-auto object-contain -my-16 -ml-3 translate-y-[5px]"
                    />
                </div>

                {/* Nav Links — Desktop */}
                <div className="hidden lg:flex items-center gap-6 xl:gap-8 2xl:gap-10">
                    {navLinks.map((link) =>
                        link.href ? (
                            <Link
                                key={link.label}
                                to={link.href}
                                className="font-sans text-[15px] font-medium text-ivory/80 hover:text-champagne transition-colors link-lift whitespace-nowrap"
                            >
                                {link.label}
                            </Link>
                        ) : (
                            <button
                                key={link.label}
                                onClick={() => scrollTo(link.id)}
                                className="font-sans text-[15px] font-medium text-ivory/80 hover:text-champagne transition-colors link-lift whitespace-nowrap"
                            >
                                {link.label}
                            </button>
                        )
                    )}
                    <Link
                        to="/mobiler-service"
                        className="group flex items-center gap-2 font-sans text-[15px] font-bold text-emerald-400 hover:text-emerald-300 transition-all link-lift whitespace-nowrap drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    >
                        <span className="bg-emerald-500 text-obsidian px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse">NEU</span>
                        Mobiler Service
                    </Link>
                </div>

                {/* CTA — Desktop */}
                <div className="hidden lg:inline-flex items-center gap-3 xl:gap-4">
                    <Link
                        to="/buchen"
                        className="btn-magnetic bg-champagne text-obsidian px-6 py-2.5 rounded-full font-sans font-semibold text-sm whitespace-nowrap items-center justify-center relative overflow-hidden"
                    >
                        <span className="relative z-10">Jetzt Buchen</span>
                    </Link>
                </div>

                {/* Hamburger — Mobile */}
                <button
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label="Menü öffnen"
                    className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full border border-slate/50 text-ivory/80 hover:text-champagne hover:border-champagne/50 transition-colors"
                >
                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 z-40 bg-obsidian flex flex-col items-center justify-center gap-10 transition-all duration-500 lg:hidden ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {navLinks.map((link, i) =>
                    link.href ? (
                        <Link
                            key={link.label}
                            to={link.href}
                            onClick={() => setMenuOpen(false)}
                            style={{ transitionDelay: menuOpen ? `${i * 60}ms` : '0ms' }}
                            className={`font-drama italic text-4xl text-ivory hover:text-champagne transition-all duration-300 ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            {link.label}
                        </Link>
                    ) : (
                        <button
                            key={link.label}
                            onClick={() => scrollTo(link.id)}
                            style={{ transitionDelay: menuOpen ? `${i * 60}ms` : '0ms' }}
                            className={`font-drama italic text-4xl text-ivory hover:text-champagne transition-all duration-300 ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                            {link.label}
                        </button>
                    )
                )}

                <Link
                    to="/mobiler-service"
                    onClick={() => setMenuOpen(false)}
                    style={{ transitionDelay: menuOpen ? `${navLinks.length * 60}ms` : '0ms' }}
                    className={`flex items-center gap-3 font-sans text-xl font-semibold text-emerald-400 transition-all duration-300 ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]`}
                >
                    <span className="bg-emerald-500 text-obsidian px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse">NEU</span>
                    Mobiler Service
                </Link>

                <Link
                    to="/buchen"
                    onClick={() => setMenuOpen(false)}
                    style={{ transitionDelay: menuOpen ? `${(navLinks.length + 1) * 60}ms` : '0ms' }}
                    className={`mt-4 bg-champagne text-obsidian px-10 py-4 rounded-full font-sans font-bold text-lg transition-all duration-300 ${menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    Jetzt Buchen
                </Link>
            </div>
        </>
    );
}
