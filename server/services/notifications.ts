import { db } from '../db';
import { notifications, type Notification } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export class NotificationService {
  async createNotification({
    userId,
    type,
    title,
    message,
    transactionId
  }: {
    userId: number;
    type: Notification['type'];
    title: string;
    message: string;
    transactionId?: number;
  }): Promise<Notification> {
    const [notification] = await db.insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        transactionId,
        read: false
      })
      .returning();

    return notification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.createdAt);
  }

  async markAsRead(notificationId: number, userId: number): Promise<Notification | null> {
    const [notification] = await db.update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();

    return notification || null;
  }

  async markAllAsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadCount(userId: number): Promise<number> {
    const result = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    
    return result.length;
  }
}

export const notificationService = new NotificationService();
