export const allInOnePackages = [
    {
        id: 'aio-1',
        name: 'Innen & Außen Basis',
        price: 'ab €130,-',
        priceNum: 130,
        popular: false,
        savings: '€20 gespart',
        includes: ['Basic Handwäsche', 'Basic Innenreinigung'],
        features: [
            'Kratzfreies Waschen (2-Eimer-Methode)',
            'Staubsaugen & Abstauben Innenraum',
            'Felgen, Reifen & Radkästen',
            'Fenster & Spiegel innen/außen',
            'Türpfosten & Türschwellen',
            'Reifenaufbereitung',
        ],
    },
    {
        id: 'aio-2',
        name: 'Glanz & Pflege',
        price: 'ab €230,-',
        priceNum: 230,
        popular: true,
        savings: '€40 gespart',
        includes: ['Premium Handwäsche', 'Premium Innenreinigung'],
        features: [
            'Kratzfreies Waschen + Sprühwachsversiegelung',
            'Teer & Flugrost entfernen',
            'Ledersitze reinigen & pflegen',
            'Nassreinigung Stoffsitze & Teppich',
            'Kunststoffteile behandeln',
            'Fenster streifenfrei innen/außen',
        ],
    },
    {
        id: 'aio-3',
        name: 'Politur & Keramikschutz',
        price: 'ab €1.395,-',
        priceNum: 1395,
        popular: false,
        savings: '€95 gespart',
        includes: ['Schwere Politur', 'Keramik Beschichtungspaket'],
        features: [
            'Dekontaminierende Handwäsche inkl.',
            'Mehrstufiges Maschinenpolieren',
            'Kratzer, Hologramme & Oxidation entfernen',
            'FIREBALL Keramikversiegelung',
            '2–3 Jahre Standzeit',
            'UV-, Wasser- & Schmutzschutz',
        ],
    },
    {
        id: 'aio-4',
        name: 'Elite Komplettpaket',
        price: 'ab €1.545,-',
        priceNum: 1545,
        popular: false,
        savings: '€200 gespart',
        badge: 'Bestes Paket',
        includes: ['Premium Handwäsche', 'Premium Innenreinigung', 'Schwere Politur', 'Keramikversiegelung'],
        features: [
            'Komplette Innen- & Außenreinigung',
            'Mehrstufige Maschinenpolierung',
            'Alle Kratzer & Hologramme entfernt',
            'FIREBALL Keramikversiegelung',
            'Garantie: bis zu 5 Jahre',
            'UV-, Wasser- & Schmutzschutz',
        ],
    },
];

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
        subtitle: "5 Jahre Garantie. Extrem wasserabweisend & UV-beständig.",
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
            }
        ]
    }
];
