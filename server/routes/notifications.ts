import { Router, Response } from 'express';
import { db } from '../services/dbStore.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Get notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await db.getNotificationsByUser(req.user!.id);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching notifications' });
  }
});

// Mark single notification read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const success = await db.markNotificationRead(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error marking notification read' });
  }
});

// Mark all read
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.markAllNotificationsRead(req.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error marking all read' });
  }
});

export default router;
