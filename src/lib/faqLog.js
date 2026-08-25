import { logUnansweredQuestion } from './api';

/**
 * Unanswered questions, lifted out of the component that used to own them.
 *
 * They go to /api/faq-log (anonymous: timestamp + text only, appended to a review Google Sheet)
 * so they can become new knowledge-base entries. This is the only channel that tells the business
 * what visitors actually ask, which is why the FAQ section kept a search field when the chat
 * presentation was removed — losing the bubbles was the point, losing the signal was not.
 *
 * Ambiguous questions carry a "[mehrdeutig]" marker to surface ambiguity hot-spots. localStorage
 * keeps a local copy in case the API is not configured (FAQ_LOG_SHEET_ID is still unset — see
 * docs/context/open-questions.md).
 */
const sentThisSession = new Set();

export function logUnanswered(q, type) {
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
