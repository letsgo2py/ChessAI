// Type definitions for Expo Constants extra config
declare module 'expo-constants' {
  export interface ExpoConfig {
    extra?: {
      firebaseApiKey?: string;
      firebaseAuthDomain?: string;
      firebaseDatabaseUrl?: string;
      firebaseProjectId?: string;
      firebaseStorageBucket?: string;
      firebaseMessagingSenderId?: string;
      firebaseAppId?: string;
    };
  }
}

