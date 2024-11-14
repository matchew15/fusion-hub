import { Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { listings, transactions, chats, users } from "../db/schema";
import { eq, and, or, ilike, sql } from "drizzle-orm";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Add a public route for initial auth check
  app.get("/api/auth-check", (req, res) => {
    res.json({ authenticated: req.isAuthenticated() });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).json({ message: "Unauthorized" });
  });

  // Enhanced listings route with filters
  app.get("/api/listings", async (req, res) => {
    try {
      const { search, type, location, hashtags } = req.query;
      let query = db.select().from(listings).where(eq(listings.active, true));

      // Apply filters if provided
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(listings.title, `%${search}%`),
            ilike(listings.description, `%${search}%`)
          )
        );
      }

      if (type && type !== 'all') {
        conditions.push(eq(listings.type, type as string));
      }

      if (location) {
        conditions.push(ilike(listings.location, `%${location}%`));
      }

      if (hashtags) {
        const hashtagArray = typeof hashtags === 'string' 
          ? hashtags.split(',').filter(Boolean)
          : Array.isArray(hashtags) 
            ? hashtags.filter(Boolean)
            : [];
            
        if (hashtagArray.length > 0) {
          conditions.push(
            sql`${listings.hashtags} && ${sql.array(hashtagArray, 'text')}`
          );
        }
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const filteredListings = await query;
      res.json(filteredListings);
    } catch (error: any) {
      console.error("Failed to fetch listings:", error);
      res.status(500).json({ 
        message: "Failed to fetch listings",
        details: error.message 
      });
    }
  });

  app.post("/api/listings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const listing = await db.insert(listings).values({
        ...req.body,
        sellerId: req.user.id,
      }).returning();
      
      res.json(listing[0]);
    } catch (error: any) {
      console.error("Failed to create listing:", error);
      res.status(500).json({ 
        message: "Failed to create listing",
        details: error.message 
      });
    }
  });

  // Delete endpoint for listings
  app.delete("/api/listings/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, parseInt(req.params.id)))
        .limit(1);

      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.sellerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this listing" });
      }

      await db
        .update(listings)
        .set({ active: false })
        .where(eq(listings.id, parseInt(req.params.id)));

      res.json({ message: "Listing deleted successfully" });
    } catch (error: any) {
      console.error("Failed to delete listing:", error);
      res.status(500).json({ 
        message: "Failed to delete listing",
        details: error.message 
      });
    }
  });

  // Users route for chat
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  });

  app.get("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(req.params.id)))
      .limit(1);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
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
  app.post("/api/chats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const chat = await db.insert(chats).values({
      ...req.body,
      senderId: req.user.id,
    }).returning();

    res.json(chat[0]);
  });

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
