import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';

let io = null;

export const initSocket = (httpServer) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  // Strict Authentication Middleware: Reject connections without valid JWT
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = verifyToken(token);
      socket.user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Automatically join the user's private notification channel
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);
    console.log(`[Socket] User connected: ${socket.user.id} (${socket.user.role}) -> joined ${userRoom}`);

    // Restrict room joining to explicitly recognized patterns with RBAC
    socket.on('join', (roomName) => {
      if (typeof roomName !== 'string') return;

      // 1. User room: user:<userId> (self or admin only)
      if (roomName.startsWith('user:')) {
        const targetUserId = roomName.slice(5);
        if (targetUserId === socket.user.id || socket.user.role === 'admin') {
          socket.join(roomName);
        } else {
          socket.emit('error:unauthorized', { message: 'Unauthorized room access' });
        }
        return;
      }

      // 2. Attendance session live class room: session:<sessionId> (faculty or admin only)
      if (roomName.startsWith('session:')) {
        if (['faculty', 'admin'].includes(socket.user.role)) {
          socket.join(roomName);
        } else {
          socket.emit('error:unauthorized', { message: 'Only faculty or admins can join live session streams' });
        }
        return;
      }

      // Any unrecognized room name is denied
      socket.emit('error:unauthorized', { message: `Room '${roomName}' is not allowed` });
    });

    socket.on('leave', (roomName) => {
      if (typeof roomName === 'string') {
        socket.leave(roomName);
      }
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
