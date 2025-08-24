import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useAuth } from "@/hooks/useAuth-simple";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Calculator, Trash2, Coins, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CashCalculator } from "@/components/cash-calculator";
import { WeekCalculator } from "@/components/week-calculator";
import { ThemeSelector } from "@/components/theme-selector";
import { ExportButtons } from "@/components/export-buttons";
import fintrakLogo from "../assets/fintrak-logo.png";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FinancialData, FinancialRow, AdditionalWeek } from "@shared/schema";

export default function Home() {
  // Temporarily bypass auth for development testing
  const user = { id: "46429020" };
  const authLoading = false;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Financial data state
  const [cashOnHand, setCashOnHand] = useState(0);
  const [week1Balance, setWeek1Balance] = useState(0);
  const [additionalWeekBalances, setAdditionalWeekBalances] = useState<{[key: string]: number}>({});
  const [financialData, setFinancialData] = useState<Partial<FinancialData>>({});

  // Fetch financial data with error handling - prioritize localStorage in offline mode
  const { data: serverFinancialData, isLoading: dataLoading, error: dataError } = useQuery({
    queryKey: ["/api/financial-data"],
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/financial-data", {
          credentials: "include",
        });
        if (response.status === 401) {
          // If unauthorized, fall back to localStorage immediately
          console.log("🔄 Server unavailable, using offline mode with localStorage");
          return null;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch financial data");
        }
        return await response.json();
      } catch (error) {
        console.log("Financial data fetch error, using offline mode:", error);
        return null;
      }
    },
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
      
      // Save to localStorage as backup
      localStorage.setItem('fintrak-financial-data', JSON.stringify(data));
      localStorage.setItem('fintrak-cash-on-hand', (notesTotal + coinsTotal).toString());
    } else {
      // Fallback to localStorage if server data unavailable
      const backupData = localStorage.getItem('fintrak-financial-data');
      const backupCash = localStorage.getItem('fintrak-cash-on-hand');
      
      if (backupData) {
        try {
          const parsedData = JSON.parse(backupData);
          console.log('🔄 Loading data from localStorage backup');
          setFinancialData(parsedData);
          
          if (backupCash) {
            setCashOnHand(parseFloat(backupCash));
          } else {
            // Recalculate if no cached cash value
            const denominations = {
              notes100: parseFloat(parsedData.notes100 || "0"),
              notes50: parseFloat(parsedData.notes50 || "0"),
              notes20: parseFloat(parsedData.notes20 || "0"),
              notes10: parseFloat(parsedData.notes10 || "0"),
              notes5: parseFloat(parsedData.notes5 || "0"),
              coins2: parseFloat(parsedData.coins2 || "0"),
              coins1: parseFloat(parsedData.coins1 || "0"),
              coins050: parseFloat(parsedData.coins050 || "0"),
              coins020: parseFloat(parsedData.coins020 || "0"),
              coins010: parseFloat(parsedData.coins010 || "0"),
              coins005: parseFloat(parsedData.coins005 || "0"),
            };
            
            const notesTotal = denominations.notes100 * 100 + denominations.notes50 * 50 + 
                              denominations.notes20 * 20 + denominations.notes10 * 10 + denominations.notes5 * 5;
            const coinsTotal = denominations.coins2 * 2 + denominations.coins1 * 1 + 
                              denominations.coins050 * 0.5 + denominations.coins020 * 0.2 + 
                              denominations.coins010 * 0.1 + denominations.coins005 * 0.05;
            
            setCashOnHand(notesTotal + coinsTotal);
          }
        } catch (error) {
          console.error('Error parsing backup data:', error);
        }
      }
    }
  }, [serverFinancialData]);

  // Save financial data mutation
  const saveDataMutation = useMutation({
    mutationFn: async (data: Partial<FinancialData>) => {
      try {
        await apiRequest("PUT", "/api/financial-data", data);
      } catch (error) {
        console.log("Save error (ignored):", error);
        // Ignore auth errors for now
      }
    },
    onError: (error) => {
      console.log("Mutation error (ignored):", error);
      // Simplified error handling - no toasts for auth errors
    },
  });

  // Clear data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("DELETE", "/api/financial-data");
      } catch (error) {
        console.log("Clear error (ignored):", error);
        // Ignore auth errors for now
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-data"] });
      // Clear local state as well
      setFinancialData({});
      setCashOnHand(0);
      setWeek1Balance(0);
      setAdditionalWeekBalances({});
      toast({
        title: "Success",
        description: "All financial data has been cleared.",
      });
    },
    onError: (error) => {
      console.log("Clear mutation error (ignored):", error);
      // Simplified error handling
    },
  });

  // Auto-save when data changes with localStorage backup
  useEffect(() => {
    if (financialData && Object.keys(financialData).length > 0) {
      // Save to localStorage immediately as backup
      localStorage.setItem('fintrak-financial-data', JSON.stringify(financialData));
      localStorage.setItem('fintrak-last-update', Date.now().toString());
      
      const timeoutId = setTimeout(() => {
        saveDataMutation.mutate(financialData);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [financialData]);

  // Load backup balances on startup
  useEffect(() => {
    const week1Backup = localStorage.getItem('fintrak-week1-balance');
    const additionalBackup = localStorage.getItem('fintrak-additional-balances');
    
    if (week1Backup) {
      setWeek1Balance(parseFloat(week1Backup));
    }
    if (additionalBackup) {
      try {
        setAdditionalWeekBalances(JSON.parse(additionalBackup));
      } catch (error) {
        console.error('Error loading balance backup:', error);
      }
    }
  }, []);

  const updateFinancialData = (updates: Partial<FinancialData>) => {
    setFinancialData(prev => ({ ...prev, ...updates }));
  };

  const handleCashUpdate = (denominations: any, totalCash: number) => {
    setCashOnHand(totalCash);
    // Save cash on hand to localStorage
    localStorage.setItem('fintrak-cash-on-hand', totalCash.toString());
    
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
    // Save balance to localStorage
    localStorage.setItem('fintrak-week1-balance', balance.toString());
    
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

  const handleAdditionalWeekUpdate = (weekId: string, { incomeRows, expenseRows, balance }: {
    incomeRows: FinancialRow[];
    expenseRows: FinancialRow[];
    balance: number;
  }) => {
    setAdditionalWeekBalances(prev => {
      const updated = { ...prev, [weekId]: balance };
      // Save additional balances to localStorage
      localStorage.setItem('fintrak-additional-balances', JSON.stringify(updated));
      return updated;
    });
    
    const additionalWeeks = (financialData.additionalWeeks as any[]) || [];
    const updatedWeeks = additionalWeeks.map(week => 
      week.id === weekId 
        ? { ...week, incomeRows, expenseRows }
        : week
    );
    
    updateFinancialData({
      additionalWeeks: updatedWeeks,
    });
  };

  const addAdditionalWeek = () => {
    const additionalWeeks = (financialData.additionalWeeks as any[]) || [];
    const newWeekNumber = 3 + additionalWeeks.length;
    const newWeek = {
      id: `week-${Date.now()}`,
      weekNumber: newWeekNumber,
      name: `Week ${newWeekNumber}`,
      incomeRows: [],
      expenseRows: [],
    };
    
    updateFinancialData({
      additionalWeeks: [...additionalWeeks, newWeek],
    });
  };

  const removeAdditionalWeek = (weekId: string) => {
    const additionalWeeks = (financialData.additionalWeeks as any[]) || [];
    const updatedWeeks = additionalWeeks.filter(week => week.id !== weekId);
    
    // Renumber remaining weeks
    const renumberedWeeks = updatedWeeks.map((week, index) => ({
      ...week,
      weekNumber: 3 + index,
      name: `Week ${3 + index}`,
    }));
    
    updateFinancialData({
      additionalWeeks: renumberedWeeks,
    });
    
    // Clean up balance state
    setAdditionalWeekBalances(prev => {
      const newBalances = { ...prev };
      delete newBalances[weekId];
      return newBalances;
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
  const additionalWeeks = (financialData.additionalWeeks as AdditionalWeek[]) || [];

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/inventory"}
                className="border-primary/30 hover:bg-primary/10"
              >
                <Package className="h-4 w-4 mr-1" />
                Inventory
              </Button>
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
                onClick={() => window.location.href = '/login'}
                className="text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </Button>
            </div>

            {/* Mobile controls - next to logo */}
            <div className="md:hidden flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/inventory"}
                className="border-primary/30 hover:bg-primary/10"
              >
                <Package className="h-4 w-4" />
              </Button>
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
                className="text-destructive hover:text-destructive/80 px-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/login'}
                className="text-muted-foreground hover:text-foreground px-2"
              >
                Sign Out
              </Button>
              <ThemeSelector />
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
          {/* Cash Calculator in Card Container */}
          <div className="lg:col-span-2">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="cash-calculator" className="border border-border rounded-lg bg-card">
                <AccordionTrigger className="text-base font-medium px-6 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center">
                      <Coins className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                      <span>Cash Calculator</span>
                    </div>
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(cashOnHand)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <CashCalculator
                    denominations={denominations}
                    onUpdate={handleCashUpdate}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
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
          
          {/* Additional Weeks */}
          {additionalWeeks.map((week, index) => (
            <WeekCalculator
              key={week.id}
              weekNumber={week.weekNumber}
              weekName={week.name}
              startingBalance={
                index === 0 
                  ? week1Balance + week2IncomeRows.reduce((sum, row) => sum + row.amount, 0) - week2ExpenseRows.reduce((sum, row) => sum + row.amount, 0)
                  : additionalWeekBalances[additionalWeeks[index - 1]?.id] || 0
              }
              incomeRows={week.incomeRows}
              expenseRows={week.expenseRows}
              canRemove={true}
              onUpdate={(data) => handleAdditionalWeekUpdate(week.id, data)}
              onRemove={() => removeAdditionalWeek(week.id)}
            />
          ))}
          
          {/* Add Week Button */}
          <div className="lg:col-span-2 flex justify-center">
            <Button 
              onClick={addAdditionalWeek}
              variant="outline"
              className="w-full max-w-md border-dashed border-2 border-primary/30 hover:border-primary/50 text-primary hover:text-primary/80"
            >
              + Add Week {3 + additionalWeeks.length}
            </Button>
          </div>
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
