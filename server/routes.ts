import { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { listings, transactions, chats } from "../db/schema";
import { eq, and } from "drizzle-orm";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Listings routes
  app.get("/api/listings", async (req, res) => {
    const allListings = await db.select().from(listings).where(eq(listings.active, true));
    res.json(allListings);
  });

  app.post("/api/listings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const listing = await db.insert(listings).values({
      ...req.body,
      sellerId: req.user.id,
    }).returning();
    
    res.json(listing[0]);
  });

  // Transactions routes
  app.post("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const transaction = await db.insert(transactions).values({
      ...req.body,
      buyerId: req.user.id,
      status: "pending",
    }).returning();

    res.json(transaction[0]);
  });

  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userTransactions = await db.select()
      .from(transactions)
      .where(
        or(
          eq(transactions.buyerId, req.user.id),
          eq(transactions.sellerId, req.user.id)
        )
      );

    res.json(userTransactions);
  });

  // Chat routes
  app.get("/api/chats/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const messages = await db.select()
      .from(chats)
      .where(
        or(
          and(
            eq(chats.senderId, req.user.id),
            eq(chats.receiverId, parseInt(req.params.userId))
          ),
          and(
            eq(chats.senderId, parseInt(req.params.userId)),
            eq(chats.receiverId, req.user.id)
          )
        )
      )
      .orderBy(chats.createdAt);

    res.json(messages);
  });
}
