import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

export const useSocket = () => {
  const socketRef = useRef(null);
  const token = useAuthStore((state) => state.token);
  const addRealtimeNotification = useNotificationStore((state) => state.addRealtimeNotification);

  useEffect(() => {
    // When VITE_API_URL is relative (e.g. /api), connect to same origin
    const socketUrl =
      import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
        : window.location.origin;

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Connected successfully
    });

    socket.on('notification:new', (notif) => {
      addRealtimeNotification(notif);
      const content = notif.title ? `${notif.title}: ${notif.message}` : notif.message;
      toast(content, { duration: 4000, position: 'top-right' });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, addRealtimeNotification]);

  return socketRef.current;
};
