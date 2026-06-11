// ─── Smart Upselling: Recommendation Maps, Exclusion Rules & Package Detection ──

/**
 * Service-to-service recommendation map.
 * Each key is a service ID. Values are arrays of recommendations sorted by priority.
 *
 * type: 'upgrade'    → better version of same service
 *       'complement' → logically pairs with the selected service
 *       'addon'      → small extra that enhances the result
 *       'protect'    → protects / preserves the work just done
 */
export const serviceRecommendations = {
    // ─── HANDWÄSCHE ──────────────────────────────────────────────────────────────
    'handwaesche-0': [ // Basic Handwäsche
        { recommend: 'handwaesche-1', reason: 'Upgrade: inkl. Teer-/Flugrostentfernung & Sprühwachs-Versiegelung', type: 'upgrade', priority: 1 },
        { recommend: 'innenreinigung-0', reason: 'Außen sauber? Innen auch — Basic Innenreinigung dazu', type: 'complement', priority: 2 },
        { recommend: 'zusatz-0', reason: 'Fensterbeschichtung: Wasser perlt ab ±70 km/h ab', type: 'addon', priority: 3 },
    ],
    'handwaesche-1': [ // Premium Handwäsche
        { recommend: 'innenreinigung-1', reason: 'Komplett-Pflege: Premium Innenreinigung für den vollen Glanz', type: 'complement', priority: 1 },
        { recommend: 'politur-0', reason: 'Lack auffrischen: Leichte Politur für optimalen Glanz', type: 'complement', priority: 2 },
        { recommend: 'zusatz-5', reason: 'Textilimprägnierung schützt die Sitze als Extra', type: 'addon', priority: 3 },
    ],
    'handwaesche-2': [ // Premium + Basic Interieur
        { recommend: 'innenreinigung-1', reason: 'Upgrade Interieur: Nassreinigung & Lederpflege statt nur Staubsaugen', type: 'upgrade', priority: 1 },
        { recommend: 'zusatz-16', reason: 'Ozonbehandlung für frischen Duft nach der Reinigung', type: 'addon', priority: 2 },
        { recommend: 'politur-0', reason: 'Lack auffrischen: Leichte Politur für optimalen Glanz', type: 'complement', priority: 3 },
    ],

    // ─── INNENREINIGUNG ──────────────────────────────────────────────────────────
    'innenreinigung-0': [ // Basic Innenreinigung
        { recommend: 'innenreinigung-1', reason: 'Upgrade: inkl. Lederpflege, Nassreinigung & Kunststoffbehandlung', type: 'upgrade', priority: 1 },
        { recommend: 'handwaesche-0', reason: 'Innen sauber? Außen auch — Basic Handwäsche dazu', type: 'complement', priority: 2 },
        { recommend: 'zusatz-5', reason: 'Textilimprägnierung schützt Sitze langfristig', type: 'addon', priority: 3 },
    ],
    'innenreinigung-1': [ // Premium Innenreinigung
        { recommend: 'innenreinigung-2', reason: 'Leder langfristig schützen — Beschichtung hält Monate', type: 'protect', priority: 1 },
        { recommend: 'handwaesche-1', reason: 'Komplett-Pflege: Premium Handwäsche für außen', type: 'complement', priority: 2 },
        { recommend: 'zusatz-16', reason: 'Ozonbehandlung gegen Gerüche & Schimmel', type: 'addon', priority: 3 },
    ],
    'innenreinigung-2': [ // Ledersitz Beschichtung
        { recommend: 'innenreinigung-1', reason: 'Premium Innenreinigung vor der Beschichtung empfohlen', type: 'complement', priority: 1 },
        { recommend: 'zusatz-6', reason: 'Armaturenbrett & Türverkleidungen gleich mitbehandeln', type: 'addon', priority: 2 },
        { recommend: 'handwaesche-1', reason: 'Premium Handwäsche für den kompletten Look', type: 'complement', priority: 3 },
    ],

    // ─── POLITUR ─────────────────────────────────────────────────────────────────
    'politur-0': [ // Leichte Politur
        { recommend: 'keramik-0', reason: 'Polierten Lack dauerhaft schützen — Keramikversiegelung', type: 'protect', priority: 1 },
        { recommend: 'politur-3', reason: 'Scheinwerfer gleich mitpolieren', type: 'addon', priority: 2 },
        { recommend: 'zusatz-0', reason: 'Fenster beschichten für bessere Sicht bei Regen', type: 'addon', priority: 3 },
    ],
    'politur-1': [ // Schwere Politur
        { recommend: 'keramik-1', reason: 'Nach der Politur: Keramikschutz für 2–3 Jahre Glanz', type: 'protect', priority: 1 },
        { recommend: 'politur-3', reason: 'Scheinwerfer gleich mitpolieren', type: 'addon', priority: 2 },
        { recommend: 'innenreinigung-1', reason: 'Außen perfekt? Innen auch — Premium Innenreinigung', type: 'complement', priority: 3 },
    ],
    'politur-2': [ // Spot-Politur
        { recommend: 'politur-0', reason: 'Für rundum perfekten Glanz: komplette Leichte Politur', type: 'upgrade', priority: 1 },
        { recommend: 'handwaesche-1', reason: 'Premium Handwäsche für den frischen Look', type: 'complement', priority: 2 },
        { recommend: 'politur-3', reason: 'Scheinwerfer gleich mitpolieren', type: 'addon', priority: 3 },
    ],
    'politur-3': [ // Scheinwerfer Polieren
        { recommend: 'politur-0', reason: 'Kompletter Lackglanz dazu? Leichte Politur', type: 'complement', priority: 1 },
        { recommend: 'zusatz-1', reason: 'Windschutzscheibe beschichten für klare Sicht', type: 'addon', priority: 2 },
        { recommend: 'handwaesche-1', reason: 'Premium Handwäsche für den kompletten Look', type: 'complement', priority: 3 },
    ],

    // ─── KERAMIK VERSIEGELUNG ────────────────────────────────────────────────────
    'keramik-0': [ // Neuwagen Beschichtung
        { recommend: 'zusatz-3', reason: 'Felgen-Keramik dazu — Komplettschutz', type: 'addon', priority: 1 },
        { recommend: 'innenreinigung-2', reason: 'Außen geschützt? Leder innen auch beschichten', type: 'complement', priority: 2 },
        { recommend: 'zusatz-5', reason: 'Textilimprägnierung für den Innenraum', type: 'addon', priority: 3 },
    ],
    'keramik-1': [ // Beschichtungspaket
        { recommend: 'zusatz-3', reason: 'Felgen-Keramik dazu — Komplettschutz', type: 'addon', priority: 1 },
        { recommend: 'innenreinigung-2', reason: 'Leder innen auch langfristig beschichten', type: 'complement', priority: 2 },
        { recommend: 'innenreinigung-1', reason: 'Premium Innenreinigung inklusive Lederpflege', type: 'complement', priority: 3 },
    ],
    'keramik-2': [ // Matt Beschichtung
        { recommend: 'zusatz-0', reason: 'Fensterbeschichtung für den vollen Schutz', type: 'addon', priority: 1 },
        { recommend: 'handwaesche-1', reason: 'Premium Handwäsche — schonend für matte Lacke', type: 'complement', priority: 2 },
        { recommend: 'innenreinigung-1', reason: 'Premium Innenreinigung für den Innenraum', type: 'complement', priority: 3 },
    ],

    // ─── ZUSATZPAKETE ────────────────────────────────────────────────────────────
    'zusatz-0': [ // Autofenster beschichten
        { recommend: 'handwaesche-1', reason: 'Premium Handwäsche für den kompletten Außenglanz', type: 'complement', priority: 1 },
        { recommend: 'politur-3', reason: 'Scheinwerfer gleich mitpolieren', type: 'addon', priority: 2 },
        { recommend: 'keramik-1', reason: 'Komplettschutz: Keramikversiegelung für den Lack', type: 'protect', priority: 3 },
    ],
    'verkauf-0': [ // Verkaufsaufbereitung / Leasingrückläufer
        { recommend: 'politur-3', reason: 'Scheinwerfer polieren — wertet das Auto weiter auf', type: 'addon', priority: 1 },
        { recommend: 'zusatz-0', reason: 'Fenster beschichten — beeindruckt Käufer', type: 'addon', priority: 2 },
        { recommend: 'zusatz-16', reason: 'Ozonbehandlung für frischen Duft', type: 'addon', priority: 3 },
    ],

    // ─── ALL-IN-ONE PAKETE ───────────────────────────────────────────────────────
    'tier-bronze': [ // Wash & Clean (Innen & Außen Basis)
        { recommend: 'zusatz-5', reason: 'Textilimprägnierung für langfristigen Schutz', type: 'addon', priority: 1 },
        { recommend: 'zusatz-0', reason: 'Fensterbeschichtung gegen Regen', type: 'addon', priority: 2 },
        { recommend: 'politur-3', reason: 'Scheinwerfer gleich mitpolieren', type: 'addon', priority: 3 },
    ],
    'tier-silber': [ // Deep Clean (Glanz & Pflege)
        { recommend: 'innenreinigung-2', reason: 'Ledersitz Beschichtung für langfristigen Schutz', type: 'protect', priority: 1 },
        { recommend: 'zusatz-0', reason: 'Fensterbeschichtung gegen Regen', type: 'addon', priority: 2 },
        { recommend: 'zusatz-16', reason: 'Ozonbehandlung für frischen Duft', type: 'addon', priority: 3 },
    ],
    'tier-gold': [ // Deep Polish (Politur & Keramikschutz)
        { recommend: 'innenreinigung-1', reason: 'Innen auch perfekt: Premium Innenreinigung', type: 'complement', priority: 1 },
        { recommend: 'zusatz-0', reason: 'Fenster beschichten für Komplettschutz', type: 'addon', priority: 2 },
        { recommend: 'politur-3', reason: 'Scheinwerfer gleich mitpolieren', type: 'addon', priority: 3 },
    ],
    'tier-elite': [ // Endstufe (Elite Komplettpaket)
        { recommend: 'zusatz-0', reason: 'Fensterbeschichtung für den letzten Schliff', type: 'addon', priority: 1 },
        { recommend: 'zusatz-16', reason: 'Ozonbehandlung für frischen Duft dazu', type: 'addon', priority: 2 },
        { recommend: 'politur-3', reason: 'Scheinwerfer gleich mitpolieren', type: 'addon', priority: 3 },
    ],
};

/**
 * Exclusion rules — prevent nonsensical or redundant combinations.
 * When a service in `if` is selected, the services in `exclude` won't be recommended.
 */
export const exclusionRules = [
    // Same-category upgrades: don't suggest basic when premium is selected
    { if: 'handwaesche-1', exclude: ['handwaesche-0'] },
    { if: 'handwaesche-2', exclude: ['handwaesche-0', 'handwaesche-1'] },
    { if: 'innenreinigung-1', exclude: ['innenreinigung-0'] },
    { if: 'politur-1', exclude: ['politur-0', 'politur-2'] },
    { if: 'politur-0', exclude: ['politur-2'] },

    // AIO packages cover their constituent services
    { if: 'tier-bronze', exclude: ['handwaesche-0', 'innenreinigung-0'] },
    { if: 'tier-silber', exclude: ['handwaesche-0', 'handwaesche-1', 'innenreinigung-0', 'innenreinigung-1'] },
    { if: 'tier-gold', exclude: ['politur-0', 'politur-1', 'politur-2', 'keramik-1'] },
    { if: 'tier-elite', exclude: ['handwaesche-0', 'handwaesche-1', 'handwaesche-2', 'innenreinigung-0', 'innenreinigung-1', 'politur-0', 'politur-1', 'politur-2', 'keramik-0', 'keramik-1'] },

    // Verkaufsaufbereitung / Leasingrückläufer is comprehensive
    { if: 'verkauf-0', exclude: ['handwaesche-0', 'innenreinigung-0'] },
];

/**
 * Smart package detection: when individual selections can be replaced by a cheaper AIO package.
 * `partialMatchThreshold` allows suggesting the package when N of M required services are selected.
 */
export const packageDetectionRules = [
    {
        packageId: 'tier-bronze',
        requiredServiceIds: ['handwaesche-0', 'innenreinigung-0'],
    },
    {
        packageId: 'tier-silber',
        requiredServiceIds: ['handwaesche-1', 'innenreinigung-1'],
    },
    {
        packageId: 'tier-gold',
        requiredServiceIds: ['politur-1', 'keramik-1'],
    },
    {
        packageId: 'tier-elite',
        requiredServiceIds: ['handwaesche-1', 'innenreinigung-1', 'politur-1', 'keramik-1'],
        partialMatchThreshold: 3, // Suggest when at least 3 of 4 are selected
    },
];
