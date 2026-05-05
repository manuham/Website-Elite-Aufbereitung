export const tierPackages = [
    {
        id: 'tier-bronze',
        tier: 'Bronze',
        dots: 1,
        name: 'Wash & Clean',
        subtitle: 'Premium Handwäsche & Innenreinigung',
        price: 'ab 230,–',
        headerStyle: { background: 'linear-gradient(135deg, #6B4F0E, #8B6914, #C4943A)' },
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
        price: 'ab 390,–',
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
        subtitle: 'Silber + 2-stufige Politur & Beschichtungen',
        price: 'ab 690,–',
        headerStyle: { background: 'linear-gradient(135deg, #8B6914, #B8860B, #DAA520)' },
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
        price: 'ab 1.790,–',
        headerStyle: { background: 'linear-gradient(135deg, #064E3B, #047857, #4DB292)' },
        features: [
            { text: 'Alles aus Gold', muted: true },
            { text: '3-Gang Politur', bold: true, sub: 'maximaler Glanz, bestmögliche Kratzerentfernung' },
            { text: 'FIREBALL Keramikbeschichtung', bold: true, badge: '40.000–60.000 km', sub: 'Härteste Schutzschicht — Lack, Glanz & extremer Abperleffekt' },
            { text: 'Felgen zerlegt, poliert & beschichtet', bold: true },
            { text: 'Bremssättel beschichtet', bold: true },
            { text: 'Einstiege poliert & beschichtet', bold: true },
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
    },
];

// Legacy alias for useRecommendations hook compatibility
export const allInOnePackages = tierPackages.map(pkg => ({
    id: pkg.id,
    name: `${pkg.tier} – ${pkg.name}`,
    price: `${pkg.price} €`,
    priceNum: parseInt(pkg.price.replace(/[^\d]/g, '')),
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
                features: [
                    "Dekontaminierende Handwäsche inkludiert",
                    "1-stufiges Polieren",
                    "Entfernung sehr feiner Kratzer",
                    "Optimaler Glanz",
                    "Inkl. Wachsbeschichtung als Lackschutz",
                    "Empfohlen für leichte Gebrauchsspuren/Neuwagen",
                    "Für SUV/Transporter/Kombis Aufpreis 95,-"
                ]
            },
            {
                name: "Schwere Politur",
                price: "ab €595,-",
                popular: true,
                features: [
                    "Dekontaminierende Handwäsche inkludiert",
                    "Mehrstufiges Polieren (für besten Glanz)",
                    "Entfernung mittlerer bis tiefer Kratzer",
                    "Entfernen von Oxidation, Flecken, Hologrammen",
                    "Optimaler Glanz",
                    "Inkl. Wachsbeschichtung als Lackschutz",
                    "Empfohlen für Autos mit viel Gebrauchsspuren",
                    "Für SUV/Transporter/Kombis Aufpreis 95,-"
                ]
            },
            {
                name: "Spot-Politur",
                price: "ab €45,-",
                popular: false,
                features: [
                    "Gezielte Entfernung kleiner Kratzer",
                    "Hologramme oder Lackdefekte beheben",
                    "Perfekt ohne vollständige Politur",
                    "Für einen makellosen Look"
                ]
            },
            {
                name: "Scheinwerfer Polieren",
                price: "ab €45,-",
                popular: false,
                features: [
                    "Pro Scheinwerfer",
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
        id: "zusatz",
        title: "Zusatzpakete",
        packages: [
            {
                name: "Autofenster & Felgen",
                price: "ab €85,-",
                popular: false,
                features: [
                    "Windschutzscheibe Beschichtung: ab €85",
                    "Alle Fenster Beschichtung: ab €185",
                    "Wasser rutscht bei ±70 km/h ab",
                    "Lebensdauer bis 12 Monate",
                    "Felgenzergung & Reinigung: ab €245",
                    "Verhindert haftenden Bremsstaub"
                ]
            },
            {
                name: "Interieur Pflege",
                price: "ab €25,-",
                popular: true,
                features: [
                    "Textilimprägnierung: ab €25",
                    "Türverkleidungen & Armaturen: ab €25",
                    "Dachhimmel intensiv: ab €55",
                    "Ozonbehandlung (Geruch/Schimmel): ab €75",
                    "Kunststoffteile außen: ab €75",
                    "Stellt Original-Look wieder her"
                ]
            },
            {
                name: "Verkaufsaufbereitung",
                price: "ab €295,-",
                popular: false,
                features: [
                    "Gründliche Innen- und Außenreinigung",
                    "Flecken entfernen",
                    "Lack polieren für glänzenden Auftritt",
                    "Frisches Ambiente im Innenraum",
                    "Fahrzeug optimal für den Verkauf vorbereiten"
                ]
            }
        ]
    }
];
