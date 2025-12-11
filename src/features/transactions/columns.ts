/**
 * Transactions Table Column Definitions
 * 
 * All available columns for the transaction history table
 */

import type { ColumnDef, ColumnCategory } from '../columns';

// Transaction column IDs
export type TransactionColumnId =
  // Core
  | 'date'
  | 'type'
  | 'symbol'
  | 'name'
  | 'quantity'
  | 'price'
  | 'total'
  | 'fees'
  | 'netAmount'
  // Position Impact
  | 'sharesAfter'
  | 'avgCostAfter'
  | 'realizedGain'
  | 'realizedGainPercent'
  // Context
  | 'notes'
  | 'tags'
  | 'account'
  | 'broker'
  // Tax
  | 'taxLot'
  | 'holdingPeriod'
  | 'shortVsLong';

// Column categories
export const TRANSACTION_CATEGORIES: ColumnCategory[] = [
  { id: 'core', label: 'Core', description: 'Essential transaction info' },
  { id: 'impact', label: 'Position Impact', description: 'Effect on holdings' },
  { id: 'context', label: 'Context', description: 'Additional details' },
  { id: 'tax', label: 'Tax', description: 'Tax-related information' },
];

// All column definitions
export const TRANSACTION_COLUMNS: ColumnDef<TransactionColumnId>[] = [
  // Core
  { id: 'date', label: 'Date', category: 'core', sortable: true, defaultVisible: true, hideable: false, width: 110, format: 'date', description: 'Transaction date' },
  { id: 'type', label: 'Type', category: 'core', sortable: true, defaultVisible: true, width: 100, description: 'Buy, sell, dividend, etc.' },
  { id: 'symbol', label: 'Symbol', category: 'core', sortable: true, defaultVisible: true, width: 100, description: 'Ticker symbol' },
  { id: 'name', label: 'Name', category: 'core', sortable: true, defaultVisible: true, width: 180, description: 'Investment name' },
  { id: 'quantity', label: 'Quantity', category: 'core', sortable: true, defaultVisible: true, width: 100, align: 'right', format: 'number', description: 'Number of shares' },
  { id: 'price', label: 'Price', category: 'core', sortable: true, defaultVisible: true, width: 100, align: 'right', format: 'currency', description: 'Price per share' },
  { id: 'total', label: 'Total', category: 'core', sortable: true, defaultVisible: true, width: 120, align: 'right', format: 'currency', description: 'Total transaction amount' },
  { id: 'fees', label: 'Fees', category: 'core', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'currency', description: 'Commission and fees' },
  { id: 'netAmount', label: 'Net Amount', category: 'core', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', description: 'Amount after fees' },

  // Position Impact
  { id: 'sharesAfter', label: 'Shares After', category: 'impact', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'number', description: 'Position size after trade' },
  { id: 'avgCostAfter', label: 'Avg Cost After', category: 'impact', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', description: 'Average cost after trade' },
  { id: 'realizedGain', label: 'Realized Gain', category: 'impact', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', canBeNegative: true, description: 'Realized gain/loss on sale' },
  { id: 'realizedGainPercent', label: 'Realized %', category: 'impact', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: 'Realized gain/loss %' },

  // Context
  { id: 'notes', label: 'Notes', category: 'context', sortable: false, defaultVisible: true, width: 200, description: 'Transaction notes' },
  { id: 'tags', label: 'Tags', category: 'context', sortable: false, defaultVisible: false, width: 150, description: 'Custom tags' },
  { id: 'account', label: 'Account', category: 'context', sortable: true, defaultVisible: false, width: 120, description: 'Brokerage account' },
  { id: 'broker', label: 'Broker', category: 'context', sortable: true, defaultVisible: false, width: 120, description: 'Broker name' },

  // Tax
  { id: 'taxLot', label: 'Tax Lot', category: 'tax', sortable: true, defaultVisible: false, width: 100, description: 'Tax lot identifier' },
  { id: 'holdingPeriod', label: 'Holding Period', category: 'tax', sortable: true, defaultVisible: false, width: 120, format: 'number', description: 'Days held' },
  { id: 'shortVsLong', label: 'Term', category: 'tax', sortable: true, defaultVisible: false, width: 90, description: 'Short or long term' },
];

// Default visible columns
export const DEFAULT_TRANSACTION_COLUMNS: TransactionColumnId[] = [
  'date',
  'type',
  'symbol',
  'name',
  'quantity',
  'price',
  'total',
  'notes',
];

// Helper to get column by ID
export function getTransactionColumnById(id: TransactionColumnId): ColumnDef<TransactionColumnId> | undefined {
  return TRANSACTION_COLUMNS.find(c => c.id === id);
}
