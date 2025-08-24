# Supabase Setup for FINTRAK

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign up/Sign in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: FINTRAK
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"

## Step 2: Get Connection Details

After project creation:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## Step 3: Set Environment Variables

In your Netlify deployment, add these environment variables:

- `SUPABASE_URL` = Your Project URL
- `SUPABASE_ANON_KEY` = Your anon public key

## Step 4: Create Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase-setup.sql`
3. Click "Run" to execute the SQL

This will create:
- `financial_data` table for cash calculator and financial planning
- `inventory_batches` table for inventory management
- `sales_records` table for sales tracking
- Proper indexes and triggers
- Row Level Security policies

## Step 5: Test Connection

After deployment, the app will automatically:
- Connect to Supabase using environment variables
- Create default data for new users
- Sync all financial, inventory, and sales data

## Features with Supabase

✅ **Persistent Data Storage**
- Financial data survives function restarts
- Inventory and sales data properly stored
- Real-time updates across devices

✅ **Automatic Calculations**
- Break-even analysis with projected pricing
- Actual sale cost per unit calculations
- Profit margin tracking

✅ **Data Relationships**
- Sales records linked to inventory batches
- Automatic quantity updates
- Foreign key constraints

✅ **Offline Backup**
- localStorage still works as backup
- Seamless sync when connection restored
- Zero data loss architecture

## Production Security

For production use, consider:

1. **Replace hardcoded user ID** with proper authentication
2. **Update RLS policies** for multiple users
3. **Add API rate limiting** if needed
4. **Enable database backups** in Supabase

## Database Schema

### financial_data
- User's cash denominations and calculations
- Bank account balances
- Weekly income/expense planning
- Additional weeks functionality

### inventory_batches
- Product batch management
- Projected vs actual pricing
- Stock quantity tracking
- Cost analysis

### sales_records
- Individual sale transactions
- Price per unit tracking
- Payment status
- Automatic batch updates

The database automatically handles:
- UUID primary keys
- Timestamps (created_at, updated_at)
- Foreign key relationships
- Data integrity constraints