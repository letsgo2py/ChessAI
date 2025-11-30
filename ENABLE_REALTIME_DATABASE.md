# How to Enable Firebase Realtime Database

## Step-by-Step Instructions

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Select your project: **myapp-6f421**

### Step 2: Navigate to Realtime Database
1. In the left sidebar, look for **"Build"** section
2. Click on **"Realtime Database"**
   - If you don't see it, click the **"</>"** (Web) icon or look under "Build" menu

### Step 3: Create Database
1. Click the **"Create Database"** button
2. You'll see two options:
   - **Location**: Choose the region closest to your users
     - Recommended: `us-central1` (United States) or closest to your location
   - **Security Rules**: Choose one:
     - **Start in test mode** (for development) - Allows read/write for 30 days
     - **Start in locked mode** (more secure) - Requires authentication

3. For development, select **"Start in test mode"**
4. Click **"Enable"**

### Step 4: Get Your Database URL
1. After creating, you'll see your database URL at the top
2. It will look like: `https://myapp-6f421-default-rtdb.firebaseio.com/`
3. Copy this URL

### Step 5: Update Firebase Config
Open `chess-app/config/firebase.ts` and add the `databaseURL`:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDrnA-lXKgcU2m87-vBsPF1DaBcF3MLZH8",
  authDomain: "myapp-6f421.firebaseapp.com",
  databaseURL: "https://myapp-6f421-default-rtdb.firebaseio.com/", // ADD THIS
  projectId: "myapp-6f421",
  storageBucket: "myapp-6f421.firebasestorage.app",
  messagingSenderId: "422129025129",
  appId: "1:422129025129:web:9c106281f132f14d5b22f8"
};
```

### Step 6: Set Security Rules (Important!)
1. In Realtime Database, go to **"Rules"** tab
2. For development/testing, use:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
3. Click **"Publish"**

⚠️ **Warning**: These rules allow anyone to read/write. Only use for development!

### Step 7: Verify Database is Working
1. Go to **"Data"** tab in Realtime Database
2. You should see an empty database
3. You can test by adding data manually

## Visual Guide

```
Firebase Console
├── Project: myapp-6f421
│   ├── Build (left sidebar)
│   │   ├── Realtime Database ← Click here
│   │   │   ├── Create Database button
│   │   │   ├── Data tab (view data)
│   │   │   └── Rules tab (security rules)
```

## Troubleshooting

**Q: I don't see "Realtime Database" option**
- Make sure you're in the correct project
- Try refreshing the page
- Look under "Build" section in left sidebar

**Q: Database URL not showing**
- Make sure database is created
- Check the database name in the URL
- It should be: `https://[PROJECT_ID]-default-rtdb.firebaseio.com/`

**Q: Getting permission errors**
- Check your security rules
- Make sure rules allow read/write for testing

## Next Steps

After enabling:
1. Update `firebase.ts` with `databaseURL`
2. Test the connection
3. Start your server: `cd server && npm start`
4. Test matchmaking feature

