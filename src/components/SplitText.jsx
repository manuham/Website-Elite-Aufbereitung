import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../lib/motion';

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
 * open on three sides, and past the box bottom so descenders survive while anything parked below —
 * a unit waiting to be revealed — stays hidden.
 *
 * The bottom number is measured, not guessed. Playfair Display Italic, measured in Chrome via
 * canvas TextMetrics:
 *
 *   font content area   1.330em   (ascent 1.080 + descent 0.250)
 *   'f' descends        0.190em below the baseline, 'g' 0.200em
 *   line-height 1       glyphs overflow the box by 0.165em top and bottom
 *
 * Tailwind's text-5xl and text-6xl ship line-height 1, so at those sizes the descender sits
 * 0.115em BELOW the box — which is why 0.09em was still shaving the italic 'f' and the 'g'.
 * 0.24em was then compared side by side against clip-path:none at 2x and renders identically,
 * so it also absorbs a font-fallback with deeper descenders. At leading-[1.1] only 0.065em is
 * needed, so one value covers every heading on the site.
 *
 * Padding cannot do this job. Vertical padding with a compensating negative margin looks equivalent
 * but is not: on an inline-block, negative vertical margins shrink the line box, and multi-line
 * headings collapse into each other.
 */
const REVEAL_CLIP = {
    clipPath: 'inset(-0.45em -0.45em -0.24em -0.45em)',
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

        // Returning before the fromTo below is what makes this safe: the units are rendered
        // visible and it is `gsap.fromTo` that parks them at yPercent 130. Never run, never
        // hidden — the heading is simply there. (Guarding *after* the fromTo, or skipping only
        // the tween, would leave every heading on the site permanently blank.)
        if (prefersReducedMotion()) return;

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

            // GSAP defaults to force3D:'auto', which animates with translate3d() and promotes each
            // unit to its own GPU layer. Every one of those layers sits inside a clip-path, and a
            // composited layer whose edge lands on a fractional pixel can leave a hairline seam
            // along that edge — the kind of stray mark that never shows in software rendering and
            // only appears on a real, GPU-accelerated browser. These are short text reveals; 2D
            // transforms are plenty.
            force3D: false,

            // And once the reveal is done, take the transform off entirely rather than leaving a
            // translate(0px, 0%) behind. A finished unit is then a plain, unpromoted inline-block.
            onComplete() {
                gsap.set(this.targets(), { clearProps: 'transform,willChange' });
            },
        };

        // 130, not the original 110: REVEAL_CLIP holds the clip edge 0.24em below the box so
        // descenders survive, so a unit has to travel its own height plus that to disappear —
        // 124 % at line-height 1. 130 clears it and still reads the same at 0.8s.
        if (animation === 'slideUp') {
            fromVars = { yPercent: 130, opacity: 0 };
            toVars = { ...toVars, yPercent: 0, opacity: 1 };
        } else if (animation === 'fadeIn') {
            fromVars = { opacity: 0, y: 20 };
            toVars = { ...toVars, opacity: 1, y: 0 };
        } else if (animation === 'clipReveal') {
            fromVars = { yPercent: 130 };
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
