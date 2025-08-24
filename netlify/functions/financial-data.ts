import { Handler } from '@netlify/functions';
import { supabase, FinancialDataRow } from './supabase-client';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const userId = "46429020"; // Hard-coded for simple auth

  try {
    switch (event.httpMethod) {
      case 'GET':
        const { data: existingData, error: fetchError } = await supabase
          .from('financial_data')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (!existingData) {
          // Create default data for new user
          const defaultData: FinancialDataRow = {
            user_id: userId,
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
            bank_account_rows: [
              { id: "amp-default", label: "AMP", amount: 0 },
              { id: "upbank-default", label: "Up Bank", amount: 0 },
              { id: "anz-default", label: "ANZ", amount: 0 }
            ],
            week1_income_rows: [],
            week1_expense_rows: [],
            week2_income_rows: [],
            week2_expense_rows: [],
            additional_weeks: [],
          };

          const { data: newData, error: insertError } = await supabase
            .from('financial_data')
            .insert(defaultData)
            .select()
            .single();

          if (insertError) throw insertError;
          
          // Convert snake_case to camelCase for frontend
          const responseData = {
            userId: newData.user_id,
            notes100: newData.notes100,
            notes50: newData.notes50,
            notes20: newData.notes20,
            notes10: newData.notes10,
            notes5: newData.notes5,
            coins2: newData.coins2,
            coins1: newData.coins1,
            coins050: newData.coins050,
            coins020: newData.coins020,
            coins010: newData.coins010,
            coins005: newData.coins005,
            bankAccountRows: newData.bank_account_rows,
            week1IncomeRows: newData.week1_income_rows,
            week1ExpenseRows: newData.week1_expense_rows,
            week2IncomeRows: newData.week2_income_rows,
            week2ExpenseRows: newData.week2_expense_rows,
            additionalWeeks: newData.additional_weeks,
          };
          
          return { statusCode: 200, headers, body: JSON.stringify(responseData) };
        }

        // Convert existing data to frontend format
        const responseData = {
          userId: existingData.user_id,
          notes100: existingData.notes100,
          notes50: existingData.notes50,
          notes20: existingData.notes20,
          notes10: existingData.notes10,
          notes5: existingData.notes5,
          coins2: existingData.coins2,
          coins1: existingData.coins1,
          coins050: existingData.coins050,
          coins020: existingData.coins020,
          coins010: existingData.coins010,
          coins005: existingData.coins005,
          bankAccountRows: existingData.bank_account_rows,
          week1IncomeRows: existingData.week1_income_rows,
          week1ExpenseRows: existingData.week1_expense_rows,
          week2IncomeRows: existingData.week2_income_rows,
          week2ExpenseRows: existingData.week2_expense_rows,
          additionalWeeks: existingData.additional_weeks,
        };
        
        return { statusCode: 200, headers, body: JSON.stringify(responseData) };

      case 'PUT':
        if (!event.body) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
        }
        
        const updateData = JSON.parse(event.body);
        
        // Convert camelCase to snake_case for database
        const dbUpdateData: Partial<FinancialDataRow> = {
          notes100: updateData.notes100,
          notes50: updateData.notes50,
          notes20: updateData.notes20,
          notes10: updateData.notes10,
          notes5: updateData.notes5,
          coins2: updateData.coins2,
          coins1: updateData.coins1,
          coins050: updateData.coins050,
          coins020: updateData.coins020,
          coins010: updateData.coins010,
          coins005: updateData.coins005,
          bank_account_rows: updateData.bankAccountRows,
          week1_income_rows: updateData.week1IncomeRows,
          week1_expense_rows: updateData.week1ExpenseRows,
          week2_income_rows: updateData.week2IncomeRows,
          week2_expense_rows: updateData.week2ExpenseRows,
          additional_weeks: updateData.additionalWeeks,
        };

        const { data: updatedData, error: updateError } = await supabase
          .from('financial_data')
          .upsert({ user_id: userId, ...dbUpdateData })
          .select()
          .single();

        if (updateError) throw updateError;

        // Convert back to frontend format
        const updatedResponse = {
          userId: updatedData.user_id,
          notes100: updatedData.notes100,
          notes50: updatedData.notes50,
          notes20: updatedData.notes20,
          notes10: updatedData.notes10,
          notes5: updatedData.notes5,
          coins2: updatedData.coins2,
          coins1: updatedData.coins1,
          coins050: updatedData.coins050,
          coins020: updatedData.coins020,
          coins010: updatedData.coins010,
          coins005: updatedData.coins005,
          bankAccountRows: updatedData.bank_account_rows,
          week1IncomeRows: updatedData.week1_income_rows,
          week1ExpenseRows: updatedData.week1_expense_rows,
          week2IncomeRows: updatedData.week2_income_rows,
          week2ExpenseRows: updatedData.week2_expense_rows,
          additionalWeeks: updatedData.additional_weeks,
        };
        
        return { statusCode: 200, headers, body: JSON.stringify(updatedResponse) };

      case 'DELETE':
        const { error: deleteError } = await supabase
          .from('financial_data')
          .delete()
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

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
          bankAccountRows: [
            { id: "amp-default", label: "AMP", amount: 0 },
            { id: "upbank-default", label: "Up Bank", amount: 0 },
            { id: "anz-default", label: "ANZ", amount: 0 }
          ],
          week1IncomeRows: [],
          week1ExpenseRows: [],
          week2IncomeRows: [],
          week2ExpenseRows: [],
          additionalWeeks: [],
        };
        
        return { statusCode: 200, headers, body: JSON.stringify(defaultData) };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};