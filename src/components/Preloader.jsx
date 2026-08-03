import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import useIsomorphicLayoutEffect from '../hooks/useIsomorphicLayoutEffect';
import Img from './Img';

export default function Preloader({ onComplete }) {
    const overlayRef = useRef(null);
    const logoRef = useRef(null);
    const barRef = useRef(null);
    const barFillRef = useRef(null);
    // Starts true so the prerendered HTML and the first client render agree — reading
    // sessionStorage here would crash the build-time render and desync hydration. The overlay is a
    // plain obsidian rectangle at this point (both children are opacity-0), so a prerendered page
    // paints exactly like the empty shell it replaced.
    const [show, setShow] = useState(true);
    const [gateResolved, setGateResolved] = useState(false);

    // Skip the preloader on return visits within the session. A layout effect, so the overlay is
    // gone before the browser paints — an ordinary effect would flash it for one frame.
    useIsomorphicLayoutEffect(() => {
        let visited = false;
        try {
            visited = !!sessionStorage.getItem('elite-visited');
        } catch {
            // Private mode / storage blocked — treat as a first visit.
        }
        if (visited) setShow(false);
        setGateResolved(true);
    }, []);

    useEffect(() => {
        // Nothing starts until we know whether this is a return visit.
        if (!gateResolved) return;

        if (!show) {
            onComplete?.();
            return;
        }

        // Prevent scrolling during preloader
        document.body.style.overflow = 'hidden';

        const tl = gsap.timeline({
            onComplete: () => {
                try {
                    sessionStorage.setItem('elite-visited', '1');
                } catch {
                    // Storage blocked — the preloader simply plays again next navigation.
                }
                document.body.style.overflow = '';
                setShow(false);
                onComplete?.();
            }
        });

        tl
            // Logo fades in
            .fromTo(logoRef.current,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }
            )
            // Progress bar appears
            .fromTo(barRef.current,
                { opacity: 0, scaleX: 0 },
                { opacity: 1, scaleX: 1, duration: 0.3, ease: 'power2.out' },
                '-=0.2'
            )
            // Progress bar fills
            .fromTo(barFillRef.current,
                { scaleX: 0 },
                { scaleX: 1, duration: 1, ease: 'power2.inOut' },
                '-=0.1'
            )
            // Logo scales up slightly
            .to(logoRef.current,
                { scale: 1.05, duration: 0.2, ease: 'power2.in' },
                '-=0.3'
            )
            // Everything fades and the overlay lifts
            .to(overlayRef.current, {
                clipPath: 'inset(0 0 100% 0)',
                duration: 0.8,
                ease: 'power4.inOut',
            }, '+=0.1');

        return () => tl.kill();
    }, [gateResolved, show, onComplete]);

    if (!show) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[10000] bg-obsidian flex flex-col items-center justify-center gap-8"
            style={{ clipPath: 'inset(0 0 0 0)' }}
        >
            {/* Logo */}
            <div ref={logoRef} className="opacity-0">
                <Img
                    src="/assets/logo-new2.png"
                    sizes="80px"
                    alt="Elite Aufbereitung"
                    className="h-16 sm:h-20 w-auto brightness-100 invert-0"
                />
            </div>

            {/* Progress bar */}
            <div
                ref={barRef}
                className="w-48 sm:w-64 h-[2px] bg-ivory/10 rounded-full overflow-hidden opacity-0 origin-center"
            >
                <div
                    ref={barFillRef}
                    className="h-full bg-gradient-to-r from-accent to-accent-glow origin-left rounded-full"
                    style={{ transform: 'scaleX(0)' }}
                />
            </div>
        </div>
    );
}
