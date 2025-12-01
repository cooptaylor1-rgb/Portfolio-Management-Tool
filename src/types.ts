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
  type: 'buy' | 'sell' | 'dividend';
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
