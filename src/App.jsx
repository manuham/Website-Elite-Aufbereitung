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
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import BookingPage from './pages/BookingPage';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';
import AGB from './pages/AGB';
import Widerruf from './pages/Widerruf';
import Projekte from './pages/Projekte';
import MobilerService from './pages/MobilerService';
import EliteEndstufe from './pages/EliteEndstufe';
import Preloader from './components/Preloader';

import ScrollProgress from './components/ScrollProgress';
import PageTransition from './components/PageTransition';
import { prefersReducedMotion } from './lib/motion';

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

function HomePage({ preloaderDone }) {
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

    // Two ways to arrive at a section, and both land here.
    //
    //   location.state.scrollTo — set by Navbar/Footer when navigating in from another route.
    //   location.hash           — every in-page nav link is now a real <a href="/#id">, so this
    //                             also covers a pasted or shared https://…/#pricing. React
    //                             Router does not scroll to fragments on its own, and the
    //                             browser's own fragment scroll during parse is undone by
    //                             ScrollToTop, so without this a shared deep link silently
    //                             dumped the visitor at the top of the page.
    //
    // Keyed on location.key as well, so clicking the same link twice scrolls again.
    useEffect(() => {
        const target = location.state?.scrollTo
            || (location.hash ? decodeURIComponent(location.hash.slice(1)) : null);
        if (!target) return;

        let cancelled = false;
        let raf = 0;
        // Any real gesture outranks the correction loop below.
        const abort = () => { cancelled = true; };
        window.addEventListener('wheel', abort, { passive: true, once: true });
        window.addEventListener('touchstart', abort, { passive: true, once: true });
        window.addEventListener('keydown', abort, { once: true });

        // An instant jump lands using the layout as it is *now*, but everything between here
        // and a far target is lazy-loaded: those images decode over the next few hundred ms,
        // each one resizing its section and dragging the target out from under the viewport.
        // Measured before this loop existed: a jump to #footer settled 10,385px short.
        // So re-pin until the layout stops moving, then stop.
        const settleUntil = performance.now() + 1200;
        const settle = () => {
            if (cancelled) return;
            const el = document.getElementById(target);
            if (!el) return;
            if (Math.abs(el.getBoundingClientRect().top) > 2) {
                el.scrollIntoView({ behavior: 'auto' });
            }
            if (performance.now() < settleUntil) raf = requestAnimationFrame(settle);
        };

        // The document is prerendered and hydrating; section offsets move as images settle.
        const t = setTimeout(() => {
            if (cancelled) return;
            const el = document.getElementById(target);
            if (!el) return;

            // Jump rather than glide when the target is far away. Pricing sits several
            // viewports down, and smooth-scrolling that distance drags the viewport through
            // every pinned section and scrubbed parallax on the way, which is both slow and
            // visibly janky. Near targets still glide — and a smooth scroll retargets itself
            // as layout shifts, so only the instant path needs the settle loop.
            const far = Math.abs(el.getBoundingClientRect().top) > window.innerHeight * 4;
            if (far || prefersReducedMotion()) {
                el.scrollIntoView({ behavior: 'auto' });
                raf = requestAnimationFrame(settle);
            } else {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);

        return () => {
            cancelled = true;
            clearTimeout(t);
            cancelAnimationFrame(raf);
            window.removeEventListener('wheel', abort);
            window.removeEventListener('touchstart', abort);
            window.removeEventListener('keydown', abort);
        };
    }, [location.state, location.hash, location.key]);

    return (
        <div className="min-h-screen font-sans bg-obsidian text-ivory selection:bg-champagne selection:text-obsidian overflow-hidden">
            {/* WHY -> HOW -> WHAT.
                The page used to open on features and sell packages; the strongest sentence
                on the site ("Die meisten Autowäschen setzen auf Geschwindigkeit und Masse")
                was five sections down. The argument now runs in order, and the packages are
                the answer to it rather than the opening bid.

                Section ids are unchanged — Navbar, Footer and Hero all target them by id and
                dereference with ?.scrollIntoView, so a stale id fails silently. */}
            <Navbar />
            <Hero entranceReady={preloaderDone} />
            <Philosophy />      {/* WHY / the enemy: Masse und Geschwindigkeit   #philosophy */}
            <Protocol />        {/* HOW: the three craft steps                   #protocol   */}
            <Gallery />         {/* PROOF: the work itself                       #gallery    */}
            <GoogleReviews />   {/* SOCIAL PROOF                                 #reviews    */}
            <Pricing />         {/* WHAT: the packages                           #pricing    */}
            <MobileService />   {/* CONVENIENCE — demoted from 3rd               #mobile-service */}
            <Features />        {/* WHY US, as a closing recap                   #features   */}
            <FAQ />
            <Footer />
        </div>
    );
}

function ScrollToTop() {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        // A fragment target owns the scroll position — HomePage's handler above is about to
        // scroll to it. Resetting to 0 here would race it and win, which is why /#pricing
        // used to land at the top of the page.
        if (hash) return;
        window.scrollTo(0, 0);
    }, [pathname, hash]);
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

/**
 * Everything inside the router.
 *
 * Split out from App so the build-time prerenderer (src/entry-server.jsx) can render the same tree
 * under a MemoryRouter without dragging BrowserRouter — and therefore the browser History API —
 * into Node. The browser still mounts it through App below, unchanged.
 */
export function AppShell() {
    const [preloaderDone, setPreloaderDone] = useState(false);
    const handlePreloaderComplete = useCallback(() => {
        setPreloaderDone(true);
        // The preloader locks/unlocks body overflow — re-measure scroll positions
        requestAnimationFrame(() => ScrollTrigger.refresh());
    }, []);
    useMagneticGlobal();

    return (
        <>
            <Preloader onComplete={handlePreloaderComplete} />

            <ScrollProgress />
            <PageTransition />
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<HomePage preloaderDone={preloaderDone} />} />
                <Route path="/buchen" element={<BookingPage />} />
                <Route path="/projekte" element={<Projekte />} />
                <Route path="/mobiler-service" element={<MobilerService />} />
                <Route path="/elite-endstufe" element={<EliteEndstufe />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/agb" element={<AGB />} />
                <Route path="/widerruf" element={<Widerruf />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppShell />
        </BrowserRouter>
    );
}
