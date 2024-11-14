import passport from "passport";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { users, insertUserSchema, type User as SelectUser } from "db/schema";
import { db } from "db";
import { eq } from "drizzle-orm";
import { z } from "zod";

// extend express user object with our schema
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Validation schema for Pi Network authentication
const piAuthSchema = z.object({
  uid: z.string().min(1, "Pi UID is required"),
  accessToken: z.string().min(1, "Access token is required"),
});

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
      
      if (!user) {
        return done(new Error("User not found"));
      }
      
      done(null, user);
    } catch (err) {
      console.error("User deserialization error:", err);
      done(err);
    }
  });

  // Pi Network Authentication endpoint
  app.post("/api/auth/pi", async (req, res) => {
    try {
      // Validate request body
      const validationResult = piAuthSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Invalid authentication data",
          errors: validationResult.error.errors
        });
      }

      const { uid, accessToken } = validationResult.data;

      // Check if user exists by Pi UID
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.piUid, uid))
        .limit(1);

      if (!user) {
        // Create new user
        try {
          const [newUser] = await db
            .insert(users)
            .values({
              username: `user_${uid.slice(-6)}`, // Generate temporary username
              piUid: uid,
              piAccessToken: accessToken,
              status: 'active'
            })
            .returning();
          
          console.info("New user created:", { id: newUser.id, username: newUser.username });
          user = newUser;
        } catch (error: any) {
          console.error("User creation error:", error);
          throw error;
        }
      } else {
        // Update access token if user exists
        try {
          const [updatedUser] = await db
            .update(users)
            .set({ 
              piAccessToken: accessToken,
              status: 'active'
            })
            .where(eq(users.id, user.id))
            .returning();
          user = updatedUser;
        } catch (error: any) {
          console.error("User update error:", error);
          throw error;
        }
      }

      // Log the user in
      return new Promise<void>((resolve, reject) => {
        req.login(user, (err) => {
          if (err) {
            console.error("Login error:", err);
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
            status: user.status
          },
        });
      }).catch((error) => {
        console.error("Authentication error:", error);
        res.status(500).json({ 
          message: "Login failed",
          code: "LOGIN_ERROR"
        });
      });
    } catch (error: any) {
      console.error("Pi auth error:", error);
      res.status(500).json({ 
        message: "Authentication failed",
        code: error.code || "AUTH_ERROR",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ 
          message: "Logout failed",
          code: "LOGOUT_ERROR"
        });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Public route for checking authentication status
  app.get("/api/auth/status", (req, res) => {
    res.json({ 
      authenticated: req.isAuthenticated(),
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        piUid: req.user.piUid,
        status: req.user.status
      } : null
    });
  });
}
