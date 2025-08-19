var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  financialData: () => financialData,
  financialDataRelations: () => financialDataRelations,
  insertFinancialDataSchema: () => insertFinancialDataSchema,
  sessions: () => sessions,
  updateFinancialDataSchema: () => updateFinancialDataSchema,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  theme: varchar("theme").default("blue"),
  darkMode: boolean("dark_mode").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var financialData = pgTable("financial_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Cash denominations (Australian currency)
  notes100: decimal("notes_100", { precision: 10, scale: 2 }).default("0"),
  notes50: decimal("notes_50", { precision: 10, scale: 2 }).default("0"),
  notes20: decimal("notes_20", { precision: 10, scale: 2 }).default("0"),
  notes10: decimal("notes_10", { precision: 10, scale: 2 }).default("0"),
  notes5: decimal("notes_5", { precision: 10, scale: 2 }).default("0"),
  coins2: decimal("coins_2", { precision: 10, scale: 2 }).default("0"),
  coins1: decimal("coins_1", { precision: 10, scale: 2 }).default("0"),
  coins050: decimal("coins_050", { precision: 10, scale: 2 }).default("0"),
  coins020: decimal("coins_020", { precision: 10, scale: 2 }).default("0"),
  coins010: decimal("coins_010", { precision: 10, scale: 2 }).default("0"),
  coins005: decimal("coins_005", { precision: 10, scale: 2 }).default("0"),
  // Bank accounts data
  bankAccountRows: jsonb("bank_account_rows").default([]),
  // Week 1 data
  week1IncomeRows: jsonb("week1_income_rows").default([]),
  week1ExpenseRows: jsonb("week1_expense_rows").default([]),
  // Week 2 data
  week2IncomeRows: jsonb("week2_income_rows").default([]),
  week2ExpenseRows: jsonb("week2_expense_rows").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var usersRelations = relations(users, ({ one }) => ({
  financialData: one(financialData, {
    fields: [users.id],
    references: [financialData.userId]
  })
}));
var financialDataRelations = relations(financialData, ({ one }) => ({
  user: one(users, {
    fields: [financialData.userId],
    references: [users.id]
  })
}));
var insertFinancialDataSchema = createInsertSchema(financialData).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var updateFinancialDataSchema = insertFinancialDataSchema.partial();

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Financial data operations
  async getFinancialData(userId) {
    const [data] = await db.select().from(financialData).where(eq(financialData.userId, userId));
    return data;
  }
  async createFinancialData(data) {
    const [created] = await db.insert(financialData).values(data).returning();
    return created;
  }
  async updateFinancialData(userId, data) {
    const [updated] = await db.update(financialData).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(financialData.userId, userId)).returning();
    return updated;
  }
  async upsertFinancialData(userId, data) {
    const existing = await this.getFinancialData(userId);
    if (existing) {
      return await this.updateFinancialData(userId, data);
    } else {
      return await this.createFinancialData({ ...data, userId });
    }
  }
};
var storage = new DatabaseStorage();

// server/simpleAuth.ts
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
var scryptAsync = promisify(scrypt);
var ADMIN_USERNAME = "admin";
var AUTHORIZED_USER_ID = "46429020";
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET || "fintrak-secret-key-2025",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      // Set to true in production with HTTPS
      maxAge: sessionTtl
    }
  });
}
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}
async function setupSimpleAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  const ADMIN_PASSWORD_HASH = await hashPassword("fintrak2025");
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      if (username === ADMIN_USERNAME && await comparePasswords(password, ADMIN_PASSWORD_HASH)) {
        req.session.userId = AUTHORIZED_USER_ID;
        req.session.username = username;
        await storage.upsertUser({
          id: AUTHORIZED_USER_ID,
          email: "admin@fintrak.local",
          firstName: "Admin",
          lastName: "User"
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
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password required" });
      }
      if (await comparePasswords(currentPassword, ADMIN_PASSWORD_HASH)) {
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

// server/routes.ts
import { z } from "zod";
var AUTHORIZED_USER_ID2 = "46429020";
var isAuthorizedUser = (req, res, next) => {
  if (!req.session || req.session.userId !== AUTHORIZED_USER_ID2) {
    return res.status(403).json({
      message: "Access denied. This application is private."
    });
  }
  next();
};
async function registerRoutes(app2) {
  await setupSimpleAuth(app2);
  app2.patch("/api/auth/user", isAuthenticated, isAuthorizedUser, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { theme, darkMode } = req.body;
      const updateData = {};
      if (theme) updateData.theme = theme;
      if (typeof darkMode === "boolean") updateData.darkMode = darkMode;
      updateData.updatedAt = /* @__PURE__ */ new Date();
      const user = await storage.upsertUser({
        id: userId,
        ...updateData
      });
      res.json(user);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });
  app2.get("/api/financial-data", isAuthenticated, isAuthorizedUser, async (req, res) => {
    try {
      const userId = req.session.userId;
      const data = await storage.getFinancialData(userId);
      if (!data) {
        const defaultData = {
          userId,
          notes100: "0",
          notes50: "0",
          notes20: "0",
          notes10: "0",
          notes5: "0",
          coins2: "0",
          coins1: "0",
          coins050: "0",
          coins020: "0",
          coins010: "0",
          coins005: "0",
          bankAccountRows: [],
          week1IncomeRows: [],
          week1ExpenseRows: [],
          week2IncomeRows: [],
          week2ExpenseRows: []
        };
        res.json(defaultData);
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
      res.status(500).json({ message: "Failed to fetch financial data" });
    }
  });
  app2.put("/api/financial-data", isAuthenticated, isAuthorizedUser, async (req, res) => {
    try {
      const userId = req.session.userId;
      const validatedData = updateFinancialDataSchema.parse(req.body);
      const data = await storage.upsertFinancialData(userId, validatedData);
      res.json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        console.error("Error updating financial data:", error);
        res.status(500).json({ message: "Failed to update financial data" });
      }
    }
  });
  app2.delete("/api/financial-data", isAuthenticated, isAuthorizedUser, async (req, res) => {
    try {
      const userId = req.session.userId;
      const defaultData = {
        notes100: "0",
        notes50: "0",
        notes20: "0",
        notes10: "0",
        notes5: "0",
        coins2: "0",
        coins1: "0",
        coins050: "0",
        coins020: "0",
        coins010: "0",
        coins005: "0",
        bankAccountRows: [],
        week1IncomeRows: [],
        week1ExpenseRows: [],
        week2IncomeRows: [],
        week2ExpenseRows: []
      };
      const data = await storage.upsertFinancialData(userId, defaultData);
      res.json(data);
    } catch (error) {
      console.error("Error clearing financial data:", error);
      res.status(500).json({ message: "Failed to clear financial data" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
