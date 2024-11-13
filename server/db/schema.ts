import { pgTable, text, timestamp, numeric, pgEnum, serial } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  piUid: text('pi_uid').notNull().unique(),
  piAccessToken: text('pi_access_token').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'locked',
  'released',
  'disputed',
  'refunded',
  'cancelled'
]);

export const disputeStatusEnum = pgEnum('dispute_status', [
  'pending',
  'resolved',
  'cancelled'
]);

export const escrowTransactions = pgTable('escrow_transactions', {
  id: serial('id').primaryKey(),
  sellerId: serial('seller_id').references(() => users.id),
  buyerId: serial('buyer_id').references(() => users.id),
  amount: numeric('amount', { precision: 10, scale: 6 }).notNull(),
  status: transactionStatusEnum('status').notNull().default('pending'),
  paymentIdentifier: text('payment_identifier'),
  memo: text('memo').notNull(),
  releaseConditions: text('release_conditions').notNull(),
  autoReleaseAt: timestamp('auto_release_at'),
  disputeReason: text('dispute_reason'),
  disputeStatus: disputeStatusEnum('dispute_status'),
  disputeResolutionNotes: text('dispute_resolution_notes'),
  disputeResolvedBy: serial('dispute_resolved_by').references(() => users.id),
  disputeResolvedAt: timestamp('dispute_resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type User = typeof users.$inferSelect;
export type EscrowTransaction = typeof escrowTransactions.$inferSelect;
