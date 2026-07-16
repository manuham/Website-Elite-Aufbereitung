import { applyCors, enforceRateLimit } from './_lib/security.js';

// Places API (New). The legacy endpoint (maps.googleapis.com/maps/api/place/details/json) was
// frozen on 2025-03-01: it still runs for projects that had it enabled before then, but it can
// no longer be enabled on new ones. This project's Google Cloud project postdates that, so the
// legacy call could only ever have returned REQUEST_DENIED. The New API works on any project.
const PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places';

// The billed SKU is set by the most expensive field in the mask, and `reviews` puts us in
// Enterprise + Atmosphere ($40/1000) — which has a 1,000/month free cap, not the 10,000 that
// Essentials gets. Ask for nothing beyond what the section renders.
const FIELD_MASK = 'reviews,rating,userRatingCount';

// Reviews change maybe monthly; the section is on every homepage load. At s-maxage=3600 this
// endpoint could bill ~750-2200 calls/month across Vercel's edge regions — uncomfortably near
// the 1,000 free cap on somebody else's card. A day is still fresher than the data changes.
const CACHE_CONTROL = 's-maxage=86400, stale-while-revalidate=3600';

/**
 * Map a Places API (New) review onto the legacy-shaped fields the client already consumes.
 * Keeping the seam here means src/lib/reviewsState.js and its tests never learn which API
 * version answered — deriveReviewsState still filters on `rating` and reads `text`.
 */
export function toLegacyShape(review) {
  return {
    author_name: review?.authorAttribution?.displayName || '',
    rating: review?.rating,
    text: review?.text?.text || '',
    relative_time_description: review?.relativePublishTimeDescription || '',
  };
}

export default async function handler(req, res) {
  if (applyCors(req, res, 'GET, OPTIONS')) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (enforceRateLimit(req, res, { name: 'reviews', max: 120, windowMs: 60 * 1000 })) return;

  const { GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID } = process.env;

  if (!GOOGLE_PLACES_API_KEY || !GOOGLE_PLACE_ID) {
    // This 500 used to return silently, so the reviews section fell back to curated
    // testimonials and looked perfect while the endpoint had never once succeeded.
    // Name the missing vars: this is the log that would have caught it.
    const missing = [
      !GOOGLE_PLACES_API_KEY && 'GOOGLE_PLACES_API_KEY',
      !GOOGLE_PLACE_ID && 'GOOGLE_PLACE_ID',
    ].filter(Boolean);
    console.error(`Reviews API misconfigured — not set in this environment: ${missing.join(', ')}`);
    return res.status(500).json({ error: 'Missing Google Places configuration' });
  }

  // Place IDs are opaque Google tokens; anything else is a config error, not a request to send.
  if (!/^[A-Za-z0-9_-]+$/.test(GOOGLE_PLACE_ID)) {
    console.error('Reviews API misconfigured — GOOGLE_PLACE_ID is not a valid Place ID');
    return res.status(500).json({ error: 'Missing Google Places configuration' });
  }

  const url = `${PLACES_ENDPOINT}/${encodeURIComponent(GOOGLE_PLACE_ID)}?languageCode=de`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
    });

    if (!response.ok) {
      // The New API reports failures via HTTP status + an error body, not a `status` string.
      // Log the reason — a wrong key, an un-enabled API and a bad Place ID are indistinguishable
      // from the client, and this is the only place the difference is visible.
      const detail = await response.text().catch(() => '');
      console.error(`Places API error ${response.status}: ${detail.slice(0, 500)}`);
      return res.status(502).json({ error: `Places API error: ${response.status}` });
    }

    const data = await response.json();

    res.setHeader('Cache-Control', CACHE_CONTROL);
    return res.status(200).json({
      reviews: (data.reviews || []).map(toLegacyShape),
      rating: data.rating,
      total: data.userRatingCount,
    });
  } catch (error) {
    console.error('Reviews fetch failed:', error);
    return res.status(502).json({ error: 'Failed to fetch reviews' });
  }
}
