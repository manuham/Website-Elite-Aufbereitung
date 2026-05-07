import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

/**
 * PageTransition — clip-path wipe overlay on route changes.
 * Renders a fixed overlay that animates on every pathname change.
 */
export default function PageTransition() {
    const overlayRef = useRef(null);
    const location = useLocation();
    const isFirst = useRef(true);

    useEffect(() => {
        // Skip animation on initial mount
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }

        const overlay = overlayRef.current;
        if (!overlay) return;

        // Wipe in then wipe out
        const tl = gsap.timeline();
        tl.set(overlay, { display: 'block' })
            .fromTo(overlay,
                { clipPath: 'inset(0 0 100% 0)' },
                { clipPath: 'inset(0 0 0% 0)', duration: 0.4, ease: 'power3.inOut' }
            )
            .to(overlay,
                { clipPath: 'inset(100% 0 0 0)', duration: 0.4, ease: 'power3.inOut' },
                '+=0.05'
            )
            .set(overlay, { display: 'none' });

        return () => tl.kill();
    }, [location.pathname]);

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[9995] bg-obsidian pointer-events-none hidden"
            style={{ clipPath: 'inset(0 0 100% 0)' }}
        />
    );
}
