import { describe, it, expect } from 'vitest';
import { matchFaq, detectIntent, normalize } from './faqMatcher.js';
import { FAQ_KNOWLEDGE, SUGGESTED_QUESTIONS } from '../data/faqKnowledge.js';

describe('exact-question invariant', () => {
    it('every entry answers its own question', () => {
        for (const entry of FAQ_KNOWLEDGE) {
            const result = matchFaq(entry.q, FAQ_KNOWLEDGE);
            expect(result.matched, `"${entry.q}" did not match`).toBe(true);
            expect(result.entry.id, `"${entry.q}" matched the wrong entry`).toBe(entry.id);
        }
    });

    it('no two entries share a normalized question or variant', () => {
        const seen = new Map();
        for (const entry of FAQ_KNOWLEDGE) {
            for (const alt of [entry.q, ...(entry.variants ?? [])]) {
                const n = normalize(alt);
                expect(seen.has(n), `"${alt}" duplicates ${seen.get(n)}`).toBe(false);
                seen.set(n, entry.id);
            }
        }
    });

    it('all suggested questions resolve to an answer', () => {
        for (const q of SUGGESTED_QUESTIONS) {
            expect(matchFaq(q, FAQ_KNOWLEDGE).matched, `"${q}" did not match`).toBe(true);
        }
    });
});

describe('query → entry', () => {
    it.each([
        ['Was ist eine Politur?', 'wissen-politur'],
        ['Was ist denn eine Politur genau?', 'wissen-politur'],
        ['Was bringt eine Politur?', 'wissen-politur'],
        ['Was kostet eine Politur?', 'preis-politur'],
        ['Politur kosten', 'preis-politur'],
        ['Wie lange dauert eine Politur?', 'faq-dauer-politur-keramik'],
        ['Wo seid ihr?', 'faq-standorte'],
        ['Wie lange hält eine Versiegelung?', 'faq-haltbarkeit-versiegelung'],
        ['Wie funktioniert eine Keramikversiegelung?', 'wissen-keramikversiegelung'],
        ['Was ist eine Autoaufbereitung?', 'wissen-aufbereitung'],
        ['Was ist Detailing?', 'wissen-aufbereitung'],
        ['Was ist eine Versiegelung?', 'wissen-versiegelung'],
        ['Was kostet eine Versiegelung?', 'preis-keramik'],
        ['Was kosten die Komplettpakete?', 'preis-komplettpakete'],
        ['Wie oft sollte ich mein Auto waschen lassen?', 'wissen-wie-oft-waschen'],
        ['Wie läuft die Buchung ab?', 'faq-termin-buchen'],
        ['Kommt ihr auch zu mir nach Hause?', 'faq-mobil-ablauf'],
    ])('%s → %s', (query, id) => {
        const result = matchFaq(query, FAQ_KNOWLEDGE);
        expect(result.matched).toBe(true);
        expect(result.entry.id).toBe(id);
    });
});

describe('clarify on intent-free near-ties', () => {
    it.each([
        ['Politur', ['faq-dauer-politur-keramik', 'preis-politur', 'wissen-politur']],
        ['Keramik', null], // several keramik entries — exact set depends on tuning
        ['Innenreinigung', ['faq-dauer-innenreinigung', 'preis-innenreinigung', 'wissen-innenreinigung']],
    ])('"%s" asks back instead of guessing', (query, expectedIds) => {
        const result = matchFaq(query, FAQ_KNOWLEDGE);
        expect(result.matched).toBe(false);
        expect(result.clarify?.length).toBeGreaterThanOrEqual(2);
        if (expectedIds) {
            expect(result.clarify.map((e) => e.id).sort()).toEqual([...expectedIds].sort());
        }
    });

    it('a clear winner does not trigger clarify', () => {
        const result = matchFaq('Kommt ihr auch zu mir nach Hause?', FAQ_KNOWLEDGE);
        expect(result.matched).toBe(true);
        expect(result.clarify).toBeUndefined();
    });

    it('unknown topics fall back without clarify', () => {
        const result = matchFaq('Macht ihr Smart Repair?', FAQ_KNOWLEDGE);
        expect(result.matched).toBe(false);
        expect(result.clarify).toBeUndefined();
    });
});

describe('detectIntent', () => {
    it.each([
        ['Was kostet eine Politur?', 'price'],
        ['Wie lange hält eine Versiegelung?', 'durability'],
        ['Wie lange dauert eine Politur?', 'duration'],
        ['Wie oft sollte ich mein Auto waschen lassen?', 'frequency'],
        ['Wo seid ihr?', 'location'],
        ['Wie buche ich einen Termin?', 'booking'],
        ['Wie funktioniert eine Keramikversiegelung?', 'process'],
        ['Was ist eine Politur?', 'definition'],
        ['Was sind Swirls?', 'definition'],
        ['Entfernt ihr auch Hundehaare?', null],
        ['Was bringt eine Scheibenversiegelung?', null],
    ])('%s → %s', (query, intent) => {
        expect(detectIntent(query)).toBe(intent);
    });
});
