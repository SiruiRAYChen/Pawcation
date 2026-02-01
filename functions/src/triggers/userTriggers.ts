import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Trigger when a user is deleted - cleanup their data
export const onUserDeleted = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snapshot, context) => {
    const userId = context.params.userId;
    const db = admin.firestore();

    try {
      // Delete user's pets
      const petsSnapshot = await db.collection('pets')
        .where('userId', '==', userId)
        .get();
      
      const batch = db.batch();
      petsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete user's plans
      const plansSnapshot = await db.collection('plans')
        .where('userId', '==', userId)
        .get();
      
      plansSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete user's memory photos
      const photosSnapshot = await db.collection('memoryPhotos')
        .where('userId', '==', userId)
        .get();
      
      photosSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log(`Successfully cleaned up data for deleted user: ${userId}`);
    } catch (error) {
      console.error(`Error cleaning up data for user ${userId}:`, error);
    }
  });
