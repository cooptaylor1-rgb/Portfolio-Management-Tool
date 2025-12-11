/**
 * Positions Table Column Definitions
 * 
 * All available columns for the positions/holdings table
 */

import type { ColumnDef, ColumnCategory } from '../columns';

// Position column IDs
export type PositionColumnId =
  // Identity
  | 'symbol'
  | 'name'
  | 'type'
  | 'sector'
  | 'industry'
  // Quantity & Price
  | 'quantity'
  | 'price'
  | 'avgCost'
  | 'lastTradeDate'
  // Value
  | 'value'
  | 'costBasis'
  | 'weight'
  // Performance
  | 'gain'
  | 'gainPercent'
  | 'dayChange'
  | 'dayChangePercent'
  | 'weekChange'
  | 'monthChange'
  | 'ytdChange'
  | 'yearChange'
  // Valuation
  | 'peRatio'
  | 'pbRatio'
  | 'psRatio'
  | 'evEbitda'
  | 'pegRatio'
  // Fundamentals
  | 'marketCap'
  | 'enterpriseValue'
  | 'revenue'
  | 'netIncome'
  | 'eps'
  | 'epsGrowth'
  | 'revenueGrowth'
  // Profitability
  | 'grossMargin'
  | 'operatingMargin'
  | 'netMargin'
  | 'roe'
  | 'roa'
  | 'roic'
  // Dividend
  | 'dividendYield'
  | 'dividendAmount'
  | 'payoutRatio'
  | 'exDivDate'
  // Risk
  | 'beta'
  | 'volatility'
  | 'sharpeRatio'
  | 'maxDrawdown'
  // Technical
  | 'rsi'
  | 'sma50'
  | 'sma200'
  | 'distFrom52High'
  | 'distFrom52Low'
  // Analyst
  | 'analystRating'
  | 'priceTarget'
  | 'targetUpside';

// Column categories
export const POSITION_CATEGORIES: ColumnCategory[] = [
  { id: 'identity', label: 'Identity', description: 'Basic information' },
  { id: 'quantity', label: 'Quantity & Price', description: 'Holdings and pricing' },
  { id: 'value', label: 'Value', description: 'Position value and weight' },
  { id: 'performance', label: 'Performance', description: 'Returns and changes' },
  { id: 'valuation', label: 'Valuation', description: 'Valuation multiples' },
  { id: 'fundamentals', label: 'Fundamentals', description: 'Financial metrics' },
  { id: 'profitability', label: 'Profitability', description: 'Margin and returns' },
  { id: 'dividend', label: 'Dividend', description: 'Dividend information' },
  { id: 'risk', label: 'Risk', description: 'Risk metrics' },
  { id: 'technical', label: 'Technical', description: 'Technical indicators' },
  { id: 'analyst', label: 'Analyst', description: 'Analyst ratings' },
];

// All column definitions
export const POSITION_COLUMNS: ColumnDef<PositionColumnId>[] = [
  // Identity
  { id: 'symbol', label: 'Symbol', category: 'identity', sortable: true, defaultVisible: true, hideable: false, width: 120, description: 'Ticker symbol' },
  { id: 'name', label: 'Name', category: 'identity', sortable: true, defaultVisible: true, width: 180, description: 'Company name' },
  { id: 'type', label: 'Type', category: 'identity', sortable: true, defaultVisible: false, width: 100, description: 'Asset type (stock, ETF, etc.)' },
  { id: 'sector', label: 'Sector', category: 'identity', sortable: true, defaultVisible: true, width: 120, description: 'Industry sector' },
  { id: 'industry', label: 'Industry', category: 'identity', sortable: true, defaultVisible: false, width: 140, description: 'Specific industry' },

  // Quantity & Price
  { id: 'quantity', label: 'Shares', category: 'quantity', sortable: true, defaultVisible: true, width: 100, align: 'right', format: 'number', description: 'Number of shares held' },
  { id: 'price', label: 'Price', category: 'quantity', sortable: true, defaultVisible: true, width: 100, align: 'right', format: 'currency', description: 'Current market price' },
  { id: 'avgCost', label: 'Avg Cost', category: 'quantity', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'currency', description: 'Average cost basis per share' },
  { id: 'lastTradeDate', label: 'Last Trade', category: 'quantity', sortable: true, defaultVisible: false, width: 110, format: 'date', description: 'Date of last trade' },

  // Value
  { id: 'value', label: 'Market Value', category: 'value', sortable: true, defaultVisible: true, width: 120, align: 'right', format: 'currency', description: 'Current market value' },
  { id: 'costBasis', label: 'Cost Basis', category: 'value', sortable: true, defaultVisible: true, width: 120, align: 'right', format: 'currency', description: 'Total cost basis' },
  { id: 'weight', label: 'Weight', category: 'value', sortable: true, defaultVisible: true, width: 80, align: 'right', format: 'percent', description: 'Portfolio weight %' },

  // Performance
  { id: 'gain', label: 'Gain/Loss $', category: 'performance', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', canBeNegative: true, description: 'Unrealized gain/loss in dollars' },
  { id: 'gainPercent', label: 'Total Return', category: 'performance', sortable: true, defaultVisible: true, width: 110, align: 'right', format: 'percent', canBeNegative: true, description: 'Total return since purchase' },
  { id: 'dayChange', label: 'Day Chg $', category: 'performance', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'currency', canBeNegative: true, description: 'Today\'s change in dollars' },
  { id: 'dayChangePercent', label: 'Day Chg %', category: 'performance', sortable: true, defaultVisible: true, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: 'Today\'s change %' },
  { id: 'weekChange', label: 'Week Chg', category: 'performance', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: '1-week change %' },
  { id: 'monthChange', label: 'Month Chg', category: 'performance', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: '1-month change %' },
  { id: 'ytdChange', label: 'YTD Chg', category: 'performance', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: 'Year-to-date change %' },
  { id: 'yearChange', label: '1Y Chg', category: 'performance', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: '1-year change %' },

  // Valuation
  { id: 'peRatio', label: 'P/E', category: 'valuation', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'number', description: 'Price to earnings ratio' },
  { id: 'pbRatio', label: 'P/B', category: 'valuation', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'number', description: 'Price to book ratio' },
  { id: 'psRatio', label: 'P/S', category: 'valuation', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'number', description: 'Price to sales ratio' },
  { id: 'evEbitda', label: 'EV/EBITDA', category: 'valuation', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'number', description: 'Enterprise value to EBITDA' },
  { id: 'pegRatio', label: 'PEG', category: 'valuation', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'number', description: 'P/E to growth ratio' },

  // Fundamentals
  { id: 'marketCap', label: 'Market Cap', category: 'fundamentals', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', description: 'Market capitalization' },
  { id: 'enterpriseValue', label: 'Ent. Value', category: 'fundamentals', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', description: 'Enterprise value' },
  { id: 'revenue', label: 'Revenue', category: 'fundamentals', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', description: 'Annual revenue' },
  { id: 'netIncome', label: 'Net Income', category: 'fundamentals', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', description: 'Annual net income' },
  { id: 'eps', label: 'EPS', category: 'fundamentals', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'currency', description: 'Earnings per share' },
  { id: 'epsGrowth', label: 'EPS Growth', category: 'fundamentals', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: 'EPS growth rate' },
  { id: 'revenueGrowth', label: 'Rev Growth', category: 'fundamentals', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: 'Revenue growth rate' },

  // Profitability
  { id: 'grossMargin', label: 'Gross Margin', category: 'profitability', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'percent', description: 'Gross profit margin' },
  { id: 'operatingMargin', label: 'Op. Margin', category: 'profitability', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', description: 'Operating margin' },
  { id: 'netMargin', label: 'Net Margin', category: 'profitability', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', description: 'Net profit margin' },
  { id: 'roe', label: 'ROE', category: 'profitability', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', description: 'Return on equity' },
  { id: 'roa', label: 'ROA', category: 'profitability', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', description: 'Return on assets' },
  { id: 'roic', label: 'ROIC', category: 'profitability', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', description: 'Return on invested capital' },

  // Dividend
  { id: 'dividendYield', label: 'Div Yield', category: 'dividend', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', description: 'Annual dividend yield' },
  { id: 'dividendAmount', label: 'Div Amount', category: 'dividend', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'currency', description: 'Annual dividend per share' },
  { id: 'payoutRatio', label: 'Payout Ratio', category: 'dividend', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', description: 'Dividend payout ratio' },
  { id: 'exDivDate', label: 'Ex-Div Date', category: 'dividend', sortable: true, defaultVisible: false, width: 100, format: 'date', description: 'Next ex-dividend date' },

  // Risk
  { id: 'beta', label: 'Beta', category: 'risk', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'number', description: 'Beta vs market' },
  { id: 'volatility', label: 'Volatility', category: 'risk', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', description: 'Annualized volatility' },
  { id: 'sharpeRatio', label: 'Sharpe', category: 'risk', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'number', description: 'Sharpe ratio' },
  { id: 'maxDrawdown', label: 'Max DD', category: 'risk', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', canBeNegative: true, description: 'Maximum drawdown' },

  // Technical
  { id: 'rsi', label: 'RSI', category: 'technical', sortable: true, defaultVisible: false, width: 70, align: 'right', format: 'number', description: '14-day RSI' },
  { id: 'sma50', label: 'vs SMA50', category: 'technical', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', canBeNegative: true, description: '% from 50-day SMA' },
  { id: 'sma200', label: 'vs SMA200', category: 'technical', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', canBeNegative: true, description: '% from 200-day SMA' },
  { id: 'distFrom52High', label: 'vs 52W High', category: 'technical', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: '% from 52-week high' },
  { id: 'distFrom52Low', label: 'vs 52W Low', category: 'technical', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', description: '% from 52-week low' },

  // Analyst
  { id: 'analystRating', label: 'Rating', category: 'analyst', sortable: true, defaultVisible: false, width: 90, description: 'Consensus analyst rating' },
  { id: 'priceTarget', label: 'Price Target', category: 'analyst', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'currency', description: 'Mean analyst price target' },
  { id: 'targetUpside', label: 'Upside', category: 'analyst', sortable: true, defaultVisible: false, width: 80, align: 'right', format: 'percent', canBeNegative: true, description: '% upside to price target' },
];

// Default visible columns
export const DEFAULT_POSITION_COLUMNS: PositionColumnId[] = [
  'symbol',
  'quantity',
  'price',
  'value',
  'costBasis',
  'gainPercent',
  'dayChangePercent',
  'weight',
  'sector',
];

// Helper to get column by ID
export function getPositionColumnById(id: PositionColumnId): ColumnDef<PositionColumnId> | undefined {
  return POSITION_COLUMNS.find(c => c.id === id);
}
