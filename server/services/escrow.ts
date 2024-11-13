import { db } from '../db';
import { users, escrowTransactions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { piHelper } from '../lib/pi-helper';

export interface CreateEscrowParams {
  sellerId: number;
  buyerId: number;
  amount: number;
  memo: string;
  releaseConditions: string;
}

export interface EscrowTransaction {
  id: number;
  sellerId: number;
  buyerId: number;
  amount: number;
  status: 'pending' | 'locked' | 'released' | 'disputed' | 'refunded' | 'cancelled';
  paymentIdentifier?: string;
  memo: string;
  releaseConditions: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EscrowService {
  async createTransaction(params: CreateEscrowParams): Promise<EscrowTransaction> {
    const { sellerId, buyerId, amount, memo, releaseConditions } = params;
    
    // Validate users exist
    const [seller, buyer] = await Promise.all([
      db.select().from(users).where(eq(users.id, sellerId)).limit(1),
      db.select().from(users).where(eq(users.id, buyerId)).limit(1)
    ]);

    if (!seller[0] || !buyer[0]) {
      throw new Error('Invalid seller or buyer ID');
    }

    // Create escrow transaction
    const [transaction] = await db.insert(escrowTransactions).values({
      sellerId,
      buyerId,
      amount,
      memo,
      releaseConditions,
      status: 'pending'
    }).returning();

    return transaction;
  }

  async lockFunds(transactionId: number, paymentIdentifier: string): Promise<EscrowTransaction> {
    const [transaction] = await db
      .update(escrowTransactions)
      .set({ 
        status: 'locked',
        paymentIdentifier,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(escrowTransactions.id, transactionId),
          eq(escrowTransactions.status, 'pending')
        )
      )
      .returning();

    if (!transaction) {
      throw new Error('Transaction not found or already processed');
    }

    return transaction;
  }

  async releaseFunds(transactionId: number, userId: number): Promise<EscrowTransaction> {
    // Verify user is the seller
    const [transaction] = await db
      .select()
      .from(escrowTransactions)
      .where(
        and(
          eq(escrowTransactions.id, transactionId),
          eq(escrowTransactions.sellerId, userId),
          eq(escrowTransactions.status, 'locked')
        )
      )
      .limit(1);

    if (!transaction) {
      throw new Error('Transaction not found or unauthorized');
    }

    // Release funds through Pi SDK
    if (!transaction.paymentIdentifier) {
      throw new Error('Payment identifier missing');
    }
    
    await piHelper.completePayment(transaction.paymentIdentifier);

    // Update transaction status
    const [updatedTransaction] = await db
      .update(escrowTransactions)
      .set({ 
        status: 'released',
        updatedAt: new Date()
      })
      .where(eq(escrowTransactions.id, transactionId))
      .returning();

    return updatedTransaction;
  }

  async initiateDispute(
    transactionId: number,
    userId: number,
    reason: string
  ): Promise<EscrowTransaction> {
    // Verify user is buyer or seller
    const [transaction] = await db
      .select()
      .from(escrowTransactions)
      .where(
        and(
          eq(escrowTransactions.id, transactionId),
          eq(escrowTransactions.status, 'locked')
        )
      )
      .limit(1);

    if (!transaction) {
      throw new Error('Transaction not found or invalid status');
    }

    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new Error('Unauthorized to initiate dispute');
    }

    // Update transaction status
    const [updatedTransaction] = await db
      .update(escrowTransactions)
      .set({ 
        status: 'disputed',
        disputeReason: reason,
        disputeStatus: 'pending',
        updatedAt: new Date()
      })
      .where(eq(escrowTransactions.id, transactionId))
      .returning();

    return updatedTransaction;
  }
}

export const escrowService = new EscrowService();
