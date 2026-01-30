import { io, Socket } from 'socket.io-client';

// const SOCKET_URL = 'http://localhost:3001'; 
const PORT = 3001;
const SOCKET_URL = `http://${process.env.SERVER_IP}:${PORT}`;   // Using my laptop IP address for now


let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    console.log("Creating new socket connection");

    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
    });

    // Global debug listeners (VERY IMPORTANT)
    socket.on('connect', () => {
      console.log('SOCKET CONNECTED (global):', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('SOCKET DISCONNECTED (global):', reason);
    });

    socket.on('connect_error', (err) => {
      console.log('SOCKET CONNECT ERROR:', err.message);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("Disconnecting socket");
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

