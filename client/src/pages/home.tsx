import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Calculator, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CashCalculator } from "@/components/cash-calculator";
import { WeekCalculator } from "@/components/week-calculator";
import { ThemeSelector } from "@/components/theme-selector";
import { ExportButtons } from "@/components/export-buttons";
import fintrakLogo from "../assets/fintrak-logo.png";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { FinancialData, FinancialRow } from "@shared/schema";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Financial data state
  const [cashOnHand, setCashOnHand] = useState(0);
  const [week1Balance, setWeek1Balance] = useState(0);
  const [financialData, setFinancialData] = useState<Partial<FinancialData>>({});

  // Fetch financial data
  const { data: serverFinancialData, isLoading: dataLoading } = useQuery({
    queryKey: ["/api/financial-data"],
    retry: false,
  });

  // Initialize data from server
  useEffect(() => {
    if (serverFinancialData) {
      const data = serverFinancialData as any;
      setFinancialData(data);
      
      // Parse denominations and calculate cash on hand
      const denominations = {
        notes100: parseFloat(data.notes100 || "0"),
        notes50: parseFloat(data.notes50 || "0"),
        notes20: parseFloat(data.notes20 || "0"),
        notes10: parseFloat(data.notes10 || "0"),
        notes5: parseFloat(data.notes5 || "0"),
        coins2: parseFloat(data.coins2 || "0"),
        coins1: parseFloat(data.coins1 || "0"),
        coins050: parseFloat(data.coins050 || "0"),
        coins020: parseFloat(data.coins020 || "0"),
        coins010: parseFloat(data.coins010 || "0"),
        coins005: parseFloat(data.coins005 || "0"),
      };
      
      const notesTotal = denominations.notes100 * 100 + denominations.notes50 * 50 + 
                        denominations.notes20 * 20 + denominations.notes10 * 10 + denominations.notes5 * 5;
      const coinsTotal = denominations.coins2 * 2 + denominations.coins1 * 1 + 
                        denominations.coins050 * 0.5 + denominations.coins020 * 0.2 + 
                        denominations.coins010 * 0.1 + denominations.coins005 * 0.05;
      
      setCashOnHand(notesTotal + coinsTotal);
    }
  }, [serverFinancialData]);

  // Save financial data mutation
  const saveDataMutation = useMutation({
    mutationFn: async (data: Partial<FinancialData>) => {
      await apiRequest("PUT", "/api/financial-data", data);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Clear data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/financial-data");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-data"] });
      toast({
        title: "Success",
        description: "All financial data has been cleared.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-save when data changes
  useEffect(() => {
    if (financialData && Object.keys(financialData).length > 0) {
      const timeoutId = setTimeout(() => {
        saveDataMutation.mutate(financialData);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [financialData]);

  const updateFinancialData = (updates: Partial<FinancialData>) => {
    setFinancialData(prev => ({ ...prev, ...updates }));
  };

  const handleCashUpdate = (denominations: any, totalCash: number) => {
    setCashOnHand(totalCash);
    updateFinancialData({
      notes100: denominations.notes100.toString(),
      notes50: denominations.notes50.toString(),
      notes20: denominations.notes20.toString(),
      notes10: denominations.notes10.toString(),
      notes5: denominations.notes5.toString(),
      coins2: denominations.coins2.toString(),
      coins1: denominations.coins1.toString(),
      coins050: denominations.coins050.toString(),
      coins020: denominations.coins020.toString(),
      coins010: denominations.coins010.toString(),
      coins005: denominations.coins005.toString(),
    });
  };

  const handleWeek1Update = ({ incomeRows, expenseRows, bankAccountRows, balance }: {
    incomeRows: FinancialRow[];
    expenseRows: FinancialRow[];
    bankAccountRows?: FinancialRow[];
    balance: number;
  }) => {
    setWeek1Balance(balance);
    const updateData: any = {
      week1IncomeRows: incomeRows,
      week1ExpenseRows: expenseRows,
    };
    if (bankAccountRows) {
      updateData.bankAccountRows = bankAccountRows;
    }
    updateFinancialData(updateData);
  };

  const handleWeek2Update = ({ incomeRows, expenseRows }: {
    incomeRows: FinancialRow[];
    expenseRows: FinancialRow[];
  }) => {
    updateFinancialData({
      week2IncomeRows: incomeRows,
      week2ExpenseRows: expenseRows,
    });
  };

  const handleClearData = () => {
    setShowClearDialog(false);
    clearDataMutation.mutate();
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Calculator className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading your financial data...</p>
        </div>
      </div>
    );
  }

  if (!user && !authLoading) {
    return null; // Let App.tsx handle authentication routing
  }

  // Parse financial rows from server data
  const bankAccountRows = (financialData.bankAccountRows as FinancialRow[]) || [];
  const week1IncomeRows = (financialData.week1IncomeRows as FinancialRow[]) || [];
  const week1ExpenseRows = (financialData.week1ExpenseRows as FinancialRow[]) || [];
  const week2IncomeRows = (financialData.week2IncomeRows as FinancialRow[]) || [];
  const week2ExpenseRows = (financialData.week2ExpenseRows as FinancialRow[]) || [];

  // Parse cash denominations
  const data = financialData as any;
  const denominations = {
    notes100: parseFloat(data.notes100 || "0"),
    notes50: parseFloat(data.notes50 || "0"),
    notes20: parseFloat(data.notes20 || "0"),
    notes10: parseFloat(data.notes10 || "0"),
    notes5: parseFloat(data.notes5 || "0"),
    coins2: parseFloat(data.coins2 || "0"),
    coins1: parseFloat(data.coins1 || "0"),
    coins050: parseFloat(data.coins050 || "0"),
    coins020: parseFloat(data.coins020 || "0"),
    coins010: parseFloat(data.coins010 || "0"),
    coins005: parseFloat(data.coins005 || "0"),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background shadow-sm border-b border-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Main header row */}
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              <img 
                src={fintrakLogo}
                alt="FINTRAK Logo" 
                className="h-7 sm:h-9 object-contain"
              />
            </div>
            
            {/* Desktop controls */}
            <div className="hidden md:flex items-center space-x-3">
              <ThemeSelector />
              <ExportButtons data={{
                cashOnHand,
                bankAccountRows,
                week1IncomeRows,
                week1ExpenseRows,
                week2IncomeRows,
                week2ExpenseRows,
                week1Balance,
                week2Balance: week1Balance + week2IncomeRows.reduce((sum, row) => sum + row.amount, 0) - week2ExpenseRows.reduce((sum, row) => sum + row.amount, 0),
                totalBankBalance: bankAccountRows.reduce((sum, row) => sum + row.amount, 0)
              }} />
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                className="text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                className="text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <ThemeSelector />
            </div>
          </div>

          {/* Mobile controls row */}
          <div className="md:hidden border-t border-border py-2">
            <div className="flex justify-between items-center">
              <ExportButtons data={{
                cashOnHand,
                bankAccountRows,
                week1IncomeRows,
                week1ExpenseRows,
                week2IncomeRows,
                week2ExpenseRows,
                week1Balance,
                week2Balance: week1Balance + week2IncomeRows.reduce((sum, row) => sum + row.amount, 0) - week2ExpenseRows.reduce((sum, row) => sum + row.amount, 0),
                totalBankBalance: bankAccountRows.reduce((sum, row) => sum + row.amount, 0)
              }} />
              <div className="flex space-x-2">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearDialog(true)}
                  className="text-destructive hover:text-destructive/80 px-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/api/logout'}
                  className="text-muted-foreground hover:text-foreground px-2"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
          
          {/* Summary Bar - Mobile optimized */}
          <div className="border-t border-border py-3">
            <div className="grid grid-cols-2 sm:flex sm:justify-center gap-2 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center justify-center sm:justify-start">
                <span className="text-muted-foreground mr-1 sm:mr-2">Cash:</span>
                <span className="font-semibold text-foreground">{formatCurrency(cashOnHand)}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start">
                <span className="text-muted-foreground mr-1 sm:mr-2">Bank:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(bankAccountRows.reduce((sum, row) => sum + row.amount, 0))}
                </span>
              </div>
              <div className="flex items-center justify-center sm:justify-start">
                <span className="text-muted-foreground mr-1 sm:mr-2">Week 1:</span>
                <span className="font-semibold text-primary">{formatCurrency(week1Balance)}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start">
                <span className="text-muted-foreground mr-1 sm:mr-2">Week 2:</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(week1Balance + 
                    week2IncomeRows.reduce((sum, row) => sum + row.amount, 0) - 
                    week2ExpenseRows.reduce((sum, row) => sum + row.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Cash Calculator */}
          <CashCalculator
            denominations={denominations}
            onUpdate={handleCashUpdate}
          />
          
          {/* Week 1 Calculator */}
          <WeekCalculator
            weekNumber={1}
            cashOnHand={cashOnHand}
            bankAccountRows={bankAccountRows}
            incomeRows={week1IncomeRows}
            expenseRows={week1ExpenseRows}
            onUpdate={handleWeek1Update}
          />
          
          {/* Week 2 Calculator */}
          <WeekCalculator
            weekNumber={2}
            startingBalance={week1Balance}
            incomeRows={week2IncomeRows}
            expenseRows={week2ExpenseRows}
            onUpdate={handleWeek2Update}
          />
        </div>
      </main>



      {/* Clear Data Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to clear all financial data? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearData}
              disabled={clearDataMutation.isPending}
            >
              {clearDataMutation.isPending ? "Clearing..." : "Clear All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
