import { Router } from 'express';
import { admin, db } from '../config/firebase';

const router = Router();

// Create user (handled by Firebase Auth, but we store additional info in Firestore)
router.post('/', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Store additional user info in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: userRecord.email,
      name: name || null,
      avatar_url: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      user_id: userRecord.uid,
      email: userRecord.email,
      name: name || null,
      avatar_url: null,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ detail: 'Email already registered' });
    }
    
    return res.status(500).json({ detail: error.message });
  }
});

// Get user with pets and plans
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Get user's pets
    const petsSnapshot = await db.collection('pets')
      .where('userId', '==', userId)
      .get();
    
    const pets = petsSnapshot.docs.map(doc => ({
      pet_id: doc.id,
      ...doc.data(),
    }));

    // Get user's plans
    const plansSnapshot = await db.collection('plans')
      .where('userId', '==', userId)
      .get();
    
    const plans = plansSnapshot.docs.map(doc => ({
      plan_id: doc.id,
      ...doc.data(),
    }));

    const userData = userDoc.data();
    return res.json({
      user_id: userDoc.id,
      email: userData?.email,
      name: userData?.name,
      avatar_url: userData?.avatar_url,
      pets,
      plans,
    });
  } catch (error: any) {
    console.error('Error getting user:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Get user's pets
router.get('/:userId/pets', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Get user's pets
    const petsSnapshot = await db.collection('pets')
      .where('userId', '==', userId)
      .get();
    
    const pets = petsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        pet_id: doc.id,
        user_id: data.userId,
        name: data.name,
        breed: data.breed,
        gender: data.gender,
        date_of_birth: data.dateOfBirth,
        is_dob_estimated: data.isDobEstimated,
        gotcha_day: data.gotchaDay,
        size: data.size,
        personality: data.personality,
        health: data.health,
        appearance: data.appearance,
        rabies_expiration: data.rabiesExpiration,
        microchip_id: data.microchipId,
        image_url: data.imageUrl,
        avatar_url: data.avatarUrl,
      };
    });

    return res.json(pets);
  } catch (error: any) {
    console.error('Error getting user pets:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Get user's plans
router.get('/:userId/plans', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Get user's plans
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

    return res.json(plans);
  } catch (error: any) {
    console.error('Error getting user plans:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// List users
router.get('/', async (req, res) => {
  try {
    const { skip = 0, limit = 100 } = req.query;

    const usersSnapshot = await db.collection('users')
      .offset(Number(skip))
      .limit(Number(limit))
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      user_id: doc.id,
      ...doc.data(),
    }));

    res.json(users);
  } catch (error: any) {
    console.error('Error listing users:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Update user
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, avatar_url, password } = req.body;

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ detail: 'User not found' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    await userRef.update(updates);

    // Update password in Firebase Auth if provided
    if (password) {
      await admin.auth().updateUser(userId, { password });
    }

    const updatedUser = await userRef.get();
    return res.json({
      user_id: updatedUser.id,
      ...updatedUser.data(),
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Delete user
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete from Firestore
    await db.collection('users').doc(userId).delete();
    
    // Delete from Firebase Auth
    await admin.auth().deleteUser(userId);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Login (Firebase Auth handles this on client, but we can verify)
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    // In Firebase, login is handled on the client side with Firebase Auth SDK
    // This endpoint is for compatibility - we'll just verify the user exists
    const userRecord = await admin.auth().getUserByEmail(email);
    
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    return res.json({
      user_id: userDoc.id,
      email: userDoc.data()?.email,
      name: userDoc.data()?.name,
      avatar_url: userDoc.data()?.avatar_url,
    });
  } catch (error: any) {
    console.error('Error logging in:', error);
    return res.status(401).json({ detail: 'Invalid email or password' });
  }
});

export const userRoutes = router;
