import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Trash2 } from "lucide-react";
import { FinancialRow } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

type BankAccountsProps = {
  bankAccountRows: FinancialRow[];
  onUpdate: (data: {
    bankAccountRows: FinancialRow[];
    totalBankBalance: number;
  }) => void;
};

export function BankAccounts({ bankAccountRows: initialBankAccountRows, onUpdate }: BankAccountsProps) {
  const [bankAccountRows, setBankAccountRows] = useState<FinancialRow[]>(initialBankAccountRows);

  useEffect(() => {
    // Ensure default bank accounts exist
    let updatedRows = [...initialBankAccountRows];
    
    // Check if default accounts exist, if not add them
    const defaultAccounts = [
      { id: "amp-default", label: "AMP", amount: 0 },
      { id: "anz-default", label: "ANZ", amount: 0 }
    ];
    
    defaultAccounts.forEach(defaultAccount => {
      const exists = updatedRows.some(row => row.label === defaultAccount.label);
      if (!exists) {
        updatedRows.push(defaultAccount);
      }
    });
    
    setBankAccountRows(updatedRows);
    
    // If we added new accounts, trigger an update
    if (updatedRows.length > initialBankAccountRows.length) {
      updateCalculations(updatedRows);
    }
  }, [initialBankAccountRows]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const calculateTotalBalance = (accounts: FinancialRow[]) => {
    return accounts.reduce((sum, row) => sum + row.amount, 0);
  };

  const updateCalculations = (accounts: FinancialRow[]) => {
    const totalBankBalance = calculateTotalBalance(accounts);
    onUpdate({ bankAccountRows: accounts, totalBankBalance });
  };

  const addBankAccountRow = () => {
    const newRow: FinancialRow = {
      id: generateId(),
      label: "Checking Account",
      amount: 0,
    };
    const updatedRows = [...bankAccountRows, newRow];
    setBankAccountRows(updatedRows);
    updateCalculations(updatedRows);
  };

  const updateBankAccountRow = (id: string, field: 'label' | 'amount', value: string | number) => {
    const updatedRows = bankAccountRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    );
    setBankAccountRows(updatedRows);
    updateCalculations(updatedRows);
  };

  const removeBankAccountRow = (id: string) => {
    const updatedRows = bankAccountRows.filter(row => row.id !== id);
    setBankAccountRows(updatedRows);
    updateCalculations(updatedRows);
  };

  const totalBalance = calculateTotalBalance(bankAccountRows);

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="mr-3 h-5 w-5 text-primary" />
            <h3 className="text-sm font-medium text-foreground/85">
              Bank Accounts
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-lg font-bold text-primary">
              {formatCurrency(totalBalance)}
            </div>
            <Button onClick={addBankAccountRow} size="sm" className="bg-primary text-white touch-manipulation">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add Account</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          {bankAccountRows.map(row => (
            <div key={row.id} className="flex items-center space-x-2 p-2 bg-card rounded-lg">
              <Input
                value={row.label}
                onChange={(e) => updateBankAccountRow(row.id, 'label', e.target.value)}
                placeholder="Account name..."
                className="flex-1 text-base sm:text-sm touch-manipulation"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={row.amount || ""}
                  onChange={(e) => updateBankAccountRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-28 sm:w-32 pl-8 text-right text-base sm:text-sm touch-manipulation"
                  step="0.01"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeBankAccountRow(row.id)}
                className="text-red-500 hover:text-red-700 p-2 touch-manipulation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {bankAccountRows.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Building2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No bank accounts added yet</p>
            </div>
          )}
        </div>
        
        {bankAccountRows.length > 0 && (
          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground/85">
                Total Bank Balance:
              </span>
              <span className="text-sm font-semibold text-primary">
                {formatCurrency(totalBalance)}
              </span>
            </div>
          </div>
        )}
    </div>
  );
}