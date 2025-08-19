import {
  users,
  financialData,
  type User,
  type UpsertUser,
  type FinancialData,
  type InsertFinancialData,
  type UpdateFinancialData,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Financial data operations
  getFinancialData(userId: string): Promise<FinancialData | undefined>;
  createFinancialData(data: InsertFinancialData): Promise<FinancialData>;
  updateFinancialData(userId: string, data: UpdateFinancialData): Promise<FinancialData>;
  upsertFinancialData(userId: string, data: UpdateFinancialData): Promise<FinancialData>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Financial data operations
  async getFinancialData(userId: string): Promise<FinancialData | undefined> {
    const [data] = await db
      .select()
      .from(financialData)
      .where(eq(financialData.userId, userId));
    return data;
  }

  async createFinancialData(data: InsertFinancialData): Promise<FinancialData> {
    const [created] = await db
      .insert(financialData)
      .values(data)
      .returning();
    return created;
  }

  async updateFinancialData(userId: string, data: UpdateFinancialData): Promise<FinancialData> {
    const [updated] = await db
      .update(financialData)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(financialData.userId, userId))
      .returning();
    return updated;
  }

  async upsertFinancialData(userId: string, data: UpdateFinancialData): Promise<FinancialData> {
    const existing = await this.getFinancialData(userId);
    
    if (existing) {
      return await this.updateFinancialData(userId, data);
    } else {
      return await this.createFinancialData({ ...data, userId } as InsertFinancialData);
    }
  }
}

export const storage = new DatabaseStorage();
