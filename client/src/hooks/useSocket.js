import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

let sharedSocket = null;
let currentToken = null;

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const addRealtimeNotification = useNotificationStore((state) => state.addRealtimeNotification);
  const [socket, setSocket] = useState(() => sharedSocket);

  useEffect(() => {
    if (!token) {
      if (sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        currentToken = null;
        setSocket(null);
      }
      return;
    }

    // If token changed or socket disconnected, create new connection
    if (!sharedSocket || currentToken !== token) {
      if (sharedSocket) {
        sharedSocket.disconnect();
      }

      const socketUrl =
        import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
          ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
          : window.location.origin;

      sharedSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      currentToken = token;

      sharedSocket.on('notification:new', (notif) => {
        addRealtimeNotification(notif);
        const content = notif.title ? `${notif.title}: ${notif.message}` : notif.message;
        toast(content, { duration: 4000, position: 'top-right' });
      });
    }

    setSocket(sharedSocket);

    const onConnect = () => setSocket(sharedSocket);
    sharedSocket.on('connect', onConnect);

    return () => {
      if (sharedSocket) {
        sharedSocket.off('connect', onConnect);
      }
    };
  }, [token, addRealtimeNotification]);

  return socket;
};
