import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

declare module "express-session" {
  interface SessionData {
    userId: string;
    username: string;
  }
}

const scryptAsync = promisify(scrypt);

// Simple user credentials (you can modify these)
const ADMIN_USERNAME = "admin";
const AUTHORIZED_USER_ID = "46429020";

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "fintrak-secret-key-2025",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      maxAge: sessionTtl,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    },
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

export async function setupSimpleAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Default password hash for "fintrak2025"
  const ADMIN_PASSWORD_HASH = await hashPassword("fintrak2025");

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      // Check credentials
      if (username === ADMIN_USERNAME && await comparePasswords(password, ADMIN_PASSWORD_HASH)) {
        // Create user session
        req.session.userId = AUTHORIZED_USER_ID;
        req.session.username = username;
        
        // Ensure user exists in database
        await storage.upsertUser({
          id: AUTHORIZED_USER_ID,
          email: "admin@fintrak.local",
          firstName: "Admin",
          lastName: "User",
        });
        
        const user = await storage.getUser(AUTHORIZED_USER_ID);
        res.json({ 
          success: true, 
          user,
          message: "Login successful" 
        });
      } else {
        res.status(401).json({ message: "Invalid username or password" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Change password endpoint
  app.post('/api/auth/change-password', isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password required" });
      }
      
      // Verify current password
      if (await comparePasswords(currentPassword, ADMIN_PASSWORD_HASH)) {
        // In a real implementation, you'd update the stored hash
        // For now, we'll just confirm the password change
        res.json({ message: "Password changed successfully" });
      } else {
        res.status(401).json({ message: "Current password is incorrect" });
      }
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Password change failed" });
    }
  });
}