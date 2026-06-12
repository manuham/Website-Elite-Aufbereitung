/*
    faqMatcher — client-side matching of free-text German questions against the
    FAQ knowledge base (src/data/faqKnowledge.js). No external API, no deps.

    Scoring: entry keywords weigh most, entry question text next, answer text
    least. German compound words ("Keramikversiegelung" ↔ "Keramik") are caught
    via bidirectional prefix matching, small typos via Damerau distance ≤ 1.

    On top sits an intent layer: the raw query is classified (price, duration,
    definition, …) before stopword filtering, entries derive their intent from
    their question title, and matching/conflicting intents boost/penalize the
    base score. A query without any intent signal that produces a near-tie
    (e.g. just "Politur") returns a clarify result instead of guessing.
*/

const UMLAUTS = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };

export function normalize(s) {
    return s
        .toLowerCase()
        .replace(/[äöüß]/g, (c) => UMLAUTS[c])
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function tokenize(s) {
    return normalize(s).split(' ').filter((t) => t.length >= 2);
}

/*
    Query intent, detected on the RAW query before stopword filtering —
    "was"/"ist"/"wie" are stopwords, so definitional intent would otherwise be
    lost. Ordered, first match wins: specific beats generic ("Was kostet …" is
    price, not definition; "Wie lange hält …" is durability, not duration).
    Deliberately no "wie viel" pattern — it would misfire on counting questions
    like "Wie viele Standorte habt ihr?". Patterns run on normalize()d text,
    so umlauts are already folded (haelt, erklaer, heisst).
*/
const INTENT_PATTERNS = [
    ['price', /kostet|\bkosten\b|preis|\bteuer\b|\beuro\b/],
    ['durability', /\bhaelt\b|\bhalten\b|\bhaltbar/],
    ['duration', /\bdauert\b|\bdauer\b|\bwie lange\b/],
    ['frequency', /\bwie oft\b|\bhaeufig/],
    ['location', /\bwo\b|\bwohin\b|\bstandort|\badresse/],
    ['booking', /\bbuch|\btermin/],
    ['process', /\bwie funktioniert\b|\bwie laeuft\b|\bablauf/],
    ['definition', /\bwas ist\b|\bwas sind\b|\bbedeut|\bwas heisst\b|\berklaer|\bdefinition\b|\bwas versteht man\b/],
];

export function detectIntent(text) {
    const t = normalize(String(text).replace(/€/g, ' euro '));
    for (const [intent, re] of INTENT_PATTERNS) {
        if (re.test(t)) return intent;
    }
    return null;
}

// Intent-bearing words (wo, wann, lange, oft, teuer, kostet …) are deliberately
// NOT stopwords — location/duration/price entries key off them.
const STOPWORDS = new Set([
    'und', 'oder', 'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine',
    'einen', 'einem', 'einer', 'ist', 'sind', 'war', 'ich', 'mein', 'meine',
    'meinen', 'mir', 'mich', 'es', 'im', 'in', 'am', 'an', 'auf', 'fuer',
    'mit', 'von', 'zu', 'zum', 'zur', 'bei', 'nach', 'man', 'kann', 'koennt',
    'koennen', 'wie', 'was', 'sich', 'auch', 'noch', 'schon', 'dann', 'aber',
    'doch', 'mal', 'bitte', 'hallo', 'ihr', 'sie', 'du', 'habt', 'haben',
    'hat', 'habe', 'gibt', 'sehr', 'gerne', 'wird', 'werden', 'um', 'dass',
    'denn', 'mehr', 'so', 'da', 'als', 'seid', 'sollte', 'soll', 'muss',
    'machen', 'macht', 'machst', 'bietet', 'bieten', 'lassen', 'auto',
    'autos', 'fahrzeug', 'wagen', 'eigentlich',
]);

/** Damerau-Levenshtein distance ≤ 1: one substitution, insertion, deletion or
    adjacent transposition. O(n), no DP table. */
export function isWithinOneEdit(a, b) {
    if (a === b) return true;
    const diff = a.length - b.length;
    if (diff > 1 || diff < -1) return false;
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    if (diff === 0) {
        if (a.slice(i + 1) === b.slice(i + 1)) return true; // substitution
        return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2); // transposition
    }
    const [short, long] = diff < 0 ? [a, b] : [b, a]; // insertion/deletion
    return short.slice(i) === long.slice(i + 1);
}

const MIN_PREFIX = 4; // shortest compound stem we trust ("lack", "harz")
const MIN_FUZZY = 5;  // below this, one edit reaches unrelated words

function matchToken(token, tokens, tokenSet, exactPts, prefixPts) {
    if (tokenSet.has(token)) return exactPts;
    for (const t of tokens) {
        const [short, long] = token.length <= t.length ? [token, t] : [t, token];
        if (short.length >= MIN_PREFIX && long.startsWith(short)) return prefixPts;
    }
    if (token.length >= MIN_FUZZY) {
        for (const t of tokens) {
            if (t.length >= MIN_FUZZY && isWithinOneEdit(token, t)) return exactPts - 1;
        }
    }
    return 0;
}

function buildIndex(entries) {
    return entries.map((entry) => {
        const kw = [...new Set((entry.keywords ?? []).flatMap(tokenize))];
        const alts = [entry.q, ...(entry.variants ?? [])]; // variants score like question text
        const q = [...new Set(alts.flatMap(tokenize))];
        const a = [...new Set(tokenize(entry.a))];
        return {
            kw, kwSet: new Set(kw), q, qSet: new Set(q), a, aSet: new Set(a),
            exactSet: new Set(alts.map(normalize)),
            // 'intent' in entry allows an explicit override incl. `intent: null`
            intent: 'intent' in entry ? entry.intent : detectIntent(entry.q),
        };
    });
}

const indexCache = new WeakMap();

function getIndex(entries) {
    let index = indexCache.get(entries);
    if (!index) {
        index = buildIndex(entries);
        indexCache.set(entries, index);
    }
    return index;
}

function scoreEntry(idx, tokens) {
    let score = 0;
    let matched = 0;
    let answerScore = 0;
    for (const t of tokens) {
        const s = Math.max(
            matchToken(t, idx.kw, idx.kwSet, 5, 3.5),
            matchToken(t, idx.q, idx.qSet, 3, 2),
        );
        if (s > 0) {
            matched++;
            score += s;
        } else {
            const a = matchToken(t, idx.a, idx.aSet, 1, 0.5);
            if (a > 0) matched++;
            answerScore += a;
        }
    }
    score += Math.min(answerScore, 3); // long answers must not dominate
    return score * (0.5 + 0.5 * (matched / tokens.length)); // coverage bonus
}

// One exact keyword hit with an unmatched second token scores 5 × 0.75 = 3.75,
// a full-coverage compound-prefix hit 3.5 — both should answer. Pure question-
// text (3) or answer-text (≤ 3) matches stay below.
const THRESHOLD = 3.5;

const INTENT_BOOST = 1.5;   // query and entry share an intent
const INTENT_PENALTY = 2;   // both sides have an intent and they differ; applied
                            // before the threshold so a conflicting best
                            // candidate falls to fallback, not a wrong answer
const EXACT_BONUS = 10;     // normalized query equals entry q/variant — makes
                            // clicking a clarify/related button deterministic
const CLARIFY_MARGIN = 1;   // near-tie band below the best score
const CLARIFY_MAX = 3;

/**
 * Match a free-text question against the knowledge base.
 * @returns {{matched: true, entry, related: entry[]} |
 *           {matched: false, clarify: entry[]} |
 *           {matched: false, suggestions: entry[]}}
 */
export function matchFaq(query, entries) {
    let tokens = tokenize(query).filter((t) => !STOPWORDS.has(t));
    if (tokens.length === 0) tokens = tokenize(query); // all stopwords — use raw
    if (tokens.length === 0) return { matched: false, suggestions: [] };

    const queryIntent = detectIntent(query);
    const nq = normalize(query);
    const index = getIndex(entries);
    const ranked = entries
        .map((entry, i) => {
            const idx = index[i];
            let base = scoreEntry(idx, tokens);
            if (queryIntent && idx.intent) {
                base += queryIntent === idx.intent ? INTENT_BOOST : -INTENT_PENALTY;
            }
            const exact = idx.exactSet.has(nq);
            return { entry, base, exact, score: exact ? base + EXACT_BONUS : base };
        })
        .sort((x, y) => y.score - x.score);

    const best = ranked[0];
    if (!best || best.score < THRESHOLD) {
        return {
            matched: false,
            suggestions: ranked.slice(0, 2).filter((r) => r.score >= 2).map((r) => r.entry),
        };
    }
    // No intent signal and several candidates in a dead heat (e.g. just
    // "Politur") — ask back instead of guessing. With an intent, the
    // boost/penalty already separates the candidates.
    if (!best.exact && !queryIntent) {
        const tied = ranked.filter((r) => r.score >= best.score - CLARIFY_MARGIN);
        if (tied.length >= 2) {
            return { matched: false, clarify: tied.slice(0, CLARIFY_MAX).map((r) => r.entry) };
        }
    }
    const relatedMin = Math.max(3, best.base * 0.4); // base: EXACT_BONUS must not starve related
    return {
        matched: true,
        entry: best.entry,
        related: ranked
            .slice(1)
            .filter((r) => r.score >= relatedMin)
            .slice(0, 2)
            .map((r) => r.entry),
    };
}
