import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { matchFaq } from '../lib/faqMatcher';
import { logUnanswered } from '../lib/faqLog';
import { FAQ_KNOWLEDGE, SUGGESTED_QUESTIONS } from '../data/faqKnowledge';
import Disclosure from './Disclosure';

/**
 * The FAQ, as a topic navigator rather than a chat.
 *
 * What this replaces: an "Elité Assistent" panel with a bot avatar, chat bubbles, a
 * `setTimeout(600 + Math.random() * 300)` fake typing delay and the subline "Antwortet sofort –
 * ohne KI". Saying "ohne KI" does not help when the visual pattern is a chatbot; the pattern is
 * the claim. It was never an LLM either — matchFaq() does keyword scoring over a hand-written
 * knowledge base, which is a good FAQ search wearing the wrong costume.
 *
 * What survives, deliberately:
 *  - The knowledge base itself, untouched. It is the actual value.
 *  - matchFaq() and its 101-line test suite, because the search field still uses them.
 *  - The /api/faq-log signal, the only channel telling the business what people ask. Dropping the
 *    input entirely (as the brief suggested) would have retired that quietly.
 *
 * Composition note: the section previously had an accordion in the left column and the bot in the
 * right, so a topic accordion beside an accordion would have been two mechanisms doing one job.
 * The tabs pattern is deliberately NOT an accordion, so the section reads as one thing.
 *
 * Every panel is rendered and inactive ones carry `hidden`. That matters more than it looks: the
 * whole page is prerendered, so mounting only the active panel would delete the other topics'
 * questions and answers from the HTML that crawlers and AI answer engines read.
 */

/**
 * Topics, matched against the knowledge base by predicate rather than by a hand-maintained list of
 * ids — a list of forty ids would go stale the first time someone adds an entry.
 */
const TOPICS = [
    { id: 'preise', label: 'Preise', match: (e) => e.category === 'preise' },
    { id: 'keramik', label: 'Keramik', match: (e) => e.keywords?.includes('keramik') },
    { id: 'mobil', label: 'Mobiler Service', match: (e) => e.category === 'mobil' },
    { id: 'termin', label: 'Termin', match: (e) => e.category === 'buchung' },
    { id: 'dauer', label: 'Dauer', match: (e) => e.keywords?.some((k) => k.startsWith('dauer')) },
    {
        id: 'innen',
        label: 'Innenreinigung',
        match: (e) => e.keywords?.includes('innenreinigung') || e.keywords?.includes('innenraum'),
    },
];

/** Bounded, so the homepage does not carry all 57 entries. Featured entries sort first. */
const PER_TOPIC = 5;

function LinkPill({ label, to, href }) {
    const cls =
        'inline-flex items-center gap-1.5 font-sans text-xs text-ivory/80 hover:text-ivory border border-ivory/15 hover:border-accent/50 bg-slate/40 rounded-full px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
    return to ? (
        <Link to={to} className={cls}>{label}</Link>
    ) : (
        <a href={href} className={cls}>{label}</a>
    );
}

export default function FaqNavigator() {
    const [active, setActive] = useState(0);
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState(null);
    const [openId, setOpenId] = useState(null);
    const tabRefs = useRef([]);

    const topics = useMemo(
        () =>
            TOPICS.map((t) => ({
                ...t,
                entries: FAQ_KNOWLEDGE.filter(t.match)
                    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
                    .slice(0, PER_TOPIC),
            })).filter((t) => t.entries.length > 0),
        []
    );

    /** Arrow/Home/End across the rail, per the tabs pattern. */
    const onTabKeyDown = (e) => {
        const last = topics.length - 1;
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = active === last ? 0 : active + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = active === 0 ? last : active - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = last;
        if (next === null) return;
        e.preventDefault();
        setActive(next);
        tabRefs.current[next]?.focus();
    };

    const onSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        if (!q) return;

        const result = matchFaq(q, FAQ_KNOWLEDGE);

        if (result.matched) {
            const hit = result.entry;
            const topicIndex = topics.findIndex((t) => t.entries.some((x) => x.id === hit.id));
            if (topicIndex >= 0) {
                setActive(topicIndex);
                setOpenId(hit.id);
                setNotice(null);
            } else {
                // A real answer that no topic panel happens to carry — show it on its own rather
                // than pretending we found nothing.
                setOpenId(null);
                setNotice({ kind: 'loose', entry: hit });
            }
            return;
        }

        // matchFaq returns one of three shapes: a hit with `entry`, an ambiguous result with
        // `clarify`, or a miss with `suggestions`. The first two are different enough to log
        // differently — "[mehrdeutig]" marks questions the knowledge base answers more than once.
        if (result.clarify?.length) {
            logUnanswered(q, 'clarify');
            setNotice({ kind: 'miss', ambiguous: true, suggestions: result.clarify });
            return;
        }

        logUnanswered(q);
        setNotice({ kind: 'miss', ambiguous: false, suggestions: result.suggestions ?? [] });
    };

    return (
        <div className="w-full flex flex-col gap-8">
            {/* Search — a labelled field over the FAQ, not a message box. No bot, no bubbles, no
                typing indicator, and it says what it does. */}
            <form onSubmit={onSearch} className="w-full max-w-2xl">
                <label htmlFor="faq-search" className="font-sans text-sm text-ivory/60">
                    Suchst du etwas Bestimmtes?
                </label>
                <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory/40 pointer-events-none" />
                        <input
                            id="faq-search"
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="z. B. Keramikversiegelung, Dauer, mobiler Service"
                            className="w-full bg-slate/30 border border-ivory/10 focus:border-accent/50 rounded-xl pl-11 pr-4 py-3 font-sans text-sm text-ivory placeholder:text-ivory/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-accent text-obsidian px-6 rounded-xl font-sans font-bold text-sm hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ivory"
                    >
                        Suchen
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setQuery(s)}
                            className="font-sans text-xs text-ivory/50 hover:text-ivory border border-ivory/10 hover:border-accent/40 rounded-full px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </form>

            {notice?.kind === 'loose' && (
                <div className="max-w-2xl bg-slate/30 border border-accent/20 rounded-2xl p-5 flex flex-col gap-2">
                    <p className="font-sans font-semibold text-sm text-ivory">{notice.entry.q}</p>
                    <p className="font-sans text-sm text-ivory/70 leading-relaxed">{notice.entry.a}</p>
                </div>
            )}

            {notice?.kind === 'miss' && (
                <div className="max-w-2xl bg-slate/30 border border-ivory/10 rounded-2xl p-5 flex flex-col gap-3">
                    <p className="font-sans text-sm text-ivory/70">
                        {notice.ambiguous
                            ? 'Dazu gibt es mehrere Antworten — welche meinst du?'
                            : 'Dazu steht hier nichts — die Frage ist notiert. Matthias hilft dir direkt weiter.'}
                    </p>
                    {notice.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {notice.suggestions.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => {
                                        setQuery(s.q);
                                        setNotice(null);
                                        const ti = topics.findIndex((t) =>
                                            t.entries.some((x) => x.id === s.id)
                                        );
                                        if (ti >= 0) { setActive(ti); setOpenId(s.id); }
                                        else setNotice({ kind: 'loose', entry: s });
                                    }}
                                    className="font-sans text-xs text-ivory/80 hover:text-ivory border border-ivory/15 hover:border-accent/50 bg-slate/40 rounded-full px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                >
                                    {s.q}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Topic rail */}
            <div
                role="tablist"
                aria-label="Themen"
                onKeyDown={onTabKeyDown}
                className="flex flex-wrap gap-2"
            >
                {topics.map((t, i) => (
                    <button
                        key={t.id}
                        ref={(el) => (tabRefs.current[i] = el)}
                        role="tab"
                        id={`faq-tab-${t.id}`}
                        aria-selected={i === active}
                        aria-controls={`faq-panel-${t.id}`}
                        tabIndex={i === active ? 0 : -1}
                        onClick={() => { setActive(i); setNotice(null); }}
                        className={`font-sans text-sm px-5 py-2.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                            i === active
                                ? 'bg-accent text-obsidian border-accent font-semibold'
                                : 'text-ivory/70 border-ivory/15 hover:text-ivory hover:border-accent/40'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Panels — all present in the HTML, inactive ones hidden. */}
            {topics.map((t, i) => (
                <div
                    key={t.id}
                    role="tabpanel"
                    id={`faq-panel-${t.id}`}
                    aria-labelledby={`faq-tab-${t.id}`}
                    tabIndex={0}
                    hidden={i !== active}
                    className="flex-col gap-4 focus-visible:outline-none"
                >
                    {t.entries.map((entry, idx) => (
                        <Disclosure
                            key={entry.id}
                            title={entry.q}
                            defaultOpen={openId ? entry.id === openId : idx === 0}
                        >
                            <div className="flex flex-col gap-3">
                                <p className="font-sans text-sm sm:text-[15px] text-ivory/70 leading-relaxed">
                                    {entry.a}
                                </p>
                                {entry.links?.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {entry.links.map((l) => (
                                            <LinkPill key={l.label} {...l} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Disclosure>
                    ))}
                </div>
            ))}
        </div>
    );
}
