import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  theme: varchar("theme").default("blue"),
  darkMode: boolean("dark_mode").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial data storage
export const financialData = pgTable("financial_data", {
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
  // Additional weeks data
  additionalWeeks: jsonb("additional_weeks").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory batches table for tracking different batches of products
export const inventoryBatches = pgTable("inventory_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  batchName: varchar("batch_name").notNull(), // e.g., "Chocolate Cakes - Batch 1"
  productName: varchar("product_name").notNull(), // e.g., "Chocolate Cake"
  totalPricePaid: decimal("total_price_paid", { precision: 10, scale: 2 }).notNull(),
  numberOfUnits: integer("number_of_units").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(), // auto-calculated
  projectedSaleCostPerUnit: decimal("projected_sale_cost_per_unit", { precision: 10, scale: 2 }).notNull().default("0"),
  actualSaleCostPerUnit: decimal("actual_sale_cost_per_unit", { precision: 10, scale: 2 }).default("0"),
  qtyInStock: integer("qty_in_stock").notNull(),
  qtySold: integer("qty_sold").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales records table for tracking individual sales
export const salesRecords = pgTable("sales_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  batchId: varchar("batch_id").notNull().references(() => inventoryBatches.id, { onDelete: "cascade" }),
  qty: integer("qty").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(), // individual sale price per unit
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull(),
  balanceOwing: decimal("balance_owing", { precision: 10, scale: 2 }).notNull(), // auto-calculated
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  financialData: one(financialData, {
    fields: [users.id],
    references: [financialData.userId],
  }),
  inventoryBatches: many(inventoryBatches),
  salesRecords: many(salesRecords),
}));

export const inventoryBatchesRelations = relations(inventoryBatches, ({ one, many }) => ({
  user: one(users, {
    fields: [inventoryBatches.userId],
    references: [users.id],
  }),
  salesRecords: many(salesRecords),
}));

export const salesRecordsRelations = relations(salesRecords, ({ one }) => ({
  user: one(users, {
    fields: [salesRecords.userId],
    references: [users.id],
  }),
  batch: one(inventoryBatches, {
    fields: [salesRecords.batchId],
    references: [inventoryBatches.id],
  }),
}));

export const financialDataRelations = relations(financialData, ({ one }) => ({
  user: one(users, {
    fields: [financialData.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertFinancialDataSchema = createInsertSchema(financialData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFinancialDataSchema = insertFinancialDataSchema.partial();

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type FinancialData = typeof financialData.$inferSelect;
export type InsertFinancialData = z.infer<typeof insertFinancialDataSchema>;
export type UpdateFinancialData = z.infer<typeof updateFinancialDataSchema>;

// Financial row types
export type FinancialRow = {
  id: string;
  label: string;
  amount: number;
};

// Additional week type
export type AdditionalWeek = {
  id: string;
  weekNumber: number;
  name: string;
  incomeRows: FinancialRow[];
  expenseRows: FinancialRow[];
};

// Inventory and Sales schemas
export const insertInventoryBatchSchema = createInsertSchema(inventoryBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesRecordSchema = createInsertSchema(salesRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InventoryBatch = typeof inventoryBatches.$inferSelect;
export type InsertInventoryBatch = z.infer<typeof insertInventoryBatchSchema>;
export type SalesRecord = typeof salesRecords.$inferSelect;
export type InsertSalesRecord = z.infer<typeof insertSalesRecordSchema>;
