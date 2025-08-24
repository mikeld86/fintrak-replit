-- FINTRAK Database Schema for Supabase
-- Run these commands in your Supabase SQL Editor

-- Create financial_data table
CREATE TABLE IF NOT EXISTS financial_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  notes100 TEXT DEFAULT '0',
  notes50 TEXT DEFAULT '0',
  notes20 TEXT DEFAULT '0',
  notes10 TEXT DEFAULT '0',
  notes5 TEXT DEFAULT '0',
  coins2 TEXT DEFAULT '0',
  coins1 TEXT DEFAULT '0',
  coins050 TEXT DEFAULT '0',
  coins020 TEXT DEFAULT '0',
  coins010 TEXT DEFAULT '0',
  coins005 TEXT DEFAULT '0',
  bank_account_rows JSONB DEFAULT '[]',
  week1_income_rows JSONB DEFAULT '[]',
  week1_expense_rows JSONB DEFAULT '[]',
  week2_income_rows JSONB DEFAULT '[]',
  week2_expense_rows JSONB DEFAULT '[]',
  additional_weeks JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create inventory_batches table
CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  qty_in_stock INTEGER NOT NULL DEFAULT 0,
  qty_sold INTEGER NOT NULL DEFAULT 0,
  cost_per_unit TEXT NOT NULL,
  projected_sale_cost_per_unit TEXT DEFAULT '0',
  actual_sale_cost_per_unit TEXT DEFAULT '0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_records table
CREATE TABLE IF NOT EXISTS sales_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  batch_id UUID NOT NULL REFERENCES inventory_batches(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL,
  price_per_unit TEXT NOT NULL,
  total_price TEXT NOT NULL,
  amount_paid TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_data_user_id ON financial_data(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_user_id ON inventory_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_user_id ON sales_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_records_batch_id ON sales_records(batch_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_financial_data_updated_at BEFORE UPDATE ON financial_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_batches_updated_at BEFORE UPDATE ON inventory_batches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_records_updated_at BEFORE UPDATE ON sales_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access their own data
CREATE POLICY "Users can view their own financial data" ON financial_data
    FOR ALL USING (user_id = '46429020');

CREATE POLICY "Users can view their own inventory batches" ON inventory_batches
    FOR ALL USING (user_id = '46429020');

CREATE POLICY "Users can view their own sales records" ON sales_records
    FOR ALL USING (user_id = '46429020');

-- Grant necessary permissions
GRANT ALL ON financial_data TO anon, authenticated;
GRANT ALL ON inventory_batches TO anon, authenticated;
GRANT ALL ON sales_records TO anon, authenticated;