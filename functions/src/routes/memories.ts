import { Router } from 'express';
import { admin, db } from '../config/firebase';

const router = Router();

// Get past trips (trips with end date in the past)
router.get('/past-trips/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    // Get all plans for the user first, then filter in memory
    const plansSnapshot = await db.collection('plans')
      .where('userId', '==', userId)
      .get();

    const result = [];

    // Filter for past trips and sort by end date
    const pastPlans = plansSnapshot.docs
      .filter(doc => {
        const endDate = doc.data().endDate;
        return endDate && endDate < today;
      })
      .sort((a, b) => {
        const aDate = a.data().endDate || '';
        const bDate = b.data().endDate || '';
        return bDate.localeCompare(aDate); // Descending order
      });

    for (const planDoc of pastPlans) {
      const planData = planDoc.data();
      
      // Get photos for this trip, sorted by creation time
      const photosSnapshot = await db.collection('memoryPhotos')
        .where('tripId', '==', planDoc.id)
        .get();
      
      // Sort photos in memory and get the most recent one as cover
      const sortedPhotos = photosSnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            localPath: data.localPath,
            createdAt: data.createdAt,
            _sortTime: data.createdAt?.toMillis() || 0,
          };
        })
        .sort((a, b) => b._sortTime - a._sortTime);
      
      const coverPhoto = sortedPhotos.length > 0 ? sortedPhotos[0].localPath : null;
      
      // Extract visited cities
      let visitedCities: string[] = [];
      if (planData.destination) {
        visitedCities.push(planData.destination);
      }
      
      if (planData.placesPassingBy && planData.tripType === 'Road Trip') {
        try {
          const cities = planData.placesPassingBy.startsWith('[') 
            ? JSON.parse(planData.placesPassingBy)
            : planData.placesPassingBy.split(',').map((c: string) => c.trim());
          visitedCities = visitedCities.concat(cities);
        } catch (e) {
          if (planData.placesPassingBy) {
            visitedCities = visitedCities.concat(
              planData.placesPassingBy.split(',').map((c: string) => c.trim())
            );
          }
        }
      }
      
      // Remove duplicates
      visitedCities = Array.from(new Set(visitedCities));

      result.push({
        plan_id: planDoc.id,
        user_id: planData.userId,
        start_date: planData.startDate,
        end_date: planData.endDate,
        trip_type: planData.tripType,
        is_round_trip: planData.isRoundTrip,
        destination: planData.destination,
        places_passing_by: planData.placesPassingBy,
        detailed_itinerary: planData.detailedItinerary,
        num_humans: planData.numHumans,
        num_adults: planData.numAdults,
        num_children: planData.numChildren,
        budget: planData.budget,
        origin: planData.origin,
        pet_ids: planData.petIds,
        cover_photo: coverPhoto,
        photo_count: sortedPhotos.length,
        visited_cities: visitedCities,
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error getting past trips:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Get trip photos
router.get('/photos/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { city_name } = req.query;
    
    console.log('Getting photos for trip:', tripId, 'city:', city_name);

    let query = db.collection('memoryPhotos').where('tripId', '==', tripId);
    
    if (city_name) {
      query = query.where('cityName', '==', city_name);
    }

    // Fetch without orderBy to avoid composite index requirement
    const photosSnapshot = await query.get();
    
    console.log('Found photos:', photosSnapshot.size);

    // Map and sort in memory
    const photos = photosSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          photo_id: doc.id,
          trip_id: data.tripId,
          user_id: data.userId,
          local_path: data.localPath,
          city_name: data.cityName,
          created_at: data.createdAt?.toDate().toISOString() || null,
          _sortTime: data.createdAt?.toMillis() || 0,
        };
      })
      .sort((a, b) => b._sortTime - a._sortTime) // Sort descending by time
      .map(({ _sortTime, ...photo }) => photo); // Remove the temporary sort field

    res.json(photos);
  } catch (error: any) {
    console.error('Error getting trip photos:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ detail: error.message });
  }
});

// Add memory photo
router.post('/photos', async (req, res) => {
  try {
    const { trip_id, user_id, local_path, city_name } = req.body;
    
    console.log('Adding memory photo:', { trip_id, user_id, city_name, has_local_path: !!local_path });

    if (!trip_id || !user_id || !local_path) {
      return res.status(400).json({ detail: 'Missing required fields: trip_id, user_id, local_path' });
    }

    const tripDoc = await db.collection('plans').doc(trip_id).get();
    if (!tripDoc.exists) {
      console.error('Trip not found:', trip_id);
      return res.status(404).json({ detail: 'Trip not found' });
    }

    const photoData = {
      tripId: trip_id,
      userId: user_id,
      localPath: local_path,
      cityName: city_name || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const photoRef = await db.collection('memoryPhotos').add(photoData);
    const photoDoc = await photoRef.get();
    const data = photoDoc.data();
    
    console.log('Photo added successfully:', photoRef.id);

    return res.status(201).json({
      photo_id: photoDoc.id,
      trip_id: data?.tripId,
      user_id: data?.userId,
      local_path: data?.localPath,
      city_name: data?.cityName,
      created_at: data?.createdAt?.toDate().toISOString() || null,
    });
  } catch (error: any) {
    console.error('Error adding memory photo:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ detail: error.message });
  }
});

// Delete memory photo
router.delete('/photos/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    
    const photoDoc = await db.collection('memoryPhotos').doc(photoId).get();
    if (!photoDoc.exists) {
      return res.status(404).json({ detail: 'Photo not found' });
    }

    await db.collection('memoryPhotos').doc(photoId).delete();
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting memory photo:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Get visited cities for map
router.get('/visited-cities/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Getting visited cities for user:', userId);

    // Get all plans for the user, then filter in memory (avoid Firestore index requirement)
    const plansSnapshot = await db.collection('plans')
      .where('userId', '==', userId)
      .get();
    
    console.log('Found plans:', plansSnapshot.size);

    // Filter for past trips
    const pastPlans = plansSnapshot.docs.filter(doc => {
      const endDate = doc.data().endDate;
      return endDate && endDate < today;
    });
    
    console.log('Past trips:', pastPlans.length);

    const cityTrips: { [key: string]: string[] } = {};
    const tripColors: { [key: string]: string } = {};
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

    let idx = 0;
    for (const planDoc of pastPlans) {
      const planData = planDoc.data();
      tripColors[planDoc.id] = colors[idx % colors.length];
      idx++;

      let cities: string[] = [];
      if (planData.tripType === 'Direct Trip' || planData.tripType === 'Direct Flight') {
        if (planData.destination) {
          cities = [planData.destination];
        }
      } else if (planData.tripType === 'Road Trip') {
        if (planData.placesPassingBy) {
          try {
            cities = planData.placesPassingBy.startsWith('[')
              ? JSON.parse(planData.placesPassingBy)
              : planData.placesPassingBy.split(',').map((c: string) => c.trim());
          } catch (e) {
            cities = planData.placesPassingBy.split(',').map((c: string) => c.trim());
          }
        }
      }

      for (const city of cities) {
        if (city && city.trim()) {
          if (!cityTrips[city]) {
            cityTrips[city] = [];
          }
          cityTrips[city].push(planDoc.id);
        }
      }
    }
    
    console.log('City trips:', Object.keys(cityTrips).length, 'cities');

    const result = [];
    for (const [cityName, tripIds] of Object.entries(cityTrips)) {
      // Handle Firestore 'in' query limit of 10 items
      let photoCount = 0;
      
      if (tripIds.length > 0) {
        // Split into batches of 10 for Firestore 'in' query
        for (let i = 0; i < tripIds.length; i += 10) {
          const batch = tripIds.slice(i, i + 10);
          const photoSnapshot = await db.collection('memoryPhotos')
            .where('cityName', '==', cityName)
            .where('tripId', 'in', batch)
            .get();
          photoCount += photoSnapshot.size;
        }
      }

      const tripColor = tripColors[tripIds[0]] || '#4ECDC4';

      result.push({
        city_name: cityName,
        trip_ids: tripIds,
        photo_count: photoCount,
        trip_color: tripColor,
      });
    }
    
    console.log('Returning', result.length, 'cities');
    res.json(result);
  } catch (error: any) {
    console.error('Error getting visited cities:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ detail: error.message });
  }
});

// Delete past trip
router.delete('/trips/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;

    const tripDoc = await db.collection('plans').doc(tripId).get();
    if (!tripDoc.exists) {
      return res.status(404).json({ detail: 'Trip not found' });
    }

    // Delete all photos for this trip
    const photosSnapshot = await db.collection('memoryPhotos')
      .where('tripId', '==', tripId)
      .get();
    
    const batch = db.batch();
    photosSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete the trip
    await db.collection('plans').doc(tripId).delete();
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting past trip:', error);
    return res.status(500).json({ detail: error.message });
  }
});

export const memoryRoutes = router;
