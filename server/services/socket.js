import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow unauthenticated connection for public status boards if needed, but mark as guest
      socket.user = null;
      return next();
    }

    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      return next();
    } catch (err) {
      console.warn('[Socket Auth Warn] Invalid token on connection:', err.message);
      socket.user = null;
      return next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.user && socket.user.id) {
      const userRoom = `user:${socket.user.id}`;
      socket.join(userRoom);
      console.log(`[Socket] User connected: ${socket.user.id} -> joined ${userRoom}`);
    } else {
      console.log(`[Socket] Anonymous connection: ${socket.id}`);
    }

    // Allow joining specific rooms if requested (e.g., session live attendance, rooms board)
    socket.on('join', (roomName) => {
      socket.join(roomName);
    });

    socket.on('leave', (roomName) => {
      socket.leave(roomName);
    });

    socket.on('disconnect', () => {
      // Disconnected cleanly
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};
