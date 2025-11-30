# How to Test Matchmaking with Expo Go

## Quick Answer
**Yes, you need TWO devices/emulators** to test matchmaking. Here's how:

## Option 1: Two Physical Devices (Recommended)

### Step 1: Start the Backend Server
```bash
cd chess-app/server
npm install  # If not done already
npm start
```
You should see: `Chess server running on port 3001`

### Step 2: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

### Step 3: Update Socket URL for Devices

Open `chess-app/config/socket.ts` and change:
```typescript
const SOCKET_URL = 'http://YOUR_IP_ADDRESS:3001';
```

For example, if your IP is `192.168.1.100`:
```typescript
const SOCKET_URL = 'http://192.168.1.100:3001';
```

### Step 4: Make Sure All Devices Are on Same Network
- Your computer (running server) and both phones must be on the **same WiFi network**

### Step 5: Start Expo App
```bash
cd chess-app
npm start
```

### Step 6: Open on Two Devices
1. **Device 1**: Scan QR code with Expo Go → Open app → Click "Play Random Match"
2. **Device 2**: Scan QR code with Expo Go → Open app → Click "Play Random Match"
3. Both should match and start playing!

---

## Option 2: One Physical Device + One Emulator

### Step 1-3: Same as above (start server, find IP, update socket URL)

### Step 4: Start Expo
```bash
cd chess-app
npm start
```

### Step 5: Test
1. **Physical Device**: Scan QR code → Open app → Click "Play Random Match"
2. **Emulator**: Press `a` in terminal (Android) or `i` (iOS) → Click "Play Random Match"
3. They should match!

**Note**: For emulator, you might need to use `10.0.2.2` instead of your IP:
- Android Emulator: Use `http://10.0.2.2:3001`
- iOS Simulator: Use `http://localhost:3001` or your actual IP

---

## Option 3: Two Emulators (Easier for Development)

### Step 1: Start Server
```bash
cd chess-app/server
npm start
```

### Step 2: Update Socket URL
For emulators, use:
```typescript
// Android Emulator
const SOCKET_URL = 'http://10.0.2.2:3001';

// iOS Simulator
const SOCKET_URL = 'http://localhost:3001';
```

### Step 3: Start Expo
```bash
cd chess-app
npm start
```

### Step 4: Open Two Emulators
1. Press `a` twice (Android) or `i` twice (iOS) to open two instances
2. Or use Android Studio/Xcode to launch multiple emulators
3. Click "Play Random Match" on both
4. They should match!

---

## Troubleshooting

### ❌ "Connection Error" or "Can't connect to server"

**Check:**
1. ✅ Server is running (`npm start` in server folder)
2. ✅ Socket URL is correct in `config/socket.ts`
3. ✅ All devices on same WiFi network
4. ✅ Firewall isn't blocking port 3001

**Fix Firewall (Windows):**
```powershell
# Allow Node.js through firewall
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3001
```

### ❌ "Waiting for opponent..." forever

**Check:**
1. ✅ Two devices are both searching
2. ✅ Both clicked "Play Random Match"
3. ✅ Check server console for connection logs

### ❌ Emulator can't connect

**Try:**
- Android: Use `10.0.2.2:3001` instead of localhost
- iOS: Use `localhost:3001` or your computer's IP
- Make sure server is running

### ❌ Server not starting

**Check:**
```bash
cd chess-app/server
npm install  # Install dependencies first
npm start
```

---

## Testing Checklist

- [ ] Server is running on port 3001
- [ ] Socket URL updated in `config/socket.ts`
- [ ] Two devices/emulators ready
- [ ] Both devices on same network
- [ ] Both apps opened in Expo Go
- [ ] Both clicked "Play Random Match"
- [ ] Match found! ✅

---

## Quick Test Command

To test if server is accessible:
```bash
# From your phone's browser (same WiFi), try:
http://YOUR_IP:3001
# Should see connection or error (not 404)
```

---

## What Happens When You Match?

1. Both players join matchmaking queue
2. Server matches them (when 2 players in queue)
3. Server creates game room
4. Both players receive:
   - Game ID
   - Player color (white/black)
   - Opponent name
5. Game starts with initial board
6. Moves sync in real-time!

---

## Need Help?

Check server console for logs:
- `User connected: [socket-id]` - Device connected
- `Player joined matchmaking: [socket-id]` - Player in queue
- `Match found: Player1 vs Player2` - Match created!

