import passport from "passport";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { users, insertUserSchema, type User as SelectUser } from "db/schema";
import { db } from "db";
import { eq } from "drizzle-orm";

// extend express user object with our schema
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "porygon-supremacy",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 86400000, // 24 hours
      httpOnly: true,
    },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: true,
      sameSite: 'none'
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Pi Network Authentication
  app.post("/pi-auth", async (req, res) => {
    try {
      const { piUid, accessToken, username } = req.body;

      if (!piUid || !username) {
        return res.status(400).json({ message: "Missing required Pi auth data" });
      }

      // Check if user exists by Pi UID
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.piUid, piUid))
        .limit(1);

      if (!user) {
        // Create new user if not exists
        const [newUser] = await db
          .insert(users)
          .values({
            username,
            piUid,
            piAccessToken: accessToken,
          })
          .returning();
        user = newUser;
      } else {
        // Update access token if user exists
        const [updatedUser] = await db
          .update(users)
          .set({ piAccessToken: accessToken })
          .where(eq(users.id, user.id))
          .returning();
        user = updatedUser;
      }

      // Log the user in
      return new Promise<void>((resolve, reject) => {
        req.login(user, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }).then(() => {
        res.json({
          message: "Authentication successful",
          user: {
            id: user.id,
            username: user.username,
            piUid: user.piUid,
          },
        });
      }).catch(() => {
        res.status(500).json({ message: "Login failed" });
      });
    } catch (error: any) {
      console.error("Pi auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Public route for checking authentication status
  app.get("/api/auth-status", (req, res) => {
    res.json({ 
      authenticated: req.isAuthenticated(),
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        piUid: req.user.piUid
      } : null
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).json({ message: "Unauthorized" });
  });
}
