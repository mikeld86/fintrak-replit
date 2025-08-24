import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ShoppingCart, DollarSign, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import type { SalesRecord, InsertSalesRecord, InventoryBatch } from "@shared/schema";

interface SalesTrackerProps {
  selectedBatch?: InventoryBatch;
}

export function SalesTracker({ selectedBatch }: SalesTrackerProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    qty: "",
    pricePerUnit: "",
    totalPrice: "",
    amountPaid: "",
    notes: "",
  });

  // Fetch sales records with localStorage fallback
  const { data: salesRecords = [], isLoading } = useQuery({
    queryKey: ["/api/sales-records", selectedBatch?.id],
    retry: false,
    enabled: !!selectedBatch,
    queryFn: async () => {
      if (!selectedBatch) return [];
      
      try {
        const response = await fetch(`/api/sales-records?batchId=${selectedBatch.id}`, {
          credentials: "include",
        });
        if (response.status === 401) {
          // Load from localStorage when server unavailable
          const localData = localStorage.getItem(`fintrak-sales-records-${selectedBatch.id}`);
          return localData ? JSON.parse(localData) : [];
        }
        if (!response.ok) return [];
        const data = await response.json();
        // Save to localStorage as backup
        localStorage.setItem(`fintrak-sales-records-${selectedBatch.id}`, JSON.stringify(data));
        return data;
      } catch (error) {
        console.log("Loading sales records from localStorage");
        const localData = localStorage.getItem(`fintrak-sales-records-${selectedBatch.id}`);
        return localData ? JSON.parse(localData) : [];
      }
    },
  });

  // Add sales record mutation
  const addSaleMutation = useMutation({
    mutationFn: async (saleData: InsertSalesRecord) => {
      try {
        const response = await apiRequest("POST", "/api/sales-records", saleData);
        return await response.json();
      } catch (error) {
        // Offline mode - save to localStorage
        const localKey = `fintrak-sales-records-${saleData.batchId}`;
        const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
        const newSale = {
          ...saleData,
          id: `sale_${Date.now()}`,
          userId: "46429020",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        localData.push(newSale);
        localStorage.setItem(localKey, JSON.stringify(localData));
        
        // Update batch quantities and actual sale cost in localStorage
        const batchData = JSON.parse(localStorage.getItem('fintrak-inventory-batches') || '[]');
        const batchIndex = batchData.findIndex((b: any) => b.id === saleData.batchId);
        if (batchIndex >= 0) {
          batchData[batchIndex].qtySold = (batchData[batchIndex].qtySold || 0) + saleData.qty;
          batchData[batchIndex].qtyInStock = Math.max(0, batchData[batchIndex].qtyInStock - saleData.qty);
          
          // Calculate actual sale cost per unit based on all sales
          const allSales = [...localData, newSale];
          const totalRevenue = allSales.reduce((sum: number, sale: any) => sum + parseFloat(sale.totalPrice), 0);
          const totalQtySold = allSales.reduce((sum: number, sale: any) => sum + sale.qty, 0);
          batchData[batchIndex].actualSaleCostPerUnit = totalQtySold > 0 ? (totalRevenue / totalQtySold).toString() : "0";
          
          localStorage.setItem('fintrak-inventory-batches', JSON.stringify(batchData));
        }
        
        return newSale;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-batches"] });
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  // Delete sales record mutation
  const deleteSaleMutation = useMutation({
    mutationFn: async (saleId: string) => {
      try {
        await apiRequest("DELETE", `/api/sales-records/${saleId}`);
      } catch (error) {
        // Offline mode - remove from localStorage
        if (!selectedBatch) return;
        const localKey = `fintrak-sales-records-${selectedBatch.id}`;
        const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
        const saleToDelete = localData.find((s: any) => s.id === saleId);
        const filtered = localData.filter((s: any) => s.id !== saleId);
        localStorage.setItem(localKey, JSON.stringify(filtered));
        
        // Update batch quantities
        if (saleToDelete) {
          const batchData = JSON.parse(localStorage.getItem('fintrak-inventory-batches') || '[]');
          const batchIndex = batchData.findIndex((b: any) => b.id === selectedBatch.id);
          if (batchIndex >= 0) {
            batchData[batchIndex].qtySold = Math.max(0, (batchData[batchIndex].qtySold || 0) - saleToDelete.qty);
            batchData[batchIndex].qtyInStock = batchData[batchIndex].qtyInStock + saleToDelete.qty;
            localStorage.setItem('fintrak-inventory-batches', JSON.stringify(batchData));
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-batches"] });
    },
  });

  const resetForm = () => {
    setFormData({
      qty: "",
      pricePerUnit: "",
      totalPrice: "",
      amountPaid: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    
    const qty = parseInt(formData.qty) || 0;
    const totalPrice = parseFloat(formData.totalPrice) || 0;
    const amountPaid = parseFloat(formData.amountPaid) || 0;
    const balanceOwing = totalPrice - amountPaid;
    
    if (qty > selectedBatch.qtyInStock) {
      alert(`Cannot sell ${qty} units. Only ${selectedBatch.qtyInStock} units in stock.`);
      return;
    }
    
    const pricePerUnit = parseFloat(formData.pricePerUnit) || (totalPrice / qty);
    
    const saleData: InsertSalesRecord = {
      batchId: selectedBatch.id,
      qty,
      pricePerUnit: pricePerUnit.toString(),
      totalPrice: totalPrice.toString(),
      amountPaid: amountPaid.toString(),
      balanceOwing: balanceOwing.toString(),
      notes: formData.notes,
      userId: "46429020",
    };

    addSaleMutation.mutate(saleData);
  };

  const calculateBalance = () => {
    const total = parseFloat(formData.totalPrice) || 0;
    const paid = parseFloat(formData.amountPaid) || 0;
    return total - paid;
  };

  const calculateSummary = () => {
    if (!selectedBatch || salesRecords.length === 0) {
      return {
        totalRevenue: 0,
        totalPaid: 0,
        totalOwing: 0,
        totalSold: 0,
        averagePrice: 0,
        profit: 0,
        profitMargin: 0,
      };
    }

    const totalRevenue = salesRecords.reduce((sum: number, record: SalesRecord) => sum + parseFloat(record.totalPrice), 0);
    const totalPaid = salesRecords.reduce((sum: number, record: SalesRecord) => sum + parseFloat(record.amountPaid), 0);
    const totalOwing = salesRecords.reduce((sum: number, record: SalesRecord) => sum + parseFloat(record.balanceOwing), 0);
    const totalSold = salesRecords.reduce((sum: number, record: SalesRecord) => sum + record.qty, 0);
    const averagePrice = totalSold > 0 ? totalRevenue / totalSold : 0;
    
    const costOfGoodsSold = totalSold * parseFloat(selectedBatch.unitCost);
    const profit = totalRevenue - costOfGoodsSold;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalPaid,
      totalOwing,
      totalSold,
      averagePrice,
      profit,
      profitMargin,
    };
  };

  const summary = calculateSummary();

  if (!selectedBatch) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center py-8 text-foreground/60">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-foreground/40" />
            <p>Select an inventory batch to track sales</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground/85">
              Sales Tracker - {selectedBatch.batchName}
            </CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={resetForm}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-2 border-primary/20">
              <DialogHeader>
                <DialogTitle className="text-foreground/85">Record New Sale</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="qty" className="text-sm text-foreground/85">
                      Quantity Sold
                    </Label>
                    <Input
                      id="qty"
                      type="number"
                      value={formData.qty}
                      onChange={(e) => {
                        const qty = e.target.value;
                        const total = formData.totalPrice;
                        setFormData(prev => ({ 
                          ...prev, 
                          qty,
                          pricePerUnit: parseInt(qty) > 0 && total ? (parseFloat(total) / parseInt(qty)).toString() : "0"
                        }));
                      }}
                      placeholder="0"
                      max={selectedBatch.qtyInStock}
                      className="bg-input border-primary/30 text-foreground"
                      required
                    />
                    <div className="text-xs text-foreground/60">
                      Available: {selectedBatch.qtyInStock} units
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalPrice" className="text-sm text-foreground/85">
                      Total Price
                    </Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      step="0.01"
                      value={formData.totalPrice}
                      onChange={(e) => {
                        const total = e.target.value;
                        const qty = parseInt(formData.qty) || 0;
                        setFormData(prev => ({ 
                          ...prev, 
                          totalPrice: total,
                          pricePerUnit: qty > 0 && total ? (parseFloat(total) / qty).toString() : "0"
                        }));
                      }}
                      placeholder="0.00"
                      className="bg-input border-primary/30 text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground/85">Price Per Unit (Auto-calculated)</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-primary/30 bg-muted text-foreground/85">
                      {formData.qty && formData.totalPrice ? 
                        formatCurrency(parseFloat(formData.totalPrice) / parseInt(formData.qty)) : 
                        formatCurrency(0)
                      }
                    </div>
                    <div className="text-xs text-foreground/60">
                      Projected: {formatCurrency(parseFloat(selectedBatch.projectedSaleCostPerUnit || "0"))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amountPaid" className="text-sm text-foreground/85">
                      Amount Paid
                    </Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      step="0.01"
                      value={formData.amountPaid}
                      onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: e.target.value }))}
                      placeholder="0.00"
                      className="bg-input border-primary/30 text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-foreground/85">Balance Owing (Auto)</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-primary/30 bg-muted text-foreground/85">
                      {formatCurrency(calculateBalance())}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm text-foreground/85">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Customer details, payment method, etc."
                    className="bg-input border-primary/30 text-foreground resize-none"
                    rows={3}
                  />
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
                    disabled={addSaleMutation.isPending}
                  >
                    {addSaleMutation.isPending ? "Saving..." : "Record Sale"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Sales Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="text-center">
            <div className="text-sm text-foreground/60">Total Revenue</div>
            <div className="text-lg font-semibold text-foreground/85">
              {formatCurrency(summary.totalRevenue)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-foreground/60">Units Sold</div>
            <div className="text-lg font-semibold text-foreground/85">
              {summary.totalSold}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-foreground/60">Profit</div>
            <div className={`text-lg font-semibold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.profit)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-foreground/60">Margin</div>
            <div className={`text-lg font-semibold ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.profitMargin.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Sales Records */}
        {isLoading ? (
          <div className="text-center py-8 text-foreground/60">Loading sales records...</div>
        ) : salesRecords.length === 0 ? (
          <div className="text-center py-8 text-foreground/60">
            No sales recorded yet. Add your first sale to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {salesRecords.map((record: SalesRecord) => (
              <div
                key={record.id}
                className="p-4 rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {record.qty} units
                      </Badge>
                      <span className="text-xs text-foreground/60">
                        {new Date(record.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-foreground/60">Total Price:</span>
                        <div className="font-medium text-foreground/85">
                          {formatCurrency(parseFloat(record.totalPrice))}
                        </div>
                      </div>
                      <div>
                        <span className="text-foreground/60">Amount Paid:</span>
                        <div className="font-medium text-foreground/85">
                          {formatCurrency(parseFloat(record.amountPaid))}
                        </div>
                      </div>
                      <div>
                        <span className="text-foreground/60">Balance Owing:</span>
                        <div className={`font-medium ${parseFloat(record.balanceOwing) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(parseFloat(record.balanceOwing))}
                        </div>
                      </div>
                      <div>
                        <span className="text-foreground/60">Unit Price:</span>
                        <div className="font-medium text-foreground/85">
                          {formatCurrency(parseFloat(record.totalPrice) / record.qty)}
                        </div>
                      </div>
                    </div>

                    {record.notes && (
                      <>
                        <Separator className="my-3" />
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="h-4 w-4 text-foreground/40 mt-0.5" />
                          <span className="text-foreground/70">{record.notes}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Delete this sales record?")) {
                        deleteSaleMutation.mutate(record.id);
                      }
                    }}
                    className="border-red-300 text-red-600 hover:bg-red-50 h-8 px-2 ml-4"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}