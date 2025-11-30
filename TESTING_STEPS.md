# Step-by-Step: Testing Matchmaking

## ✅ Prerequisites Checklist

- [ ] Backend server dependencies installed
- [ ] Firebase Realtime Database enabled
- [ ] Two devices/emulators ready

---

## 🚀 Quick Start (5 Steps)

### Step 1: Install Server Dependencies (First Time Only)
```bash
cd chess-app/server
npm install
```

### Step 2: Start the Backend Server
```bash
# In chess-app/server folder
npm start
```
**Keep this terminal open!** You should see:
```
Chess server running on port 3001
```

### Step 3: Find Your Computer's IP Address

**Windows (PowerShell):**
```powershell
ipconfig | findstr IPv4
```

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

Copy the IP address (usually `192.168.x.x` or `10.x.x.x`)

### Step 4: Update Socket URL

Open `chess-app/config/socket.ts` and replace:
```typescript
const SOCKET_URL = 'http://localhost:3001';
```

With your IP:
```typescript
const SOCKET_URL = 'http://192.168.1.XXX:3001'; // Replace XXX with your IP
```

**For Emulators:**
- Android Emulator: `http://10.0.2.2:3001`
- iOS Simulator: `http://localhost:3001`

### Step 5: Test with Two Devices

1. **Start Expo:**
   ```bash
   cd chess-app
   npm start
   ```

2. **Device 1:**
   - Open Expo Go app
   - Scan QR code
   - Click "Play Random Match"
   - Wait for opponent...

3. **Device 2:**
   - Open Expo Go app
   - Scan QR code
   - Click "Play Random Match"
   - **Both should match immediately!** 🎉

---

## 📱 Testing Options

### Option A: Two Physical Phones (Best Experience)
- ✅ Real device testing
- ✅ Same WiFi network required
- ✅ Use your computer's IP address

### Option B: One Phone + One Emulator
- ✅ Good for development
- ✅ Phone: Use computer's IP
- ✅ Emulator: Use `10.0.2.2` (Android) or `localhost` (iOS)

### Option C: Two Emulators
- ✅ Fastest for testing
- ✅ Use `10.0.2.2` (Android) or `localhost` (iOS)

---

## 🔍 Verify Everything Works

### Check Server is Running:
```bash
# Should see in terminal:
Chess server running on port 3001
User connected: [some-id]
Player joined matchmaking: [some-id]
```

### Check Connection:
- Open phone browser (same WiFi)
- Go to: `http://YOUR_IP:3001`
- Should connect (not 404 error)

### Check Matchmaking:
- Two players in queue → Match found!
- Server console shows: `Match found: Player1 vs Player2`

---

## ❌ Common Issues

### "Connection Error"
1. Check server is running
2. Check IP address is correct
3. Check both devices on same WiFi
4. Check firewall allows port 3001

### "Waiting forever"
1. Make sure TWO devices are searching
2. Check server console for connection logs
3. Try restarting server

### "Can't find IP address"
- Windows: `ipconfig`
- Mac: `ifconfig`
- Look for IPv4 address (not 127.0.0.1)

---

## 🎮 What to Expect

1. **Click "Play Random Match"** → Shows "Searching for Opponent..."
2. **Second player joins** → Both see "Match Found!"
3. **Game starts** → Chess board appears
4. **Make moves** → Both players see moves in real-time!

---

## 💡 Pro Tips

- Keep server terminal visible to see connection logs
- Use same WiFi network for all devices
- Restart server if connection issues
- Test with emulators first (easier setup)

---

## 🆘 Still Having Issues?

1. Check `HOW_TO_TEST_MATCHMAKING.md` for detailed troubleshooting
2. Check server console for error messages
3. Verify all steps above are completed
4. Make sure no firewall is blocking port 3001

