import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database table definitions for Supabase
export interface FinancialDataRow {
  id?: string;
  user_id: string;
  notes100: string;
  notes50: string;
  notes20: string;
  notes10: string;
  notes5: string;
  coins2: string;
  coins1: string;
  coins050: string;
  coins020: string;
  coins010: string;
  coins005: string;
  bank_account_rows: any[];
  week1_income_rows: any[];
  week1_expense_rows: any[];
  week2_income_rows: any[];
  week2_expense_rows: any[];
  additional_weeks: any[];
  created_at?: string;
  updated_at?: string;
}

export interface InventoryBatchRow {
  id?: string;
  user_id: string;
  batch_name: string;
  product_name: string;
  qty_in_stock: number;
  qty_sold: number;
  cost_per_unit: string;
  projected_sale_cost_per_unit?: string;
  actual_sale_cost_per_unit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalesRecordRow {
  id?: string;
  user_id: string;
  batch_id: string;
  qty: number;
  price_per_unit: string;
  total_price: string;
  amount_paid: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}