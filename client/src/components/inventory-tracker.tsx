import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Package, TrendingUp, Calculator, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import type { InventoryBatch, InsertInventoryBatch } from "@shared/schema";

interface InventoryTrackerProps {
  onBatchSelect?: (batch: InventoryBatch) => void;
  selectedBatchId?: string;
}

export function InventoryTracker({ onBatchSelect, selectedBatchId }: InventoryTrackerProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<InventoryBatch | null>(null);
  const [formData, setFormData] = useState({
    batchName: "",
    productName: "",
    totalPricePaid: "",
    numberOfUnits: "",
    projectedSaleCostPerUnit: "",
    qtyInStock: "",
  });

  // Fetch inventory batches with localStorage fallback
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["/api/inventory-batches"],
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/inventory-batches", {
          credentials: "include",
        });
        if (response.status === 401) {
          // Load from localStorage when server unavailable
          const localData = localStorage.getItem('fintrak-inventory-batches');
          return localData ? JSON.parse(localData) : [];
        }
        if (!response.ok) return [];
        const data = await response.json();
        // Save to localStorage as backup
        localStorage.setItem('fintrak-inventory-batches', JSON.stringify(data));
        return data;
      } catch (error) {
        console.log("Loading inventory from localStorage");
        const localData = localStorage.getItem('fintrak-inventory-batches');
        return localData ? JSON.parse(localData) : [];
      }
    },
  });

  // Add/Update batch mutation
  const saveBatchMutation = useMutation({
    mutationFn: async (batchData: InsertInventoryBatch & { id?: string }) => {
      const isUpdate = !!batchData.id;
      const url = isUpdate ? `/api/inventory-batches/${batchData.id}` : "/api/inventory-batches";
      const method = isUpdate ? "PUT" : "POST";
      
      try {
        const response = await apiRequest(method, url, batchData);
        return await response.json();
      } catch (error) {
        // Offline mode - save to localStorage
        const localData = JSON.parse(localStorage.getItem('fintrak-inventory-batches') || '[]');
        const newBatch = {
          ...batchData,
          id: batchData.id || `batch_${Date.now()}`,
          userId: "46429020",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        if (isUpdate) {
          const index = localData.findIndex((b: any) => b.id === batchData.id);
          if (index >= 0) localData[index] = newBatch;
        } else {
          localData.push(newBatch);
        }
        
        localStorage.setItem('fintrak-inventory-batches', JSON.stringify(localData));
        return newBatch;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-batches"] });
      setIsAddDialogOpen(false);
      setEditingBatch(null);
      resetForm();
    },
  });

  // Delete batch mutation
  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      try {
        await apiRequest("DELETE", `/api/inventory-batches/${batchId}`);
      } catch (error) {
        // Offline mode - remove from localStorage
        const localData = JSON.parse(localStorage.getItem('fintrak-inventory-batches') || '[]');
        const filtered = localData.filter((b: any) => b.id !== batchId);
        localStorage.setItem('fintrak-inventory-batches', JSON.stringify(filtered));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-batches"] });
    },
  });

  const resetForm = () => {
    setFormData({
      batchName: "",
      productName: "",
      totalPricePaid: "",
      numberOfUnits: "",
      projectedSaleCostPerUnit: "",
      qtyInStock: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalPrice = parseFloat(formData.totalPricePaid) || 0;
    const units = parseInt(formData.numberOfUnits) || 0;
    const unitCost = units > 0 ? totalPrice / units : 0;
    
    const batchData = {
      ...(editingBatch?.id && { id: editingBatch.id }),
      batchName: formData.batchName,
      productName: formData.productName,
      totalPricePaid: totalPrice.toString(),
      numberOfUnits: units,
      unitCost: unitCost.toString(),
      projectedSaleCostPerUnit: formData.projectedSaleCostPerUnit || "0",
      actualSaleCostPerUnit: editingBatch?.actualSaleCostPerUnit || "0",
      qtyInStock: parseInt(formData.qtyInStock) || 0,
      qtySold: editingBatch?.qtySold ?? 0,
      userId: "46429020",
    };

    saveBatchMutation.mutate(batchData);
  };

  const handleEdit = (batch: InventoryBatch) => {
    setEditingBatch(batch);
    setFormData({
      batchName: batch.batchName,
      productName: batch.productName,
      totalPricePaid: batch.totalPricePaid,
      numberOfUnits: batch.numberOfUnits.toString(),
      projectedSaleCostPerUnit: batch.projectedSaleCostPerUnit || "0",
      qtyInStock: batch.qtyInStock.toString(),
    });
    setIsAddDialogOpen(true);
  };

  const calculateUnitCost = () => {
    const total = parseFloat(formData.totalPricePaid) || 0;
    const units = parseInt(formData.numberOfUnits) || 0;
    return units > 0 ? total / units : 0;
  };

  const calculateBreakEven = (batch: InventoryBatch) => {
    const unitCost = parseFloat(batch.unitCost);
    const projectedSalePrice = parseFloat(batch.projectedSaleCostPerUnit || "0");
    const actualSalePrice = parseFloat(batch.actualSaleCostPerUnit || "0");
    
    return {
      unitCost,
      projectedSalePrice,
      actualSalePrice,
      totalCost: parseFloat(batch.totalPricePaid),
      unitsToBreakEven: projectedSalePrice > 0 ? Math.ceil(parseFloat(batch.totalPricePaid) / (projectedSalePrice - unitCost)) : 0,
      projectedProfitPerUnit: projectedSalePrice - unitCost,
      actualProfitPerUnit: actualSalePrice - unitCost,
      projectedTotalProfit: (projectedSalePrice - unitCost) * (batch.qtySold || 0),
      actualTotalProfit: (actualSalePrice - unitCost) * (batch.qtySold || 0),
    };
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground/85">Inventory Tracker</CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  setEditingBatch(null);
                  resetForm();
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-2 border-primary/20">
              <DialogHeader>
                <DialogTitle className="text-foreground/85">
                  {editingBatch ? "Edit Batch" : "Add New Batch"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchName" className="text-sm text-foreground/85">
                      Batch Name
                    </Label>
                    <Input
                      id="batchName"
                      value={formData.batchName}
                      onChange={(e) => setFormData(prev => ({ ...prev, batchName: e.target.value }))}
                      placeholder="e.g., Chocolate Cakes - Batch 1"
                      className="bg-input border-primary/30 text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productName" className="text-sm text-foreground/85">
                      Product Name
                    </Label>
                    <Input
                      id="productName"
                      value={formData.productName}
                      onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                      placeholder="e.g., Chocolate Cake"
                      className="bg-input border-primary/30 text-foreground"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalPricePaid" className="text-sm text-foreground/85">
                      Total Price Paid
                    </Label>
                    <Input
                      id="totalPricePaid"
                      type="number"
                      step="0.01"
                      value={formData.totalPricePaid}
                      onChange={(e) => setFormData(prev => ({ ...prev, totalPricePaid: e.target.value }))}
                      placeholder="0.00"
                      className="bg-input border-primary/30 text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfUnits" className="text-sm text-foreground/85">
                      Number of Units
                    </Label>
                    <Input
                      id="numberOfUnits"
                      type="number"
                      value={formData.numberOfUnits}
                      onChange={(e) => setFormData(prev => ({ ...prev, numberOfUnits: e.target.value }))}
                      placeholder="0"
                      className="bg-input border-primary/30 text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectedSaleCostPerUnit" className="text-sm text-foreground/85">
                      Projected Sale Price Per Unit
                    </Label>
                    <Input
                      id="projectedSaleCostPerUnit"
                      type="number"
                      step="0.01"
                      value={formData.projectedSaleCostPerUnit}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectedSaleCostPerUnit: e.target.value }))}
                      placeholder="0.00"
                      className="bg-input border-primary/30 text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground/85">Unit Cost (Auto)</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-primary/30 bg-muted text-foreground/85">
                      {formatCurrency(calculateUnitCost())}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qtyInStock" className="text-sm text-foreground/85">
                      Qty in Stock
                    </Label>
                    <Input
                      id="qtyInStock"
                      type="number"
                      value={formData.qtyInStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, qtyInStock: e.target.value }))}
                      placeholder="0"
                      className="bg-input border-primary/30 text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="border-primary/30"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={saveBatchMutation.isPending}
                  >
                    {saveBatchMutation.isPending ? "Saving..." : editingBatch ? "Update" : "Add"} Batch
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-foreground/60">Loading batches...</div>
        ) : batches.length === 0 ? (
          <div className="text-center py-8 text-foreground/60">
            No inventory batches yet. Add your first batch to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch: InventoryBatch) => {
              const breakEven = calculateBreakEven(batch);
              const isSelected = selectedBatchId === batch.id;
              
              return (
                <div
                  key={batch.id}
                  className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-primary/20 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                  onClick={() => onBatchSelect?.(batch)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground/85">{batch.batchName}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {batch.productName}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-foreground/60">Total Cost:</span>
                          <div className="font-medium text-foreground/85">
                            {formatCurrency(parseFloat(batch.totalPricePaid))}
                          </div>
                        </div>
                        <div>
                          <span className="text-foreground/60">Unit Cost:</span>
                          <div className="font-medium text-foreground/85">
                            {formatCurrency(parseFloat(batch.unitCost))}
                          </div>
                        </div>
                        <div>
                          <span className="text-foreground/60">Projected Sale Price:</span>
                          <div className="font-medium text-foreground/85">
                            {formatCurrency(parseFloat(batch.projectedSaleCostPerUnit || "0"))}
                          </div>
                        </div>
                        <div>
                          <span className="text-foreground/60">Actual Sale Price:</span>
                          <div className="font-medium text-foreground/85">
                            {formatCurrency(parseFloat(batch.actualSaleCostPerUnit || "0"))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                        <div>
                          <span className="text-foreground/60">In Stock:</span>
                          <div className="font-medium text-foreground/85">
                            {batch.qtyInStock} / {batch.numberOfUnits}
                          </div>
                        </div>
                        <div>
                          <span className="text-foreground/60">Sold:</span>
                          <div className="font-medium text-foreground/85">
                            {batch.qtySold || 0}
                          </div>
                        </div>
                        <div>
                          <span className="text-foreground/60">Break Even (Units):</span>
                          <div className="font-medium text-foreground/85">
                            {breakEven.unitsToBreakEven > 0 ? `${breakEven.unitsToBreakEven} units` : "Set projected price"}
                          </div>
                        </div>
                        <div>
                          <span className="text-foreground/60">Projected Profit/Unit:</span>
                          <div className={`font-medium ${breakEven.projectedProfitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(breakEven.projectedProfitPerUnit)}
                          </div>
                        </div>
                      </div>

                      <Separator className="my-3" />
                      
                      <div className="flex items-center gap-4 text-xs text-foreground/60">
                        <div className="flex items-center gap-1">
                          <Calculator className="h-3 w-3" />
                          Break-even: {breakEven.unitsToBreakEven > 0 ? `${breakEven.unitsToBreakEven} units` : "Set projected price"} 
                          {breakEven.projectedSalePrice > 0 && ` at ${formatCurrency(breakEven.projectedSalePrice)} each`}
                        </div>
                        {breakEven.actualSalePrice > 0 && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Actual profit: {formatCurrency(breakEven.actualProfitPerUnit)}/unit
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(batch);
                        }}
                        className="border-primary/30 h-8 px-2"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this batch?")) {
                            deleteBatchMutation.mutate(batch.id);
                          }
                        }}
                        className="border-red-300 text-red-600 hover:bg-red-50 h-8 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}