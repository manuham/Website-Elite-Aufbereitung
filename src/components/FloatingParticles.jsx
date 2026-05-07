import { useMemo } from 'react';

/**
 * FloatingParticles — CSS-only floating dust motes.
 * Barely visible, atmospheric effect evoking a detailing studio under spotlights.
 */
export default function FloatingParticles({ count = 20, className = '' }) {
    const particles = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            size: 1.5 + Math.random() * 2.5,
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: 15 + Math.random() * 25,
            delay: Math.random() * -20,
            drift: 20 + Math.random() * 40,
            opacity: 0.08 + Math.random() * 0.15,
        }));
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
