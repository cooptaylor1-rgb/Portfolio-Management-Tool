/**
 * Risk Table Column Definitions
 * 
 * All available columns for risk analysis tables
 */

import type { ColumnDef, ColumnCategory } from '../columns';

// Risk column IDs
export type RiskColumnId =
  // Identity
  | 'symbol'
  | 'name'
  | 'sector'
  | 'type'
  // Position
  | 'value'
  | 'weight'
  | 'concentration'
  // Volatility
  | 'volatility'
  | 'volatility30d'
  | 'volatility90d'
  | 'volatilityRank'
  // Market Risk
  | 'beta'
  | 'correlation'
  | 'systematicRisk'
  | 'idiosyncraticRisk'
  // VaR
  | 'var95'
  | 'var99'
  | 'cvar'
  | 'expectedShortfall'
  // Contribution
  | 'riskContribution'
  | 'marginalVar'
  | 'componentVar'
  // Drawdown
  | 'maxDrawdown'
  | 'currentDrawdown'
  | 'avgDrawdown'
  | 'drawdownDays'
  // Tail Risk
  | 'skewness'
  | 'kurtosis'
  | 'tailRisk';

// Column categories
export const RISK_CATEGORIES: ColumnCategory[] = [
  { id: 'identity', label: 'Identity', description: 'Basic information' },
  { id: 'position', label: 'Position', description: 'Position sizing' },
  { id: 'volatility', label: 'Volatility', description: 'Volatility metrics' },
  { id: 'market_risk', label: 'Market Risk', description: 'Systematic risk' },
  { id: 'var', label: 'Value at Risk', description: 'VaR metrics' },
  { id: 'contribution', label: 'Risk Contribution', description: 'Portfolio risk contribution' },
  { id: 'drawdown', label: 'Drawdown', description: 'Drawdown analysis' },
  { id: 'tail_risk', label: 'Tail Risk', description: 'Distribution metrics' },
];

// All column definitions
export const RISK_COLUMNS: ColumnDef<RiskColumnId>[] = [
  // Identity
  { id: 'symbol', label: 'Symbol', category: 'identity', sortable: true, defaultVisible: true, hideable: false, width: 100, description: 'Ticker symbol' },
  { id: 'name', label: 'Name', category: 'identity', sortable: true, defaultVisible: false, width: 160, description: 'Company name' },
  { id: 'sector', label: 'Sector', category: 'identity', sortable: true, defaultVisible: false, width: 120, description: 'Industry sector' },
  { id: 'type', label: 'Type', category: 'identity', sortable: true, defaultVisible: false, width: 100, description: 'Asset type' },

  // Position
  { id: 'value', label: 'Value', category: 'position', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', description: 'Position value' },
  { id: 'weight', label: 'Weight', category: 'position', sortable: true, defaultVisible: true, width: 80, align: 'right', format: 'percent', description: 'Portfolio weight' },
  { id: 'concentration', label: 'Concentration', category: 'position', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'percent', description: 'Position concentration score' },

  // Volatility
  { id: 'volatility', label: 'Volatility', category: 'volatility', sortable: true, defaultVisible: true, width: 90, align: 'right', format: 'percent', description: 'Annualized volatility' },
  { id: 'volatility30d', label: '30d Vol', category: 'volatility', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', description: '30-day volatility' },
  { id: 'volatility90d', label: '90d Vol', category: 'volatility', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', description: '90-day volatility' },
  { id: 'volatilityRank', label: 'Vol Rank', category: 'volatility', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', description: 'Volatility percentile rank' },

  // Market Risk
  { id: 'beta', label: 'Beta', category: 'market_risk', sortable: true, defaultVisible: false, width: 70, align: 'right', format: 'number', description: 'Beta vs market' },
  { id: 'correlation', label: 'Correlation', category: 'market_risk', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'number', description: 'Correlation to portfolio' },
  { id: 'systematicRisk', label: 'Systematic', category: 'market_risk', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', description: 'Systematic (market) risk' },
  { id: 'idiosyncraticRisk', label: 'Idiosyncratic', category: 'market_risk', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'percent', description: 'Idiosyncratic (specific) risk' },

  // VaR
  { id: 'var95', label: 'VaR (95%)', category: 'var', sortable: true, defaultVisible: true, width: 100, align: 'right', format: 'currency', description: 'Value at Risk at 95% confidence' },
  { id: 'var99', label: 'VaR (99%)', category: 'var', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'currency', description: 'Value at Risk at 99% confidence' },
  { id: 'cvar', label: 'CVaR', category: 'var', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'currency', description: 'Conditional VaR (Expected Shortfall)' },
  { id: 'expectedShortfall', label: 'Exp. Shortfall', category: 'var', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', description: 'Expected shortfall beyond VaR' },

  // Contribution
  { id: 'riskContribution', label: 'Risk Contrib', category: 'contribution', sortable: true, defaultVisible: true, width: 110, align: 'right', format: 'percent', description: 'Contribution to portfolio risk' },
  { id: 'marginalVar', label: 'Marginal VaR', category: 'contribution', sortable: true, defaultVisible: false, width: 110, align: 'right', format: 'currency', description: 'Marginal VaR' },
  { id: 'componentVar', label: 'Component VaR', category: 'contribution', sortable: true, defaultVisible: false, width: 120, align: 'right', format: 'currency', description: 'Component VaR' },

  // Drawdown
  { id: 'maxDrawdown', label: 'Max DD', category: 'drawdown', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', canBeNegative: true, description: 'Maximum historical drawdown' },
  { id: 'currentDrawdown', label: 'Current DD', category: 'drawdown', sortable: true, defaultVisible: false, width: 100, align: 'right', format: 'percent', canBeNegative: true, description: 'Current drawdown from peak' },
  { id: 'avgDrawdown', label: 'Avg DD', category: 'drawdown', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', canBeNegative: true, description: 'Average drawdown' },
  { id: 'drawdownDays', label: 'DD Days', category: 'drawdown', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'number', description: 'Days in current drawdown' },

  // Tail Risk
  { id: 'skewness', label: 'Skewness', category: 'tail_risk', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'number', canBeNegative: true, description: 'Return distribution skewness' },
  { id: 'kurtosis', label: 'Kurtosis', category: 'tail_risk', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'number', description: 'Return distribution kurtosis' },
  { id: 'tailRisk', label: 'Tail Risk', category: 'tail_risk', sortable: true, defaultVisible: false, width: 90, align: 'right', format: 'percent', description: 'Tail risk score' },
];

// Default visible columns
export const DEFAULT_RISK_COLUMNS: RiskColumnId[] = [
  'symbol',
  'weight',
  'volatility',
  'riskContribution',
  'var95',
];

// Helper to get column by ID
export function getRiskColumnById(id: RiskColumnId): ColumnDef<RiskColumnId> | undefined {
  return RISK_COLUMNS.find(c => c.id === id);
}
