import { Handler } from '@netlify/functions';
import { supabase, SalesRecordRow } from './supabase-client';

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
        const { batchId } = event.queryStringParameters || {};
        if (!batchId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'batchId is required' }) };
        }
        
        const { data: sales, error: fetchError } = await supabase
          .from('sales_records')
          .select('*')
          .eq('user_id', userId)
          .eq('batch_id', batchId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Convert snake_case to camelCase for frontend
        const responseSales = (sales || []).map((sale: any) => ({
          id: sale.id,
          userId: sale.user_id,
          batchId: sale.batch_id,
          qty: sale.qty,
          pricePerUnit: sale.price_per_unit,
          totalPrice: sale.total_price,
          amountPaid: sale.amount_paid,
          notes: sale.notes,
          createdAt: sale.created_at,
          updatedAt: sale.updated_at,
        }));

        return { statusCode: 200, headers, body: JSON.stringify(responseSales) };

      case 'POST':
        if (!event.body) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
        }
        
        const saleData = JSON.parse(event.body);
        
        const newSaleData: Omit<SalesRecordRow, 'id'> = {
          user_id: userId,
          batch_id: saleData.batchId,
          qty: saleData.qty,
          price_per_unit: saleData.pricePerUnit,
          total_price: saleData.totalPrice,
          amount_paid: saleData.amountPaid,
          notes: saleData.notes,
        };

        const { data: newSale, error: insertError } = await supabase
          .from('sales_records')
          .insert(newSaleData)
          .select()
          .single();

        if (insertError) throw insertError;

        // Update batch quantities and actual sale cost
        const { data: allSales, error: salesError } = await supabase
          .from('sales_records')
          .select('*')
          .eq('user_id', userId)
          .eq('batch_id', saleData.batchId);

        if (salesError) throw salesError;

        // Calculate actual sale cost per unit
        const totalRevenue = (allSales || []).reduce((sum: number, sale: any) => sum + parseFloat(sale.total_price), 0);
        const totalQtySold = (allSales || []).reduce((sum: number, sale: any) => sum + sale.qty, 0);
        const actualSaleCostPerUnit = totalQtySold > 0 ? (totalRevenue / totalQtySold).toString() : "0";

        // Update the inventory batch
        const { error: batchUpdateError } = await supabase
          .from('inventory_batches')
          .update({
            qty_sold: totalQtySold,
            actual_sale_cost_per_unit: actualSaleCostPerUnit,
          })
          .eq('id', saleData.batchId)
          .eq('user_id', userId);

        if (batchUpdateError) throw batchUpdateError;

        // Convert to frontend format
        const responseNewSale = {
          id: newSale.id,
          userId: newSale.user_id,
          batchId: newSale.batch_id,
          qty: newSale.qty,
          pricePerUnit: newSale.price_per_unit,
          totalPrice: newSale.total_price,
          amountPaid: newSale.amount_paid,
          notes: newSale.notes,
          createdAt: newSale.created_at,
          updatedAt: newSale.updated_at,
        };
        
        return { statusCode: 201, headers, body: JSON.stringify(responseNewSale) };

      case 'DELETE':
        const pathSegments = event.path.split('/');
        const saleId = pathSegments[pathSegments.length - 1];
        
        // Get the sale record to be deleted
        const { data: saleToDelete, error: fetchSaleError } = await supabase
          .from('sales_records')
          .select('*')
          .eq('id', saleId)
          .eq('user_id', userId)
          .single();

        if (fetchSaleError || !saleToDelete) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Sale record not found' }) };
        }

        // Delete the sale record
        const { error: deleteError } = await supabase
          .from('sales_records')
          .delete()
          .eq('id', saleId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        // Get remaining sales for this batch to recalculate totals
        const { data: remainingSales, error: remainingSalesError } = await supabase
          .from('sales_records')
          .select('*')
          .eq('user_id', userId)
          .eq('batch_id', saleToDelete.batch_id);

        if (remainingSalesError) throw remainingSalesError;

        // Recalculate actual sale cost per unit
        const totalRevenue = (remainingSales || []).reduce((sum: number, sale: any) => sum + parseFloat(sale.total_price), 0);
        const totalQtySold = (remainingSales || []).reduce((sum: number, sale: any) => sum + sale.qty, 0);
        const actualSaleCostPerUnit = totalQtySold > 0 ? (totalRevenue / totalQtySold).toString() : "0";

        // Update the inventory batch
        const { error: batchUpdateError } = await supabase
          .from('inventory_batches')
          .update({
            qty_sold: totalQtySold,
            actual_sale_cost_per_unit: actualSaleCostPerUnit,
          })
          .eq('id', saleToDelete.batch_id)
          .eq('user_id', userId);

        if (batchUpdateError) throw batchUpdateError;
        
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Sale record deleted successfully' }) };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};