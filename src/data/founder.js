/**
 * Everything the founder section says about Matthias, in one place.
 *
 * Separate from the component so the guard test can import it without pulling in JSX, gsap and the
 * image manifest — and so a component file keeps exporting only a component (React Fast Refresh
 * stops working otherwise, which eslint enforces here).
 */

/**
 * ⚠ PLACEHOLDER — NOT MATTHIAS' WORDS.
 *
 * Written to show the layout while his real sentence is collected. `placeholder: true` makes
 * src/data/founder.test.js FAIL, and that failing test is the whole safety mechanism: a made-up
 * quote attributed to a real, named person is indistinguishable from a real one to every visitor,
 * and nothing else would catch it. (`npm run build` does not run tests, so it does not block a
 * deploy — it just makes sure nobody forgets.)
 *
 * TODO(Matthias): replace `text` with his own sentence and delete the `placeholder` flag.
 * Setting this to `null` is also fine — the section then shows only the real customer quote.
 *
 * @type {{ text: string, placeholder?: boolean } | null}
 */
export const founderQuote = {
    text: 'Ein Auto steht bei mir so lange, wie es braucht. Wenn du beim Abholen nicht siehst, wo die Zeit hingegangen ist, habe ich meinen Job nicht gemacht.',
    placeholder: true,
};

/**
 * Photos of Matthias at work.
 *
 * Length-driven: when he sends more, add an object — that is the whole integration. Only
 * VAN_Matthias.jpg is asserted anywhere in this repo to be him, so it is the only one captioned
 * as him. Any new file must go through `npm run images:optimize` before <Img> can serve it
 * responsively.
 */
export const founderPhotos = [
    {
        src: '/assets/VAN/VAN_Matthias.jpg',
        alt: 'Matthias Kaufmann reinigt die Felge eines Fahrzeugs vor dem Elité-Aufbereitungsvan',
        caption: 'Felgenreinigung vor Ort',
    },
];
