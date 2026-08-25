import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send } from 'lucide-react';
import { matchFaq } from '../lib/faqMatcher';
import { logUnansweredQuestion } from '../lib/api';
import { FAQ_KNOWLEDGE, SUGGESTED_QUESTIONS } from '../data/faqKnowledge';

const GREETING = 'Hallo! Ich bin der Elité-Assistent. Frag mich alles zu Leistungen, Preisen, Terminen oder Pflege-Tipps.';
const FALLBACK = 'Das weiß ich leider nicht – aber Matthias hilft dir gerne persönlich weiter. Ruf kurz an oder buch direkt online.';
const CLARIFY = 'Dazu habe ich mehrere Antworten. Was genau meinst du?';

// Unanswered questions go to /api/faq-log (anonymous: timestamp + text only,
// appended to a review Google Sheet) so they can become new knowledge-base
// entries. Ambiguous questions are logged with a "[mehrdeutig]" marker to
// surface ambiguity hot-spots; answered low-margin matches are deliberately
// not logged (a "[knapp]" marker could be added later if needed). localStorage
// keeps a local copy in case the API isn't configured.
const sentThisSession = new Set();

function logUnanswered(q, type) {
    const logged = type === 'clarify' ? `[mehrdeutig] ${q}` : q;
    try {
        const key = 'elite-faq-unanswered';
        const list = JSON.parse(localStorage.getItem(key) ?? '[]');
        list.push(type ? { q, ts: Date.now(), type } : { q, ts: Date.now() });
        localStorage.setItem(key, JSON.stringify(list.slice(-50)));
    } catch { /* private mode / storage full — best effort only */ }

    const norm = logged.toLowerCase();
    if (!sentThisSession.has(norm)) {
        sentThisSession.add(norm);
        logUnansweredQuestion(logged);
    }
}

function LinkPill({ label, to, href }) {
    const cls = 'inline-flex items-center gap-1.5 font-sans text-xs text-ivory/80 hover:text-ivory border border-ivory/15 hover:border-accent/50 bg-slate/40 rounded-full px-3 py-1.5 transition-colors';
    return to
        ? <Link to={to} className={cls}>{label}</Link>
        : <a href={href} className={cls}>{label}</a>;
}

export default function FAQBot() {
    const [messages, setMessages] = useState([
        { id: 0, role: 'bot', text: GREETING },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    const timeoutRef = useRef(null);
    const idRef = useRef(0);

    useEffect(() => () => clearTimeout(timeoutRef.current), []);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, isTyping]);

    const ask = (question) => {
        const q = question.trim();
        if (!q || isTyping) return;
        const nextId = () => ++idRef.current;
        setMessages((m) => [...m, { id: nextId(), role: 'user', text: q }]);
        setInput('');
        setIsTyping(true);
        timeoutRef.current = setTimeout(() => {
            const result = matchFaq(q, FAQ_KNOWLEDGE);
            setIsTyping(false);
            if (result.matched) {
                setMessages((m) => [...m, {
                    id: nextId(),
                    role: 'bot',
                    text: result.entry.a,
                    links: result.entry.links,
                    related: result.related.map((e) => e.q),
                }]);
            } else if (result.clarify) {
                logUnanswered(q, 'clarify');
                setMessages((m) => [...m, {
                    id: nextId(),
                    role: 'bot',
                    text: CLARIFY,
                    clarify: true,
                    related: result.clarify.map((e) => e.q),
                }]);
            } else {
                logUnanswered(q);
                setMessages((m) => [...m, {
                    id: nextId(),
                    role: 'bot',
                    text: FALLBACK,
                    fallback: true,
                    related: result.suggestions.map((e) => e.q),
                }]);
            }
        }, 600 + Math.random() * 300);
    };

    return (
        <div className="w-full bg-slate/30 border border-ivory/10 rounded-2xl overflow-hidden flex flex-col">

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-ivory/10">
                <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-accent" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-accent">Elité Assistent</span>
                    <span className="flex items-center gap-1.5 font-sans text-xs text-ivory/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-glow animate-pulse" />
                        Antwortet sofort – ohne KI, direkt von unserer Website
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-label="Chat mit dem Elité Assistenten"
                className="h-[340px] sm:h-[400px] overflow-y-auto px-4 sm:px-5 py-5 flex flex-col gap-4"
            >
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                            className={`max-w-[88%] px-4 py-3 font-sans text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-accent/15 border border-accent/20 text-ivory rounded-2xl rounded-tr-md'
                                : 'bg-slate/40 border border-ivory/10 text-ivory/80 rounded-2xl rounded-tl-md'}`}
                        >
                            {msg.text}
                        </div>

                        {(msg.fallback || msg.links?.length > 0) && (
                            <div className="flex flex-wrap gap-2 max-w-[88%]">
                                {msg.fallback ? (
                                    <>
                                        <LinkPill label="Anrufen" href="tel:+436642546078" />
                                        <LinkPill label="E-Mail" href="mailto:info.eliteaufbereitung@gmail.com" />
                                        <LinkPill label="Jetzt buchen" to="/buchen" />
                                    </>
                                ) : (
                                    msg.links.map((link) => (
                                        <LinkPill key={link.label} {...link} />
                                    ))
                                )}
                            </div>
                        )}

                        {msg.related?.length > 0 && (
                            <div className="flex flex-col gap-1.5 max-w-[88%]">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-ivory/40">
                                    {msg.fallback ? 'Meintest du vielleicht' : msg.clarify ? 'Meinst du' : 'Verwandte Fragen'}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {msg.related.map((q) => (
                                        <button
                                            key={q}
                                            type="button"
                                            onClick={() => ask(q)}
                                            className="font-sans text-xs text-left text-accent/90 hover:text-accent border border-accent/20 hover:border-accent/50 rounded-full px-3 py-1.5 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="flex items-center gap-1.5 bg-slate/40 border border-ivory/10 rounded-2xl rounded-tl-md px-4 py-3.5 self-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-ivory/50 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-ivory/50 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-ivory/50 animate-bounce [animation-delay:300ms]" />
                    </div>
                )}
            </div>

            {/* Suggestions + input */}
            <div className="px-4 sm:px-5 pb-4 pt-1 flex flex-col gap-3 border-t border-ivory/10">
                <div className="flex flex-wrap gap-2 pt-3">
                    {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                            key={q}
                            type="button"
                            onClick={() => ask(q)}
                            className="font-sans text-xs text-ivory/60 hover:text-ivory border border-ivory/15 hover:border-accent/50 rounded-full px-3 py-1.5 transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>
                <form
                    onSubmit={(e) => { e.preventDefault(); ask(input); }}
                    className="flex items-center gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Deine Frage…"
                        maxLength={200}
                        aria-label="Deine Frage an den Elité Assistenten"
                        className="input-elite flex-1 min-w-0 bg-obsidian/60 border border-slate/60 rounded-xl px-4 py-3 font-sans text-sm text-ivory placeholder:text-ivory/40 outline-none"
                    />
                    <button
                        type="submit"
                        aria-label="Frage senden"
                        disabled={!input.trim() || isTyping}
                        className="w-11 h-11 shrink-0 rounded-xl bg-accent text-obsidian flex items-center justify-center transition-opacity disabled:opacity-40 hover:opacity-90"
                    >
                        <Send className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                </form>
            </div>
        </div>
    );
}
