import { useEffect } from 'react';
import { X, Phone, Mail } from 'lucide-react';

export default function PhoneConsultModal({ packageName, onClose }) {
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center px-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <div
                className="relative bg-obsidian border border-slate/60 rounded-[2rem] p-8 max-w-md w-full shadow-[0_0_60px_rgba(0,0,0,0.6)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header row */}
                <div className="flex items-center justify-between mb-5">
                    <span className="font-sans text-xs uppercase tracking-widest text-accent font-bold">
                        Persönliche Beratung
                    </span>
                    <button
                        onClick={onClose}
                        aria-label="Schließen"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-ivory/40 hover:text-ivory hover:bg-slate/50 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Package chip */}
                <div className="mb-4">
                    <span className="font-mono text-xs border border-accent/30 text-accent rounded-full px-3 py-1">
                        {packageName}
                    </span>
                </div>

                {/* Headline */}
                <h2 className="font-drama italic text-3xl text-ivory leading-tight mb-4">
                    Termin telefonisch vereinbaren
                </h2>

                {/* Explanation */}
                <p className="font-sans text-sm text-ivory/60 leading-relaxed mb-6">
                    Dieses Paket erfordert eine individuelle Kalkulation. Aufwand und Endpreis hängen stark vom Zustand, der Größe und den Anforderungen Ihres Fahrzeugs ab — deshalb klären wir alles persönlich mit Ihnen.
                </p>

                {/* Divider */}
                <div className="h-px bg-slate/50 mb-6" />

                {/* Phone block */}
                <a
                    href="tel:+436642546078"
                    className="flex flex-col gap-2 w-full py-5 px-6 rounded-xl bg-slate/40 border border-slate/60 hover:border-accent/50 hover:bg-slate/60 transition-all mb-4 group"
                >
                    <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-accent shrink-0" />
                        <span className="font-sans text-xs uppercase tracking-widest text-ivory/40">
                            Jetzt anrufen
                        </span>
                    </div>
                    <span className="font-mono text-3xl font-bold text-ivory group-hover:text-accent transition-colors">
                        +43 664 2546078
                    </span>
                    <span className="font-sans text-xs text-ivory/40">
                        Mo – Sa, 08:00 – 18:00 Uhr
                    </span>
                </a>

                {/* Email block */}
                <a
                    href="mailto:info.eliteaufbereitung@gmail.com"
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-slate/30 transition-all group"
                >
                    <Mail className="w-4 h-4 text-accent shrink-0" />
                    <div className="flex flex-col gap-0.5">
                        <span className="font-sans text-sm text-ivory/60 group-hover:text-ivory transition-colors break-all">
                            info.eliteaufbereitung@gmail.com
                        </span>
                        <span className="font-sans text-xs text-ivory/40">
                            Wir antworten innerhalb von 24 Stunden
                        </span>
                    </div>
                </a>
            </div>
        </div>
    );
}
