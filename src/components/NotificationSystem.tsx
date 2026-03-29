import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../store/settingsStore';
import { useGameStore } from '../store/gameStore';
import type { Language } from '../types/game.types';

export type NotificationType = 'urgent' | 'important' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    route: string;
  };
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationBanner: React.FC<{
  notification: Notification;
  onDismiss: () => void;
  onAction: () => void;
}> = ({ notification, onDismiss, onAction }) => {
  const bgColors = {
    urgent: 'bg-danger-500',
    important: 'bg-amber-500',
    info: 'bg-field-500',
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className={`${bgColors[notification.type]} text-white p-4 shadow-lg`}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <p className="font-body font-semibold">{notification.title}</p>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
        <div className="flex items-center gap-2">
          {notification.action && (
            <button
              onClick={onAction}
              className="px-4 py-2 bg-white/20 rounded-lg font-body text-sm hover:bg-white/30"
            >
              {notification.action.label}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-white/20 rounded-full"
          >
            ✕
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const NotificationTray: React.FC<NotificationSystemProps> = ({
  notifications,
  onDismiss,
  onMarkRead,
  onMarkAllRead,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const typeIcons = {
    urgent: '🔴',
    important: '🟠',
    info: '🟢',
  };

  return (
    <>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-soil-100 rounded-full"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Tray */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-soil-200 z-50"
          >
            <div className="p-4 border-b border-soil-100 flex items-center justify-between">
              <h3 className="font-body font-semibold text-soil-900">सूचनाएँ</h3>
              <button
                onClick={onMarkAllRead}
                className="text-sm text-field-600 hover:text-field-700"
              >
                सब पढ़ा
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-center text-soil-500 font-body">कोई सूचना नहीं</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-soil-100 ${notification.read ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span>{typeIcons[notification.type]}</span>
                      <div className="flex-1">
                        <p className="font-body font-semibold text-sm text-soil-900">
                          {notification.title}
                        </p>
                        <p className="font-body text-xs text-soil-600">
                          {notification.message}
                        </p>
                        <p className="text-xs text-soil-400 mt-1">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {!notification.read && (
                        <button
                          onClick={() => onMarkRead(notification.id)}
                          className="text-xs text-field-600"
                        >
                          ✓ पढ़ा
                        </button>
                      )}
                      <button
                        onClick={() => onDismiss(notification.id)}
                        className="text-xs text-danger-600"
                      >
                        हटाओ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { notifications: notificationsEnabled } = useSettingsStore();
  const { gameState } = useGameStore();

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!notificationsEnabled) return;
    
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 20));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Check for urgent notifications
  React.useEffect(() => {
    if (!gameState || !notificationsEnabled) return;

    // PMFBY cutoff warning
    if (gameState.weekNumber === 3 && !gameState.pmfbyEnrolled) {
      addNotification({
        type: 'urgent',
        title: '⚠️ बीमे की आखिरी तारीख!',
        message: 'PMFBY के लिए आज आखिरी दिन है',
        action: { label: 'बीमा करो', route: '/insurance' },
      });
    }

    // Debt overdue
    const overdueDebt = gameState.debtBreakdown?.find(d => d.dueWeek <= gameState.weekNumber);
    if (overdueDebt) {
      addNotification({
        type: 'urgent',
        title: '⚠️ कर्ज़ की तारीख निकली!',
        message: `₹${overdueDebt.amount} चुकाना है`,
        action: { label: 'चुकाओ', route: '/credit' },
      });
    }

    // High stress
    if (gameState.stressLevel > 90) {
      addNotification({
        type: 'urgent',
        title: '⚠️ तनाव बहुत ज़्यादा है!',
        message: 'सही फैसला लेना मुश्किल होगा',
      });
    }

    // PMFBY cutoff in 2 weeks
    if (gameState.weekNumber === 2 && !gameState.pmfbyEnrolled) {
      addNotification({
        type: 'important',
        title: '⏰ बीमा का समय निकल रहा है',
        message: 'PMFBY के लिए 1 हफ्ता बचा है',
        action: { label: 'अभी करो', route: '/insurance' },
      });
    }
  }, [gameState, notificationsEnabled]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    markAsRead,
    markAllAsRead,
  };
};

export default NotificationTray;
