import { pgTable, text, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  piUid: text("pi_uid").unique(), // Pi Network unique identifier
  piAccessToken: text("pi_access_token"), // Pi Network access token
  piWalletAddress: text("pi_wallet_address"),
  whatsappNumber: text("whatsapp_number"), // Added WhatsApp number field
  createdAt: timestamp("created_at").defaultNow(),
});

export const listings = pgTable("listings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sellerId: integer("seller_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  buyPrice: decimal("buy_price", { precision: 10, scale: 2 }), // Optional buy price for requests
  type: text("type").notNull(), // "Product", "Service", or "Request"
  hashtags: text("hashtags").array(), // Array of hashtags
  image: text("image").notNull(),
  location: text("location"),
  whatsappNumber: text("whatsapp_number"), // Added WhatsApp number field for direct contact
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
export const insertUserSchema = createInsertSchema(users, {
  piUid: z.string().optional(),
  piAccessToken: z.string().optional(),
  piWalletAddress: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

export const selectUserSchema = createSelectSchema(users);

export const insertListingSchema = createInsertSchema(listings, {
  price: z.number().min(0).multipleOf(0.01),
  buyPrice: z.number().min(0).multipleOf(0.01).optional(),
  type: z.enum(["Product", "Service", "Request"]),
  hashtags: z.array(z.string()).default([]),
  image: z.string().startsWith("data:image/").min(1),
  location: z.string().min(1, "Location is required"),
  whatsappNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid WhatsApp number").optional(),
});

export const selectListingSchema = createSelectSchema(listings);
export const insertChatSchema = createInsertSchema(chats);
export const selectChatSchema = createSelectSchema(chats);
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

// Types
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Listing = z.infer<typeof selectListingSchema>;
export type Chat = z.infer<typeof selectChatSchema>;
export type Transaction = z.infer<typeof selectTransactionSchema>;
