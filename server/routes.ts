import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSimpleAuth, isAuthenticated } from "./simpleAuth";
import { insertFinancialDataSchema, updateFinancialDataSchema } from "@shared/schema";
import { z } from "zod";

// Restrict access to only the authorized user
const AUTHORIZED_USER_ID = "46429020";

const isAuthorizedUser = (req: any, res: any, next: any) => {
  if (!req.session || req.session.userId !== AUTHORIZED_USER_ID) {
    return res.status(403).json({ 
      message: "Access denied. This application is private." 
    });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupSimpleAuth(app);

  // Update user preferences (theme, dark mode)
  app.patch('/api/auth/user', isAuthenticated, isAuthorizedUser, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { theme, darkMode } = req.body;
      
      const updateData: any = {};
      if (theme) updateData.theme = theme;
      if (typeof darkMode === 'boolean') updateData.darkMode = darkMode;
      updateData.updatedAt = new Date();
      
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

  // Get financial data
  app.get('/api/financial-data', isAuthenticated, isAuthorizedUser, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const data = await storage.getFinancialData(userId);
      
      if (!data) {
        // Return default empty financial data
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
          week2ExpenseRows: [],
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

  // Update financial data
  app.put('/api/financial-data', isAuthenticated, isAuthorizedUser, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Validate request body
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

  // Clear all financial data
  app.delete('/api/financial-data', isAuthenticated, isAuthorizedUser, async (req: any, res) => {
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
        week2ExpenseRows: [],
      };
      
      const data = await storage.upsertFinancialData(userId, defaultData);
      res.json(data);
    } catch (error) {
      console.error("Error clearing financial data:", error);
      res.status(500).json({ message: "Failed to clear financial data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
