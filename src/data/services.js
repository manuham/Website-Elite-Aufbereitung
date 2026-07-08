export const tierPackages = [
    {
        id: 'tier-bronze',
        tier: 'Bronze',
        dots: 1,
        name: 'Wash & Clean',
        subtitle: 'Premium Handwäsche & Innenreinigung',
        price: 'ab €230,-',
        sizeSurcharge: true,
        durationMin: 300,
        mobilExtraMin: 60,
        headerStyle: { background: 'linear-gradient(135deg, #A0522D, #CD7F32, #D4945A)' },
        features: [
            { section: 'Aussen' },
            { text: 'Kratzfreie Handwäsche (2-Eimer-Methode)' },
            { text: 'Felgen, Reifen & Radkästen' },
            { text: 'Teer & Insektenentfernung' },
            { text: 'Sprühwachs-Versiegelung' },
            { text: 'Reifenpflege & Trocknung' },
            { section: 'Innen' },
            { text: 'Armaturenbrett & Türverkleidungen' },
            { text: 'Ledersitze reinigen & pflegen' },
            { text: 'Stoffsitze & Teppiche nassgereinigt' },
            { text: 'Kunststoffteile aufbereitet (neuer Look)' },
            { text: 'Tierhaare entfernen' },
            { text: 'Fenster & Spiegel streifenfrei' },
            { text: 'Dachhimmel Intensivreinigung' },
        ],
    },
    {
        id: 'tier-silber',
        tier: 'Silber',
        dots: 2,
        name: 'Deep Clean',
        subtitle: 'Bronze + Politur & Versiegelung',
        price: 'ab €420,-',
        sizeSurcharge: true,
        durationDays: 1,
        mobilExtraMin: 60,
        mobilSurcharge: 45,
        headerStyle: { background: 'linear-gradient(135deg, #5C5C5C, #8A8A8A, #B8B8B8)' },
        features: [
            { text: 'Alles aus Bronze', muted: true },
            { text: 'Lackvorbereitung & Entfettung', bold: true },
            { text: 'Lackinspektion & Schichtdickenmessung', bold: true },
            { text: '1-Schritt Politur', bold: true, sub: 'bis zu 40–60 % der Kratzer entfernt' },
            { text: 'Sprühversiegelung', bold: true, badge: 'ca. 12.000 km', sub: 'Haltbarkeit ca. 12.000 km — Schutz vor UV-Strahlung, Vogelkot, Streusalz & Oxidation' },
        ],
    },
    {
        id: 'tier-gold',
        tier: 'Gold',
        dots: 3,
        name: 'Deep Polish',
        phoneOnly: true,
        subtitle: 'Silber + 2-stufige Politur & Beschichtungen',
        price: 'ab €890,-',
        sizeSurcharge: true,
        durationDays: 2,
        mobilSurcharge: 65,
        headerStyle: { background: 'linear-gradient(135deg, #996515, #B8860B, #DAA520)' },
        features: [
            { text: 'Alles aus Bronze & Silber', muted: true },
            { text: 'Lackvorbereitung & Entfettung', bold: true },
            { text: 'Lackinspektion & Schichtdickenmessung', bold: true },
            { text: '2-stufige Politur', bold: true, badge: 'Upgrade', sub: '60–80 % der sichtbaren Kratzer entfernt' },
            { text: 'Sprühversiegelung', bold: true, badge: 'ca. 12.000 km', sub: 'Haltbarkeit ca. 12.000 km — Schutz vor UV-Strahlung, Vogelkot, Streusalz & Oxidation' },
            { text: 'Fensterbeschichtung (alle Scheiben)', bold: true },
            { text: 'Kunststoff UV-Schutz Beschichtung', bold: true },
            { text: 'Dekontamination & Tonbehandlung', bold: true },
        ],
    },
    {
        id: 'tier-elite',
        tier: 'Élite Exklusiv',
        dots: 0, // uses lightning icon instead
        name: 'Endstufe',
        subtitle: 'Das Ultimative. Kein Kompromiss.',
        price: 'ab €1.890,-',
        sizeSurcharge: true,
        durationDays: 5,
        headerStyle: { background: 'linear-gradient(135deg, #064E3B, #047857, #4DB292)' },
        features: [
            { text: 'Alles aus Gold', muted: true },
            { text: '3-Gang Politur', bold: true, sub: 'maximaler Glanz, bestmögliche Kratzerentfernung' },
            { text: 'FIREBALL Keramikbeschichtung', bold: true, badge: '40.000–60.000 km', sub: 'Härteste Schutzschicht — Lack, Glanz & extremer Abperleffekt' },
            { text: 'Felgen zerlegt, poliert & beschichtet', bold: true },
            { text: 'Bremssättel beschichtet', bold: true },
            { text: 'Einstiege poliert & beschichtet', bold: true },
            { text: 'Motorraum gereinigt & beschichtet', bold: true },
            { text: 'Ledersitze Keramikbeschichtung', bold: true, sub: 'Schutz vor Schmutz, UV & Farbabrieb' },
            { text: 'Kunststoffteile beschichtet (UV-Schutz)', bold: true },
            { text: 'Stoff- & Textilbeschichtung', bold: true, sub: 'inkl. Fußmatten — wasser- & schmutzabweisend' },
            { text: 'Persönliche Übergabe & Pflegeberatung', bold: true },
        ],
        gift: {
            title: 'Pflegegeschenk inklusive',
            description: 'Hochwertiges Pflegeset zur Heimanwendung',
        },
        ctaLabel: 'Mehr erfahren',
        phoneOnly: true,
    },
];

// Legacy alias for useRecommendations hook compatibility
export const allInOnePackages = tierPackages.map(pkg => ({
    id: pkg.id,
    name: `${pkg.tier} – ${pkg.name}`,
    price: pkg.price,
    priceNum: parseInt(pkg.price.replace(/[^\d]/g, '')),
    phoneOnly: !!pkg.phoneOnly,
    durationMin: pkg.durationMin ?? null,
    durationDays: pkg.durationDays ?? null,
    mobilExtraMin: pkg.mobilExtraMin ?? 0,
    mobilSurcharge: pkg.mobilSurcharge ?? 0,
}));

export const serviceCategories = [
    {
        id: "handwaesche",
        title: "Handwäsche",
        packages: [
            {
                name: "Basic Handwäsche",
                price: "ab €75,-",
                popular: false,
                sizeSurcharge: true,
                durationMin: 60,
                mobilExtraMin: 30,
                features: [
                    "Kratzfreies Waschen (2-Eimer-Methode)",
                    "Türpfosten und Türschwellen reinigen",
                    "Reinigung von Felgen, Reifen und Radkästen",
                    "Mit warmer Luft & Mikrofasertüchern trocknen",
                    "Reifenaufbereitung",
                ]
            },
            {
                name: "Premium Handwäsche",
                price: "ab €115,-",
                popular: true,
                sizeSurcharge: true,
                durationMin: 90,
                mobilExtraMin: 30,
                features: [
                    "Kratzfreies Waschen (2-Eimer-Methode)",
                    "Türpfosten und Türschwellen reinigen",
                    "Reinigung von Felgen, Reifen und Radkästen",
                    "Teer und Flugrost entfernen",
                    "Mit warmer Luft & Mikrofasertüchern trocknen",
                    "Sprühwachs Versiegelung",
                    "Reifenaufbereitung",
                    "Optional: Keramik-Versiegelung (+Aufpreis)"
                ]
            },
            {
                name: "Premium + Basic Interieur",
                price: "ab €175,-",
                popular: false,
                sizeSurcharge: true,
                durationMin: 150,
                mobilExtraMin: 30,
                features: [
                    "Alles aus Premium Handwäsche inkl.",
                    "Staubsaugen des Innenraums",
                    "Innenraum abstauben",
                    "Tierhaare Aufsaugen",
                    "Fenster, Spiegel putzen",
                ]
            }
        ]
    },
    {
        id: "innenreinigung",
        title: "Innenreinigung",
        packages: [
            {
                name: "Basic Innenreinigung",
                price: "ab €75,-",
                popular: false,
                sizeSurcharge: true,
                durationMin: 90,
                features: [
                    "Staubsaugen des Innenraums und der Automatten",
                    "Abstauben des Armaturenbretts und Konsole",
                    "Reinigung der Fenster und Spiegel (streifenfrei)",
                    "Tierhaare aufsaugen",
                    "Automatten ausbürsten und absaugen"
                ]
            },
            {
                name: "Premium Innenreinigung",
                price: "ab €155,-",
                popular: true,
                sizeSurcharge: true,
                durationMin: 150,
                features: [
                    "Armaturenbrett und Mittelkonsole reinigen",
                    "Türverkleidungen reinigen",
                    "Tierhaare entfernen",
                    "Ledersitze reinigen und pflegen",
                    "Stoffsitze reinigen und Nassaugen",
                    "Reinigung von Automatten und Teppichen",
                    "Kunststoffteile behandeln (neuer Look)",
                    "Fenster streifenfrei reinigen"
                ]
            },
            {
                name: "Ledersitz Beschichtung",
                price: "ab €85,-",
                popular: false,
                sizeSurcharge: true,
                durationMin: 60,
                features: [
                    "Wasser- und schmutzabweisend",
                    "Schutz vor UV-Strahlung",
                    "Schutz vor täglicher Beanspruchung",
                    "Schutz vor Farbübertragung (Jeans)",
                    "Gilt nur für Leder in gutem Zustand",
                    "Inkl. Reinigung der Sitze"
                ]
            }
        ]
    },
    {
        id: "politur",
        title: "Politur",
        packages: [
            {
                name: "Leichte Politur",
                price: "ab €395,-",
                popular: false,
                sizeSurcharge: true,
                durationMin: 360,
                mobilExtraMin: 30,
                mobilSurcharge: 45,
                features: [
                    "Dekontaminierende Handwäsche inkludiert",
                    "1-stufiges Polieren",
                    "Entfernung sehr feiner Kratzer",
                    "Optimaler Glanz",
                    "Inkl. Wachsbeschichtung als Lackschutz",
                    "Empfohlen für leichte Gebrauchsspuren/Neuwagen",
                    "Aufpreis je nach Fahrzeuggröße (Kompakt +55, Mittel +75, SUV +95)"
                ]
            },
            {
                name: "Schwere Politur",
                price: "ab €595,-",
                popular: true,
                sizeSurcharge: true,
                phoneOnly: true,
                durationDays: 1.5,
                mobilSurcharge: 65,
                features: [
                    "Dekontaminierende Handwäsche inkludiert",
                    "Mehrstufiges Polieren (für besten Glanz)",
                    "Entfernung mittlerer bis tiefer Kratzer",
                    "Entfernen von Oxidation, Flecken, Hologrammen",
                    "Optimaler Glanz",
                    "Inkl. Wachsbeschichtung als Lackschutz",
                    "Empfohlen für Autos mit viel Gebrauchsspuren",
                    "Größere Fahrzeuge: Aufpreis je nach Fahrzeuggröße (auf Anfrage)"
                ]
            },
            {
                name: "Spot-Politur",
                price: "ab €45,-",
                popular: false,
                durationMin: 60,
                features: [
                    "Gezielte Entfernung kleiner Kratzer",
                    "Hologramme oder Lackdefekte beheben",
                    "Perfekt ohne vollständige Politur",
                    "Für einen makellosen Look"
                ]
            },
            {
                name: "Scheinwerfer Polieren",
                price: "ab €60,- (je Stück)",
                popular: false,
                durationMin: 180,
                mobilExtraMin: 30,
                features: [
                    "Je Scheinwerfer (Stück)",
                    "Stumpfe Scheinwerfer in Glanz zurückversetzen",
                    "Schleif- und Poliertechniken",
                    "Ideal für technische Inspektionen"
                ]
            }
        ]
    },
    {
        id: "keramik",
        title: "Keramik Versiegelung",
        subtitle: "40.000 – 60.000 km Garantie. Extrem wasserabweisend & UV-beständig.",
        packages: [
            {
                name: "Neuwagen Beschichtung",
                price: "ab €795,-",
                popular: false,
                sizeSurcharge: true,
                phoneOnly: true,
                durationDays: 2,
                features: [
                    "Nur für Autos bis 3-4 Monate / 4000km",
                    "Basic-Innen und Aussenreinigung",
                    "1-2 Stufen Politur für besten Glanz",
                    "Tonbehandlung und Dekontamination",
                    "Maschinenpolieren in mehreren Schritten",
                    "Entfettung des Lacks",
                    "Auftragung von FIREBALL",
                    "Härtung der Beschichtung",
                    "Hinweise zur Pflege"
                ]
            },
            {
                name: "Beschichtungspaket",
                price: "ab €895,-",
                popular: true,
                sizeSurcharge: true,
                phoneOnly: true,
                durationDays: 3,
                mobilSurcharge: 65,
                features: [
                    "Lebensdauer 2 bis 3 Jahre",
                    "Dauer: 1-2 Werktage",
                    "Basic-Innen und Aussenreinigung",
                    "3-Gang Politur für besten Glanz",
                    "Tonbehandlung und Dekontamination",
                    "Maschinenpolieren in mehreren Schritten",
                    "Entfettung des Lacks",
                    "Auftragung von FIREBALL",
                    "Härtung der Beschichtung"
                ]
            },
            {
                name: "Matt Beschichtung",
                price: "ab €795,-",
                popular: false,
                sizeSurcharge: true,
                phoneOnly: true,
                durationDays: 2,
                mobilSurcharge: 85,
                features: [
                    "Speziell für matte Lacke",
                    "Basic-Innen und Aussenreinigung",
                    "Tonbehandlung und Dekontamination",
                    "Maschinenpolieren vorbereiten",
                    "Entfettung des Lacks",
                    "Auftragung von FIREBALL",
                    "Härtung der Beschichtung",
                    "Hinweise zur Beschichtungspflege"
                ]
            }
        ]
    },
    {
        id: "verkauf",
        title: "Verkauf & Leasing",
        subtitle: "Optimal vorbereitet für den Verkauf oder die Leasingrückgabe.",
        packages: [
            {
                name: "Verkaufsaufbereitung / Leasingrückläufer",
                price: "ab €295,-",
                popular: true,
                sizeSurcharge: true,
                durationMin: 360,
                mobilExtraMin: 60,
                features: [
                    "Gründliche Innen- und Außenreinigung",
                    "Flecken & Gebrauchsspuren entfernen",
                    "Lack polieren für einen glänzenden Auftritt",
                    "Optimale Präsentation für Inserate & Besichtigungen",
                    "Leasingrückläufer rückgabefertig aufbereitet — vermeidet Nachzahlungen",
                ]
            }
        ]
    },
    {
        id: "zusatz",
        title: "Zusatzpakete",
        packages: [
            // 0 — window coatings (recommendation referent "zusatz-0")
            {
                name: "Autofenster beschichten",
                price: "ab €85,-",
                group: "beschichten",
                popular: false,
                durationMin: 120,
                mobilExtraMin: 30,
                features: [
                    "Seitenscheiben mit Beschichtung",
                    "Wasser perlt ab ±70 km/h ab",
                    "Haltbarkeit ca. 12 Monate / 20.000 km",
                    "Bessere Sicht bei Regen",
                ]
            },
            // 1
            {
                name: "Windschutzscheibe beschichten",
                price: "ab €85,-",
                group: "beschichten",
                popular: false,
                durationMin: 60,
                mobilExtraMin: 30,
                features: [
                    "Klare Sicht bei Regen",
                    "Wasser perlt ab ±70 km/h ab",
                    "Haltbarkeit ca. 12 Monate",
                ]
            },
            // 2
            {
                name: "Alle Fenster beschichten",
                price: "ab €185,-",
                group: "beschichten",
                popular: true,
                durationMin: 120,
                mobilExtraMin: 30,
                features: [
                    "Rundum-Beschichtung aller Scheiben",
                    "Wasser perlt ab ±70 km/h ab",
                    "Haltbarkeit ca. 12 Monate / 20.000 km",
                ]
            },
            // 3
            {
                name: "Felgen-Keramik 1 Schicht",
                price: "ab €245,-",
                group: "beschichten",
                popular: false,
                durationMin: 240,
                features: [
                    "Felgen demontiert & gereinigt",
                    "Keramikversiegelung, Haltbarkeit 2,5–3 Jahre",
                    "Verhindert haftenden Bremsstaub",
                    "Deutlich leichtere Reinigung",
                ]
            },
            // 4
            {
                name: "Felgen-Keramik 2 Schichten",
                price: "ab €345,-",
                group: "beschichten",
                popular: false,
                durationMin: 360,
                features: [
                    "Zwei Schichten, Haltbarkeit 3,5–4 Jahre",
                    "Felgen demontiert & gereinigt",
                    "Maximaler Schutz vor Bremsstaub",
                ]
            },
            // 5 — interior referent ("zusatz-5" Textil)
            {
                name: "Textilimprägnierung (pro Sitz)",
                price: "ab €35,-",
                group: "innenraum",
                popular: false,
                durationMin: 30,
                features: [
                    "Wasser- & schmutzabweisend",
                    "Schützt Stoffsitze langfristig",
                    "Preis pro Sitz",
                ]
            },
            // 6
            {
                name: "Türverkleidung & Armaturen",
                price: "ab €35,-",
                group: "innenraum",
                popular: false,
                durationMin: 30,
                features: [
                    "Reinigung & Pflege der Kunststoffe",
                    "Armaturenbrett & Türverkleidungen",
                    "Stellt den Original-Look wieder her",
                ]
            },
            // 7
            {
                name: "Dachhimmel Intensivreinigung",
                price: "ab €55,-",
                group: "innenraum",
                popular: false,
                durationMin: 60,
                features: [
                    "Entfernt Flecken & Verfärbungen",
                    "Schonende Intensivreinigung",
                ]
            },
            // 8
            {
                name: "Leder-Keramik versiegeln",
                price: "ab €125,-",
                group: "innenraum",
                popular: false,
                durationMin: 90,
                features: [
                    "Wasser- & schmutzabweisend",
                    "Schutz vor UV & Farbabrieb (Jeans)",
                    "Inkl. Reinigung der Sitze",
                ]
            },
            // 9
            {
                name: "Hundehaare entfernen",
                price: "ab €40,-",
                group: "innenraum",
                popular: false,
                durationMin: 30,
                features: [
                    "Gründliche Entfernung von Tierhaaren",
                    "Aus Polstern, Teppichen & Kofferraum",
                ]
            },
            // 10
            {
                name: "Motorwäsche + Konservierung",
                price: "ab €50,-",
                group: "aussen",
                popular: false,
                durationMin: 45,
                mobilExtraMin: 30,
                features: [
                    "Schonende Motorraumreinigung",
                    "Anschließende Konservierung",
                ]
            },
            // 11
            {
                name: "Cabrio-Verdeck imprägnieren",
                price: "ab €70,-",
                group: "aussen",
                popular: false,
                durationMin: 60,
                mobilExtraMin: 30,
                features: [
                    "Reinigung & Imprägnierung",
                    "Wasser- & schmutzabweisend",
                ]
            },
            // 12
            {
                name: "Auspuffblende polieren & versiegeln",
                price: "ab €30,-",
                group: "polieren",
                popular: false,
                durationMin: 30,
                mobilExtraMin: 30,
                features: [
                    "Politur auf Hochglanz",
                    "Anschließende Versiegelung",
                ]
            },
            // 13 — multi-day, bookable
            {
                name: "Kunststoffteile beschichten (außen)",
                price: "ab €75,-",
                group: "beschichten",
                popular: false,
                durationDays: 1,
                features: [
                    "UV-Schutz für Außenkunststoffe",
                    "Stellt tiefes Schwarz wieder her",
                    "Langanhaltender Schutz",
                ]
            },
            // 14 — PPF
            {
                name: "PPF Einstiege",
                price: "ab €90,-",
                group: "aussen",
                popular: false,
                durationMin: 120,
                features: [
                    "Lackschutzfolie für die Einstiege",
                    "Unsichtbarer Schutz vor Kratzern",
                ]
            },
            // 15 — PPF
            {
                name: "PPF Türgriffmulden",
                price: "ab €80,-",
                group: "aussen",
                popular: false,
                durationMin: 90,
                features: [
                    "Lackschutzfolie für die Türgriffmulden",
                    "Schutz vor Kratzern & Lackabrieb",
                ]
            },
            // 16 — Ozon (interior referent "zusatz-16")
            {
                name: "Ozonbehandlung",
                price: "ab €75,-",
                group: "innenraum",
                popular: false,
                durationMin: 120,
                mobilExtraMin: 30,
                features: [
                    "Beseitigt hartnäckige Gerüche (Nikotin, Tier, Feuchtigkeit)",
                    "Tiefendesinfektion: Bakterien, Pilze & Keime",
                    "Dringt in Polster, Teppiche & Lüftungsschächte ein",
                    "Langanhaltende Wirkung über Wochen",
                ]
            }
        ]
    }
];
