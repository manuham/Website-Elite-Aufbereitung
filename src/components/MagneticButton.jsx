import { useMagnetic } from '../hooks/useMagnetic';

/**
 * MagneticButton — wraps any element with true magnetic cursor-tracking behavior.
 * The element physically pulls toward the cursor within a proximity zone.
 */
export default function MagneticButton({ children, className = '', strength = 0.3, radius = 100, as: Tag = 'div', ...props }) {
    const ref = useMagnetic(strength, radius);

    return (
        <Tag ref={ref} className={`btn-magnetic ${className}`} {...props}>
            {children}
        </Tag>
    );
}
