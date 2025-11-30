# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "Chess App")
4. Follow the setup wizard

## Step 2: Enable Realtime Database

1. In Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Choose location (closest to your users)
4. Start in "test mode" for development (you'll secure it later)

## Step 3: Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click on Web icon (`</>`)
4. Register app with a nickname
5. Copy the Firebase configuration object

## Step 4: Update Firebase Config

Open `chess-app/config/firebase.ts` and replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 5: Database Rules (for production)

Update your Realtime Database rules in Firebase Console:

```json
{
  "rules": {
    "games": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "matchmaking": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

For development/testing, you can use:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**Note:** The above rules are for testing only. Secure them properly for production!

