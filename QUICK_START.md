# Quick Start Guide - Random Match Feature

## Prerequisites

1. Node.js installed (v16 or higher)
2. Firebase account (free tier works)
3. Two devices or emulators for testing

## Setup Steps

### 1. Firebase Setup (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Realtime Database
4. Copy your Firebase config
5. Update `chess-app/config/firebase.ts` with your config

### 2. Backend Server Setup (5 minutes)

```bash
cd chess-app/server
npm install
npm start
```

The server will run on `http://localhost:3001`

### 3. Update Socket URL

Open `chess-app/config/socket.ts` and set:
- Local: `http://localhost:3001` (for emulator)
- Device: `http://YOUR_COMPUTER_IP:3001` (for physical device)
  - Find IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### 4. Test the App

1. Start the Expo app: `npm start`
2. Click "Play Random Match"
3. Open on two devices/emulators
4. Both should match and start playing!

## How It Works

1. **Matchmaking**: Players join a queue, server matches them when 2 are available
2. **Game Creation**: Server creates a game room with unique ID
3. **Real-time Sync**: Moves are sent via Socket.io and synced to both players
4. **Game State**: Server maintains the game state and validates moves

## Troubleshooting

- **Can't connect**: Check if server is running and URL is correct
- **No match found**: Make sure 2 players are searching simultaneously
- **Moves not syncing**: Check server logs for errors

## Next Steps

- Deploy server to production (Heroku, Railway, etc.)
- Add user authentication
- Add game history
- Add chat feature
- Add rating system

