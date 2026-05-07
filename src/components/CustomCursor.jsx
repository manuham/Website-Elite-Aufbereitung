import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
    const dotRef = useRef(null);
    const circleRef = useRef(null);
    const textRef = useRef(null);
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        // Detect touch device
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) {
            setIsTouch(true);
            return;
        }

        const dot = dotRef.current;
        const circle = circleRef.current;
        const textEl = textRef.current;
        if (!dot || !circle) return;

        // Quick-to for smooth following
        const xDot = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power2.out' });
        const yDot = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power2.out' });
        const xCircle = gsap.quickTo(circle, 'x', { duration: 0.35, ease: 'power2.out' });
        const yCircle = gsap.quickTo(circle, 'y', { duration: 0.35, ease: 'power2.out' });

        const onMouseMove = (e) => {
            xDot(e.clientX);
            yDot(e.clientY);
            xCircle(e.clientX);
            yCircle(e.clientY);
        };

        const expandCursor = (scale, text = '') => {
            gsap.to(circle, { scale, duration: 0.3, ease: 'power2.out' });
            gsap.to(dot, { scale: 0, duration: 0.2 });
            if (textEl) {
                textEl.textContent = text;
                gsap.to(textEl, { opacity: text ? 1 : 0, duration: 0.2 });
            }
        };

        const resetCursor = () => {
            gsap.to(circle, { scale: 1, duration: 0.3, ease: 'power2.out' });
            gsap.to(dot, { scale: 1, duration: 0.2 });
            if (textEl) {
                gsap.to(textEl, { opacity: 0, duration: 0.2 });
            }
        };

        const onMouseOver = (e) => {
            const target = e.target.closest('[data-cursor]')
                || e.target.closest('a')
                || e.target.closest('button')
                || e.target.closest('.gallery-item')
                || e.target.closest('.btn-magnetic');

            if (!target) return;

            const cursorType = target.getAttribute('data-cursor');

            if (cursorType === 'view') {
                expandCursor(2.5, 'View');
            } else if (cursorType === 'book') {
                expandCursor(2, 'Book');
            } else if (cursorType === 'drag') {
                expandCursor(2, 'Drag');
            } else if (target.closest('.gallery-item')) {
                expandCursor(2.5, 'View');
            } else {
                // Generic link/button hover
                expandCursor(1.8, '');
            }
        };

        const onMouseOut = (e) => {
            const target = e.target.closest('[data-cursor]')
                || e.target.closest('a')
                || e.target.closest('button')
                || e.target.closest('.gallery-item')
                || e.target.closest('.btn-magnetic');

            if (target) resetCursor();
        };

        const onMouseDown = () => {
            gsap.to(circle, { scale: 0.8, duration: 0.15 });
            gsap.to(dot, { scale: 0.5, duration: 0.15 });
        };

        const onMouseUp = () => {
            resetCursor();
        };

        // Hide default cursor
        document.body.style.cursor = 'none';
        document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
            el.style.cursor = 'none';
        });

        window.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseover', onMouseOver);
        document.addEventListener('mouseout', onMouseOut);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);

        // MutationObserver to handle dynamically added elements
        const observer = new MutationObserver(() => {
            document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
                el.style.cursor = 'none';
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            document.body.style.cursor = '';
            document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
                el.style.cursor = '';
            });
            window.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseover', onMouseOver);
            document.removeEventListener('mouseout', onMouseOut);
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            observer.disconnect();
        };
    }, [isTouch]);

    if (isTouch) return null;

    return (
        <>
            {/* Small dot */}
            <div
                ref={dotRef}
                className="custom-cursor-dot fixed top-0 left-0 w-2 h-2 bg-accent rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
            />
            {/* Trailing circle */}
            <div
                ref={circleRef}
                className="custom-cursor-circle fixed top-0 left-0 w-10 h-10 border border-accent/60 rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            >
                <span
                    ref={textRef}
                    className="font-sans text-[10px] font-bold text-accent uppercase tracking-wider opacity-0 whitespace-nowrap"
                />
            </div>
        </>
    );
}
