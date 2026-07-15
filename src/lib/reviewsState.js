import { testimonials } from '../data/reviews';

// One half of the marquee must be wider than the viewport, because .marquee-track animates
// translateX(-50%) — if half the track is narrower than the screen, a blank strip appears and
// grows through every cycle. 12 cards at the widest breakpoint (400px + 24px gap) is 5064px,
// which covers 4K. The Places API returns at most 5 reviews, so this is load-bearing on the
// live path; the 15-entry fallback happens to be wide enough and always masked the bug.
export const MIN_CARDS_PER_HALF = 12;

// "Simon Zimmermann" -> "Simon Z."
function abbreviate(authorName) {
  if (!authorName) return 'Anonym';
  if (!authorName.includes(' ')) return authorName;
  const parts = authorName.split(' ');
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Decide what the reviews section may claim, from one /api/reviews payload.
 *
 * The honesty rule: `rating` and `total` are non-null ONLY when the cards themselves came from
 * Google. They are nested under liveness rather than tracked as a separate flag, so the state
 * where real Google aggregates sit above hardcoded testimonials cannot be represented at all.
 *
 * That state is not hypothetical — it is what the old code did whenever the API returned 200 but
 * no review survived the rating filter: it swapped in the hardcoded list AND applied the real
 * rating. Note the numbers are genuinely low in exactly that case (nothing scored >= 4), so it
 * printed a real "2.4" above fifteen hardcoded 5-star cards.
 *
 * @param data parsed /api/reviews body, or null/undefined if the request failed
 * @returns { isLive, reviews, rating, total } — rating/total are null unless isLive
 */
export function deriveReviewsState(data) {
  const mapped = (data?.reviews || [])
    .filter((r) => r.rating >= 4 && typeof r.text === 'string' && r.text.trim())
    .map((r) => ({
      name: abbreviate(r.author_name),
      rating: r.rating,
      text: r.text,
      timeAgo: r.relative_time_description || null,
    }));

  if (!mapped.length) {
    return { isLive: false, reviews: testimonials, rating: null, total: null };
  }

  return {
    isLive: true,
    reviews: mapped,
    rating: typeof data.rating === 'number' ? data.rating : null,
    total: typeof data.total === 'number' ? data.total : null,
  };
}

/**
 * Build the marquee track: repeat the list until one half is wide enough, then double it.
 *
 * The doubling is what makes translateX(-50%) loop seamlessly — at -50% the second copy sits
 * exactly where the first began. Any repeat count must therefore keep the total even, or the
 * seam lands mid-card and the gap becomes a jitter.
 */
export function buildMarqueeTrack(list) {
  if (!list.length) return [];
  const copies = Math.ceil(MIN_CARDS_PER_HALF / list.length);
  const half = Array.from({ length: copies }, () => list).flat();
  return [...half, ...half];
}
