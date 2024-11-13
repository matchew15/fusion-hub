import { Router } from 'express';
import { z } from 'zod';
import { escrowService } from '../services/escrow';
import { authenticateUser } from '../middleware/auth';
import { piHelper } from '../lib/pi-helper';

const router = Router();

// Validation schemas
const createEscrowSchema = z.object({
  sellerId: z.number(),
  amount: z.number().positive(),
  memo: z.string(),
  releaseConditions: z.string()
});

const disputeSchema = z.object({
  reason: z.string().min(10)
});

const resolveDisputeSchema = z.object({
  resolution: z.enum(['refund', 'release']),
  notes: z.string().min(10)
});

// Create escrow transaction
router.post('/transactions', authenticateUser, async (req, res) => {
  try {
    const validation = createEscrowSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid request data',
        errors: validation.error.errors
      });
    }

    const { sellerId, amount, memo, releaseConditions } = validation.data;
    
    const transaction = await escrowService.createTransaction({
      sellerId,
      buyerId: req.user!.id,
      amount,
      memo,
      releaseConditions
    });

    const payment = await piHelper.createPayment({
      amount: transaction.amount,
      memo: transaction.memo,
      metadata: { 
        transactionId: transaction.id,
        type: 'escrow'
      }
    });

    const lockedTransaction = await escrowService.lockFunds(
      transaction.id,
      payment.identifier!
    );

    res.json({
      message: 'Escrow transaction created',
      transaction: lockedTransaction,
      payment
    });
  } catch (error: any) {
    console.error('Create escrow error:', error);
    res.status(500).json({
      message: 'Failed to create escrow transaction',
      error: error.message
    });
  }
});

// Release funds from escrow
router.post('/transactions/:id/release', authenticateUser, async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    
    const transaction = await escrowService.releaseFunds(
      transactionId,
      req.user!.id
    );

    res.json({
      message: 'Funds released successfully',
      transaction
    });
  } catch (error: any) {
    console.error('Release funds error:', error);
    res.status(500).json({
      message: 'Failed to release funds',
      error: error.message
    });
  }
});

// Initiate dispute
router.post('/transactions/:id/dispute', authenticateUser, async (req, res) => {
  try {
    const validation = disputeSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid dispute reason',
        errors: validation.error.errors
      });
    }

    const transactionId = parseInt(req.params.id);
    const { reason } = validation.data;

    const transaction = await escrowService.initiateDispute(
      transactionId,
      req.user!.id,
      reason
    );

    res.json({
      message: 'Dispute initiated successfully',
      transaction
    });
  } catch (error: any) {
    console.error('Initiate dispute error:', error);
    res.status(500).json({
      message: 'Failed to initiate dispute',
      error: error.message
    });
  }
});

// Resolve dispute
router.post('/transactions/:id/resolve-dispute', authenticateUser, async (req, res) => {
  try {
    const validation = resolveDisputeSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        message: 'Invalid resolution data',
        errors: validation.error.errors
      });
    }

    const transactionId = parseInt(req.params.id);
    const { resolution, notes } = validation.data;

    const transaction = await escrowService.resolveDispute(
      transactionId,
      req.user!.id,
      resolution,
      notes
    );

    res.json({
      message: 'Dispute resolved successfully',
      transaction
    });
  } catch (error: any) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      message: 'Failed to resolve dispute',
      error: error.message
    });
  }
});

// Get disputed transactions
router.get('/disputed-transactions', authenticateUser, async (req, res) => {
  try {
    const transactions = await escrowService.getDisputedTransactions();
    res.json({ transactions });
  } catch (error: any) {
    console.error('Get disputed transactions error:', error);
    res.status(500).json({
      message: 'Failed to get disputed transactions',
      error: error.message
    });
  }
});

export default router;
