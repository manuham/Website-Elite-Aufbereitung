import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * SplitText — splits text into words/characters and animates them in with a mask reveal.
 *
 * Structure: outer mask (overflow-hidden) > inner .split-unit (animated)
 *
 * Props:
 * - children: string text to animate
 * - as: HTML tag (default 'span')
 * - className: passed to wrapper
 * - type: 'words' | 'chars' (default 'words')
 * - trigger: 'scroll' | 'load' (default 'scroll')
 * - stagger, duration, delay, triggerStart, animation
 */
export default function SplitText({
    children,
    as: Tag = 'span',
    className = '',
    type = 'words',
    trigger = 'scroll',
    stagger,
    duration = 0.8,
    delay = 0,
    triggerStart = 'top 80%',
    animation = 'slideUp',
}) {
    const containerRef = useRef(null);
    const text = typeof children === 'string' ? children : '';

    useEffect(() => {
        if (!containerRef.current || !text) return;

        const elements = containerRef.current.querySelectorAll('.split-unit');
        if (!elements.length) return;

        const defaultStagger = type === 'chars' ? 0.03 : 0.06;
        const actualStagger = stagger ?? defaultStagger;

        let fromVars = {};
        let toVars = {
            duration,
            stagger: actualStagger,
            ease: 'power4.out',
            delay,
        };

        if (animation === 'slideUp') {
            fromVars = { yPercent: 110, opacity: 0 };
            toVars = { ...toVars, yPercent: 0, opacity: 1 };
        } else if (animation === 'fadeIn') {
            fromVars = { opacity: 0, y: 20 };
            toVars = { ...toVars, opacity: 1, y: 0 };
        } else if (animation === 'clipReveal') {
            fromVars = { yPercent: 100 };
            toVars = { ...toVars, yPercent: 0 };
        }

        if (trigger === 'scroll') {
            toVars.scrollTrigger = {
                trigger: containerRef.current,
                start: triggerStart,
            };
        }

        const ctx = gsap.context(() => {
            gsap.fromTo(elements, fromVars, toVars);
        }, containerRef);

        return () => ctx.revert();
    }, [text, type, trigger, stagger, duration, delay, triggerStart, animation]);

    if (!text) {
        return <Tag className={className}>{children}</Tag>;
    }

    const words = text.split(' ');

    return (
        <Tag ref={containerRef} className={className} aria-label={text}>
            {type === 'chars'
                ? words.map((word, wi) => (
                    <span key={wi} className="inline-block whitespace-nowrap">
                        {word.split('').map((char, ci) => (
                            <span
                                key={`${wi}-${ci}`}
                                className="inline-block overflow-hidden"
                                style={{ lineHeight: 'inherit', verticalAlign: 'top' }}
                            >
                                <span className="split-unit inline-block">
                                    {char}
                                </span>
                            </span>
                        ))}
                        {wi < words.length - 1 && (
                            <span className="inline-block">&nbsp;</span>
                        )}
                    </span>
                ))
                : words.map((word, i) => (
                    <span key={i} className="inline-block overflow-hidden" style={{ verticalAlign: 'top' }}>
                        <span className="split-unit inline-block" style={{ lineHeight: 'inherit' }}>
                            {word}
                        </span>
                        {i < words.length - 1 && <>&nbsp;</>}
                    </span>
                ))
            }
        </Tag>
    );
}
