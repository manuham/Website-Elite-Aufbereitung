import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Philosophy from './components/Philosophy';
import MobileService from './components/MobileService';
import Protocol from './components/Protocol';
import Gallery from './components/Gallery';
import GoogleReviews from './components/GoogleReviews';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import BookingPage from './pages/BookingPage';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';
import Projekte from './pages/Projekte';
import MobilerService from './pages/MobilerService';
import EliteEndstufe from './pages/EliteEndstufe';
import Preloader from './components/Preloader';

import ScrollProgress from './components/ScrollProgress';
import PageTransition from './components/PageTransition';

gsap.registerPlugin(ScrollTrigger);

// Global magnetic button behavior — applies to all .btn-magnetic elements
function useMagneticGlobal() {
    useEffect(() => {
        if ('ontouchstart' in window) return;

        const handler = (e) => {
            const el = e.target.closest('.btn-magnetic');
            if (!el) return;

            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;

            gsap.to(el, { x: dx * 0.25, y: dy * 0.25, duration: 0.3, ease: 'power2.out' });
        };

        const resetHandler = (e) => {
            const el = e.target.closest('.btn-magnetic');
            if (!el) return;
            gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
        };

        document.addEventListener('mousemove', handler);
        document.addEventListener('mouseleave', resetHandler, true);

        // Also reset on mouseout from magnetic buttons specifically
        const resetOnOut = (e) => {
            if (e.target.classList?.contains('btn-magnetic')) {
                gsap.to(e.target, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
            }
        };
        document.addEventListener('mouseout', resetOnOut);

        return () => {
            document.removeEventListener('mousemove', handler);
            document.removeEventListener('mouseleave', resetHandler, true);
            document.removeEventListener('mouseout', resetOnOut);
        };
    }, []);
}

function HomePage() {
    const location = useLocation();

    useEffect(() => {
        ScrollTrigger.refresh();

        // Activate underline-draw elements on scroll
        const underlines = document.querySelectorAll('.underline-draw');
        const triggers = [];
        underlines.forEach(el => {
            const st = ScrollTrigger.create({
                trigger: el,
                start: 'top 85%',
                onEnter: () => el.classList.add('is-visible'),
            });
            triggers.push(st);
        });

        return () => triggers.forEach(st => st.kill());
    }, []);

    useEffect(() => {
        if (location.state?.scrollTo) {
            setTimeout(() => {
                document.getElementById(location.state.scrollTo)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [location.state]);

    return (
        <div className="min-h-screen font-sans bg-obsidian text-ivory selection:bg-champagne selection:text-obsidian overflow-hidden">
            <Navbar />
            <Hero />
            <Features />
            <MobileService />
            <GoogleReviews />
            <Philosophy />
            <Protocol />
            <Gallery />
            <Pricing />
            <Footer />
        </div>
    );
}

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}

function NotFound() {
    return (
        <div className="min-h-screen bg-obsidian text-ivory flex flex-col items-center justify-center gap-6 px-6 text-center">
            <span className="font-mono text-xs text-champagne uppercase tracking-widest">Fehler 404</span>
            <h1 className="font-drama italic text-5xl sm:text-6xl">Seite nicht gefunden</h1>
            <p className="font-sans text-ivory/50 max-w-md">Die angeforderte Seite existiert nicht oder wurde verschoben.</p>
            <Link to="/" className="mt-4 bg-champagne text-obsidian px-8 py-3 rounded-full font-sans font-semibold text-sm hover:brightness-110 transition-all">
                Zur Startseite
            </Link>
        </div>
    );
}

export default function App() {
    const [preloaderDone, setPreloaderDone] = useState(false);
    const handlePreloaderComplete = useCallback(() => setPreloaderDone(true), []);
    useMagneticGlobal();

    return (
        <BrowserRouter>
            <Preloader onComplete={handlePreloaderComplete} />

            <ScrollProgress />
            <PageTransition />
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/buchen" element={<BookingPage />} />
                <Route path="/projekte" element={<Projekte />} />
                <Route path="/mobiler-service" element={<MobilerService />} />
                <Route path="/elite-endstufe" element={<EliteEndstufe />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
