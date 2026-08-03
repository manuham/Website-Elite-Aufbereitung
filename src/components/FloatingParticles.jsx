import { useMemo } from 'react';

/**
 * Deterministic stand-in for Math.random() — a small LCG, seeded per particle.
 *
 * The pages are prerendered to HTML at build time, so a real random number would put different
 * inline styles in the server markup than the client computes and every mote would be a hydration
 * mismatch. The values still look arbitrary; they are just the *same* arbitrary values each time,
 * which is invisible at 15 dust motes of ~10 % opacity.
 */
function seededRandom(seed) {
    let state = (seed * 1664525 + 1013904223) % 4294967296;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

/**
 * FloatingParticles — CSS-only floating dust motes.
 * Barely visible, atmospheric effect evoking a detailing studio under spotlights.
 */
export default function FloatingParticles({ count = 20, className = '' }) {
    const particles = useMemo(() => {
        return Array.from({ length: count }, (_, i) => {
            const rand = seededRandom(i + 1);
            return {
                id: i,
                size: 1.5 + rand() * 2.5,
                x: rand() * 100,
                y: rand() * 100,
                duration: 15 + rand() * 25,
                delay: rand() * -20,
                drift: 20 + rand() * 40,
                opacity: 0.08 + rand() * 0.15,
            };
        });
    }, [count]);

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none z-[2] ${className}`}>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="particle absolute rounded-full bg-ivory"
                    style={{
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        opacity: p.opacity,
                        animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
                        '--drift': `${p.drift}px`,
                    }}
                />
            ))}
        </div>
    );
}
