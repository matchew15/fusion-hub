import { Router } from 'express';
import { db } from '../db';
import { escrowTransactions, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Get user's transaction history
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const transactions = await db
      .select({
        id: escrowTransactions.id,
        amount: escrowTransactions.amount,
        status: escrowTransactions.status,
        memo: escrowTransactions.memo,
        paymentIdentifier: escrowTransactions.paymentIdentifier,
        createdAt: escrowTransactions.createdAt,
        updatedAt: escrowTransactions.updatedAt,
        disputeStatus: escrowTransactions.disputeStatus,
        disputeReason: escrowTransactions.disputeReason,
        seller: {
          id: users.id,
          username: users.username
        }
      })
      .from(escrowTransactions)
      .leftJoin(users, eq(escrowTransactions.sellerId, users.id))
      .where(eq(escrowTransactions.buyerId, userId))
      .orderBy(desc(escrowTransactions.createdAt));

    res.json({ transactions });
  } catch (error: any) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
});

export default router;
