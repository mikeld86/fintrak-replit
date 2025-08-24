import { Handler } from '@netlify/functions';
import { supabase, InventoryBatchRow } from './supabase-client';

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
  const userKey = `batches_${userId}`;

  try {
    switch (event.httpMethod) {
      case 'GET':
        const { data: batches, error: fetchError } = await supabase
          .from('inventory_batches')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Convert snake_case to camelCase for frontend
        const responseBatches = (batches || []).map((batch: any) => ({
          id: batch.id,
          userId: batch.user_id,
          batchName: batch.batch_name,
          productName: batch.product_name,
          qtyInStock: batch.qty_in_stock,
          qtySold: batch.qty_sold || 0,
          costPerUnit: batch.cost_per_unit,
          projectedSaleCostPerUnit: batch.projected_sale_cost_per_unit,
          actualSaleCostPerUnit: batch.actual_sale_cost_per_unit,
          createdAt: batch.created_at,
          updatedAt: batch.updated_at,
        }));

        return { statusCode: 200, headers, body: JSON.stringify(responseBatches) };

      case 'POST':
        if (!event.body) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
        }
        
        const batchData = JSON.parse(event.body);
        
        const newBatchData: Omit<InventoryBatchRow, 'id'> = {
          user_id: userId,
          batch_name: batchData.batchName,
          product_name: batchData.productName,
          qty_in_stock: batchData.qtyInStock,
          qty_sold: 0,
          cost_per_unit: batchData.costPerUnit,
          projected_sale_cost_per_unit: batchData.projectedSaleCostPerUnit,
          actual_sale_cost_per_unit: "0",
        };

        const { data: newBatch, error: insertError } = await supabase
          .from('inventory_batches')
          .insert(newBatchData)
          .select()
          .single();

        if (insertError) throw insertError;

        // Convert to frontend format
        const responseNewBatch = {
          id: newBatch.id,
          userId: newBatch.user_id,
          batchName: newBatch.batch_name,
          productName: newBatch.product_name,
          qtyInStock: newBatch.qty_in_stock,
          qtySold: newBatch.qty_sold,
          costPerUnit: newBatch.cost_per_unit,
          projectedSaleCostPerUnit: newBatch.projected_sale_cost_per_unit,
          actualSaleCostPerUnit: newBatch.actual_sale_cost_per_unit,
          createdAt: newBatch.created_at,
          updatedAt: newBatch.updated_at,
        };
        
        return { statusCode: 201, headers, body: JSON.stringify(responseNewBatch) };

      case 'PUT':
        if (!event.body) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body required' }) };
        }
        
        const pathSegments = event.path.split('/');
        const batchId = pathSegments[pathSegments.length - 1];
        const updateData = JSON.parse(event.body);
        
        const dbUpdateData: Partial<InventoryBatchRow> = {
          batch_name: updateData.batchName,
          product_name: updateData.productName,
          qty_in_stock: updateData.qtyInStock,
          qty_sold: updateData.qtySold,
          cost_per_unit: updateData.costPerUnit,
          projected_sale_cost_per_unit: updateData.projectedSaleCostPerUnit,
          actual_sale_cost_per_unit: updateData.actualSaleCostPerUnit,
        };

        const { data: updatedBatch, error: updateError } = await supabase
          .from('inventory_batches')
          .update(dbUpdateData)
          .eq('id', batchId)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;

        if (!updatedBatch) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Batch not found' }) };
        }

        // Convert to frontend format
        const responseUpdatedBatch = {
          id: updatedBatch.id,
          userId: updatedBatch.user_id,
          batchName: updatedBatch.batch_name,
          productName: updatedBatch.product_name,
          qtyInStock: updatedBatch.qty_in_stock,
          qtySold: updatedBatch.qty_sold,
          costPerUnit: updatedBatch.cost_per_unit,
          projectedSaleCostPerUnit: updatedBatch.projected_sale_cost_per_unit,
          actualSaleCostPerUnit: updatedBatch.actual_sale_cost_per_unit,
          createdAt: updatedBatch.created_at,
          updatedAt: updatedBatch.updated_at,
        };
        
        return { statusCode: 200, headers, body: JSON.stringify(responseUpdatedBatch) };

      case 'DELETE':
        const deletePathSegments = event.path.split('/');
        const deleteBatchId = deletePathSegments[deletePathSegments.length - 1];
        
        const { error: deleteError } = await supabase
          .from('inventory_batches')
          .delete()
          .eq('id', deleteBatchId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
        
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Batch deleted successfully' }) };

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};