import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";

interface QuickAddShortcut {
  label: string;
  amount: number;
  type: 'income' | 'expense';
}

interface QuickAddShortcutsProps {
  onAddIncome: (label: string, amount: number) => void;
  onAddExpense: (label: string, amount: number) => void;
  weekNumber: number;
}

const INCOME_SHORTCUTS: QuickAddShortcut[] = [
  { label: "Centrelink", amount: 963.53, type: 'income' },
  { label: "Sales", amount: 100, type: 'income' },
  { label: "Sales", amount: 200, type: 'income' },
  { label: "Sales", amount: 450, type: 'income' },
  { label: "D5", amount: 500, type: 'income' },
];

const EXPENSE_SHORTCUTS: QuickAddShortcut[] = [
  { label: "Restock", amount: 2000, type: 'expense' },
  { label: "Rent", amount: 1300, type: 'expense' },
  { label: "Electricity", amount: 50, type: 'expense' },
  { label: "Phone", amount: 225, type: 'expense' },
  { label: "Internet", amount: 85, type: 'expense' },
];

export function QuickAddShortcuts({ onAddIncome, onAddExpense, weekNumber }: QuickAddShortcutsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors touch-manipulation"
      >
        <h3 className="text-sm font-medium text-primary dark:text-primary">
          Quick Add - Week {weekNumber}
        </h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-primary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-primary" />
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {/* Income Shortcuts */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-primary/80 dark:text-primary/90 mb-2">Income</h4>
            <div className="flex flex-wrap gap-1">
              {INCOME_SHORTCUTS.map((shortcut, index) => (
                <Button
                  key={`${shortcut.label}-${shortcut.amount}-${index}`}
                  variant="outline"
                  size="sm"
                  onClick={() => onAddIncome(shortcut.label, shortcut.amount)}
                  className="text-xs h-7 px-2 bg-green-50 hover:bg-green-100 dark:bg-green-950/50 dark:hover:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 touch-manipulation"
                >
                  <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {shortcut.label} ${shortcut.amount}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Expense Shortcuts */}
          <div>
            <h4 className="text-xs font-medium text-primary/80 dark:text-primary/90 mb-2">Expenses</h4>
            <div className="flex flex-wrap gap-1">
              {EXPENSE_SHORTCUTS.map((shortcut, index) => (
                <Button
                  key={`${shortcut.label}-${shortcut.amount}-${index}`}
                  variant="outline"
                  size="sm"
                  onClick={() => onAddExpense(shortcut.label, shortcut.amount)}
                  className="text-xs h-7 px-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 touch-manipulation"
                >
                  <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {shortcut.label} ${shortcut.amount}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}