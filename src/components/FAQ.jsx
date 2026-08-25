import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';
import FaqNavigator from './FaqNavigator';
import { PHONE_DISPLAY, PHONE_HREF, EMAIL } from '../data/business';

export default function FAQ() {
    return (
        <section id="faq" className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 xl:px-16 bg-background relative overflow-hidden">
            <div className="mx-auto max-w-6xl flex flex-col gap-12">

                {/* Header */}
                <div className="flex flex-col gap-4 items-center text-center self-center">
                    <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest">Häufige Fragen</h3>
                    <h2 className="font-drama italic text-4xl sm:text-5xl lg:text-6xl text-ivory">
                        Fragen &{' '}
                        <span className="text-accent relative inline-block">
                            Antworten
                            <span className="underline-draw bg-accent" />
                        </span>
                    </h2>
                </div>

                {/* One mechanism, not two. This was an accordion beside a chat panel; the chat
                    is gone and the accordion now lives inside the topic navigator. */}
                <FaqNavigator />

                {/* Contact CTA */}
                <div className="w-full max-w-3xl mx-auto bg-slate/30 border border-slate/50 rounded-2xl p-6 sm:p-8 text-center flex flex-col gap-4 items-center">
                    <p className="font-sans text-sm text-ivory/70 leading-relaxed max-w-xl">
                        Deine Frage war nicht dabei? Wir helfen dir gerne persönlich weiter.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <a href={PHONE_HREF} className="flex-1 flex items-center justify-center gap-2 bg-slate/40 border border-slate/60 hover:border-accent/50 rounded-xl px-5 py-3 transition-colors group">
                            <Phone className="w-4 h-4 text-accent shrink-0" />
                            <span className="font-sans text-sm text-ivory/80 group-hover:text-ivory">{PHONE_DISPLAY}</span>
                        </a>
                        <a href={`mailto:${EMAIL}`} className="flex-1 flex items-center justify-center gap-2 bg-slate/40 border border-slate/60 hover:border-accent/50 rounded-xl px-5 py-3 transition-colors group">
                            <Mail className="w-4 h-4 text-accent shrink-0" />
                            <span className="font-sans text-sm text-ivory/80 group-hover:text-ivory break-all">{EMAIL}</span>
                        </a>
                    </div>
                    <Link
                        to="/buchen"
                        className="btn-magnetic bg-accent text-obsidian px-8 py-3 rounded-full font-sans font-bold text-sm mt-1 shadow-[0_0_20px_rgba(77,178,146,0.2)]"
                    >
                        Jetzt Termin buchen
                    </Link>
                </div>

            </div>
        </section>
    );
}
