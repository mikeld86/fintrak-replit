import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type CashDenominations = {
  notes100: number;
  notes50: number;
  notes20: number;
  notes10: number;
  notes5: number;
  coins2: number;
  coins1: number;
  coins050: number;
  coins020: number;
  coins010: number;
  coins005: number;
};

type CashCalculatorProps = {
  denominations: CashDenominations;
  onUpdate: (denominations: CashDenominations, totalCash: number) => void;
};

const noteValues = [
  { key: "notes100" as keyof CashDenominations, label: "$100", value: 100 },
  { key: "notes50" as keyof CashDenominations, label: "$50", value: 50 },
  { key: "notes20" as keyof CashDenominations, label: "$20", value: 20 },
  { key: "notes10" as keyof CashDenominations, label: "$10", value: 10 },
  { key: "notes5" as keyof CashDenominations, label: "$5", value: 5 },
];

const coinValues = [
  { key: "coins2" as keyof CashDenominations, label: "$2", value: 2 },
  { key: "coins1" as keyof CashDenominations, label: "$1", value: 1 },
  { key: "coins050" as keyof CashDenominations, label: "$0.50", value: 0.5 },
  { key: "coins020" as keyof CashDenominations, label: "$0.20", value: 0.2 },
  { key: "coins010" as keyof CashDenominations, label: "$0.10", value: 0.1 },
  { key: "coins005" as keyof CashDenominations, label: "$0.05", value: 0.05 },
];

export function CashCalculator({ denominations, onUpdate }: CashCalculatorProps) {
  const [localDenominations, setLocalDenominations] = useState<CashDenominations>(denominations);

  useEffect(() => {
    setLocalDenominations(denominations);
  }, [denominations]);

  const updateDenomination = (key: keyof CashDenominations, quantity: number) => {
    const updated = { ...localDenominations, [key]: Math.max(0, quantity) };
    setLocalDenominations(updated);
    
    // Calculate totals
    const notesTotal = noteValues.reduce((sum, note) => sum + (updated[note.key] * note.value), 0);
    const coinsTotal = coinValues.reduce((sum, coin) => sum + (updated[coin.key] * coin.value), 0);
    const totalCash = notesTotal + coinsTotal;
    
    onUpdate(updated, totalCash);
  };

  const notesTotal = noteValues.reduce((sum, note) => sum + (localDenominations[note.key] * note.value), 0);
  const coinsTotal = coinValues.reduce((sum, coin) => sum + (localDenominations[coin.key] * coin.value), 0);
  const totalCash = notesTotal + coinsTotal;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* Notes */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Australian Notes
        </h3>
        <div className="space-y-3">
          {noteValues.map(note => {
            const quantity = localDenominations[note.key];
            const subtotal = quantity * note.value;
            
            return (
              <div key={note.key} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <span className="text-sm font-medium text-card-foreground min-w-0 flex-1">
                  {note.label}
                </span>
                <div className="flex items-center space-x-2 sm:space-x-3 ml-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={quantity || ""}
                    onChange={(e) => updateDenomination(note.key, parseInt(e.target.value) || 0)}
                    className="w-16 sm:w-16 text-right text-base sm:text-sm touch-manipulation bg-input text-foreground border-border"
                    min="0"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground w-14 sm:w-16 text-right">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Notes Total:
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(notesTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coins */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Australian Coins
        </h3>
        <div className="space-y-3">
          {coinValues.map(coin => {
            const quantity = localDenominations[coin.key];
            const subtotal = quantity * coin.value;
            
            return (
              <div key={coin.key} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                <span className="text-sm font-medium text-card-foreground min-w-0 flex-1">
                  {coin.label}
                </span>
                <div className="flex items-center space-x-2 sm:space-x-3 ml-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={quantity || ""}
                    onChange={(e) => updateDenomination(coin.key, parseInt(e.target.value) || 0)}
                    className="w-16 sm:w-16 text-right text-base sm:text-sm touch-manipulation bg-input text-foreground border-border"
                    min="0"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground w-14 sm:w-16 text-right">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Coins Total:
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(coinsTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Total */}
      <div className="md:col-span-2 border-t-2 border-primary pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-muted-foreground">
            Total Cash on Hand:
          </span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(totalCash)}
          </span>
        </div>
      </div>
    </div>
  );
}