import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarX, CalendarPlus, Plus, Trash2, X } from "lucide-react";
import { FinancialRow } from "@shared/schema";
import { BankAccounts } from "./bank-accounts";
import { QuickAddShortcuts } from "./quick-add-shortcuts";
import { formatCurrency } from "@/lib/utils";

type WeekCalculatorProps = {
  weekNumber: number;
  weekName?: string;
  cashOnHand?: number;
  bankBalance?: number;
  startingBalance?: number;
  bankAccountRows?: FinancialRow[];
  incomeRows: FinancialRow[];
  expenseRows: FinancialRow[];
  canRemove?: boolean;
  onUpdate: (data: {
    incomeRows: FinancialRow[];
    expenseRows: FinancialRow[];
    bankAccountRows?: FinancialRow[];
    balance: number;
  }) => void;
  onRemove?: () => void;
};

export function WeekCalculator({ 
  weekNumber, 
  weekName,
  cashOnHand = 0,
  bankBalance = 0,
  startingBalance = 0,
  bankAccountRows: initialBankAccountRows = [],
  incomeRows: initialIncomeRows,
  expenseRows: initialExpenseRows,
  canRemove = false,
  onUpdate,
  onRemove
}: WeekCalculatorProps) {
  const [incomeRows, setIncomeRows] = useState<FinancialRow[]>(initialIncomeRows);
  const [expenseRows, setExpenseRows] = useState<FinancialRow[]>(initialExpenseRows);
  const [bankAccountRows, setBankAccountRows] = useState<FinancialRow[]>(initialBankAccountRows);

  // Use a ref to track if we've initialized to prevent infinite loops
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized) {
      setIncomeRows(initialIncomeRows || []);
      setExpenseRows(initialExpenseRows || []);
      setBankAccountRows(initialBankAccountRows || []);
      setIsInitialized(true);
    }
  }, [initialIncomeRows, initialExpenseRows, initialBankAccountRows, isInitialized]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const calculateBalance = (income: FinancialRow[], expenses: FinancialRow[], bankAccounts: FinancialRow[]) => {
    const totalIncome = income.reduce((sum, row) => sum + row.amount, 0);
    const totalExpenses = expenses.reduce((sum, row) => sum + row.amount, 0);
    const totalBankBalance = bankAccounts.reduce((sum, row) => sum + row.amount, 0);
    
    if (weekNumber === 1) {
      // Week 1: Cash + Bank Accounts + Income - Expenses
      return cashOnHand + totalBankBalance + totalIncome - totalExpenses;
    } else {
      // Week 2: Starting Balance (from Week 1) + Income - Expenses
      return startingBalance + totalIncome - totalExpenses;
    }
  };

  const updateCalculations = (income: FinancialRow[], expenses: FinancialRow[], bankAccounts: FinancialRow[] = bankAccountRows) => {
    const balance = calculateBalance(income, expenses, bankAccounts);
    const updateData: any = { incomeRows: income, expenseRows: expenses, balance };
    if (weekNumber === 1) {
      updateData.bankAccountRows = bankAccounts;
    }
    

    
    onUpdate(updateData);
  };

  const addIncomeRow = () => {
    const newRow: FinancialRow = {
      id: generateId(),
      label: weekNumber === 1 ? "Expected Sales" : "Projected Sales",
      amount: 0,
    };
    const updatedRows = [...incomeRows, newRow];
    setIncomeRows(updatedRows);
    updateCalculations(updatedRows, expenseRows, bankAccountRows);
  };

  const addExpenseRow = () => {
    const newRow: FinancialRow = {
      id: generateId(),
      label: weekNumber === 1 ? "Rent Payment" : "Utilities",
      amount: 0,
    };
    const updatedRows = [...expenseRows, newRow];
    setExpenseRows(updatedRows);
    updateCalculations(incomeRows, updatedRows, bankAccountRows);
  };

  const updateIncomeRow = (id: string, field: 'label' | 'amount', value: string | number) => {
    const updatedRows = incomeRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    );
    setIncomeRows(updatedRows);
    updateCalculations(updatedRows, expenseRows, bankAccountRows);
  };

  const updateExpenseRow = (id: string, field: 'label' | 'amount', value: string | number) => {
    const updatedRows = expenseRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    );
    setExpenseRows(updatedRows);
    updateCalculations(incomeRows, updatedRows, bankAccountRows);
  };

  const removeIncomeRow = (id: string) => {
    const updatedRows = incomeRows.filter(row => row.id !== id);
    setIncomeRows(updatedRows);
    updateCalculations(updatedRows, expenseRows, bankAccountRows);
  };

  const removeExpenseRow = (id: string) => {
    const updatedRows = expenseRows.filter(row => row.id !== id);
    setExpenseRows(updatedRows);
    updateCalculations(incomeRows, updatedRows, bankAccountRows);
  };

  const handleBankAccountUpdate = ({ bankAccountRows: updatedBankAccounts }: { bankAccountRows: FinancialRow[]; totalBankBalance: number }) => {
    setBankAccountRows(updatedBankAccounts);
    updateCalculations(incomeRows, expenseRows, updatedBankAccounts);
  };

  const handleQuickAddIncome = (label: string, amount: number) => {
    const newRow: FinancialRow = {
      id: `income-${Date.now()}-${Math.random()}`,
      label,
      amount
    };
    const updatedIncome = [...incomeRows, newRow];
    setIncomeRows(updatedIncome);
    updateCalculations(updatedIncome, expenseRows, bankAccountRows);
  };

  const handleQuickAddExpense = (label: string, amount: number) => {
    const newRow: FinancialRow = {
      id: `expense-${Date.now()}-${Math.random()}`,
      label,
      amount
    };
    const updatedExpenses = [...expenseRows, newRow];
    setExpenseRows(updatedExpenses);
    updateCalculations(incomeRows, updatedExpenses, bankAccountRows);
  };

  const totalIncome = incomeRows.reduce((sum, row) => sum + row.amount, 0);
  const totalExpenses = expenseRows.reduce((sum, row) => sum + row.amount, 0);
  const totalBankBalance = bankAccountRows.reduce((sum, row) => sum + row.amount, 0);
  const balance = calculateBalance(incomeRows, expenseRows, bankAccountRows);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {weekNumber === 1 ? (
              <CalendarX className="mr-3 h-5 w-5 text-primary" />
            ) : (
              <CalendarPlus className="mr-3 h-5 w-5 text-primary" />
            )}
            {weekName || (weekNumber === 1 ? "Current Week" : weekNumber === 2 ? "Next Week" : `Week ${weekNumber}`)}
          </div>
          {canRemove && onRemove && (
            <Button
              variant="ghost" 
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cash on Hand / Starting Balance */}
        <div>
          <Label className="text-sm font-medium text-muted-foreground">
            {weekNumber === 1 ? "Cash on Hand" : `Starting Balance (from Week ${weekNumber - 1})`}
          </Label>
          <div className="relative mt-2">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              type="text"
              value={weekNumber === 1 ? cashOnHand.toFixed(2) : startingBalance.toFixed(2)}
              readOnly
              className="pl-8 text-lg font-medium text-right bg-input text-foreground border-border"
              step="0.01"
            />
          </div>
        </div>

        {/* Bank Accounts - Only show in Week 1 */}
        {weekNumber === 1 && (
          <BankAccounts
            bankAccountRows={bankAccountRows}
            onUpdate={handleBankAccountUpdate}
          />
        )}

        {/* Quick Add Shortcuts */}
        <QuickAddShortcuts
          weekNumber={weekNumber}
          onAddIncome={handleQuickAddIncome}
          onAddExpense={handleQuickAddExpense}
        />

        {/* Income Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Income {weekNumber === 1 ? "This Week" : "Next Week"}
            </h3>
            <Button onClick={addIncomeRow} size="sm" className="bg-primary text-white touch-manipulation">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add Row</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
          <div className="space-y-3">
            {incomeRows.map(row => (
              <div key={row.id} className="flex items-center space-x-2 sm:space-x-3">
                <Input
                  value={row.label}
                  onChange={(e) => updateIncomeRow(row.id, 'label', e.target.value)}
                  placeholder="Income source..."
                  className="flex-1 text-base sm:text-sm touch-manipulation bg-input text-foreground border-border"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={row.amount || ""}
                    onChange={(e) => updateIncomeRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-28 sm:w-32 pl-8 text-right text-base sm:text-sm touch-manipulation bg-input text-foreground border-border"
                    step="0.01"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIncomeRow(row.id)}
                  className="text-destructive hover:text-destructive/80 p-2 touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <span className="text-sm text-muted-foreground">Total Income: </span>
            <span className="text-sm font-semibold text-green-400">
              {formatCurrency(totalIncome)}
            </span>
          </div>
        </div>

        {/* Expenses Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Expenses {weekNumber === 1 ? "This Week" : "Next Week"}
            </h3>
            <Button onClick={addExpenseRow} size="sm" className="bg-primary text-white touch-manipulation">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add Row</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
          <div className="space-y-3">
            {expenseRows.map(row => (
              <div key={row.id} className="flex items-center space-x-2 sm:space-x-3">
                <Input
                  value={row.label}
                  onChange={(e) => updateExpenseRow(row.id, 'label', e.target.value)}
                  placeholder="Expense item..."
                  className="flex-1 text-base sm:text-sm touch-manipulation bg-input text-foreground border-border"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={row.amount || ""}
                    onChange={(e) => updateExpenseRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-28 sm:w-32 pl-8 text-right text-base sm:text-sm touch-manipulation bg-input text-foreground border-border"
                    step="0.01"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExpenseRow(row.id)}
                  className="text-destructive hover:text-destructive/80 p-2 touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right">
            <span className="text-sm text-muted-foreground">Total Expenses: </span>
            <span className="text-sm font-semibold text-red-400">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>

        {/* Balance */}
        <div className="border-t border-border pt-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">
              Week {weekNumber} Balance
            </div>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(balance)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {weekNumber === 1 ? "Cash + Bank Accounts + Income - Expenses" : "Week 1 Balance + Income - Expenses"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
