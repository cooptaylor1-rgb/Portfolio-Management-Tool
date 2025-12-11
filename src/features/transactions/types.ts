/**
 * Transactions Feature Types + Helpers
 *
 * Used by the Transactions blotter view (client-side).
 */

export type TransactionType =
  | 'buy'
  | 'sell'
  | 'dividend'
  | 'interest'
  | 'fee'
  | 'transfer'
  // Present in demo data / context
  | 'split';

export interface TransactionRow {
  id: string;
  date: string;
  type: TransactionType;
  symbol: string;
  name?: string;
  quantity: number;
  price: number;
  /** Unsigned notionals (quantity * price) */
  notional: number;
  /** Signed cash impact (+inflow, -outflow) */
  cashImpact: number;
  currency?: string;
  notes?: string;
  sourceAccount?: string;
}

export interface TransactionFilters {
  text: string;
  types: TransactionType[]; // empty => all
  dateFrom?: string; // yyyy-mm-dd
  dateTo?: string; // yyyy-mm-dd
  minAbsNotional?: number;
  maxAbsNotional?: number;
}

export function getTransactionTypeLabel(type: TransactionType): string {
  switch (type) {
    case 'buy':
      return 'Buy';
    case 'sell':
      return 'Sell';
    case 'dividend':
      return 'Dividend';
    case 'interest':
      return 'Interest';
    case 'fee':
      return 'Fee';
    case 'transfer':
      return 'Transfer';
    case 'split':
      return 'Split';
    default:
      return type;
  }
}

export function computeTransactionSummary(rows: TransactionRow[]) {
  const totalBought = rows
    .filter(r => r.type === 'buy')
    .reduce((sum, r) => sum + r.notional, 0);

  const totalSold = rows
    .filter(r => r.type === 'sell')
    .reduce((sum, r) => sum + r.notional, 0);

  const dividendsReceived = rows
    .filter(r => r.type === 'dividend' || r.type === 'interest')
    .reduce((sum, r) => sum + r.notional, 0);

  const feesPaid = rows
    .filter(r => r.type === 'fee')
    .reduce((sum, r) => sum + r.notional, 0);

  return {
    count: rows.length,
    totalBought,
    totalSold,
    netInvested: totalBought - totalSold,
    dividendsReceived,
    feesPaid,
    netCashFlow: rows.reduce((sum, r) => sum + r.cashImpact, 0),
  };
}

export function applyTransactionFilters(rows: TransactionRow[], filters: TransactionFilters) {
  const text = filters.text.trim().toLowerCase();
  const typeSet = new Set(filters.types);

  const fromTime = filters.dateFrom ? new Date(filters.dateFrom).getTime() : undefined;
  const toTime = filters.dateTo ? new Date(filters.dateTo).getTime() : undefined;

  return rows.filter(r => {
    if (text) {
      const haystack = `${r.symbol} ${r.name ?? ''} ${r.notes ?? ''}`.toLowerCase();
      if (!haystack.includes(text)) return false;
    }

    if (typeSet.size > 0 && !typeSet.has(r.type)) return false;

    const time = new Date(r.date).getTime();
    if (fromTime != null && time < fromTime) return false;
    if (toTime != null && time > toTime) return false;

    const absNotional = Math.abs(r.notional);
    if (filters.minAbsNotional != null && absNotional < filters.minAbsNotional) return false;
    if (filters.maxAbsNotional != null && absNotional > filters.maxAbsNotional) return false;

    return true;
  });
}
