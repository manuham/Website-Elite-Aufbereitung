import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * SplitText — splits text into words/characters and animates them in with a mask reveal.
 *
 * Structure: outer mask (clip-path, see REVEAL_CLIP) > inner .split-unit (animated)
 *
 * Props:
 * - children: string text to animate
 * - as: HTML tag (default 'span')
 * - className: passed to wrapper
 * - type: 'words' | 'chars' (default 'words')
 * - trigger: 'scroll' | 'load' (default 'scroll')
 * - stagger, duration, delay, triggerStart, animation
 */
/**
 * The reveal mask, as a clip-path rather than overflow: hidden.
 *
 * The reveal slides each unit up from below, so only the BOTTOM edge needs to clip. overflow:hidden
 * cannot express that — it clips all four sides — and Playfair Display Italic, which every heading
 * uses, does not fit inside its own inline box: the slant pushes the 'W' past the left edge, the
 * italic 'f' runs past the line box top and bottom, and text-5xl/6xl ship line-height 1, so the
 * glyphs already overhang. All four edges were shaving letters.
 *
 * inset() takes top/right/bottom/left, and negative values push the clip edge outward. So: wide
 * open on three sides, and just past the box bottom so descenders survive while anything parked
 * below — a unit waiting to be revealed — stays hidden.
 *
 * Padding cannot do this job. Vertical padding with a compensating negative margin looks equivalent
 * but is not: on an inline-block, negative vertical margins shrink the line box, and multi-line
 * headings collapse into each other.
 */
const REVEAL_CLIP = {
    clipPath: 'inset(-0.45em -0.45em -0.09em -0.45em)',
};

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

        // 120, not the original 110: REVEAL_CLIP holds the clip edge 0.09em below the box so
        // descenders survive, which a unit parked at 110% would just barely peek through at
        // line-height 1. 120 clears it with room to spare and reads identically at 0.8s.
        if (animation === 'slideUp') {
            fromVars = { yPercent: 120, opacity: 0 };
            toVars = { ...toVars, yPercent: 0, opacity: 1 };
        } else if (animation === 'fadeIn') {
            fromVars = { opacity: 0, y: 20 };
            toVars = { ...toVars, opacity: 1, y: 0 };
        } else if (animation === 'clipReveal') {
            fromVars = { yPercent: 120 };
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
                                className="inline-block"
                                style={{ lineHeight: 'inherit', verticalAlign: 'top', ...REVEAL_CLIP }}
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
                    <span key={i} className="inline-block" style={{ verticalAlign: 'top', ...REVEAL_CLIP }}>
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
