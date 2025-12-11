/**
 * Performance Table Column Definitions
 * 
 * All available columns for performance analysis tables
 */

import type { ColumnDef, ColumnCategory } from '../columns';

// Performance column IDs
export type PerformanceColumnId =
  // Identity
  | 'symbol'
  | 'name'
  | 'sector'
  // Returns
  | 'totalReturn'
  | 'annualizedReturn'
  | 'dayReturn'
  | 'weekReturn'
  | 'monthReturn'
  | 'quarterReturn'
  | 'ytdReturn'
  | 'yearReturn'
  | '3yearReturn'
  | '5yearReturn'
  // Contribution
  | 'contribution'
  | 'contributionPercent'
  | 'weight'
  // Benchmark
  | 'vsBenchmark'
  | 'alpha'
  | 'beta'
  // Risk-Adjusted
  | 'sharpeRatio'
  | 'sortinoRatio'
  | 'calmarRatio'
  | 'informationRatio'
  // Volatility
  | 'volatility'
  | 'maxDrawdown'
  | 'drawdownDays'
  | 'winRate';

// Column categories
export const PERFORMANCE_CATEGORIES: ColumnCategory[] = [
  { id: 'identity', label: 'Identity', description: 'Basic information' },
  { id: 'returns', label: 'Returns', description: 'Return metrics' },
  { id: 'contribution', label: 'Contribution', description: 'Portfolio contribution' },
  { id: 'benchmark', label: 'Benchmark', description: 'Benchmark comparison' },
  { id: 'risk_adjusted', label: 'Risk-Adjusted', description: 'Risk-adjusted returns' },
  { id: 'volatility', label: 'Volatility', description: 'Volatility metrics' },
];

// All column definitions
export const PERFORMANCE_COLUMNS: ColumnDef<PerformanceColumnId>[] = [
  // Identity
  { id: 'symbol', label: 'Symbol', category: 'identity', sortable: true, defaultVisible: true, hideable: false, width: 100, description: 'Ticker symbol' },
  { id: 'name', label: 'Name', category: 'identity', sortable: true, defaultVisible: false, width: 160, description: 'Company name' },
  { id: 'sector', label: 'Sector', category: 'identity', sortable: true, defaultVisible: false, width: 120, description: 'Industry sector' },

  // Returns
  { id: 'totalReturn', label: 'Total Return', category: 'returns', sortable: true, defaultVisible: true, width: 110, align: 'right', format: 'percent', canBeNegative: true, description: 'Total return since purchase' },
  { id: 'annualizedReturn', label: 'Ann. Return', category: 'returns', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: 'Annualized return' },
  { id: 'dayReturn', label: 'Day', category: 'returns', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', canBeNegative: true, description: "Today's return" },
  { id: 'weekReturn', label: 'Week', category: 'returns', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', canBeNegative: true, description: '1-week return' },
  { id: 'monthReturn', label: 'Month', category: 'returns', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', canBeNegative: true, description: '1-month return' },
  { id: 'quarterReturn', label: 'Quarter', category: 'returns', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', canBeNegative: true, description: 'Quarter return' },
  { id: 'ytdReturn', label: 'YTD', category: 'returns', sortable: true, defaultVisible: true, width: 80, align: 'right', format: 'percent', canBeNegative: true, description: 'Year-to-date return' },
  { id: 'yearReturn', label: '1Y', category: 'returns', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', canBeNegative: true, description: '1-year return' },
  { id: '3yearReturn', label: '3Y', category: 'returns', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', canBeNegative: true, description: '3-year annualized return' },
  { id: '5yearReturn', label: '5Y', category: 'returns', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', canBeNegative: true, description: '5-year annualized return' },

  // Contribution
  { id: 'contribution', label: 'Contribution $', category: 'contribution', sortable: true, defaultVisible: true, width: 120, align: 'right', format: 'currency', canBeNegative: true, description: 'Dollar contribution to portfolio' },
  { id: 'contributionPercent', label: 'Contribution %', category: 'contribution', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'percent', canBeNegative: true, description: 'Percentage contribution' },
  { id: 'weight', label: 'Weight', category: 'contribution', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', description: 'Portfolio weight' },

  // Benchmark
  { id: 'vsBenchmark', label: 'vs Benchmark', category: 'benchmark', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'percent', canBeNegative: true, description: 'Return vs S&P 500' },
  { id: 'alpha', label: 'Alpha', category: 'benchmark', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', canBeNegative: true, description: 'Jensen\'s alpha' },
  { id: 'beta', label: 'Beta', category: 'benchmark', sortable: true, defaultVisible: false, width: 70, align: 'right', format: 'number', description: 'Beta vs market' },

  // Risk-Adjusted
  { id: 'sharpeRatio', label: 'Sharpe', category: 'risk_adjusted', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'number', description: 'Sharpe ratio' },
  { id: 'sortinoRatio', label: 'Sortino', category: 'risk_adjusted', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'number', description: 'Sortino ratio' },
  { id: 'calmarRatio', label: 'Calmar', category: 'risk_adjusted', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'number', description: 'Calmar ratio' },
  { id: 'informationRatio', label: 'Info Ratio', category: 'risk_adjusted', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'number', description: 'Information ratio' },

  // Volatility
  { id: 'volatility', label: 'Volatility', category: 'volatility', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', description: 'Annualized volatility' },
  { id: 'maxDrawdown', label: 'Max DD', category: 'volatility', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', canBeNegative: true, description: 'Maximum drawdown' },
  { id: 'drawdownDays', label: 'DD Days', category: 'volatility', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'number', description: 'Days in max drawdown' },
  { id: 'winRate', label: 'Win Rate', category: 'volatility', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', description: 'Percentage of winning days' },
];

// Default visible columns
export const DEFAULT_PERFORMANCE_COLUMNS: PerformanceColumnId[] = [
  'symbol',
  'totalReturn',
  'ytdReturn',
  'contribution',
];

// Helper to get column by ID
export function getPerformanceColumnById(id: PerformanceColumnId): ColumnDef<PerformanceColumnId> | undefined {
  return PERFORMANCE_COLUMNS.find(c => c.id === id);
}
