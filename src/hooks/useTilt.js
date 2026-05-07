import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * useTilt — 3D perspective tilt toward cursor with light reflection.
 *
 * @param {number} maxTilt - Maximum rotation degrees (default 8)
 * @param {number} perspective - CSS perspective value (default 800)
 * @param {boolean} glare - Show moving light reflection (default true)
 */
export function useTilt(maxTilt = 8, perspective = 800, glare = true) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || 'ontouchstart' in window) return;

        // Set perspective on parent for 3D context
        el.style.transformStyle = 'preserve-3d';
        if (el.parentElement) {
            el.parentElement.style.perspective = `${perspective}px`;
        }

        // Create glare overlay if enabled
        let glareEl = null;
        if (glare) {
            glareEl = document.createElement('div');
            glareEl.className = 'tilt-glare';
            Object.assign(glareEl.style, {
                position: 'absolute',
                inset: '0',
                borderRadius: 'inherit',
                pointerEvents: 'none',
                zIndex: '30',
                opacity: '0',
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)',
                transition: 'opacity 0.3s ease',
            });
            el.style.position = el.style.position || 'relative';
            el.appendChild(glareEl);
        }

        const onMouseMove = (e) => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const rotateX = (0.5 - y) * maxTilt;
            const rotateY = (x - 0.5) * maxTilt;

            gsap.to(el, {
                rotateX,
                rotateY,
                duration: 0.4,
                ease: 'power2.out',
            });

            if (glareEl) {
                glareEl.style.opacity = '1';
                glareEl.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
            }
        };

        const onMouseLeave = () => {
            gsap.to(el, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.6,
                ease: 'power3.out',
            });

            if (glareEl) {
                glareEl.style.opacity = '0';
            }
        };

        el.addEventListener('mousemove', onMouseMove);
        el.addEventListener('mouseleave', onMouseLeave);

        return () => {
            el.removeEventListener('mousemove', onMouseMove);
            el.removeEventListener('mouseleave', onMouseLeave);
            if (glareEl && el.contains(glareEl)) {
                el.removeChild(glareEl);
            }
        };
    }, [maxTilt, perspective, glare]);

    return ref;
}
