import admin from 'firebase-admin';
import { config } from '../../config';

try {
  if (config.FIREBASE_CLIENT_EMAIL && config.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FIREBASE_PROJECT_ID,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
        privateKey: config.FIREBASE_PRIVATE_KEY,
      }),
      storageBucket: `${config.FIREBASE_PROJECT_ID}.appspot.com`
    });
    console.log('✔ Firebase Admin SDK successfully initialized');
  } else {
    // If running locally without full service account key, attempt default credentials
    // or initialize with project ID for local emulator usage.
    admin.initializeApp({
      projectId: config.FIREBASE_PROJECT_ID,
      storageBucket: `${config.FIREBASE_PROJECT_ID}.appspot.com`
    });
    console.warn('⚠️ Firebase Admin SDK initialized with fallback default credential (env credentials missing)');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  // Do not crash server immediately during builds or testing
  if (config.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Export references to services
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export const bucket = storage.bucket();

export default admin;
