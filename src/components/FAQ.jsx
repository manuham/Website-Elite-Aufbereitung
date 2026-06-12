import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';
import SplitText from './SplitText';
import Disclosure from './Disclosure';
import FAQBot from './FAQBot';
import { FEATURED_FAQS } from '../data/faqKnowledge';

export default function FAQ() {
    return (
        <section id="faq" className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 xl:px-16 bg-background relative overflow-hidden">
            <div className="mx-auto max-w-6xl flex flex-col gap-12 items-center">

                {/* Header */}
                <div className="flex flex-col gap-4 items-center text-center">
                    <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest">Häufige Fragen</h3>
                    <h2 className="font-drama italic text-4xl sm:text-5xl lg:text-6xl text-ivory">
                        <SplitText type="words" triggerStart="top 85%">
                            Fragen &
                        </SplitText>{' '}
                        <span className="text-accent relative inline-block">
                            <SplitText type="chars" triggerStart="top 85%" delay={0.2}>
                                Antworten
                            </SplitText>
                            <span className="underline-draw bg-accent" />
                        </span>
                    </h2>
                </div>

                {/* FAQ list + assistant */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start w-full">
                    <div className="flex flex-col gap-4 w-full">
                        {FEATURED_FAQS.map((item, i) => (
                            <Disclosure key={item.id} title={item.q} defaultOpen={i === 0}>
                                <p className="font-sans text-sm sm:text-[15px] text-ivory/70 leading-relaxed">
                                    {item.a}
                                </p>
                            </Disclosure>
                        ))}
                    </div>

                    <div className="w-full lg:sticky lg:top-24">
                        <FAQBot />
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="w-full max-w-3xl mx-auto bg-slate/30 border border-slate/50 rounded-2xl p-6 sm:p-8 text-center flex flex-col gap-4 items-center">
                    <p className="font-sans text-sm text-ivory/70 leading-relaxed max-w-xl">
                        Deine Frage war nicht dabei? Wir helfen dir gerne persönlich weiter.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <a href="tel:+436642546078" className="flex-1 flex items-center justify-center gap-2 bg-slate/40 border border-slate/60 hover:border-accent/50 rounded-xl px-5 py-3 transition-colors group">
                            <Phone className="w-4 h-4 text-accent shrink-0" />
                            <span className="font-sans text-sm text-ivory/80 group-hover:text-ivory">+43 664 2546078</span>
                        </a>
                        <a href="mailto:info.eliteaufbereitung@gmail.com" className="flex-1 flex items-center justify-center gap-2 bg-slate/40 border border-slate/60 hover:border-accent/50 rounded-xl px-5 py-3 transition-colors group">
                            <Mail className="w-4 h-4 text-accent shrink-0" />
                            <span className="font-sans text-sm text-ivory/80 group-hover:text-ivory break-all">info.eliteaufbereitung@gmail.com</span>
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
