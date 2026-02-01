import axios from 'axios';
import { Router } from 'express';

const router = Router();
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

router.get('/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;

    if (!input || (input as string).length < 2) {
      return res.json({ predictions: [] });
    }

    const fallbackCities = [
      'San Francisco, CA', 'Los Angeles, CA', 'San Diego, CA', 'Sacramento, CA',
      'New York, NY', 'Boston, MA', 'Chicago, IL', 'Seattle, WA',
      'Portland, OR', 'Austin, TX', 'Dallas, TX', 'Houston, TX',
      'Miami, FL', 'Orlando, FL', 'Las Vegas, NV', 'Phoenix, AZ',
      'Denver, CO', 'Atlanta, GA', 'Nashville, TN', 'New Orleans, LA'
    ];

    try {
      const url = 'https://maps.googleapis.com/maps/api/geocode/json';
      const response = await axios.get(url, {
        params: {
          address: input,
          components: 'country:US',
          key: GOOGLE_MAPS_API_KEY,
        },
        timeout: 5000,
      });

      const data = response.data;

      if (data.status === 'OK' && data.results) {
        const predictions = [];
        const seen = new Set<string>();

        for (const result of data.results.slice(0, 5)) {
          const formattedAddress = result.formatted_address || '';
          const placeId = result.place_id || '';

          let city = null;
          let state = null;
          for (const component of result.address_components || []) {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name;
            }
          }

          if (city && state) {
            const description = `${city}, ${state}`;
            if (!seen.has(description)) {
              predictions.push({
                place_id: placeId,
                description,
                full_address: formattedAddress,
              });
              seen.add(description);
            }
          }
        }

        if (predictions.length > 0) {
          return res.json({ predictions });
        }
      }

      // Fallback to hardcoded suggestions
      const inputLower = (input as string).toLowerCase();
      const filtered = fallbackCities
        .filter(city => city.toLowerCase().includes(inputLower))
        .slice(0, 5)
        .map((city, i) => ({
          place_id: `fallback-${i}`,
          description: city,
          full_address: city,
        }));

      return res.json({ predictions: filtered });
    } catch (error) {
      console.error('Error in places autocomplete:', error);
      
      // Return filtered fallback suggestions
      const inputLower = (input as string).toLowerCase();
      const filtered = fallbackCities
        .filter(city => city.toLowerCase().includes(inputLower))
        .slice(0, 5)
        .map((city, i) => ({
          place_id: `fallback-${i}`,
          description: city,
          full_address: city,
        }));

      return res.json({ predictions: filtered });
    }
  } catch (error: any) {
    console.error('Error in places autocomplete:', error);
    return res.status(500).json({ detail: error.message });
  }
});

export const placesRoutes = router;
