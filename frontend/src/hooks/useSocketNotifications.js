import { useEffect, useState, useCallback, useMemo } from 'react';
import socket from '../services/socket';

const DEFAULT_NOTIFICATION_EVENTS = [
  'appointment-updated',
  'appointment-approved',
  'new-pharmacy-order',
  'pharmacy-order-updated',
  'delivery-assigned',
  'delivery-status-updated',
  'inventory-updated',
  'blockchain-record-verified',
  'slot-booked',
  'new-appointment-received',
  'appointment-reassigned',
  'new-lab-order-received',
  'lab-report-uploaded'
];

const normalizeEventList = (events) => {
  const merged = [...DEFAULT_NOTIFICATION_EVENTS, ...(events || [])];
  return Array.from(new Set(merged));
};

export const useSocketNotifications = ({ userId, hospitalName, extraEvents = [] } = {}) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [connected, setConnected] = useState(false);

  const handleNotification = useCallback(() => {
    setNotificationCount((count) => count + 1);
  }, []);

  const handleConnect = useCallback(() => {
    setConnected(true);
    if (userId) {
      socket.emit('join-room', String(userId));
    }
    socket.emit('join-hospital-room', hospitalName || 'General');
  }, [hospitalName, userId]);

  const events = useMemo(() => normalizeEventList(extraEvents), [extraEvents]);

  useEffect(() => {
    if (!userId) return undefined;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join-room', String(userId));
    socket.emit('join-hospital-room', hospitalName || 'General');
    socket.on('connect', handleConnect);

    events.forEach((eventName) => {
      socket.on(eventName, handleNotification);
    });

    return () => {
      socket.off('connect', handleConnect);
      events.forEach((eventName) => {
        socket.off(eventName, handleNotification);
      });
    };
  }, [userId, hospitalName, events, handleConnect, handleNotification]);

  const resetNotifications = useCallback(() => setNotificationCount(0), []);

  return [notificationCount, resetNotifications, connected];
};
