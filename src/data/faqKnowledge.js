import { tierPackages, serviceCategories } from './services.js';

/*
    Knowledge base for the FAQ bot (FAQBot.jsx) and the FAQ accordion.

    - Package prices are interpolated from services.js where possible so they
      can't drift; hand-written prose still mentions prices in a few places —
      when prices change in services.js, search this file for "€" and sync.
    - Entries with `confirm: true` cover topics not yet confirmed by the client
      (see docs/context/open-questions.md → "FAQ-Bot Inhalte"). Their answers
      deflect to a personal contact and never state unverified facts.
    - `featured: true` marks the 9 entries shown in the FAQ accordion.
    - Answers are plain text (no HTML); CTAs go into `links`:
      `{ label, to }` = router path, `{ label, href }` = tel:/mailto:/external.
    - Each entry's intent (price/duration/definition/…) is derived from its
      question title by faqMatcher's detectIntent(); an explicit `intent`
      field overrides the derivation (use `intent: null` to disable it).
    - `variants` lists alternative phrasings of the question; they match at
      question-text weight and as exact-question hits.
*/

const cat = (id) => serviceCategories.find((c) => c.id === id);
const price = (catId, name, fallback) =>
    cat(catId)?.packages.find((p) => p.name === name)?.price ?? fallback;
const tier = (id, fallback) => tierPackages.find((t) => t.id === id)?.price ?? fallback;

const LINK_BUCHEN = { label: 'Jetzt Termin buchen', to: '/buchen' };
const LINK_TEL = { label: 'Anrufen', href: 'tel:+436642546078' };
const LINK_MAIL = { label: 'E-Mail schreiben', href: 'mailto:info.eliteaufbereitung@gmail.com' };
const LINK_MOBIL = { label: 'Mobiler Service', to: '/mobiler-service' };

export const FAQ_KNOWLEDGE = [

    // ─── A. Featured FAQs (im Akkordeon sichtbar) ────────────────────────────

    {
        id: 'faq-dauer-innenreinigung',
        q: 'Wie lange dauert eine Innenreinigung?',
        a: 'Eine Basic Innenreinigung dauert ca. 90 Minuten, eine Premium Innenreinigung (inkl. Lederpflege, Nassreinigung & Kunststoffbehandlung) ca. 2,5 Stunden. Stark verschmutzte oder größere Fahrzeuge brauchen entsprechend etwas länger.',
        keywords: ['innenreinigung', 'innenraum', 'dauer', 'dauert', 'lange', 'stunden', 'zeit'],
        category: 'leistungen',
        featured: true,
    },
    {
        id: 'faq-preis-aufbereitung',
        q: 'Was kostet eine Aufbereitung?',
        a: 'Unsere Einstiegspreise: Handwäsche ab €75,–, Innenreinigung ab €75,–, das Komplettpaket „Deep Clean" ab €420,–. Alle Preise sind Endpreise und Richtwerte für durchschnittlich verschmutzte Pkw. Der finale Preis richtet sich nach Aufwand, Verschmutzungsgrad und – bei Wash & Clean, Deep Clean & Leichter Politur – nach der Fahrzeuggröße. Eine genaue Übersicht findest du im Bereich Services & Preise.',
        keywords: ['preis', 'preise', 'kosten', 'kostet', 'teuer', 'aufbereitung', 'einstiegspreis', 'preisliste'],
        category: 'preise',
        links: [LINK_BUCHEN],
        featured: true,
    },
    {
        id: 'faq-mobil-ablauf',
        q: 'Wie wäscht Elité mein Auto mobil bei mir in der Einfahrt?',
        a: 'Beim mobilen Service kommen wir mit unserem voll ausgestatteten Van direkt zu dir – in die Einfahrt, zum Stellplatz oder vor die Haustür. Wir bringen das komplette Equipment mit und arbeiten weitgehend autark. Ein Strom- bzw. Wasseranschluss ist hilfreich, aber nicht zwingend nötig. Es gilt eine Anfahrtspauschale von €50,–. Alle Leistungen sind auch mobil buchbar.',
        keywords: ['mobil', 'mobiler', 'einfahrt', 'zuhause', 'hause', 'daheim', 'van', 'kommt', 'kommen', 'strom', 'wasser', 'vorbeikommen'],
        category: 'mobil',
        links: [LINK_MOBIL],
        featured: true,
    },
    {
        id: 'faq-standorte',
        q: 'Wo befindet sich Elité Aufbereitung?',
        a: 'Wir haben zwei Standorte in Vorarlberg: Ketschenstraße 1 in 6800 Feldkirch und Bundesstraße 2a in 6714 Nüziders. Alternativ kommen wir mit dem mobilen Service direkt zu dir.',
        keywords: ['wo', 'standort', 'standorte', 'adresse', 'finden', 'feldkirch', 'nüziders', 'werkstatt', 'studio', 'befindet'],
        category: 'standort',
        featured: true,
    },
    {
        id: 'faq-dauer-politur-keramik',
        q: 'Wie lange dauert eine Politur oder Keramikbeschichtung?',
        a: 'Eine Leichte Politur dauert ca. einen Arbeitstag, eine Schwere Politur etwa 1,5 Tage. Keramikbeschichtungen benötigen je nach Paket 2–3 Werktage. Bei mehrtägigen Leistungen gibst du das Fahrzeug morgens ab und holst es nach Fertigstellung wieder ab.',
        keywords: ['politur', 'keramik', 'keramikbeschichtung', 'dauer', 'dauert', 'lange', 'tage', 'zeit'],
        category: 'leistungen',
        featured: true,
    },
    {
        id: 'faq-aufpreis-groesse',
        q: 'Warum gibt es einen Aufpreis nach Fahrzeuggröße?',
        a: 'Größere Fahrzeuge bedeuten mehr Fläche und Arbeitsaufwand. Ein größenabhängiger Aufpreis fällt bei Wash & Clean, Deep Clean & Leichter Politur an: Kompaktklasse +55,–, Mittelklasse +75,–, SUV/Van +95,–, Großfahrzeuge auf Anfrage. Kleinwagen sind ohne Aufpreis. Für alle anderen Leistungen gilt kein größenabhängiger Aufpreis.',
        keywords: ['aufpreis', 'größe', 'fahrzeuggröße', 'suv', 'kombi', 'transporter', 'kleinwagen', 'zuschlag', 'größer'],
        category: 'preise',
        featured: true,
    },
    {
        id: 'faq-termin-buchen',
        q: 'Wie buche ich einen Termin?',
        a: 'Am einfachsten online über „Jetzt buchen": Du wählst Standort oder mobilen Service, die gewünschte Leistung, deine Fahrzeuggröße und einen freien Termin und lädst 1–4 Fotos deines Fahrzeugs hoch. Wir bestätigen deine Anfrage innerhalb von 24 Stunden. Hochpreisige Premium-Leistungen (z. B. Endstufe, Keramik) stimmen wir vorab kurz telefonisch ab.',
        keywords: ['buchen', 'buchung', 'termin', 'online', 'reservieren', 'anfrage', 'foto', 'fotos', 'bilder', 'hochladen', 'ablauf', 'läuft'],
        category: 'buchung',
        links: [LINK_BUCHEN],
        featured: true,
    },
    {
        id: 'faq-vorbereitung',
        q: 'Muss ich mein Auto vorbereiten?',
        a: 'Nein. Entnimm einfach deine persönlichen Gegenstände aus dem Fahrzeug – um den Rest kümmern wir uns. Wertgegenstände nimm bitte mit.',
        keywords: ['vorbereiten', 'vorbereitung', 'ausräumen', 'gegenstände', 'wertsachen', 'vorher'],
        category: 'buchung',
        featured: true,
    },
    {
        id: 'faq-haltbarkeit-versiegelung',
        q: 'Wie lange hält eine Versiegelung?',
        a: 'Eine Sprühversiegelung schützt ca. 12.000 km vor UV-Strahlung, Vogelkot, Streusalz & Oxidation. Unsere FIREBALL Keramikbeschichtung (Endstufe/Keramik-Pakete) hält je nach Paket deutlich länger – bis zu 40.000–60.000 km mit extremem Abperleffekt.',
        keywords: ['versiegelung', 'haltbarkeit', 'hält', 'halten', 'lange', 'sprühversiegelung', 'fireball', 'schutz'],
        category: 'leistungen',
        featured: true,
    },

    // ─── B. Leistungen & Preise ──────────────────────────────────────────────

    {
        id: 'preis-handwaesche',
        q: 'Was kostet eine Handwäsche?',
        a: `Basic Handwäsche ${price('handwaesche', 'Basic Handwäsche', 'ab €75,-')} (ca. 60 Min.), Premium Handwäsche ${price('handwaesche', 'Premium Handwäsche', 'ab €115,-')} (ca. 90 Min., inkl. Teer- & Flugrostentfernung und Sprühwachs-Versiegelung), Premium + Basic Interieur ${price('handwaesche', 'Premium + Basic Interieur', 'ab €175,-')}. Gewaschen wird immer kratzfrei per Hand mit der 2-Eimer-Methode.`,
        keywords: ['handwäsche', 'waschen', 'wäsche', 'außenreinigung', 'preis', 'kosten', 'kostet', 'teuer'],
        category: 'preise',
        links: [LINK_BUCHEN],
    },
    {
        id: 'preis-innenreinigung',
        q: 'Was kostet eine Innenreinigung?',
        a: `Basic Innenreinigung ${price('innenreinigung', 'Basic Innenreinigung', 'ab €75,-')} (Staubsaugen, Armaturen, Fenster, Automatten), Premium Innenreinigung ${price('innenreinigung', 'Premium Innenreinigung', 'ab €155,-')} (zusätzlich Lederpflege, Nassreinigung der Sitze, Kunststoffbehandlung). Eine Ledersitz-Beschichtung gibt es ${price('innenreinigung', 'Ledersitz Beschichtung', 'ab €85,-')}.`,
        keywords: ['innenreinigung', 'innenraum', 'preis', 'kosten', 'kostet', 'teuer', 'saugen', 'polster', 'sitze'],
        category: 'preise',
        links: [LINK_BUCHEN],
    },
    {
        id: 'preis-politur',
        q: 'Was kostet eine Politur?',
        a: `Leichte Politur ${price('politur', 'Leichte Politur', 'ab €395,-')} (1-stufig, entfernt sehr feine Kratzer, inkl. Wachsbeschichtung), Schwere Politur ${price('politur', 'Schwere Politur', 'ab €595,-')} (mehrstufig, entfernt mittlere bis tiefe Kratzer, Oxidation & Hologramme – wird telefonisch abgestimmt). Für einzelne Stellen gibt es die Spot-Politur ${price('politur', 'Spot-Politur', 'ab €45,-')}.`,
        keywords: ['politur', 'polieren', 'kratzer', 'preis', 'kosten', 'kostet', 'teuer', 'lackkratzer'],
        category: 'preise',
        links: [LINK_BUCHEN, LINK_TEL],
    },
    {
        id: 'preis-keramik',
        q: 'Was kostet eine Keramikversiegelung?',
        a: `Neuwagen Beschichtung ${price('keramik', 'Neuwagen Beschichtung', 'ab €795,-')} (für Autos bis 3–4 Monate / 4.000 km), Beschichtungspaket ${price('keramik', 'Beschichtungspaket', 'ab €895,-')} (Lebensdauer 2–3 Jahre, inkl. 3-Gang Politur), Matt Beschichtung ${price('keramik', 'Matt Beschichtung', 'ab €795,-')} für matte Lacke. Wir arbeiten mit FIREBALL – Haltbarkeit 40.000–60.000 km. Keramik-Pakete stimmen wir vorab kurz telefonisch ab.`,
        keywords: ['keramik', 'keramikversiegelung', 'keramikbeschichtung', 'versiegelung', 'beschichtung', 'fireball', 'preis', 'kosten', 'kostet', 'teuer', 'coating'],
        category: 'preise',
        links: [LINK_TEL, LINK_BUCHEN],
    },
    {
        id: 'preis-komplettpakete',
        q: 'Welche Komplettpakete gibt es?',
        a: `Vier Stufen: Bronze „Wash & Clean" (${tier('tier-bronze', 'ab 230,–')} €, Handwäsche + Innenreinigung), Silber „Deep Clean" (${tier('tier-silber', 'ab 420,–')} €, zusätzlich 1-Schritt Politur & Sprühversiegelung), Gold „Deep Polish" (${tier('tier-gold', 'ab 890,–')} €, 2-stufige Politur, Fenster- & Kunststoffbeschichtung) und Élite „Endstufe" (${tier('tier-elite', 'ab 1.890,–')} €, 3-Gang Politur + FIREBALL Keramik, das Maximum). Gold & Endstufe stimmen wir telefonisch ab.`,
        keywords: ['komplettpaket', 'komplettpakete', 'paket', 'pakete', 'bronze', 'silber', 'gold', 'endstufe', 'deep clean', 'deep polish', 'wash', 'alles', 'teuer', 'kostet', 'kosten', 'preis', 'preise'],
        intent: 'price', // "Welche … gibt es?" leitet keinen Intent ab
        category: 'preise',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-verkaufsaufbereitung',
        q: 'Bietet ihr eine Verkaufsaufbereitung an?',
        a: `Ja – die Verkaufsaufbereitung bzw. Aufbereitung für Leasingrückläufer gibt es ${price('verkauf', 'Verkaufsaufbereitung / Leasingrückläufer', 'ab €295,-')}: gründliche Innen- & Außenreinigung, Flecken und Gebrauchsspuren entfernen, Lackpolitur für glänzende Inserate-Fotos. Leasingrückläufer bereiten wir rückgabefertig auf – das vermeidet teure Nachzahlungen.`,
        keywords: ['verkauf', 'verkaufen', 'verkaufsaufbereitung', 'leasing', 'leasingrückgabe', 'rückgabe', 'inserat', 'nachzahlung'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-zusatzpakete',
        q: 'Welche Zusatzpakete gibt es?',
        a: 'Eine ganze Reihe: Fenster beschichten (ab €85,– bzw. alle Scheiben ab €185,–), Felgen-Keramik (ab €245,–), Textilimprägnierung (ab €35,–/Sitz), Dachhimmel-Reinigung (ab €55,–), Leder-Keramik (ab €125,–), Hundehaare entfernen (ab €40,–), Motorwäsche (ab €50,–), Cabrio-Verdeck imprägnieren (ab €70,–), Ozonbehandlung (ab €75,–), PPF-Lackschutzfolie (ab €80,–) u. v. m. Zusatzpakete lassen sich direkt bei der Buchung dazubuchen.',
        keywords: ['zusatzpaket', 'zusatzpakete', 'zusatz', 'extras', 'zusätzlich', 'dazubuchen', 'optionen', 'kostet', 'kosten', 'preis'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-hundehaare',
        q: 'Entfernt ihr auch Hundehaare?',
        a: `Ja, gründliche Tierhaar-Entfernung aus Polstern, Teppichen & Kofferraum gibt es als Zusatzpaket ${price('zusatz', 'Hundehaare entfernen', 'ab €40,-')}. Bei der Premium Innenreinigung und den Komplettpaketen ist das Entfernen von Tierhaaren bereits inklusive.`,
        keywords: ['hund', 'hunde', 'hundehaare', 'tierhaare', 'haare', 'katze', 'katzenhaare', 'tier', 'fell'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-geruch-ozon',
        q: 'Bekommt ihr Gerüche aus dem Auto (Rauch, Tier, Feuchtigkeit)?',
        a: `Ja – mit der Ozonbehandlung (${price('zusatz', 'Ozonbehandlung', 'ab €75,-')}). Sie beseitigt hartnäckige Gerüche wie Nikotin, Tiergeruch oder Feuchtigkeit, desinfiziert in der Tiefe (Bakterien, Pilze, Keime) und dringt in Polster, Teppiche und Lüftungsschächte ein. Die Wirkung hält über Wochen an.`,
        keywords: ['geruch', 'gerüche', 'stinkt', 'riecht', 'rauch', 'raucher', 'nikotin', 'zigaretten', 'ozon', 'ozonbehandlung', 'muffig', 'desinfektion'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-scheinwerfer',
        q: 'Poliert ihr stumpfe Scheinwerfer?',
        a: `Ja, Scheinwerfer polieren wir ${price('politur', 'Scheinwerfer Polieren', 'ab €60,- (je Stück)')}: Mit Schleif- und Poliertechniken bringen wir vergilbte, stumpfe Scheinwerfer zurück auf Glanz – auch ideal vor der §57a-Begutachtung (Pickerl).`,
        keywords: ['scheinwerfer', 'stumpf', 'vergilbt', 'milchig', 'licht', 'pickerl', 'blind'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-felgenversiegelung',
        q: 'Macht ihr Felgenversiegelungen?',
        a: `Ja: Felgen-Keramik mit 1 Schicht ${price('zusatz', 'Felgen-Keramik 1 Schicht', 'ab €245,-')} (Haltbarkeit 2,5–3 Jahre) oder 2 Schichten ${price('zusatz', 'Felgen-Keramik 2 Schichten', 'ab €345,-')} (3,5–4 Jahre). Die Felgen werden demontiert und gereinigt; die Versiegelung verhindert haftenden Bremsstaub und macht die Reinigung deutlich leichter.`,
        keywords: ['felgen', 'felgenversiegelung', 'felgenkeramik', 'bremsstaub', 'räder', 'alufelgen'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-scheibenversiegelung',
        q: 'Was bringt eine Scheibenversiegelung?',
        a: `Bessere Sicht bei Regen: Wasser perlt ab ca. ±70 km/h einfach ab. Windschutzscheibe oder Seitenscheiben ${price('zusatz', 'Windschutzscheibe beschichten', 'ab €85,-')}, alle Fenster ${price('zusatz', 'Alle Fenster beschichten', 'ab €185,-')}. Haltbarkeit ca. 12 Monate bzw. 20.000 km.`,
        keywords: ['scheiben', 'scheibe', 'scheibenversiegelung', 'fenster', 'windschutzscheibe', 'glas', 'glasversiegelung', 'regen', 'abperlen', 'sicht'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-lederpflege',
        q: 'Pflegt und schützt ihr Ledersitze?',
        a: `Ja. Die Ledersitz-Beschichtung (${price('innenreinigung', 'Ledersitz Beschichtung', 'ab €85,-')}) macht Leder wasser- & schmutzabweisend und schützt vor UV-Strahlung und Farbübertragung (z. B. von Jeans) – inkl. Reinigung der Sitze. Noch langlebiger ist die Leder-Keramik-Versiegelung (${price('zusatz', 'Leder-Keramik versiegeln', 'ab €125,-')}). Lederreinigung & -pflege ist außerdem Teil der Premium Innenreinigung.`,
        keywords: ['leder', 'ledersitze', 'lederpflege', 'ledersitz', 'sitze', 'jeans', 'lederreinigung'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-cabrio',
        q: 'Imprägniert ihr Cabrio-Verdecke?',
        a: `Ja, Reinigung & Imprägnierung des Stoffverdecks gibt es ${price('zusatz', 'Cabrio-Verdeck imprägnieren', 'ab €70,-')} – danach ist das Verdeck wieder wasser- und schmutzabweisend.`,
        keywords: ['cabrio', 'verdeck', 'stoffdach', 'imprägnieren', 'cabriodach'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-motorwaesche',
        q: 'Macht ihr auch Motorwäschen?',
        a: `Ja, die schonende Motorraumreinigung mit anschließender Konservierung gibt es ${price('zusatz', 'Motorwäsche + Konservierung', 'ab €50,-')}.`,
        keywords: ['motor', 'motorraum', 'motorwäsche', 'motorreinigung'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'leistung-neuwagen',
        q: 'Lohnt sich eine Keramikbeschichtung für meinen Neuwagen?',
        a: `Gerade beim Neuwagen lohnt es sich: Der Lack ist noch nahezu makellos und kann optimal geschützt werden, bevor erste Waschanlagen-Kratzer entstehen. Die Neuwagen Beschichtung (${price('keramik', 'Neuwagen Beschichtung', 'ab €795,-')}) gilt für Autos bis 3–4 Monate bzw. 4.000 km und beinhaltet Politur, Dekontamination und die FIREBALL-Keramikschicht.`,
        keywords: ['neuwagen', 'neues', 'neu', 'neukauf', 'abholung', 'werksneu'],
        category: 'leistungen',
        links: [LINK_TEL],
    },
    {
        id: 'leistung-matt',
        q: 'Behandelt ihr auch matte Lacke und Folierungen?',
        a: `Ja, für matte Lacke gibt es die spezielle Matt Beschichtung (${price('keramik', 'Matt Beschichtung', 'ab €795,-')}) – sie schützt, ohne den matten Look zu verändern (kein Glanz-Effekt). Wird telefonisch abgestimmt.`,
        keywords: ['matt', 'mattlack', 'matte', 'folie', 'folierung', 'mattfolie'],
        category: 'leistungen',
        links: [LINK_TEL],
    },
    {
        id: 'leistung-ppf',
        q: 'Bietet ihr Lackschutzfolie (PPF) an?',
        a: `Ja, punktuell für die meistbelasteten Stellen: PPF für die Einstiege ${price('zusatz', 'PPF Einstiege', 'ab €90,-')} und für die Türgriffmulden ${price('zusatz', 'PPF Türgriffmulden', 'ab €80,-')}. PPF (Paint Protection Film) ist eine transparente, selbstheilende Folie, die den Lack unsichtbar vor Kratzern und Steinschlag schützt.`,
        keywords: ['ppf', 'lackschutzfolie', 'folie', 'steinschlag', 'steinschlagschutz', 'schutzfolie', 'einstiege'],
        category: 'leistungen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'buchung-telefonisch',
        q: 'Warum werden manche Pakete telefonisch abgestimmt?',
        a: 'Hochpreisige Leistungen wie Gold „Deep Polish", die Élite „Endstufe", die Schwere Politur und die Keramik-Pakete hängen stark vom Zustand deines Lacks ab. Damit das Ergebnis und der Preis passen, besprechen wir diese Pakete vorab kurz persönlich – danach bekommst du deinen Termin.',
        keywords: ['telefonisch', 'telefon', 'anrufen', 'abstimmen', 'absprache', 'beratung', 'rückruf'],
        category: 'buchung',
        links: [LINK_TEL],
    },

    // ─── C. Kontakt, Standort & Buchung ──────────────────────────────────────

    {
        id: 'kontakt',
        q: 'Wie erreiche ich euch?',
        a: 'Telefonisch unter +43 664 2546078, per E-Mail an info.eliteaufbereitung@gmail.com oder über Instagram (@eliteaufbereitung) und Facebook. Wir melden uns so schnell wie möglich zurück.',
        keywords: ['kontakt', 'telefon', 'telefonnummer', 'nummer', 'email', 'mail', 'instagram', 'facebook', 'erreichen', 'anrufen', 'schreiben', 'whatsapp'],
        category: 'kontakt',
        links: [LINK_TEL, LINK_MAIL],
    },
    {
        id: 'standort-einzugsgebiet',
        q: 'In welchem Gebiet seid ihr mobil unterwegs?',
        a: 'Mit dem mobilen Service sind wir in ganz Vorarlberg unterwegs – von Bludenz über Feldkirch, Rankweil, Götzis, Hohenems und Dornbirn bis Bregenz. Es gilt eine Anfahrtspauschale von €50,–.',
        keywords: ['einzugsgebiet', 'gebiet', 'vorarlberg', 'dornbirn', 'bregenz', 'bludenz', 'hohenems', 'lustenau', 'rankweil', 'götzis', 'umgebung', 'nähe', 'kommt', 'region'],
        intent: 'location', // "In welchem Gebiet …?" leitet keinen Intent ab
        category: 'mobil',
        links: [LINK_MOBIL],
    },
    {
        id: 'buchung-zeiten',
        q: 'Wann kann ich Termine buchen?',
        a: 'Online buchbare Termine gibt es Montag bis Freitag von 08:00 bis 18:00 Uhr und Samstag von 08:00 bis 13:00 Uhr. Bei mehrtägigen Leistungen gibst du das Auto bis 09:00 Uhr ab und holst es am letzten Tag ab 16:00 Uhr wieder ab. Du brauchst einen Termin außerhalb dieser Zeiten? Ruf uns einfach kurz an – wir finden eine Lösung.',
        keywords: ['öffnungszeiten', 'offen', 'zeiten', 'wann', 'uhrzeit', 'samstag', 'sonntag', 'feierabend', 'wochenende', 'abends', 'geöffnet'],
        category: 'buchung',
        links: [LINK_BUCHEN, LINK_TEL],
        confirm: true, // TODO(matthias): offizielle Öffnungszeiten je Standort bestätigen
    },
    {
        id: 'mobil-kosten',
        q: 'Was kostet der mobile Service zusätzlich?',
        a: 'Beim mobilen Service gilt eine Anfahrtspauschale von €50,–. Bei einzelnen Premium-Paketen (z. B. Deep Clean, Politur- und Keramik-Pakete) kommt zusätzlich ein paketabhängiger Mobil-Aufpreis von €45,– bis €85,– dazu, weil dort mehr Equipment vor Ort nötig ist. Beide Posten siehst du transparent bei der Online-Buchung.',
        keywords: ['anfahrt', 'anfahrtspauschale', 'mobil', 'aufpreis', 'mobilaufpreis', 'zusatzkosten', 'pauschale'],
        category: 'mobil',
        links: [LINK_MOBIL, LINK_BUCHEN],
    },

    // ─── D. Allgemeines Detailing-Wissen ─────────────────────────────────────

    {
        id: 'wissen-keramikversiegelung',
        q: 'Was ist eine Keramikversiegelung?',
        a: 'Eine Keramikversiegelung ist eine flüssig aufgetragene Schutzschicht auf SiO2-Basis, die sich dauerhaft mit dem Lack verbindet – deutlich härter und langlebiger als Wachs. Sie schützt vor UV-Strahlung, Vogelkot, Streusalz und Oxidation, sorgt für extremen Abperleffekt (Wasser & Schmutz haften kaum) und intensiviert den Glanz. Bei uns kommt FIREBALL mit 40.000–60.000 km Haltbarkeit zum Einsatz.',
        keywords: ['keramik', 'keramikversiegelung', 'erklärung', 'bedeutet', 'funktioniert', 'sio2', 'coating', 'vorteile', 'lohnt'],
        category: 'wissen',
    },
    {
        id: 'wissen-politur-wachs',
        q: 'Was ist der Unterschied zwischen Politur, Wachs und Versiegelung?',
        a: 'Politur trägt eine hauchdünne Lackschicht ab und entfernt so Kratzer, Swirls und Oxidation – sie stellt den Glanz wieder her. Wachs und Versiegelung schützen danach: Wachs ist natürlich und hält wenige Monate, eine Sprühversiegelung ca. 12.000 km, eine Keramikversiegelung mehrere Jahre. Kurz: Politur korrigiert, Wachs/Versiegelung konserviert.',
        // kein 'politur'-Keyword: sonst Gleichstand mit wissen-politur bei "Was ist eine Politur?"-Varianten
        keywords: ['unterschied', 'wachs', 'versiegelung', 'wachsen', 'carnauba'],
        category: 'wissen',
    },
    {
        id: 'wissen-swirls',
        q: 'Was sind Swirls und Hologramme?',
        a: 'Swirls sind feine, kreisförmige Mikrokratzer, die vor allem durch Waschanlagen und falsches Trocknen entstehen – sichtbar als „Spinnennetz" in der Sonne. Hologramme sind wolkige Schleier durch unsaubere maschinelle Politur. Beides lässt sich mit einer professionellen Politur entfernen: leichte Spuren mit der 1-stufigen, stärkere mit der mehrstufigen Politur.',
        keywords: ['swirls', 'hologramme', 'waschkratzer', 'kreise', 'mikrokratzer', 'spinnennetz', 'kratzerchen'],
        category: 'wissen',
    },
    {
        id: 'wissen-wie-oft-waschen',
        q: 'Wie oft sollte ich mein Auto waschen lassen?',
        a: 'Als Faustregel: alle 2–4 Wochen, im Winter wegen Streusalz eher öfter. Wichtiger als die Häufigkeit ist die Methode – kratzfreie Handwäsche statt Bürsten-Waschanlage. Vogelkot, Insekten und Baumharz solltest du nicht bis zur nächsten Wäsche warten lassen, sondern möglichst sofort entfernen, da sie den Lack angreifen.',
        keywords: ['oft', 'wie oft', 'waschen', 'häufig', 'häufigkeit', 'intervall', 'regelmäßig', 'winter'],
        category: 'wissen',
    },
    {
        id: 'wissen-waschanlage',
        q: 'Ist die Waschanlage schlecht für meinen Lack?',
        a: 'Bürsten-Waschanlagen sind die häufigste Ursache für Swirls und Mikrokratzer: Die Bürsten führen Schmutzpartikel der Vorgängerfahrzeuge über deinen Lack. Schonender ist die Handwäsche mit der 2-Eimer-Methode – ein Eimer mit Shampoo, einer zum Auswaschen des Handschuhs, sodass kein Schmutz zurück auf den Lack gelangt. Genau so waschen wir bei Elité.',
        keywords: ['waschanlage', 'waschstraße', 'bürsten', 'eimer', 'zwei-eimer', 'handwäsche', 'schlecht', 'kratzer'],
        category: 'wissen',
    },
    {
        id: 'wissen-dekontamination',
        q: 'Was ist eine Lackdekontamination bzw. Tonbehandlung?',
        a: 'Auf dem Lack lagern sich mit der Zeit Partikel ab, die keine Wäsche entfernt: Flugrost, Teer, Industriestaub, Baumharz. Bei der Dekontamination werden sie chemisch gelöst und mit Reinigungsknete (Tonbehandlung) mechanisch abgenommen. Danach fühlt sich der Lack glatt wie Glas an – die Pflichtbasis vor jeder Politur oder Keramikversiegelung.',
        keywords: ['dekontamination', 'tonbehandlung', 'knete', 'reinigungsknete', 'flugrost', 'teer', 'clay'],
        category: 'wissen',
    },
    {
        id: 'wissen-lederpflege-tipps',
        q: 'Wie pflege ich Ledersitze richtig?',
        a: 'Regelmäßig Staub absaugen und mit einem leicht feuchten Mikrofasertuch abwischen; 2–3× im Jahr mit mildem Lederreiniger reinigen und anschließend eine Lederpflege auftragen, damit das Leder geschmeidig bleibt und nicht reißt. Direkte Sonne meiden (UV bleicht aus). Den besten Langzeitschutz bietet eine professionelle Leder-Beschichtung – die gibt es bei uns ab €85,–.',
        keywords: ['leder', 'lederpflege', 'pflegen', 'ledersitze', 'reinigen', 'risse', 'tipps'],
        category: 'wissen',
    },
    {
        id: 'wissen-pflege-nach-keramik',
        q: 'Wie pflege ich mein Auto nach einer Keramikversiegelung?',
        a: 'Die ersten 1–2 Wochen härtet die Beschichtung aus – in dieser Zeit nicht waschen. Danach: Handwäsche mit pH-neutralem Shampoo, keine Bürsten-Waschanlagen und keine Wachs- oder Heißwachs-Programme (die legen sich über die Keramik und mindern den Abperleffekt). Mit der richtigen Pflege hält die Versiegelung ihre volle Wirkung über die gesamte Lebensdauer.',
        keywords: ['pflege', 'nach', 'keramik', 'aushärten', 'waschen', 'shampoo', 'nachsorge'],
        category: 'wissen',
    },
    {
        id: 'wissen-vogelkot',
        q: 'Was tun bei Vogelkot, Baumharz oder Insekten auf dem Lack?',
        a: 'So schnell wie möglich entfernen! Vogelkot ist stark ätzend und kann den Klarlack innerhalb weniger Stunden (besonders bei Sonne) dauerhaft beschädigen. Einweichen mit Wasser oder Detailer-Spray und sanft mit einem Mikrofasertuch abnehmen – niemals trocken reiben. Sind bereits matte Flecken oder Ätzränder entstanden, lassen sie sich meist mit einer Spot-Politur (ab €45,–) beheben.',
        keywords: ['vogelkot', 'vogeldreck', 'harz', 'baumharz', 'insekten', 'flecken', 'ätzend', 'lackschaden'],
        category: 'wissen',
    },
    {
        id: 'wissen-aufbereitung-verkauf',
        q: 'Lohnt sich eine Aufbereitung vor dem Autoverkauf?',
        a: 'Fast immer. Ein gepflegtes, glänzendes Auto erzielt nachweislich höhere Verkaufspreise und verkauft sich schneller – der Mehrerlös liegt meist deutlich über den Aufbereitungskosten. Käufer schließen vom Pflegezustand aufs ganze Fahrzeug. Unsere Verkaufsaufbereitung gibt es ab €295,–, inklusive Politur für perfekte Inserate-Fotos.',
        keywords: ['verkauf', 'autoverkauf', 'wert', 'wertsteigerung', 'lohnt', 'verkaufspreis', 'wiederverkauf'],
        category: 'wissen',
        links: [LINK_BUCHEN],
    },
    {
        id: 'wissen-schichtdicke',
        q: 'Was ist eine Schichtdickenmessung?',
        a: 'Vor jeder Politur messen wir die Dicke des Lacks elektronisch. So sehen wir, wie viel Klarlack vorhanden ist und wie viel Material gefahrlos abgetragen werden kann – und erkennen nachlackierte Stellen oder frühere Smart-Repairs. Das schützt deinen Lack vor Durchpolieren und ist bei Deep Clean, Deep Polish & Endstufe inklusive.',
        keywords: ['schichtdicke', 'schichtdickenmessung', 'lackdicke', 'messung', 'messen', 'klarlack'],
        category: 'wissen',
    },
    {
        id: 'wissen-politur',
        q: 'Was ist eine Politur?',
        a: 'Eine Politur trägt eine hauchdünne Schicht des Klarlacks ab und entfernt so Kratzer, Swirls, Oxidation und Hologramme – der Glanz wird wiederhergestellt. Bei uns gibt es die Leichte Politur (1-stufig, für sehr feine Kratzer, inkl. Wachsbeschichtung, ca. ein Arbeitstag), die Schwere Politur (mehrstufig, für mittlere bis tiefe Kratzer, ca. 1,5 Tage) und die Spot-Politur für einzelne Stellen. Vor jeder Politur messen wir die Lackdicke.',
        keywords: ['politur', 'polieren', 'lackpolitur', 'lackkorrektur', 'aufpolieren'],
        variants: ['Was bringt eine Politur?', 'Was macht eine Politur?'],
        category: 'wissen',
    },
    {
        id: 'wissen-aufbereitung',
        q: 'Was ist eine Autoaufbereitung?',
        a: 'Eine Autoaufbereitung ist die professionelle Reinigung und Pflege deines Fahrzeugs innen und außen – deutlich gründlicher als eine normale Wäsche. Je nach Paket gehören kratzfreie Handwäsche, Innenreinigung, Lackpolitur und Schutz durch Versiegelung oder Keramik dazu: von der Basic Handwäsche bis zum Maximum, der Élite „Endstufe".',
        keywords: ['aufbereitung', 'autoaufbereitung', 'fahrzeugaufbereitung', 'detailing', 'aufbereiten'],
        variants: ['Was ist Detailing?'],
        category: 'wissen',
    },
    {
        id: 'wissen-innenreinigung',
        q: 'Was ist eine professionelle Innenreinigung?',
        a: 'Bei der Basic Innenreinigung saugen wir das Fahrzeug gründlich und reinigen Armaturen, Fenster und Automatten (ca. 90 Minuten). Die Premium Innenreinigung umfasst zusätzlich Lederpflege, Nassreinigung der Sitze und Kunststoffbehandlung – inklusive Tierhaar-Entfernung (ca. 2,5 Stunden).',
        keywords: ['innenreinigung', 'innenraum', 'umfasst', 'enthalten', 'inklusive', 'beinhaltet'],
        category: 'wissen',
    },
    {
        id: 'wissen-handwaesche',
        q: 'Was ist eine kratzfreie Handwäsche?',
        a: 'Wir waschen ausschließlich per Hand mit der 2-Eimer-Methode: ein Eimer mit Shampoo, einer zum Auswaschen des Handschuhs – so gelangt kein Schmutz zurück auf den Lack und es entstehen keine Waschanlagen-Kratzer. Bei der Premium Handwäsche kommen Teer- & Flugrostentfernung und eine Sprühwachs-Versiegelung dazu.',
        keywords: ['handwäsche', 'autowäsche', 'waschen', 'eimer', 'kratzfrei', 'schonend'],
        category: 'wissen',
    },
    {
        id: 'wissen-versiegelung',
        q: 'Was ist eine Lackversiegelung?',
        a: 'Eine Versiegelung legt eine Schutzschicht über den Lack: Sie schützt vor UV-Strahlung, Vogelkot, Streusalz und Oxidation und sorgt für einen Abperleffekt. Es gibt drei Stufen: Wachs hält wenige Monate, eine Sprühversiegelung ca. 12.000 km, unsere FIREBALL Keramikversiegelung 40.000–60.000 km.',
        keywords: ['versiegelung', 'lackversiegelung', 'sprühversiegelung', 'versiegeln', 'lackschutz', 'schutzschicht'],
        variants: ['Was ist eine Versiegelung?', 'Welche Versiegelungen gibt es?'],
        category: 'wissen',
    },
    {
        id: 'wissen-spot-politur',
        q: 'Was ist eine Spot-Politur?',
        a: `Bei der Spot-Politur polieren wir einzelne Stellen statt des ganzen Fahrzeugs – ideal bei einzelnen Kratzern, matten Flecken oder Ätzrändern von Vogelkot. Gibt es ${price('politur', 'Spot-Politur', 'ab €45,-')}.`,
        keywords: ['spot', 'spotpolitur', 'stelle', 'stellen', 'teilpolitur'],
        category: 'wissen',
    },

    // ─── E. Noch mit Matthias zu klären (sichere Deflection-Antworten) ───────
    // TODO(matthias): siehe docs/context/open-questions.md → "FAQ-Bot Inhalte"

    {
        id: 'info-zahlung',
        q: 'Wie kann ich bezahlen?',
        a: 'Die Details zur Bezahlung klären wir am besten kurz persönlich – ruf uns einfach an oder schreib uns, dann bekommst du sofort alle Infos zu den Zahlungsmöglichkeiten.',
        keywords: ['zahlen', 'bezahlen', 'zahlung', 'zahlungsmethoden', 'bar', 'karte', 'kartenzahlung', 'rechnung', 'anzahlung', 'überweisung'],
        category: 'kontakt',
        links: [LINK_TEL, LINK_MAIL],
        confirm: true,
    },
    {
        id: 'info-garantie',
        q: 'Gibt es eine Garantie auf die Keramikversiegelung?',
        a: 'Unsere FIREBALL Keramikbeschichtung hält je nach Paket 40.000–60.000 km. Alle Details zu Garantie und Gewährleistung besprechen wir gerne persönlich mit dir – ruf einfach kurz durch.',
        keywords: ['garantie', 'gewährleistung', 'garantiert', 'zusicherung'],
        category: 'kontakt',
        links: [LINK_TEL],
        confirm: true,
    },
    {
        id: 'info-storno',
        q: 'Kann ich meinen Termin verschieben oder stornieren?',
        a: 'Wenn sich bei dir etwas ändert, melde dich einfach so früh wie möglich telefonisch oder per E-Mail – gemeinsam finden wir einen neuen Termin.',
        keywords: ['storno', 'stornieren', 'absagen', 'umbuchen', 'verschieben', 'verhindert', 'krank'],
        category: 'buchung',
        links: [LINK_TEL, LINK_MAIL],
        confirm: true,
    },
    {
        id: 'info-gutschein',
        q: 'Gibt es Geschenkgutscheine?',
        a: 'Eine Autoaufbereitung ist ein großartiges Geschenk! Frag am besten kurz telefonisch oder per E-Mail nach – wir finden sicher eine passende Lösung für deinen Anlass.',
        keywords: ['gutschein', 'gutscheine', 'geschenk', 'schenken', 'geburtstag', 'weihnachten', 'geschenkidee'],
        category: 'kontakt',
        links: [LINK_TEL, LINK_MAIL],
        confirm: true,
    },
    {
        id: 'info-firmen',
        q: 'Bietet ihr Konditionen für Firmen und Flotten?',
        a: 'Für Firmenfahrzeuge, Flotten und Autohäuser erstellen wir gerne ein individuelles Angebot – melde dich einfach telefonisch oder per E-Mail bei uns.',
        keywords: ['firma', 'firmen', 'flotte', 'fuhrpark', 'gewerbe', 'gewerblich', 'autohaus', 'b2b', 'firmenwagen'],
        category: 'kontakt',
        links: [LINK_TEL, LINK_MAIL],
        confirm: true,
    },
    {
        id: 'info-holbring',
        q: 'Gibt es einen Hol- und Bringservice?',
        a: 'Ob wir dein Auto abholen und wieder vorbeibringen können, hängt von Termin und Strecke ab – frag einfach kurz telefonisch nach, wir finden eine Lösung. Alternativ kommen wir mit dem mobilen Service direkt zu dir.',
        keywords: ['abholen', 'abholung', 'holservice', 'bringservice', 'bringen', 'liefern', 'ersatzwagen'],
        category: 'kontakt',
        links: [LINK_TEL, LINK_MOBIL],
        confirm: true,
    },
    {
        id: 'info-regen',
        q: 'Was passiert beim mobilen Service, wenn es regnet?',
        a: 'Schlechtwetter besprechen wir flexibel: Je nach Leistung und Standort (z. B. Carport, Garage) ist der Termin trotzdem möglich – ansonsten verschieben wir unkompliziert. Wir melden uns rechtzeitig bei dir.',
        keywords: ['regen', 'regnet', 'wetter', 'schlechtwetter', 'schnee', 'winter', 'unwetter'],
        category: 'mobil',
        links: [LINK_TEL],
        confirm: true,
    },
    {
        id: 'info-andere-fahrzeuge',
        q: 'Bereitet ihr auch Motorräder, Wohnmobile oder Boote auf?',
        a: 'Sondertermine für Motorräder, Wohnmobile, Transporter oder Boote stimmen wir individuell ab – ruf uns einfach kurz an und beschreib dein Fahrzeug, dann sagen wir dir sofort, was möglich ist.',
        keywords: ['motorrad', 'motorräder', 'wohnmobil', 'camper', 'wohnwagen', 'boot', 'lkw', 'oldtimer', 'bus'],
        category: 'kontakt',
        links: [LINK_TEL],
        confirm: true,
    },
];

export const FEATURED_FAQS = FAQ_KNOWLEDGE.filter((e) => e.featured);

export const SUGGESTED_QUESTIONS = [
    'Was kostet eine Keramikversiegelung?',
    'Kommt ihr auch zu mir nach Hause?',
    'Wie oft sollte ich mein Auto waschen lassen?',
    'Wie buche ich einen Termin?',
];
