/**
 * Dividends Table Column Definitions
 * 
 * All available columns for dividend holdings and payment tables
 */

import type { ColumnDef, ColumnCategory } from '../columns';

// Dividend holdings column IDs
export type DividendHoldingColumnId =
  // Identity
  | 'symbol'
  | 'name'
  | 'sector'
  // Position
  | 'shares'
  | 'value'
  | 'weight'
  // Yield
  | 'yield'
  | 'yieldOnCost'
  | 'dividendAmount'
  // Income
  | 'annualIncome'
  | 'quarterlyIncome'
  | 'monthlyIncome'
  // Schedule
  | 'frequency'
  | 'lastPaid'
  | 'nextPay'
  | 'daysUntilNext'
  | 'exDivDate'
  // History
  | 'divGrowth1Y'
  | 'divGrowth5Y'
  | 'yearsGrowing'
  // Safety
  | 'payoutRatio'
  | 'cashFlowPayout'
  | 'divSafetyScore';

// Upcoming payment column IDs
export type DividendPaymentColumnId =
  | 'symbol'
  | 'name'
  | 'payDate'
  | 'exDivDate'
  | 'daysUntil'
  | 'expectedAmount'
  | 'shares'
  | 'yield'
  | 'frequency';

// Column categories
export const DIVIDEND_HOLDING_CATEGORIES: ColumnCategory[] = [
  { id: 'identity', label: 'Identity', description: 'Basic information' },
  { id: 'position', label: 'Position', description: 'Holdings info' },
  { id: 'yield', label: 'Yield', description: 'Dividend yield metrics' },
  { id: 'income', label: 'Income', description: 'Income projections' },
  { id: 'schedule', label: 'Schedule', description: 'Payment schedule' },
  { id: 'history', label: 'History', description: 'Dividend history' },
  { id: 'safety', label: 'Safety', description: 'Dividend safety metrics' },
];

export const DIVIDEND_PAYMENT_CATEGORIES: ColumnCategory[] = [
  { id: 'identity', label: 'Identity', description: 'Basic information' },
  { id: 'schedule', label: 'Schedule', description: 'Payment timing' },
  { id: 'amount', label: 'Amount', description: 'Payment details' },
];

// Dividend Holdings columns
export const DIVIDEND_HOLDING_COLUMNS: ColumnDef<DividendHoldingColumnId>[] = [
  // Identity
  { id: 'symbol', label: 'Symbol', category: 'identity', sortable: true, defaultVisible: true, hideable: false, width: 100, description: 'Ticker symbol' },
  { id: 'name', label: 'Name', category: 'identity', sortable: true, defaultVisible: true, width: 160, description: 'Company name' },
  { id: 'sector', label: 'Sector', category: 'identity', sortable: true, defaultVisible: false, width: 120, description: 'Industry sector' },

  // Position
  { id: 'shares', label: 'Shares', category: 'position', sortable: true, defaultVisible: true, width: 90, align: 'right', format: 'number', description: 'Shares held' },
  { id: 'value', label: 'Value', category: 'position', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', description: 'Position value' },
  { id: 'weight', label: 'Weight', category: 'position', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', description: 'Portfolio weight' },

  // Yield
  { id: 'yield', label: 'Yield', category: 'yield', sortable: true, defaultVisible: true, width: 80, align: 'right', format: 'percent', description: 'Current dividend yield' },
  { id: 'yieldOnCost', label: 'YOC', category: 'yield', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', description: 'Yield on cost basis' },
  { id: 'dividendAmount', label: 'Div/Share', category: 'yield', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'currency', description: 'Dividend per share' },

  // Income
  { id: 'annualIncome', label: 'Annual', category: 'income', sortable: true, defaultVisible: true, width: 100, align: 'right', format: 'currency', description: 'Projected annual income' },
  { id: 'quarterlyIncome', label: 'Quarterly', category: 'income', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'currency', description: 'Projected quarterly income' },
  { id: 'monthlyIncome', label: 'Monthly', category: 'income', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'currency', description: 'Projected monthly income' },

  // Schedule
  { id: 'frequency', label: 'Frequency', category: 'schedule', sortable: true, defaultVisible: true, width: 100, description: 'Payment frequency' },
  { id: 'lastPaid', label: 'Last Paid', category: 'schedule', sortable: true, defaultVisible: false, width: 100, format: 'date', description: 'Last payment date' },
  { id: 'nextPay', label: 'Next Pay', category: 'schedule', sortable: true, defaultVisible: false, width: 100, format: 'date', description: 'Next payment date' },
  { id: 'daysUntilNext', label: 'Days Until', category: 'schedule', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'number', description: 'Days until next payment' },
  { id: 'exDivDate', label: 'Ex-Div Date', category: 'schedule', sortable: true, defaultVisible: false, width: 100, format: 'date', description: 'Next ex-dividend date' },

  // History
  { id: 'divGrowth1Y', label: '1Y Growth', category: 'history', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', canBeNegative: true, description: '1-year dividend growth' },
  { id: 'divGrowth5Y', label: '5Y Growth', category: 'history', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', canBeNegative: true, description: '5-year CAGR dividend growth' },
  { id: 'yearsGrowing', label: 'Years Growing', category: 'history', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'number', description: 'Consecutive years of dividend growth' },

  // Safety
  { id: 'payoutRatio', label: 'Payout Ratio', category: 'safety', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', description: 'Earnings payout ratio' },
  { id: 'cashFlowPayout', label: 'CF Payout', category: 'safety', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', description: 'Cash flow payout ratio' },
  { id: 'divSafetyScore', label: 'Safety Score', category: 'safety', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'number', description: 'Dividend safety score (1-100)' },
];

// Upcoming payment columns
export const DIVIDEND_PAYMENT_COLUMNS: ColumnDef<DividendPaymentColumnId>[] = [
  { id: 'symbol', label: 'Symbol', category: 'identity', sortable: true, defaultVisible: true, hideable: false, width: 100, description: 'Ticker symbol' },
  { id: 'name', label: 'Name', category: 'identity', sortable: true, defaultVisible: false, width: 160, description: 'Company name' },
  { id: 'payDate', label: 'Pay Date', category: 'schedule', sortable: true, defaultVisible: true, width: 100, format: 'date', description: 'Payment date' },
  { id: 'exDivDate', label: 'Ex-Div Date', category: 'schedule', sortable: true, defaultVisible: false, width: 100, format: 'date', description: 'Ex-dividend date' },
  { id: 'daysUntil', label: 'Days', category: 'schedule', sortable: true, defaultVisible: true, width: 70, align: 'right', format: 'number', description: 'Days until payment' },
  { id: 'expectedAmount', label: 'Expected', category: 'amount', sortable: true, defaultVisible: true, width: 100, align: 'right', format: 'currency', description: 'Expected payment amount' },
  { id: 'shares', label: 'Shares', category: 'amount', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'number', description: 'Shares held' },
  { id: 'yield', label: 'Yield', category: 'amount', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', description: 'Dividend yield' },
  { id: 'frequency', label: 'Frequency', category: 'amount', sortable: true, defaultVisible: false, width: 100, description: 'Payment frequency' },
];

// Default visible columns
export const DEFAULT_DIVIDEND_HOLDING_COLUMNS: DividendHoldingColumnId[] = [
  'symbol',
  'name',
  'shares',
  'yield',
  'frequency',
  'annualIncome',
];

export const DEFAULT_DIVIDEND_PAYMENT_COLUMNS: DividendPaymentColumnId[] = [
  'symbol',
  'expectedAmount',
  'payDate',
  'daysUntil',
];

// Helpers
export function getDividendHoldingColumnById(id: DividendHoldingColumnId): ColumnDef<DividendHoldingColumnId> | undefined {
  return DIVIDEND_HOLDING_COLUMNS.find(c => c.id === id);
}

export function getDividendPaymentColumnById(id: DividendPaymentColumnId): ColumnDef<DividendPaymentColumnId> | undefined {
  return DIVIDEND_PAYMENT_COLUMNS.find(c => c.id === id);
}
