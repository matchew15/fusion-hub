import { pgTable, text, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  piWalletAddress: text("pi_wallet_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const listings = pgTable("listings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sellerId: integer("seller_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  listingId: integer("listing_id").references(() => listings.id),
  buyerId: integer("buyer_id").references(() => users.id),
  sellerId: integer("seller_id").references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // pending, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertListingSchema = createInsertSchema(listings);
export const selectListingSchema = createSelectSchema(listings);
export const insertChatSchema = createInsertSchema(chats);
export const selectChatSchema = createSelectSchema(chats);
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

// Types
export type User = z.infer<typeof selectUserSchema>;
export type Listing = z.infer<typeof selectListingSchema>;
export type Chat = z.infer<typeof selectChatSchema>;
export type Transaction = z.infer<typeof selectTransactionSchema>;