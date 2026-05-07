import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ScrollProgress() {
    const barRef = useRef(null);

    useEffect(() => {
        const bar = barRef.current;
        if (!bar) return;

        const trigger = ScrollTrigger.create({
            trigger: document.documentElement,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                gsap.set(bar, { scaleX: self.progress });
            },
        });

        return () => trigger.kill();
    }, []);

    return (
        <div
            ref={barRef}
            className="fixed top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent to-accent-glow origin-left z-[9990] pointer-events-none"
            style={{ transform: 'scaleX(0)' }}
        />
    );
}
