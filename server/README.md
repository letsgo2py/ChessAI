# Chess Game Backend Server

## Setup Instructions

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

3. The server will run on `http://localhost:3001`

## Environment Variables

You can set the PORT environment variable:
```bash
PORT=3001 npm start
```

## API Endpoints

The server uses Socket.io for real-time communication. See `server.js` for available events.

## Deployment

For production, deploy to:
- Heroku
- AWS EC2
- DigitalOcean
- Railway
- Render

Make sure to update the SOCKET_URL in `chess-app/config/socket.ts` to your deployed server URL.

