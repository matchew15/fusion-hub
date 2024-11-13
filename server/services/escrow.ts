import { db } from '../db';
import { users, escrowTransactions, type EscrowTransaction } from '../db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';
import { piHelper } from '../lib/pi-helper';
import { Decimal } from 'decimal.js';
import { notificationService } from './notifications';

export interface CreateEscrowParams {
  sellerId: number;
  buyerId: number;
  amount: Decimal;
  memo: string;
  releaseConditions: string;
}

export class EscrowService {
  private readonly RELEASE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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
      amount: amount.toString(),
      memo,
      releaseConditions,
      status: 'pending',
      autoReleaseAt: new Date(Date.now() + this.RELEASE_TIMEOUT)
    }).returning();

    // Create notifications for both buyer and seller
    await Promise.all([
      notificationService.createNotification({
        userId: sellerId,
        type: 'transaction_created',
        title: 'New Transaction',
        message: `New escrow transaction created for ${amount} Pi`,
        transactionId: transaction.id
      }),
      notificationService.createNotification({
        userId: buyerId,
        type: 'transaction_created',
        title: 'New Transaction',
        message: `New escrow transaction created for ${amount} Pi`,
        transactionId: transaction.id
      })
    ]);

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

    // Create notifications for status change
    await Promise.all([
      notificationService.createNotification({
        userId: transaction.sellerId,
        type: 'transaction_locked',
        title: 'Funds Locked',
        message: `Funds have been locked in escrow for transaction #${transaction.id}`,
        transactionId: transaction.id
      }),
      notificationService.createNotification({
        userId: transaction.buyerId,
        type: 'transaction_locked',
        title: 'Funds Locked',
        message: `Funds have been locked in escrow for transaction #${transaction.id}`,
        transactionId: transaction.id
      })
    ]);

    return transaction;
  }

  async releaseFunds(transactionId: number, userId: number): Promise<EscrowTransaction> {
    const transaction = await this.processRelease(
      await this.getVerifiedTransaction(transactionId, userId)
    );

    // Create notifications for fund release
    await Promise.all([
      notificationService.createNotification({
        userId: transaction.sellerId,
        type: 'transaction_released',
        title: 'Funds Released',
        message: `Funds have been released for transaction #${transaction.id}`,
        transactionId: transaction.id
      }),
      notificationService.createNotification({
        userId: transaction.buyerId,
        type: 'transaction_released',
        title: 'Funds Released',
        message: `Funds have been released for transaction #${transaction.id}`,
        transactionId: transaction.id
      })
    ]);

    return transaction;
  }

  private async processRelease(transaction: EscrowTransaction): Promise<EscrowTransaction> {
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
      .where(eq(escrowTransactions.id, transaction.id))
      .returning();

    return updatedTransaction;
  }

  private async getVerifiedTransaction(transactionId: number, userId: number): Promise<EscrowTransaction> {
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

    return transaction;
  }

  async checkAndProcessAutoReleases(): Promise<void> {
    try {
      // Get all transactions eligible for auto-release
      const transactions = await db
        .select()
        .from(escrowTransactions)
        .where(
          and(
            eq(escrowTransactions.status, 'locked'),
            lt(escrowTransactions.autoReleaseAt, new Date()),
            sql`dispute_status IS NULL OR dispute_status != 'pending'`
          )
        );

      // Process each transaction
      for (const transaction of transactions) {
        try {
          await this.processRelease(transaction);
          console.info(`Auto-released transaction ${transaction.id}`);
        } catch (error) {
          console.error(`Failed to auto-release transaction ${transaction.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Auto-release process error:', error);
      throw error;
    }
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

    // Create notifications for dispute initiation
    await Promise.all([
      notificationService.createNotification({
        userId: transaction.sellerId,
        type: 'transaction_disputed',
        title: 'Dispute Initiated',
        message: `A dispute has been initiated for transaction #${transaction.id}`,
        transactionId: transaction.id
      }),
      notificationService.createNotification({
        userId: transaction.buyerId,
        type: 'transaction_disputed',
        title: 'Dispute Initiated',
        message: `A dispute has been initiated for transaction #${transaction.id}`,
        transactionId: transaction.id
      })
    ]);

    return updatedTransaction;
  }

  async resolveDispute(
    transactionId: number,
    resolverId: number,
    resolution: 'refund' | 'release',
    notes: string
  ): Promise<EscrowTransaction> {
    const [transaction] = await db
      .select()
      .from(escrowTransactions)
      .where(
        and(
          eq(escrowTransactions.id, transactionId),
          eq(escrowTransactions.status, 'disputed')
        )
      )
      .limit(1);

    if (!transaction) {
      throw new Error('Transaction not found or not in dispute');
    }

    // Verify the payment identifier exists
    if (!transaction.paymentIdentifier) {
      throw new Error('Payment identifier missing');
    }

    try {
      if (resolution === 'refund') {
        // Handle refund through Pi SDK
        await piHelper.cancelPayment(transaction.paymentIdentifier);
        
        // Update transaction status
        const [updatedTransaction] = await db
          .update(escrowTransactions)
          .set({
            status: 'refunded',
            disputeStatus: 'resolved',
            disputeResolutionNotes: notes,
            disputeResolvedBy: resolverId,
            disputeResolvedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(escrowTransactions.id, transactionId))
          .returning();

        // Create notification for dispute resolution - refund
        await Promise.all([
          notificationService.createNotification({
            userId: transaction.sellerId,
            type: 'transaction_refunded',
            title: 'Dispute Resolved',
            message: `Dispute for transaction #${transaction.id} has been resolved with a refund.`,
            transactionId: transaction.id
          }),
          notificationService.createNotification({
            userId: transaction.buyerId,
            type: 'transaction_refunded',
            title: 'Dispute Resolved',
            message: `Dispute for transaction #${transaction.id} has been resolved with a refund.`,
            transactionId: transaction.id
          })
        ]);

        return updatedTransaction;
      } else {
        // Release funds to seller
        await piHelper.completePayment(transaction.paymentIdentifier);
        
        // Update transaction status
        const [updatedTransaction] = await db
          .update(escrowTransactions)
          .set({
            status: 'released',
            disputeStatus: 'resolved',
            disputeResolutionNotes: notes,
            disputeResolvedBy: resolverId,
            disputeResolvedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(escrowTransactions.id, transactionId))
          .returning();

        // Create notification for dispute resolution - release
        await Promise.all([
          notificationService.createNotification({
            userId: transaction.sellerId,
            type: 'transaction_released',
            title: 'Dispute Resolved',
            message: `Dispute for transaction #${transaction.id} has been resolved and funds have been released.`,
            transactionId: transaction.id
          }),
          notificationService.createNotification({
            userId: transaction.buyerId,
            type: 'transaction_released',
            title: 'Dispute Resolved',
            message: `Dispute for transaction #${transaction.id} has been resolved and funds have been released.`,
            transactionId: transaction.id
          })
        ]);

        return updatedTransaction;
      }
    } catch (error) {
      console.error('Dispute resolution error:', error);
      throw new Error('Failed to resolve dispute');
    }
  }

  async getDisputedTransactions(): Promise<EscrowTransaction[]> {
    const transactions = await db
      .select()
      .from(escrowTransactions)
      .where(eq(escrowTransactions.status, 'disputed'))
      .orderBy(escrowTransactions.createdAt);

    return transactions;
  }
}

export const escrowService = new EscrowService();