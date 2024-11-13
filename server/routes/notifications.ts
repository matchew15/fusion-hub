import { Router } from 'express';
import { notificationService } from '../services/notifications';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Get user's notifications
router.get('/', authenticateUser, async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user!.id);
    res.json({ notifications });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Get unread count
router.get('/unread-count', authenticateUser, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ count });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

// Mark notification as read
router.post('/:id/read', authenticateUser, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      parseInt(req.params.id),
      req.user!.id
    );

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    res.json({ notification });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.post('/mark-all-read', authenticateUser, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

export default router;
