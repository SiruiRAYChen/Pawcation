import Busboy from 'busboy';
import { Router } from 'express';
import { admin, db } from '../config/firebase';
import { analyzePetImage } from '../services/geminiService';

const router = Router();

// Create pet
router.post('/', async (req, res) => {
  try {
    const petData = req.body;
    const { user_id: userId, ...rest } = petData;

    // Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ detail: 'User not found' });
    }

    // Convert snake_case to camelCase for Firestore
    const firestoreData = {
      userId,
      name: rest.name,
      breed: rest.breed || null,
      gender: rest.gender || null,
      dateOfBirth: rest.date_of_birth || null,
      isDobEstimated: rest.is_dob_estimated || false,
      gotchaDay: rest.gotcha_day || null,
      size: rest.size || null,
      personality: rest.personality || [],
      health: rest.health || null,
      appearance: rest.appearance || null,
      rabiesExpiration: rest.rabies_expiration || null,
      microchipId: rest.microchip_id || null,
      imageUrl: rest.image_url || null,
      avatarUrl: rest.avatar_url || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const petRef = await db.collection('pets').add(firestoreData);
    const petDoc = await petRef.get();

    const responseData = petDoc.data();
    return res.status(201).json({
      pet_id: petDoc.id,
      user_id: responseData?.userId,
      name: responseData?.name,
      breed: responseData?.breed,
      gender: responseData?.gender,
      date_of_birth: responseData?.dateOfBirth,
      is_dob_estimated: responseData?.isDobEstimated,
      gotcha_day: responseData?.gotchaDay,
      size: responseData?.size,
      personality: responseData?.personality,
      health: responseData?.health,
      appearance: responseData?.appearance,
      rabies_expiration: responseData?.rabiesExpiration,
      microchip_id: responseData?.microchipId,
      image_url: responseData?.imageUrl,
      avatar_url: responseData?.avatarUrl,
    });
  } catch (error: any) {
    console.error('Error creating pet:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Get pet
router.get('/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    const petDoc = await db.collection('pets').doc(petId).get();

    if (!petDoc.exists) {
      return res.status(404).json({ detail: 'Pet not found' });
    }

    const data = petDoc.data();
    return res.json({
      pet_id: petDoc.id,
      user_id: data?.userId,
      name: data?.name,
      breed: data?.breed,
      gender: data?.gender,
      date_of_birth: data?.dateOfBirth,
      is_dob_estimated: data?.isDobEstimated,
      gotcha_day: data?.gotchaDay,
      size: data?.size,
      personality: data?.personality,
      health: data?.health,
      appearance: data?.appearance,
      rabies_expiration: data?.rabiesExpiration,
      microchip_id: data?.microchipId,
      image_url: data?.imageUrl,
      avatar_url: data?.avatarUrl,
    });
  } catch (error: any) {
    console.error('Error getting pet:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Get user's pets
router.get('/user/:userId/pets', async (req, res) => {
  try {
    const { userId } = req.params;

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

    res.json(pets);
  } catch (error: any) {
    console.error('Error getting user pets:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Update pet
router.put('/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    const updates = req.body;

    const petRef = db.collection('pets').doc(petId);
    const petDoc = await petRef.get();

    if (!petDoc.exists) {
      return res.status(404).json({ detail: 'Pet not found' });
    }

    // Convert snake_case to camelCase
    const firestoreUpdates: any = {};
    if (updates.name !== undefined) firestoreUpdates.name = updates.name;
    if (updates.breed !== undefined) firestoreUpdates.breed = updates.breed;
    if (updates.gender !== undefined) firestoreUpdates.gender = updates.gender;
    if (updates.date_of_birth !== undefined) firestoreUpdates.dateOfBirth = updates.date_of_birth;
    if (updates.is_dob_estimated !== undefined) firestoreUpdates.isDobEstimated = updates.is_dob_estimated;
    if (updates.gotcha_day !== undefined) firestoreUpdates.gotchaDay = updates.gotcha_day;
    if (updates.size !== undefined) firestoreUpdates.size = updates.size;
    if (updates.personality !== undefined) firestoreUpdates.personality = updates.personality;
    if (updates.health !== undefined) firestoreUpdates.health = updates.health;
    if (updates.appearance !== undefined) firestoreUpdates.appearance = updates.appearance;
    if (updates.rabies_expiration !== undefined) firestoreUpdates.rabiesExpiration = updates.rabies_expiration;
    if (updates.microchip_id !== undefined) firestoreUpdates.microchipId = updates.microchip_id;
    if (updates.image_url !== undefined) firestoreUpdates.imageUrl = updates.image_url;
    if (updates.avatar_url !== undefined) firestoreUpdates.avatarUrl = updates.avatar_url;

    await petRef.update(firestoreUpdates);

    const updatedPet = await petRef.get();
    const data = updatedPet.data();

    return res.json({
      pet_id: updatedPet.id,
      user_id: data?.userId,
      name: data?.name,
      breed: data?.breed,
      gender: data?.gender,
      date_of_birth: data?.dateOfBirth,
      is_dob_estimated: data?.isDobEstimated,
      gotcha_day: data?.gotchaDay,
      size: data?.size,
      personality: data?.personality,
      health: data?.health,
      appearance: data?.appearance,
      rabies_expiration: data?.rabiesExpiration,
      microchip_id: data?.microchipId,
      image_url: data?.imageUrl,
      avatar_url: data?.avatarUrl,
    });
  } catch (error: any) {
    console.error('Error updating pet:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Delete pet
router.delete('/:petId', async (req, res) => {
  try {
    const { petId } = req.params;
    const petDoc = await db.collection('pets').doc(petId).get();

    if (!petDoc.exists) {
      return res.status(404).json({ detail: 'Pet not found' });
    }

    await db.collection('pets').doc(petId).delete();
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting pet:', error);
    return res.status(500).json({ detail: error.message });
  }
});

// Analyze pet image
router.post('/analyze-image', async (req, res): Promise<void> => {
  try {
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      res.status(400).json({ detail: 'Content type must be multipart/form-data' });
      return;
    }

    // Create a promise-based approach to handle busboy
    const processUpload = new Promise<{ buffer: Buffer; mimeType: string }>((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers });
      let imageBuffer: Buffer | null = null;
      let mimeType = 'image/jpeg';
      let fileProcessed = false;

      busboy.on('file', (fieldname, file, info) => {
        const { mimeType: mime } = info;
        mimeType = mime;
        
        const chunks: Buffer[] = [];
        
        file.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        file.on('end', () => {
          imageBuffer = Buffer.concat(chunks);
          fileProcessed = true;
        });
      });

      busboy.on('finish', () => {
        if (!fileProcessed || !imageBuffer) {
          reject(new Error('No image file provided'));
          return;
        }
        resolve({ buffer: imageBuffer, mimeType });
      });

      busboy.on('error', (error: any) => {
        reject(error);
      });

      req.pipe(busboy);
    });

    // Wait for upload to complete
    const { buffer, mimeType } = await processUpload;
    
    // Analyze the image
    const result = await analyzePetImage(buffer, mimeType);
    
    if (result.error) {
      res.status(500).json({ detail: result.error });
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ detail: error.message });
  }
});

export const petRoutes = router;
