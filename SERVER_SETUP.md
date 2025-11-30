# Backend Server Setup Instructions

## Step 1: Install Dependencies

Navigate to the server directory and install dependencies:

```bash
cd chess-app/server
npm install
```

## Step 2: Start the Server

For development (with auto-reload):
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## Step 3: Update Socket URL in App

Open `chess-app/config/socket.ts` and update the `SOCKET_URL`:

- For local development: `http://localhost:3001`
- For testing on device: `http://YOUR_COMPUTER_IP:3001` (find your IP with `ipconfig` on Windows)
- For production: Your deployed server URL

## Step 4: Deploy Server (Optional)

### Option A: Heroku
1. Create Heroku account
2. Install Heroku CLI
3. In server directory:
```bash
heroku create your-chess-server
git push heroku main
```

### Option B: Railway
1. Go to [Railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your server directory
4. Railway will auto-deploy

### Option C: Render
1. Go to [Render.com](https://render.com)
2. New Web Service
3. Connect GitHub repo
4. Set root directory to `server`
5. Deploy

## Step 5: Update App Socket URL

After deployment, update `SOCKET_URL` in `chess-app/config/socket.ts` to your deployed server URL.

## Server Features

- Matchmaking queue system
- Real-time move synchronization
- Game state management
- Disconnect handling
- Multiple concurrent games support

