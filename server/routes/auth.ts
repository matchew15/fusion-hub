import { Router } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Get current user profile
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    res.json(user);
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

// Check auth status
router.get('/status', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user || null
  });
});

export default router;
