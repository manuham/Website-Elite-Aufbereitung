/* ─── Services & prices · Stand August 2026 ──────────────────────────────────
   `price` is a plain NUMBER (euros). Never format it here — `src/lib/pricing.js`
   owns every euro string and the vehicle-size factor. Optional `priceSuffix`
   carries a per-unit note ("pro Sitz").

   `sizeSurcharge: true` means the price is multiplied by the vehicle-size factor
   (×1,0 / ×1,15 / ×1,3 / ×1,5, "auf Anfrage" for Großfahrzeuge). Only four
   services are exempt, because there the effort does not depend on car size:
   Scheinwerfer-Aufbereitung, Textilimprägnierung, Armaturen/Türverkleidung and
   Dachhimmel. pricing.js derives SIZED_IDS from this flag — it is the single
   source of truth, so flipping it here updates every surface.

   ⚠ Individual services have NO id field: theirs is `${categoryId}-${arrayIndex}`.
   Inserting, removing or reordering an entry silently re-maps every rule in
   recommendations.js and the size-factor set. Replace in place; append at the end.
-----------------------------------------------------------------------------*/

export const tierPackages = [
    {
        id: 'tier-bronze',
        tier: 'Essential',
        dots: 1,
        name: 'Wash & Clean',
        subtitle: 'Premium Handwäsche & Innenreinigung',
        price: 350,
        sizeSurcharge: true,
        durationMin: 300,
        mobilExtraMin: 60,
        headerStyle: { background: 'linear-gradient(135deg, #A0522D, #CD7F32, #D4945A)' },
        features: [
            { text: 'Kratzfreie Handwäsche inkl. Felgen, Reifen und Radkästen' },
            { text: 'Türpfosten, Türschwellen und Reifen aufbereitet' },
            { text: 'Sprühwachs-Versiegelung als Lackschutz' },
            { text: 'Innenreinigung komplett: Sitze, Teppiche, Armaturen, Fenster' },
            { text: 'Ledersitze gepflegt, Stoffsitze nassgesaugt' },
        ],
    },
    {
        id: 'tier-silber',
        tier: 'Restore',
        dots: 2,
        name: 'Deep Clean',
        subtitle: 'Essential + Politur & Versiegelung',
        price: 620,
        sizeSurcharge: true,
        durationDays: 1,
        mobilExtraMin: 60,
        mobilSurcharge: 45,
        headerStyle: { background: 'linear-gradient(135deg, #5C5C5C, #8A8A8A, #B8B8B8)' },
        features: [
            { text: 'Kratzfreie Handwäsche inkl. Felgen, Reifen und Radkästen' },
            { text: 'Lack dekontaminiert — Teer und Flugrost entfernt' },
            { text: '1-Schritt Politur — feine Kratzer weg, optimaler Glanz', bold: true },
            { text: 'Sprühversiegelung als Lackschutz', bold: true, badge: 'hält rund 12.000 km' },
            { text: 'Innenreinigung komplett: Sitze, Teppiche, Armaturen, Fenster' },
            { text: 'Ledersitze gepflegt, Stoffsitze nassgesaugt' },
        ],
    },
    {
        id: 'tier-gold',
        tier: 'Perfect',
        dots: 3,
        name: 'Deep Polish',
        phoneOnly: true,
        subtitle: 'Restore + 2-stufige Politur & Beschichtungen',
        price: 980,
        sizeSurcharge: true,
        durationDays: 2,
        mobilSurcharge: 65,
        headerStyle: { background: 'linear-gradient(135deg, #996515, #B8860B, #DAA520)' },
        features: [
            { text: 'Kratzfreie Handwäsche inkl. Felgen, Reifen und Radkästen' },
            { text: 'Lack dekontaminiert — Teer und Flugrost entfernt' },
            { text: '2-stufige Politur — Kratzer, Oxidation und Hologramme weg', bold: true },
            { text: 'Versiegelung als Lackschutz' },
            { text: 'Fensterbeschichtung, ab ca. 70 km/h perlt das Wasser ab', bold: true },
            { text: 'Kunststoffteile beschichtet, mit UV-Schutz' },
            { text: 'Innenreinigung komplett: Sitze, Teppiche, Armaturen, Fenster' },
        ],
    },
    {
        id: 'tier-elite',
        tier: 'Élite Exklusiv',
        dots: 0, // uses lightning icon instead
        name: 'Endstufe',
        subtitle: 'Das Ultimative. Kein Kompromiss.',
        price: 2600,
        sizeSurcharge: true,
        durationDays: 5,
        headerStyle: { background: 'linear-gradient(135deg, #064E3B, #047857, #4DB292)' },
        features: [
            { text: 'Kratzfreie Handwäsche, Tonbehandlung und Entfettung' },
            { text: '3-Gang Politur für maximalen Glanz', bold: true },
            { text: 'FIREBALL Keramikbeschichtung', bold: true, badge: 'Schutz 40.000–60.000 km' },
            { text: 'Felgen zerlegt, poliert und beschichtet, Bremssättel beschichtet' },
            { text: 'Einstiegsleisten und Motorraum gereinigt und beschichtet' },
            { text: 'Fenster-, Kunststoff-, Leder- und Textilbeschichtung' },
            { text: 'Innenreinigung komplett: Sitze, Teppiche, Armaturen, Fenster' },
            { text: 'Persönliche Übergabe mit Pflegeberatung und Geschenkpaket' },
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
                price: 95,
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
                price: 155,
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
                price: 175,
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
                price: 95,
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
                price: 230,
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
                price: 85,
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
                price: 420,
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
                    "Größenfaktor je nach Fahrzeugklasse (×1,0 – ×1,5)"
                ]
            },
            {
                name: "Schwere Politur",
                price: 680,
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
                    "Größenfaktor je nach Fahrzeugklasse (Großfahrzeuge auf Anfrage)"
                ]
            },
            {
                name: "Spot-Politur",
                price: 65,
                popular: false,
                sizeSurcharge: true,
                durationMin: 60,
                features: [
                    "Gezielte Entfernung kleiner Kratzer",
                    "Hologramme oder Lackdefekte beheben",
                    "Perfekt ohne vollständige Politur",
                    "Für einen makellosen Look",
                    "Nur als Zusatz zu einer anderen Leistung"
                ]
            },
            {
                // The old "Scheinwerfer Polieren" (per piece, no sealing) is gone: it yellowed
                // again within months. This replaces it — never re-add a version without the
                // UV seal. Exempt from the size factor: a headlight is the same work on an SUV.
                name: "Scheinwerfer-Aufbereitung mit UV-Schutz",
                price: 150,
                popular: false,
                badge: 'Idealer Einstieg',
                durationMin: 180,
                mobilExtraMin: 30,
                features: [
                    "Beide Scheinwerfer — aus matt, blind und vergilbt wird wieder klar",
                    "Abgeklebt und mehrstufig nassgeschliffen",
                    "Auspoliert bis zur klaren, glatten Oberfläche",
                    "UV-Schutzversiegelung — sie bleiben klar und trüben nicht wieder ein",
                    "Deutlich mehr Lichtausbeute bei Nacht und Regen",
                    "Häufiger Beanstandungsgrund bei der §57a-Überprüfung (Pickerl)",
                    "Ein Bruchteil dessen, was neue Scheinwerfer kosten",
                ]
            }
        ]
    },
    {
        id: "keramik",
        title: "Keramik Versiegelung",
        subtitle: "40.000 – 60.000 km FIREBALL Herstellergarantie. Extrem wasserabweisend & UV-beständig.",
        packages: [
            {
                name: "Neuwagen Beschichtung",
                price: 860,
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
                price: 1250,
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
                price: 900,
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
                price: 390,
                popular: true,
                sizeSurcharge: true,
                durationMin: 360,
                mobilExtraMin: 60,
                features: [
                    "Gründliche Innen- und Außenreinigung",
                    "Flecken & Gebrauchsspuren entfernen",
                    "Lack polieren für einen glänzenden Auftritt",
                    "Frisches Ambiente im Innenraum",
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
                price: 85,
                group: "beschichten",
                popular: false,
                sizeSurcharge: true,
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
                price: 85,
                group: "beschichten",
                popular: false,
                sizeSurcharge: true,
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
                price: 185,
                group: "beschichten",
                popular: true,
                sizeSurcharge: true,
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
                price: 310,
                group: "beschichten",
                popular: false,
                sizeSurcharge: true,
                durationMin: 240,
                features: [
                    "Felgen demontiert & gereinigt",
                    "Außen, innen & Bremssättel beschichtet",
                    "Keramikversiegelung, Haltbarkeit 2,5–3 Jahre",
                    "Verhindert haftenden Bremsstaub",
                    "Deutlich leichtere Reinigung",
                    "Polieren je nach Felgentyp gegen Aufpreis",
                ]
            },
            // 4
            {
                name: "Felgen-Keramik 2 Schichten",
                price: 345,
                group: "beschichten",
                popular: false,
                sizeSurcharge: true,
                durationMin: 360,
                features: [
                    "Zwei Schichten, Haltbarkeit 3,5–4 Jahre",
                    "Felgen demontiert & gereinigt",
                    "Maximaler Schutz vor Bremsstaub",
                ]
            },
            // 5 — interior referent ("zusatz-5" Textil). No size factor: per seat, not per car.
            {
                name: "Textilimprägnierung (pro Sitz)",
                price: 50,
                priceSuffix: "pro Sitz",
                group: "innenraum",
                popular: false,
                durationMin: 30,
                features: [
                    "Wasser- & schmutzabweisend",
                    "Schützt Stoffsitze langfristig",
                    "Preis pro Sitz",
                ]
            },
            // 6 — no size factor: the same dashboard either way.
            {
                name: "Türverkleidung & Armaturen",
                price: 40,
                group: "innenraum",
                popular: false,
                durationMin: 30,
                features: [
                    "Reinigung & Pflege der Kunststoffe",
                    "Armaturenbrett & Türverkleidungen",
                    "Stellt den Original-Look wieder her",
                ]
            },
            // 7 — no size factor.
            {
                name: "Dachhimmel Intensivreinigung",
                price: 60,
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
                price: 125,
                group: "innenraum",
                popular: false,
                sizeSurcharge: true,
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
                price: 40,
                group: "innenraum",
                popular: false,
                sizeSurcharge: true,
                durationMin: 30,
                features: [
                    "Gründliche Entfernung von Tierhaaren",
                    "Aus Polstern, Teppichen & Kofferraum",
                ]
            },
            // 10
            {
                name: "Motorwäsche + Konservierung",
                price: 50,
                group: "aussen",
                popular: false,
                sizeSurcharge: true,
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
                price: 150,
                group: "aussen",
                popular: false,
                sizeSurcharge: true,
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
                price: 30,
                group: "polieren",
                popular: false,
                sizeSurcharge: true,
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
                price: 75,
                group: "beschichten",
                popular: false,
                sizeSurcharge: true,
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
                price: 90,
                group: "aussen",
                popular: false,
                sizeSurcharge: true,
                durationMin: 120,
                features: [
                    "Lackschutzfolie für die Einstiege",
                    "Unsichtbarer Schutz vor Kratzern",
                ]
            },
            // 15 — PPF
            {
                name: "PPF Türgriffmulden",
                price: 80,
                group: "aussen",
                popular: false,
                sizeSurcharge: true,
                durationMin: 90,
                features: [
                    "Lackschutzfolie für die Türgriffmulden",
                    "Schutz vor Kratzern & Lackabrieb",
                ]
            },
            // 16 — Ozon (interior referent "zusatz-16")
            {
                name: "Ozonbehandlung",
                price: 95,
                group: "innenraum",
                popular: false,
                sizeSurcharge: true,
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
    },
    // Appended last on purpose: any earlier insertion would re-index the `${cat.id}-${i}` IDs.
    {
        id: "lenkrad",
        title: "Lenkrad",
        subtitle: "Abgenutztes Lederlenkrad — fachgerecht neu gefärbt und keramikversiegelt.",
        packages: [
            {
                name: "Lenkradfärbung & Keramikversiegelung",
                price: 220,
                popular: false,
                sizeSurcharge: true,
                durationDays: 1,
                features: [
                    "Fachgerechte Auffrischung und Reparatur des Lederlenkrads",
                    "Präzise Neufärbung gegen Abnutzungen, Kratzer & Farbverluste",
                    "Keramikversiegelung für eine langlebige, schmutzabweisende Oberfläche",
                ]
            }
        ]
    }
];
