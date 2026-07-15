import { describe, it, expect } from 'vitest';
import { deriveReviewsState, buildMarqueeTrack } from './reviewsState.js';
import { testimonials } from '../data/reviews.js';

const liveReview = {
  author_name: 'Simon Zimmermann',
  rating: 5,
  text: 'Top Arbeit, sehr empfehlenswert.',
  relative_time_description: 'vor 3 Wochen',
};

describe('deriveReviewsState — numbers imply live cards', () => {
  it.each([
    ['fetch threw (null)', null],
    ['undefined', undefined],
    ['empty object', {}],
    ['the 500 body', { error: 'Missing Google Places configuration' }],
    ['aggregates, no reviews key', { rating: 4.9, total: 47 }],
    ['aggregates, empty reviews', { reviews: [], rating: 4.9, total: 47 }],
    // The mixed state nobody named: real Google aggregates, but nothing survives the filter.
    // Note the rating is genuinely LOW in this case — the old code printed it above 15
    // hardcoded 5-star cards.
    ['aggregates, all under 4 stars', {
      reviews: [{ author_name: 'A B', rating: 3, text: 'ok' }],
      rating: 2.4,
      total: 12,
    }],
    ['aggregates, text-less reviews', {
      reviews: [{ author_name: 'A B', rating: 5, text: '   ' }],
      rating: 5,
      total: 8,
    }],
  ])('%s → not live, no rating, no total', (_label, data) => {
    const s = deriveReviewsState(data);
    expect(s.isLive).toBe(false);
    expect(s.rating).toBeNull();
    expect(s.total).toBeNull();
    expect(s.reviews).toBe(testimonials);
  });

  it('never seeds 5 and never emits 30 (the two removed literals)', () => {
    const s = deriveReviewsState(null);
    expect(s.rating).not.toBe(5);
    expect(s.total).not.toBe(30);
  });

  it('rating is never non-null while isLive is false, across every shape', () => {
    for (const data of [null, undefined, {}, { rating: 4.9 }, { reviews: [], total: 30 }]) {
      const s = deriveReviewsState(data);
      if (!s.isLive) {
        expect(s.rating).toBeNull();
        expect(s.total).toBeNull();
      }
    }
  });
});

describe('deriveReviewsState — live path', () => {
  const live = { reviews: [liveReview], rating: 4.9, total: 47 };

  it('live cards carry live numbers', () => {
    const s = deriveReviewsState(live);
    expect(s).toMatchObject({ isLive: true, rating: 4.9, total: 47 });
    expect(s.reviews).toHaveLength(1);
  });

  it('abbreviates the author name', () => {
    expect(deriveReviewsState(live).reviews[0].name).toBe('Simon Z.');
    expect(deriveReviewsState({ reviews: [{ ...liveReview, author_name: 'Felix' }] })
      .reviews[0].name).toBe('Felix');
    expect(deriveReviewsState({ reviews: [{ ...liveReview, author_name: '' }] })
      .reviews[0].name).toBe('Anonym');
  });

  it('keeps the live relative time', () => {
    expect(deriveReviewsState(live).reviews[0].timeAgo).toBe('vor 3 Wochen');
  });

  it('live cards without a rating → cards live, numbers row hidden', () => {
    const s = deriveReviewsState({ ...live, rating: undefined, total: undefined });
    expect(s.isLive).toBe(true);
    expect(s.rating).toBeNull();
    expect(s.total).toBeNull();
  });

  it('a live card without a timestamp → timeAgo null, so the span is not rendered', () => {
    const s = deriveReviewsState({
      ...live,
      reviews: [{ ...liveReview, relative_time_description: undefined }],
    });
    expect(s.reviews[0].timeAgo).toBeNull();
  });

  it('drops sub-4-star reviews but stays live when others survive', () => {
    const s = deriveReviewsState({
      reviews: [liveReview, { author_name: 'X Y', rating: 2, text: 'schlecht' }],
      rating: 4.1,
      total: 9,
    });
    expect(s.isLive).toBe(true);
    expect(s.reviews).toHaveLength(1);
    expect(s.rating).toBe(4.1);
  });
});

describe('buildMarqueeTrack — the translateX(-50%) invariant', () => {
  // The Places API returns at most 5 reviews; the curated fallback has 15.
  const counts = Array.from({ length: 20 }, (_, i) => i + 1);
  const CARD_PX = 400; // md breakpoint, the widest
  const GAP_PX = 24;   // gap-6

  it.each(counts)('n=%i → even length, so the seam lands on a copy boundary', (n) => {
    expect(buildMarqueeTrack(Array(n).fill({})).length % 2).toBe(0);
  });

  it.each(counts)('n=%i → one half is wider than a 4K viewport', (n) => {
    const half = buildMarqueeTrack(Array(n).fill({})).length / 2;
    const widthPx = half * CARD_PX + (half - 1) * GAP_PX;
    expect(widthPx).toBeGreaterThanOrEqual(3840);
  });

  it.each(counts)('n=%i → the two halves are identical', (n) => {
    const list = Array.from({ length: n }, (_, i) => ({ id: i }));
    const track = buildMarqueeTrack(list);
    expect(track.slice(0, track.length / 2)).toEqual(track.slice(track.length / 2));
  });

  it('n=5 (the live worst case) no longer leaves a blank strip at 1440p', () => {
    // Before: 5 reviews doubled = 10 cards, half = 2108px < 2560px → visible gap every cycle.
    const half = buildMarqueeTrack(Array(5).fill({})).length / 2;
    expect(half * CARD_PX + (half - 1) * GAP_PX).toBeGreaterThanOrEqual(2560);
  });

  it('empty in → empty out (no infinite loop on Math.ceil(n/0))', () => {
    expect(buildMarqueeTrack([])).toEqual([]);
  });

  it('the 15-item fallback keeps exactly today’s 30-card DOM', () => {
    expect(buildMarqueeTrack(testimonials)).toHaveLength(30);
  });
});

describe('curated testimonials — data hygiene', () => {
  it('carry no frozen relative time', () => {
    // A hardcoded "vor 3 Wochen" is true the day it is pasted and false forever after.
    for (const t of testimonials) expect(t.timeAgo).toBeUndefined();
  });

  it('are non-empty (the fallback must never render an empty marquee)', () => {
    expect(testimonials.length).toBeGreaterThan(0);
  });
});
