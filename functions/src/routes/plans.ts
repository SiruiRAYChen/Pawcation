import { Router } from 'express';
import { admin, db } from '../config/firebase';
import { generateRoadTripItinerary, generateTravelItinerary } from '../services/geminiService';

const router = Router();

// Helper to calculate pet age
function calculatePetAge(dateOfBirth: string): string {
  if (!dateOfBirth) return 'unknown age';
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let ageYears = today.getFullYear() - birthDate.getFullYear();
  
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    ageYears -= 1;
  }
  
  if (ageYears < 1) {
    const ageMonths = 
      (today.getFullYear() - birthDate.getFullYear()) * 12 + 
      today.getMonth() - birthDate.getMonth();
    
    if (ageMonths < 1) return 'puppy/kitten';
    return `${ageMonths} months old`;
  } else if (ageYears === 1) {
    return '1 year old';
  } else {
    return `${ageYears} years old`;
  }
}

// Create plan
router.post('/', async (req, res) => {
  try {
    const planData = req.body;
    const { user_id: userId, ...rest } = planData;

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const firestoreData = {
      userId,
      startDate: rest.start_date,
      endDate: rest.end_date,
      tripType: rest.trip_type || null,
      isRoundTrip: rest.is_round_trip || false,
      destination: rest.destination || null,
      placesPassingBy: rest.places_passing_by || null,
      detailedItinerary: rest.detailed_itinerary || null,
      numHumans: rest.num_humans || 1,
      numAdults: rest.num_adults || 1,
      numChildren: rest.num_children || 0,
      budget: rest.budget || null,
      origin: rest.origin || null,
      petIds: rest.pet_ids || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const planRef = await db.collection('plans').add(firestoreData);
    const planDoc = await planRef.get();
    const data = planDoc.data();

    return res.status(201).json({
      plan_id: planDoc.id,
      user_id: data?.userId,
      start_date: data?.startDate,
      end_date: data?.endDate,
      trip_type: data?.tripType,
      is_round_trip: data?.isRoundTrip,
      destination: data?.destination,
      places_passing_by: data?.placesPassingBy,
      detailed_itinerary: data?.detailedItinerary,
      num_humans: data?.numHumans,
      num_adults: data?.numAdults,
      num_children: data?.numChildren,
      budget: data?.budget,
      origin: data?.origin,
      pet_ids: data?.petIds,
    });
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Get plan
router.get('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const planDoc = await db.collection('plans').doc(planId).get();

    if (!planDoc.exists) {
      return res.status(404).json({ detail: 'Plan not found' });
    }

    const data = planDoc.data();
    return res.json({
      plan_id: planDoc.id,
      user_id: data?.userId,
      start_date: data?.startDate,
      end_date: data?.endDate,
      trip_type: data?.tripType,
      is_round_trip: data?.isRoundTrip,
      destination: data?.destination,
      places_passing_by: data?.placesPassingBy,
      detailed_itinerary: data?.detailedItinerary,
      num_humans: data?.numHumans,
      num_adults: data?.numAdults,
      num_children: data?.numChildren,
      budget: data?.budget,
      origin: data?.origin,
      pet_ids: data?.petIds,
    });
  } catch (error: any) {
    console.error('Error getting plan:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Get user's plans
router.get('/user/:userId/plans', async (req, res) => {
  try {
    const { userId } = req.params;

    const plansSnapshot = await db.collection('plans')
      .where('userId', '==', userId)
      .get();

    const plans = plansSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        plan_id: doc.id,
        user_id: data.userId,
        start_date: data.startDate,
        end_date: data.endDate,
        trip_type: data.tripType,
        is_round_trip: data.isRoundTrip,
        destination: data.destination,
        places_passing_by: data.placesPassingBy,
        detailed_itinerary: data.detailedItinerary,
        num_humans: data.numHumans,
        num_adults: data.numAdults,
        num_children: data.numChildren,
        budget: data.budget,
        origin: data.origin,
        pet_ids: data.petIds,
      };
    });

    res.json(plans);
  } catch (error: any) {
    console.error('Error getting user plans:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Update plan
router.put('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    const planRef = db.collection('plans').doc(planId);
    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      return res.status(404).json({ detail: 'Plan not found' });
    }

    const firestoreUpdates: any = {};
    if (updates.start_date !== undefined) firestoreUpdates.startDate = updates.start_date;
    if (updates.end_date !== undefined) firestoreUpdates.endDate = updates.end_date;
    if (updates.trip_type !== undefined) firestoreUpdates.tripType = updates.trip_type;
    if (updates.is_round_trip !== undefined) firestoreUpdates.isRoundTrip = updates.is_round_trip;
    if (updates.destination !== undefined) firestoreUpdates.destination = updates.destination;
    if (updates.places_passing_by !== undefined) firestoreUpdates.placesPassingBy = updates.places_passing_by;
    if (updates.detailed_itinerary !== undefined) firestoreUpdates.detailedItinerary = updates.detailed_itinerary;
    if (updates.num_humans !== undefined) firestoreUpdates.numHumans = updates.num_humans;
    if (updates.num_adults !== undefined) firestoreUpdates.numAdults = updates.num_adults;
    if (updates.num_children !== undefined) firestoreUpdates.numChildren = updates.num_children;
    if (updates.budget !== undefined) firestoreUpdates.budget = updates.budget;
    if (updates.origin !== undefined) firestoreUpdates.origin = updates.origin;
    if (updates.pet_ids !== undefined) firestoreUpdates.petIds = updates.pet_ids;

    await planRef.update(firestoreUpdates);

    const updatedPlan = await planRef.get();
    const data = updatedPlan.data();

    return res.json({
      plan_id: updatedPlan.id,
      user_id: data?.userId,
      start_date: data?.startDate,
      end_date: data?.endDate,
      trip_type: data?.tripType,
      is_round_trip: data?.isRoundTrip,
      destination: data?.destination,
      places_passing_by: data?.placesPassingBy,
      detailed_itinerary: data?.detailedItinerary,
      num_humans: data?.numHumans,
      num_adults: data?.numAdults,
      num_children: data?.numChildren,
      budget: data?.budget,
      origin: data?.origin,
      pet_ids: data?.petIds,
    });
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Delete plan
router.delete('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    const planDoc = await db.collection('plans').doc(planId).get();

    if (!planDoc.exists) {
      return res.status(404).json({ detail: 'Plan not found' });
    }

    await db.collection('plans').doc(planId).delete();
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Generate itinerary
router.post('/generate-itinerary', async (req, res) => {
  try {
    const { pet_id, origin, destination, start_date, end_date, num_adults, num_children, budget } = req.body;

    const petDoc = await db.collection('pets').doc(pet_id).get();
    if (!petDoc.exists) {
      return res.status(404).json({ detail: 'Pet not found' });
    }

    const petData = petDoc.data();
    const petInfo = {
      name: petData?.name || '',
      breed: petData?.breed,
      age: calculatePetAge(petData?.dateOfBirth),
      size: petData?.size,
      personality: petData?.personality || [],
      health: petData?.health,
    };

    const result = await generateTravelItinerary({
      origin,
      destination,
      startDate: start_date,
      endDate: end_date,
      petInfo,
      numAdults: num_adults,
      numChildren: num_children,
      budget,
    });

    if (result.error) {
      return res.status(500).json({ detail: result.error });
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error generating itinerary:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Generate road trip itinerary
router.post('/generate-road-trip-itinerary', async (req, res) => {
  try {
    const { pet_id, origin, destination, start_date, end_date, num_adults, num_children, is_round_trip, budget } = req.body;

    const petDoc = await db.collection('pets').doc(pet_id).get();
    if (!petDoc.exists) {
      return res.status(404).json({ detail: 'Pet not found' });
    }

    const petData = petDoc.data();
    const petInfo = {
      name: petData?.name || '',
      breed: petData?.breed,
      age: calculatePetAge(petData?.dateOfBirth),
      size: petData?.size,
      personality: petData?.personality || [],
      health: petData?.health,
    };

    const result = await generateRoadTripItinerary({
      origin,
      destination,
      startDate: start_date,
      endDate: end_date,
      petInfo,
      numAdults: num_adults,
      numChildren: num_children,
      isRoundTrip: is_round_trip,
      budget,
    });

    if (result.error) {
      return res.status(500).json({ detail: result.error });
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error generating road trip itinerary:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Save generated itinerary as plan
router.post('/save', async (req, res) => {
  try {
    const { user_id, origin, destination, start_date, end_date, pet_ids, num_adults, num_children, trip_type, is_round_trip, detailed_itinerary } = req.body;

    const userDoc = await db.collection('users').doc(user_id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const planData = {
      userId: user_id,
      origin,
      destination,
      startDate: start_date,
      endDate: end_date,
      petIds: pet_ids,
      numAdults: num_adults,
      numChildren: num_children,
      numHumans: num_adults + num_children,
      tripType: trip_type,
      isRoundTrip: is_round_trip || false,
      detailedItinerary: detailed_itinerary,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const planRef = await db.collection('plans').add(planData);
    const planDoc = await planRef.get();
    const data = planDoc.data();

    return res.status(201).json({
      plan_id: planDoc.id,
      user_id: data?.userId,
      origin: data?.origin,
      destination: data?.destination,
      start_date: data?.startDate,
      end_date: data?.endDate,
      pet_ids: data?.petIds,
      num_adults: data?.numAdults,
      num_children: data?.numChildren,
      num_humans: data?.numHumans,
      trip_type: data?.tripType,
      is_round_trip: data?.isRoundTrip,
      detailed_itinerary: data?.detailedItinerary,
    });
  } catch (error: any) {
    console.error('Error saving plan:', error);
    return res.status(500).json({ detail: error.message });
  }
});

export const planRoutes = router;
