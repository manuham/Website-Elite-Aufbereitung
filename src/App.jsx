import { useEffect } from 'react';
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

gsap.registerPlugin(ScrollTrigger);

function HomePage() {
    useEffect(() => {
        ScrollTrigger.refresh();
    }, []);

    return (
        <div className="min-h-screen font-sans bg-obsidian text-ivory selection:bg-champagne selection:text-obsidian overflow-hidden">
            <Navbar />
            <Hero />
            <Features />
            <GoogleReviews />
            <Philosophy />
            <MobileService />
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
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/buchen" element={<BookingPage />} />
                <Route path="/projekte" element={<Projekte />} />
                <Route path="/mobiler-service" element={<MobilerService />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
