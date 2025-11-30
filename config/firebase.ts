import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import Constants from 'expo-constants';

// Loaded from environment variables via expo-constants
// Type assertion needed because expoConfig is available at runtime but types may not reflect it
const extra = (Constants as any).expoConfig?.extra;

if (!extra) {
  throw new Error('Firebase configuration not found. Please check your .env file and app.config.js');
}

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  databaseURL: extra.firebaseDatabaseUrl,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId
};

// Validate required fields
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  throw new Error(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);
export default app;

