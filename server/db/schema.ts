import { pgTable, text, timestamp, numeric, pgEnum, serial, integer, boolean, decimal } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', [
  'active',
  'inactive',
  'suspended',
  'unverified'
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  piUid: text('pi_uid').notNull().unique(),
  piAccessToken: text('pi_access_token').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('5.00'),
  status: userStatusEnum('status').notNull().default('unverified'),
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

export const notificationTypeEnum = pgEnum('notification_type', [
  'transaction_created',
  'transaction_locked',
  'transaction_released',
  'transaction_disputed',
  'transaction_refunded',
  'dispute_resolved'
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

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  transactionId: integer('transaction_id').references(() => escrowTransactions.id),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

export type User = typeof users.$inferSelect;
export type EscrowTransaction = typeof escrowTransactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
