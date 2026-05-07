import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * useMagnetic — makes an element pull toward the cursor within a proximity zone.
 * Returns a ref to attach to the element.
 *
 * @param {number} strength - How much the element moves (0-1, default 0.3)
 * @param {number} radius - Proximity zone in px (default 100)
 */
export function useMagnetic(strength = 0.3, radius = 100) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Skip on touch devices
        if ('ontouchstart' in window) return;

        const onMouseMove = (e) => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius) {
                gsap.to(el, {
                    x: dx * strength,
                    y: dy * strength,
                    duration: 0.3,
                    ease: 'power2.out',
                });
            }
        };

        const onMouseLeave = () => {
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.3)',
            });
        };

        el.addEventListener('mousemove', onMouseMove);
        el.addEventListener('mouseleave', onMouseLeave);

        return () => {
            el.removeEventListener('mousemove', onMouseMove);
            el.removeEventListener('mouseleave', onMouseLeave);
        };
    }, [strength, radius]);

    return ref;
}
