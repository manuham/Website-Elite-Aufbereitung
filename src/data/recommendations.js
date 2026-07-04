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

    // Keramik packages are phone-only (never enter the cart), so a serviceRecommendations entry
    // keyed on them could never be looked up — omitted intentionally.

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
    // Gold & Élite are phone-only (never enter the cart), so entries keyed on them could never be
    // looked up — omitted intentionally. Same reasoning applies to the exclusion/detection rules below.
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
    { if: 'politur-0', exclude: ['politur-2'] },

    // AIO packages cover their constituent services. Bronze = Premium Handwäsche + Premium
    // Innenreinigung (its feature list is the premium interior), so it also covers the premium
    // wash/interior services — not just the basic ones. Silber additionally includes a 1-step
    // polish, so it covers Leichte Politur too.
    { if: 'tier-bronze', exclude: ['handwaesche-0', 'handwaesche-1', 'handwaesche-2', 'innenreinigung-0', 'innenreinigung-1'] },
    { if: 'tier-silber', exclude: ['handwaesche-0', 'handwaesche-1', 'handwaesche-2', 'innenreinigung-0', 'innenreinigung-1', 'politur-0'] },
    // (Gold/Élite are phone-only and can never be in the cart, so exclusion rules keyed on them
    // would never fire — omitted. politur-1/Schwere Politur is phone-only too, for the same reason.)

    // Verkaufsaufbereitung / Leasingrückläufer is comprehensive
    { if: 'verkauf-0', exclude: ['handwaesche-0', 'innenreinigung-0'] },
];

/**
 * Smart package detection: when individual selections can be replaced by a cheaper AIO package.
 * `partialMatchThreshold` allows suggesting the package when N of M required services are selected.
 *
 * The engine only suggests a package when its "ab" price is BELOW the summed "ab" price of the
 * matched constituents (real saving), so each rule's requiredServiceIds must reflect what the
 * package actually bundles — Bronze = Premium wash + Premium interior; Silber = that + a light
 * polish. (Basic constituents summed cheaper than the package, so the old basic-id rules could
 * never fire.) Gold/Élite are phone-only and can't be cart-suggested, so they have no rule.
 */
export const packageDetectionRules = [
    {
        // Premium Handwäsche (115) + Premium Innenreinigung (155) = 270 > Bronze 230 → save ~40.
        packageId: 'tier-bronze',
        requiredServiceIds: ['handwaesche-1', 'innenreinigung-1'],
    },
    {
        // + Leichte Politur (395): 665 > Silber 420 → save ~245. Needs all three (full match).
        packageId: 'tier-silber',
        requiredServiceIds: ['handwaesche-1', 'innenreinigung-1', 'politur-0'],
    },
];
