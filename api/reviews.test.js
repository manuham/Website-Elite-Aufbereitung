import { describe, it, expect } from 'vitest';
import { toLegacyShape } from './reviews.js';
import { deriveReviewsState } from '../src/lib/reviewsState.js';

// A realistic Places API (New) review. Note every field the client needs is nested differently
// from the legacy API: displayName under authorAttribution, the review body under text.text.
const newApiReview = {
  name: 'places/ChIJxyz/reviews/abc',
  relativePublishTimeDescription: 'vor 3 Wochen',
  rating: 5,
  text: { text: 'Top Arbeit, sehr empfehlenswert.', languageCode: 'de' },
  originalText: { text: 'Top Arbeit, sehr empfehlenswert.', languageCode: 'de' },
  authorAttribution: {
    displayName: 'Simon Zimmermann',
    uri: 'https://www.google.com/maps/contrib/123',
    photoUri: 'https://lh3.googleusercontent.com/a/abc',
  },
  publishTime: '2026-06-24T09:12:00Z',
};

describe('toLegacyShape — the Places API (New) → client seam', () => {
  it('maps every field the client reads', () => {
    expect(toLegacyShape(newApiReview)).toEqual({
      author_name: 'Simon Zimmermann',
      rating: 5,
      text: 'Top Arbeit, sehr empfehlenswert.',
      relative_time_description: 'vor 3 Wochen',
    });
  });

  it('survives a review missing its author attribution', () => {
    // Reading .displayName off an absent authorAttribution would throw inside the handler
    // and turn one odd review into a 502 for the whole section.
    expect(() => toLegacyShape({ rating: 5, text: { text: 'ok' } })).not.toThrow();
    expect(toLegacyShape({ rating: 5, text: { text: 'ok' } }).author_name).toBe('');
  });

  it('survives a rating-only review with no text object', () => {
    const mapped = toLegacyShape({ rating: 4, authorAttribution: { displayName: 'A B' } });
    expect(mapped.text).toBe('');
    expect(mapped.rating).toBe(4);
  });

  it('survives null/undefined without throwing', () => {
    expect(() => toLegacyShape(null)).not.toThrow();
    expect(() => toLegacyShape(undefined)).not.toThrow();
  });
});

describe('the mapped payload feeds deriveReviewsState correctly', () => {
  // This is the actual contract: the New API must reach the component looking like the old one,
  // so that reviewsState.js and its tests never learn which API version answered.
  const body = (reviews, rating, total) => ({
    reviews: reviews.map(toLegacyShape),
    rating,
    total,
  });

  it('a real New-API response goes live end to end', () => {
    const s = deriveReviewsState(body([newApiReview], 4.7, 43));
    expect(s.isLive).toBe(true);
    expect(s.rating).toBe(4.7);
    expect(s.total).toBe(43);
    expect(s.reviews[0].name).toBe('Simon Z.');
    expect(s.reviews[0].timeAgo).toBe('vor 3 Wochen');
  });

  it('rating-only reviews (no text) fall back rather than render empty cards', () => {
    // Google returns reviews with a rating and no body. Mapped, text is '' — deriveReviewsState
    // filters those out, so an all-rating-only response is not "live".
    const s = deriveReviewsState(body([{ rating: 5, authorAttribution: { displayName: 'A B' } }], 5, 8));
    expect(s.isLive).toBe(false);
    expect(s.rating).toBeNull();
  });

  it('a sub-4-star review is dropped but does not sink the section', () => {
    const weak = { ...newApiReview, rating: 2, authorAttribution: { displayName: 'X Y' } };
    const s = deriveReviewsState(body([newApiReview, weak], 4.1, 9));
    expect(s.isLive).toBe(true);
    expect(s.reviews).toHaveLength(1);
  });

  it('Google returning 5 reviews still fills the marquee (the old code would gap)', () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      ...newApiReview,
      authorAttribution: { displayName: `Kunde ${i}` },
    }));
    const s = deriveReviewsState(body(five, 4.9, 47));
    expect(s.isLive).toBe(true);
    expect(s.reviews).toHaveLength(5);
  });
});
