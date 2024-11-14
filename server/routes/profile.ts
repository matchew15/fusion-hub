import { Router } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const updateProfileSchema = z.object({
  username: z.string().min(3),
  bio: z.string().max(500).optional(),
  whatsappNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  avatar: z.string().url().optional(),
});

router.put('/', authenticateUser, async (req, res) => {
  try {
    const validation = updateProfileSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid profile data',
        errors: validation.error.errors
      });
    }

    const { username, bio, whatsappNumber, avatar } = validation.data;

    // Check if username is already taken by another user
    if (username !== req.user!.username) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(409).json({
          message: 'Username is already taken'
        });
      }
    }

    // Update user profile
    const [updatedUser] = await db
      .update(users)
      .set({
        username,
        bio,
        whatsappNumber,
        avatar,
        status: 'active', // Set status to active after profile completion
      })
      .where(eq(users.id, req.user!.id))
      .returning();

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

export default router;
