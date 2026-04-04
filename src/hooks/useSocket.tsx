import { createElement, useEffect, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import api from '../api';

export const useSocket = (onNewNotification: (n: Notification) => void) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const socketUrl = useMemo(() => {
    const envUrl = process.env.REACT_APP_SOCKET_URL;
    if (envUrl) return envUrl;
    if (window.location.hostname === 'localhost') return 'http://localhost:5000';
    return window.location.origin;
  }, []);

  const renderToast = (
    t: { visible: boolean },
    notification: Notification,
    variant: 'direct' | 'broadcast'
  ) =>
    createElement(
      'div',
      { className: `toast-${variant} ${t.visible ? 'animate-in' : 'animate-out'}` },
      createElement(
        'div',
        null,
        createElement('strong', null, notification.title),
        createElement('p', null, notification.message)
      )
    );

  useEffect(() => {
    if (!user?._id) return;

    const socket = io(socketUrl, { transports: ['websocket'] });
    socketRef.current = socket;

    const register = () => socket.emit('register_user', user._id);

    socket.on('connect', register);
    socket.io.on('reconnect', register);

    socket.on('new_notification', (notification: Notification) => {
      if (notification.sender._id === user._id) return;

      if (notification.type === 'direct') {
        onNewNotification(notification);
      } else if (notification.type === 'toast') {
        onNewNotification(notification);
        toast.custom((t) => renderToast(t, notification, 'broadcast'), { duration: 6000 });
        api.patch(`/notifications/${notification._id}/toast-shown`).catch(() => {});
      }
    });

    return () => {
      socket.off('connect', register);
      socket.io.off('reconnect', register);
      socket.off('new_notification');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onNewNotification, socketUrl, user?._id]);

  return socketRef;
};

