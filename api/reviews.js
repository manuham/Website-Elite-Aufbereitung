export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID } = process.env;

  if (!GOOGLE_PLACES_API_KEY || !GOOGLE_PLACE_ID) {
    return res.status(500).json({ error: 'Missing Google Places configuration' });
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${GOOGLE_PLACE_ID}` +
    `&fields=reviews,rating,user_ratings_total` +
    `&language=de` +
    `&reviews_sort=newest` +
    `&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(502).json({ error: `Places API error: ${data.status}` });
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json({
      reviews: data.result.reviews || [],
      rating: data.result.rating,
      total: data.result.user_ratings_total,
    });
  } catch (error) {
    console.error('Google Places API error:', error);
    return res.status(502).json({ error: 'Failed to fetch reviews' });
  }
}
