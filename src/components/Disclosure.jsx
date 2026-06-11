import { useState, useId } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable collapsible/accordion panel.
 * Header button toggles a smoothly-animated body (grid-template-rows 0fr ↔ 1fr).
 * Used by the Zusatzpakete folders (Pricing) and the FAQ section.
 */
export default function Disclosure({ title, badge, defaultOpen = false, children, className = '' }) {
    const [open, setOpen] = useState(defaultOpen);
    const id = useId();
    const panelId = `disclosure-${id}`;

    return (
        <div className={`rounded-2xl border border-ivory/10 bg-slate/30 overflow-hidden transition-colors duration-300 ${open ? 'border-accent/30' : 'hover:border-ivory/20'} ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                aria-controls={panelId}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left transition-colors hover:bg-slate/40"
            >
                <span className="flex items-center gap-3 min-w-0">
                    <span className="font-sans font-bold text-base sm:text-lg text-ivory">{title}</span>
                    {badge != null && (
                        <span className="font-mono text-[11px] font-bold text-accent/90 bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full shrink-0">
                            {badge}
                        </span>
                    )}
                </span>
                <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-accent' : 'text-ivory/50'}`}
                    strokeWidth={2.5}
                />
            </button>

            <div
                id={panelId}
                role="region"
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden">
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
