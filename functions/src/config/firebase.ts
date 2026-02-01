import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK once
admin.initializeApp();

// Export initialized services for use in routes
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export { admin };
