// Manual check for the FAQ matcher — run after editing faqKnowledge.js or faqMatcher.js:
//   node scripts/test-faq-matcher.mjs
import { matchFaq } from '../src/lib/faqMatcher.js';
import { FAQ_KNOWLEDGE } from '../src/data/faqKnowledge.js';

const CASES = [
    ['Was kostet eine Politur?', 'preis-politur'],
    ['wie teuer ist keramik', 'preis-keramik'],
    ['keramick versieglung haltbarkeit', /keramik|haltbarkeit/],
    ['Wo seid ihr?', 'faq-standorte'],
    ['Kommt ihr auch nach Dornbirn?', 'standort-einzugsgebiet'],
    ['hundehaare', 'leistung-hundehaare'],
    ['mein auto stinkt nach rauch', 'leistung-geruch-ozon'],
    ['Wann habt ihr offen?', 'buchung-zeiten'],
    ['Was kostet eine Keramikversiegelung?', 'preis-keramik'],
    ['Kommt ihr auch zu mir nach Hause?', /mobil/],
    ['Wie oft sollte ich mein Auto waschen lassen?', 'wissen-wie-oft-waschen'],
    ['Wie buche ich einen Termin?', 'faq-termin-buchen'],
    ['was sind swirls', 'wissen-swirls'],
    ['kann ich mit karte zahlen', 'info-zahlung'],
    ['macht ihr auch motorräder', 'info-andere-fahrzeuge'],
    ['gutschein zu weihnachten', 'info-gutschein'],
    ['lohnt sich aufbereitung vor verkauf', /verkauf/],
    ['anfahrtskosten mobiler service', 'mobil-kosten'],
    ['wie lange dauert innenreinigung', 'faq-dauer-innenreinigung'],
    ['ledersitze schützen', /leder/],
    ['asdf blabla', null],          // expect no match
    ['   ', null],                  // expect no match
];

let pass = 0;
for (const [query, expected] of CASES) {
    const r = matchFaq(query, FAQ_KNOWLEDGE);
    const got = r.matched ? r.entry.id : null;
    const ok = expected === null
        ? got === null
        : expected instanceof RegExp ? expected.test(got ?? '') : got === expected;
    if (ok) pass++;
    const related = r.matched ? r.related.map((e) => e.id).join(', ') : (r.suggestions ?? []).map((e) => e.id).join(', ');
    console.log(`${ok ? 'PASS' : 'FAIL'}  "${query}" -> ${got ?? 'NO MATCH'}${related ? `  [${related}]` : ''}${ok ? '' : `  (expected ${expected})`}`);
}
console.log(`\n${pass}/${CASES.length} passed`);
process.exit(pass === CASES.length ? 0 : 1);
