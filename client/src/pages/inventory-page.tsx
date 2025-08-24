import { useState } from "react";
import { Package, TrendingUp, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryTracker } from "@/components/inventory-tracker";
import { SalesTracker } from "@/components/sales-tracker";
import { useLocation } from "wouter";
import type { InventoryBatch } from "@shared/schema";
import fintrakLogo from "../assets/fintrak-logo.png";

export default function InventoryPage() {
  const [, setLocation] = useLocation();
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | undefined>();

  const handleBatchSelect = (batch: InventoryBatch) => {
    setSelectedBatch(batch);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/")}
                className="border-primary/30"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Financial Calculator
              </Button>
              
              <div className="flex items-center gap-2">
                <img
                  src={fintrakLogo}
                  alt="FINTRAK"
                  className="h-8 w-auto object-contain"
                />
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-foreground/85">
                    Inventory & Sales Tracker
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Inventory Management</p>
                    <p className="text-lg font-semibold text-foreground/85">Track Batches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Sales Tracking</p>
                    <p className="text-lg font-semibold text-foreground/85">Record Sales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Profit Analysis</p>
                    <p className="text-lg font-semibold text-foreground/85">Break-even</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory Tracker */}
            <div className="space-y-4">
              <InventoryTracker 
                onBatchSelect={handleBatchSelect}
                selectedBatchId={selectedBatch?.id}
              />
            </div>

            {/* Sales Tracker */}
            <div className="space-y-4">
              <SalesTracker selectedBatch={selectedBatch} />
            </div>
          </div>

          {/* Instructions */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-foreground/85 text-base">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/70 space-y-2">
              <p><strong>1. Create Inventory Batches:</strong> Add batches of products with total cost, units, and initial stock.</p>
              <p><strong>2. Track Sales:</strong> Select a batch and record individual sales with quantities, prices, and payment details.</p>
              <p><strong>3. Monitor Profitability:</strong> View real-time profit margins, break-even analysis, and outstanding balances.</p>
              <p><strong>4. Manage Multiple Batches:</strong> Run different batches simultaneously (e.g., Batch 1 and Batch 2 of the same product).</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}