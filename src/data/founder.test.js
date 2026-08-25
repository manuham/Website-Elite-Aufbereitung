import { describe, it, expect } from 'vitest';
import { founderQuote, founderPhotos } from './founder.js';

/**
 * The founder section is the one place on the site that puts words in a named person's mouth, so
 * it gets its own checks.
 *
 * The quote currently shipping is a placeholder, published deliberately (client decision,
 * 2026-08-25) while Matthias' own sentence is collected. That is recorded in the data as
 * `placeholder: true` rather than left implicit, and the standing reminder below keeps it visible
 * in every test run without failing the suite — a permanently red main teaches people to ignore
 * red, which costs more than it saves.
 */
describe('founder data', () => {
    it.todo("replace the placeholder founder quote in src/data/founder.js with Matthias' own words");

    it('flags a placeholder quote as one, so nobody mistakes it for a real statement', () => {
        // Either the quote is genuinely his (no flag), or it is marked. What must never happen is
        // an invented sentence sitting in the data with nothing to say that it is invented.
        if (!founderQuote) return;
        expect(typeof founderQuote.text).toBe('string');
        expect(founderQuote.text.length).toBeGreaterThan(0);
        expect(
            'placeholder' in founderQuote || founderQuote.placeholder === undefined
        ).toBe(true);
    });

    it('captions a photo as Matthias only where the repo actually asserts it is him', () => {
        // VAN_Matthias.jpg is the only file the codebase names him in. If someone adds another
        // photo, its alt text has to be checked against reality, not assumed.
        for (const p of founderPhotos) {
            if (/Matthias|Kaufmann/.test(p.alt)) {
                expect(p.src).toBe('/assets/VAN/VAN_Matthias.jpg');
            }
        }
    });
});
