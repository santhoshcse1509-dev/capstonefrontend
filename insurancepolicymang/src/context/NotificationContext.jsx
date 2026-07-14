import React, { createContext, useState, useCallback } from 'react';
import { generateId } from '../utils/helpers';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification) => {
      const id = generateId();
      const newNotification = {
        id,
        type: 'info',
        duration: 5000,
        ...notification,
      };
      setNotifications((prev) => [...prev, newNotification]);

      if (newNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }

      return id;
    },
    [removeNotification]
  );

  const success = useCallback(
    (message, options = {}) =>
      addNotification({ type: 'success', message, ...options }),
    [addNotification]
  );

  const error = useCallback(
    (message, options = {}) =>
      addNotification({ type: 'error', message, duration: 8000, ...options }),
    [addNotification]
  );

  const warning = useCallback(
    (message, options = {}) =>
      addNotification({ type: 'warning', message, ...options }),
    [addNotification]
  );

  const info = useCallback(
    (message, options = {}) =>
      addNotification({ type: 'info', message, ...options }),
    [addNotification]
  );

  const clearAll = useCallback(() => setNotifications([]), []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        warning,
        info,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
