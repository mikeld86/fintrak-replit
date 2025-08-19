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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  financialData: one(financialData, {
    fields: [users.id],
    references: [financialData.userId],
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
