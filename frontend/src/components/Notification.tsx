import React from 'react';
import { Notification as NotificationType } from '../types';

interface NotificationProps {
  notification: NotificationType | null;
}

export const Notification: React.FC<NotificationProps> = ({ notification }) => {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}
    >
      {notification.message}
    </div>
  );
}; 