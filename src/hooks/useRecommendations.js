import { useMemo } from 'react';
import { serviceCategories, allInOnePackages } from '../data/services';
import {
    serviceRecommendations,
    exclusionRules,
    packageDetectionRules,
} from '../data/recommendations';

/** Parse "ab €75,-" or "ab €1.395,-" → 75 or 1395 */
function parsePriceNum(priceStr) {
    const match = priceStr.replace(/\./g, '').match(/€(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

/** Resolve a service ID to its full data (name, price, priceNum). */
function resolveService(id) {
    // AIO packages
    const aio = allInOnePackages.find(p => p.id === id);
    if (aio) return { id: aio.id, name: aio.name, price: aio.price, priceNum: aio.priceNum, type: 'aio' };

    // Individual service: "{categoryId}-{index}"
    const match = id.match(/^(.+)-(\d+)$/);
    if (!match) return null;
    const [, catId, idxStr] = match;
    const category = serviceCategories.find(c => c.id === catId);
    if (!category) return null;
    const pkg = category.packages[parseInt(idxStr)];
    if (!pkg) return null;

    return { id, name: pkg.name, price: pkg.price, priceNum: parsePriceNum(pkg.price), type: 'service' };
}

/**
 * Smart recommendation engine.
 * Returns contextual cross-sell recommendations and package savings suggestions.
 */
export function useRecommendations(selectedItems) {
    const selectedIds = useMemo(
        () => new Set(selectedItems.map(i => i.id)),
        [selectedItems]
    );

    // Build set of excluded service IDs based on current selections
    const excludedIds = useMemo(() => {
        const excluded = new Set();
        for (const item of selectedItems) {
            for (const rule of exclusionRules) {
                if (rule.if === item.id) {
                    for (const id of rule.exclude) {
                        excluded.add(id);
                    }
                }
            }
        }
        return excluded;
    }, [selectedItems]);

    // Generate contextual recommendations (max 3)
    const recommendations = useMemo(() => {
        if (selectedItems.length === 0) return [];

        const seen = new Set();
        const recs = [];

        for (const item of selectedItems) {
            const itemRecs = serviceRecommendations[item.id];
            if (!itemRecs) continue;

            for (const rec of itemRecs) {
                if (selectedIds.has(rec.recommend)) continue;
                if (excludedIds.has(rec.recommend)) continue;
                if (seen.has(rec.recommend)) continue;

                const resolved = resolveService(rec.recommend);
                if (!resolved) continue;

                seen.add(rec.recommend);
                recs.push({
                    ...rec,
                    triggeredBy: item.name,
                    service: resolved,
                });
            }
        }

        recs.sort((a, b) => a.priority - b.priority);
        return recs.slice(0, 3);
    }, [selectedItems, selectedIds, excludedIds]);

    // Smart package detection
    const packageSuggestion = useMemo(() => {
        if (selectedItems.length < 2) return null;

        // Find the best savings opportunity
        let best = null;

        for (const rule of packageDetectionRules) {
            if (selectedIds.has(rule.packageId)) continue;

            const matchedIds = rule.requiredServiceIds.filter(id => selectedIds.has(id));
            const threshold = rule.partialMatchThreshold || rule.requiredServiceIds.length;

            if (matchedIds.length >= threshold) {
                const currentCost = matchedIds.reduce((sum, id) => {
                    const item = selectedItems.find(i => i.id === id);
                    return sum + (item ? item.priceNum : 0);
                }, 0);

                const pkg = allInOnePackages.find(p => p.id === rule.packageId);
                if (!pkg || pkg.priceNum >= currentCost) continue;

                const savings = currentCost - pkg.priceNum;
                if (!best || savings > best.savings) {
                    best = {
                        package: pkg,
                        replaces: matchedIds,
                        currentCost,
                        savings,
                    };
                }
            }
        }

        return best;
    }, [selectedItems, selectedIds]);

    return { recommendations, packageSuggestion };
}
