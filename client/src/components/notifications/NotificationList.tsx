import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistance } from 'date-fns';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  transactionId?: number;
  read: boolean;
  createdAt: string;
}

interface NotificationListProps {
  onNotificationRead?: () => void;
}

export default function NotificationList({ onNotificationRead }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
      );
      onNotificationRead?.();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      notifications.filter(n => !n.read).forEach(() => onNotificationRead?.());
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading notifications...</div>;
  }

  return (
    <div className="mt-4">
      {notifications.length > 0 && (
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="w-full"
          >
            Mark all as read
          </Button>
        </div>
      )}
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.read ? 'bg-background' : 'bg-muted'
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDistance(new Date(notification.createdAt), new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm mt-1">{notification.message}</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
