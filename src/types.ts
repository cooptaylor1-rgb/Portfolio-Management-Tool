export interface Investment {
  id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'bond' | 'etf' | 'mutual-fund' | 'crypto' | 'other';
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  sector?: string;
  notes?: string;
  dayChange?: number;
  dayChangePercent?: number;
}

export interface Transaction {
  id: string;
  investmentId: string;
  type: 'buy' | 'sell' | 'dividend' | 'interest' | 'fee' | 'transfer' | 'split';
  quantity: number;
  price: number;
  date: string;
  fees?: number;
  notes?: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  bestPerformer?: { name: string; percentage: number };
  worstPerformer?: { name: string; percentage: number };
  averageReturn: number;
  diversificationScore: number;
  dayChange?: number;
  dayChangePercentage?: number;
  volatility?: number;
  shareCount?: number;
  sharpeRatio?: number;
}

export interface RiskMetrics {
  portfolioVolatility: number;
  sharpeRatio: number;
  beta: number;
  maxDrawdown: number;
  valueAtRisk: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

export interface PerformanceData {
  date: string;
  value: number;
  change: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: string;
  pe?: number;
  high52Week?: number;
  low52Week?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  symbols?: string[];
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  type: string;
  targetPrice?: number;
  notes?: string;
  addedDate: string;
}

export interface Alert {
  id: string;
  type: 'price' | 'performance' | 'risk' | 'rebalance' | 'tax';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionable?: boolean;
}

export interface RebalanceRecommendation {
  currentAllocation: Record<string, number>;
  targetAllocation: Record<string, number>;
  actions: Array<{
    symbol: string;
    action: 'buy' | 'sell';
    quantity: number;
    reason: string;
  }>;
}

// Macro & Market Indicators
export interface MacroIndicator {
  id: string;
  name: string;
  value: number | string;
  change: number;
  changePercent: number;
  unit: string;
  lastUpdate: string;
  trend: 'up' | 'down' | 'neutral';
  significance: 'bullish' | 'bearish' | 'neutral';
}

export interface YieldCurvePoint {
  maturity: string;
  yield: number;
}

// Trade Journal & Idea Tracking
export interface TradeIdea {
  id: string;
  symbol: string;
  name: string;
  status: 'watching' | 'active' | 'closed' | 'stopped';
  entryDate?: string;
  exitDate?: string;
  entryPrice?: number;
  exitPrice?: number;
  targetPrice: number;
  stopLoss: number;
  conviction: 1 | 2 | 3 | 4 | 5; // 1=low, 5=high
  timeHorizon: 'day' | 'swing' | 'position' | 'long-term';
  thesis: string;
  entryRationale: string;
  exitRationale?: string;
  tags: string[];
  catalysts: string[];
  risks: string[];
  notes: string;
  attachments?: string[];
  performance?: number;
  performancePercent?: number;
}

// Position Sizing & Risk Management
export interface PositionSizeCalculation {
  symbol: string;
  accountValue: number;
  riskPerTrade: number; // percentage
  entryPrice: number;
  stopLoss: number;
  riskAmount: number; // dollar amount to risk
  positionSize: number; // shares to buy
  positionValue: number; // dollar value
  kellyPercentage?: number; // Kelly criterion optimal size
  correlationAdjustment?: number;
}

// Scenario Analysis & Stress Testing
export interface ScenarioTest {
  id: string;
  name: string;
  description: string;
  type: 'market-crash' | 'recession' | 'inflation' | 'rate-hike' | 'sector-rotation' | 'custom';
  assumptions: {
    equityChange: number; // percentage
    bondChange: number;
    commodityChange: number;
    volatilityMultiplier: number;
    correlationChange: number;
  };
  results?: {
    portfolioChange: number;
    portfolioChangePercent: number;
    worstPosition: { symbol: string; loss: number };
    bestPosition: { symbol: string; gain: number };
    hedgeEffectiveness?: number;
  };
}

// Advanced Risk Metrics
export interface AdvancedRiskMetrics extends RiskMetrics {
  sortinoRatio: number; // Downside risk-adjusted return
  calmarRatio: number; // Return / Max Drawdown
  treynorRatio: number; // Return per unit of systematic risk
  informationRatio: number; // Excess return / Tracking error
  downsideDeviation: number;
  upCaptureRatio: number; // How much upside captured vs benchmark
  downCaptureRatio: number; // How much downside captured vs benchmark
  tailRisk: number; // Expected shortfall / CVaR
  alpha: number; // Excess return vs benchmark
}

// Correlation Analysis
export interface CorrelationData {
  matrix: Record<string, Record<string, number>>; // symbol1 -> symbol2 -> correlation
  diversificationScore: number; // 0-100, higher is more diversified
  clusters: Array<{
    name: string;
    symbols: string[];
    avgCorrelation: number;
  }>;
  recommendations: string[];
}

// Dividend Tracking
export interface DividendEvent {
  id: string;
  investmentId: string;
  symbol: string;
  exDate: string;
  payDate: string;
  amount: number;
  yield: number;
  type: 'qualified' | 'ordinary' | 'return-of-capital';
  status: 'upcoming' | 'pending' | 'received';
  reinvested: boolean;
}

export interface DividendAnalysis {
  totalAnnualIncome: number;
  averageYield: number;
  payoutFrequency: Record<string, number>; // monthly, quarterly, etc
  nextPayments: DividendEvent[];
  yieldOnCost: number; // Current yield based on original cost
  growthRate: number; // Dividend growth rate
  projectedAnnualIncome: number; // Next 12 months
}

// Export & Reporting
export interface PerformanceReport {
  period: string;
  startDate: string;
  endDate: string;
  startingValue: number;
  endingValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  benchmarkReturn?: number;
  alpha?: number;
  dividendIncome: number;
  realizedGains: number;
  unrealizedGains: number;
  transactions: Transaction[];
  topPerformers: Array<{ symbol: string; return: number }>;
  bottomPerformers: Array<{ symbol: string; return: number }>;
  sectorPerformance: Record<string, number>;
}

// Enhanced Investment with more fields
export interface EnhancedInvestment extends Investment {
  beta?: number;
  correlation?: number;
  expectedReturn?: number;
  dividendYield?: number;
  nextDividend?: string;
  analystRating?: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
  targetPrice?: number;
  fundamentals?: {
    pe?: number;
    pb?: number;
    roe?: number;
    debtToEquity?: number;
    currentRatio?: number;
  };
}

// Authentication & User Management
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  createdAt: string;
  lastLogin?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  notifications: boolean;
  defaultView: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
  confirmPassword: string;
}

// Collaboration & Sharing
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  investments: Investment[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  sharedWith: SharedUser[];
  tags?: string[];

  // Optional provenance metadata (set on backend import)
  importedFrom?: {
    sourcePortfolioId?: string;
    sourceOwnerEmail?: string;
    sourceOwnerName?: string;
    exportedAt?: string;
    version?: string;
  };

  // Optional backend-derived summary fields (used by collaboration UI)
  investmentCount?: number;
  shareCount?: number;
  permission?: 'OWNER' | 'VIEW' | 'EDIT' | 'ADMIN';
  isOwner?: boolean;
}

export interface SharedUser {
  userId: string;
  email: string;
  name: string;
  permission: 'view' | 'edit' | 'admin';
  addedAt: string;
}

export interface PortfolioActivity {
  id: string;
  portfolioId: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'deleted' | 'shared' | 'investment_added' | 'investment_removed' | 'investment_updated';
  description: string;
  timestamp: string;
  changes?: any;
}

export interface CollaborationInvite {
  id: string;
  portfolioId: string;
  portfolioName: string;
  fromUserId: string;
  fromUserName: string;
  toEmail: string;
  permission: 'view' | 'edit' | 'admin';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}
