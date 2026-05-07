import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function Preloader({ onComplete }) {
    const overlayRef = useRef(null);
    const logoRef = useRef(null);
    const barRef = useRef(null);
    const barFillRef = useRef(null);
    const [show, setShow] = useState(() => {
        // Skip preloader on return visits within session
        return !sessionStorage.getItem('elite-visited');
    });

    useEffect(() => {
        if (!show) {
            onComplete?.();
            return;
        }

        // Prevent scrolling during preloader
        document.body.style.overflow = 'hidden';

        const tl = gsap.timeline({
            onComplete: () => {
                sessionStorage.setItem('elite-visited', '1');
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
    }, [show, onComplete]);

    if (!show) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[10000] bg-obsidian flex flex-col items-center justify-center gap-8"
            style={{ clipPath: 'inset(0 0 0 0)' }}
        >
            {/* Logo */}
            <div ref={logoRef} className="opacity-0">
                <img
                    src="/assets/logo-new2.png"
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
