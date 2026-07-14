import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let auth: Auth;

// Verify if the critical api key is present in environments (prevents crash during static page pre-rendering)
const hasApiKey = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined' && firebaseConfig.apiKey !== '';

if (hasApiKey) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  
  // Enable local persistence so sessions survive browser refresh
  if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.error('Firebase Auth local persistence activation failed:', err);
    });
  }
} else {
  // Mock Firebase auth interface for static build/prerendering compilation phases
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
  } as unknown as Auth;
  console.log('Firebase Web SDK initialized with mock interface (API key missing during compile phase)');
}

export { auth };
export default app;
