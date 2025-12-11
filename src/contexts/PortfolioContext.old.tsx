/**
 * Portfolio Context
 * 
 * Centralized state management for portfolio data
 * shared across all pages in the application.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Investment, Transaction, PortfolioStats, RiskMetrics } from '../types';

interface PortfolioContextType {
  // Data
  investments: Investment[];
  transactions: Transaction[];
  stats: PortfolioStats;
  riskMetrics: RiskMetrics;
  
  // Actions
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  deleteInvestment: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  
  // Loading state
  isLoading: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return context;
}

// Sample portfolio data
const getSamplePortfolio = (): Investment[] => [
  {
    id: '1',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    type: 'stock',
    quantity: 150,
    purchasePrice: 145.00,
    currentPrice: 195.50,
    purchaseDate: '2024-01-15',
    sector: 'Technology',
    dayChange: 2.34,
    dayChangePercent: 1.21,
  },
  {
    id: '2',
    name: 'Microsoft Corporation',
    symbol: 'MSFT',
    type: 'stock',
    quantity: 85,
    purchasePrice: 350.00,
    currentPrice: 420.30,
    purchaseDate: '2024-02-20',
    sector: 'Technology',
    dayChange: -1.20,
    dayChangePercent: -0.28,
  },
  {
    id: '3',
    name: 'Alphabet Inc.',
    symbol: 'GOOGL',
    type: 'stock',
    quantity: 45,
    purchasePrice: 135.00,
    currentPrice: 175.80,
    purchaseDate: '2024-03-10',
    sector: 'Technology',
    dayChange: 3.45,
    dayChangePercent: 2.00,
  },
  {
    id: '4',
    name: 'Amazon.com Inc.',
    symbol: 'AMZN',
    type: 'stock',
    quantity: 60,
    purchasePrice: 145.00,
    currentPrice: 185.20,
    purchaseDate: '2024-01-25',
    sector: 'Consumer Discretionary',
    dayChange: -0.85,
    dayChangePercent: -0.46,
  },
  {
    id: '5',
    name: 'NVIDIA Corporation',
    symbol: 'NVDA',
    type: 'stock',
    quantity: 30,
    purchasePrice: 450.00,
    currentPrice: 875.50,
    purchaseDate: '2024-04-05',
    sector: 'Technology',
    dayChange: 15.30,
    dayChangePercent: 1.78,
  },
  {
    id: '6',
    name: 'Meta Platforms Inc.',
    symbol: 'META',
    type: 'stock',
    quantity: 40,
    purchasePrice: 350.00,
    currentPrice: 505.40,
    purchaseDate: '2024-02-15',
    sector: 'Technology',
    dayChange: 8.20,
    dayChangePercent: 1.65,
  },
  {
    id: '7',
    name: 'Johnson & Johnson',
    symbol: 'JNJ',
    type: 'stock',
    quantity: 70,
    purchasePrice: 160.00,
    currentPrice: 155.80,
    purchaseDate: '2024-03-20',
    sector: 'Healthcare',
    dayChange: 0.45,
    dayChangePercent: 0.29,
  },
  {
    id: '8',
    name: 'Visa Inc.',
    symbol: 'V',
    type: 'stock',
    quantity: 35,
    purchasePrice: 245.00,
    currentPrice: 280.60,
    purchaseDate: '2024-01-10',
    sector: 'Financials',
    dayChange: 1.80,
    dayChangePercent: 0.65,
  },
  {
    id: '9',
    name: 'Vanguard S&P 500 ETF',
    symbol: 'VOO',
    type: 'etf',
    quantity: 50,
    purchasePrice: 420.00,
    currentPrice: 485.50,
    purchaseDate: '2024-01-05',
    sector: 'Broad Market',
    dayChange: 2.15,
    dayChangePercent: 0.45,
  },
  {
    id: '10',
    name: 'Bitcoin',
    symbol: 'BTC',
    type: 'crypto',
    quantity: 0.5,
    purchasePrice: 42000.00,
    currentPrice: 98500.00,
    purchaseDate: '2024-02-01',
    sector: 'Cryptocurrency',
    dayChange: 1250.00,
    dayChangePercent: 1.29,
  },
];

const getSampleTransactions = (): Transaction[] => [
  { id: '1', investmentId: '1', type: 'buy', quantity: 100, price: 145.00, date: '2024-01-15', notes: 'Initial position' },
  { id: '2', investmentId: '1', type: 'buy', quantity: 50, price: 150.00, date: '2024-06-20', notes: 'Added to position' },
  { id: '3', investmentId: '2', type: 'buy', quantity: 85, price: 350.00, date: '2024-02-20', notes: 'Initial position' },
  { id: '4', investmentId: '3', type: 'buy', quantity: 45, price: 135.00, date: '2024-03-10', notes: 'Initial position' },
  { id: '5', investmentId: '5', type: 'buy', quantity: 30, price: 450.00, date: '2024-04-05', notes: 'AI bet' },
  { id: '6', investmentId: '1', type: 'dividend', quantity: 0, price: 0.96, date: '2024-08-15', notes: 'Quarterly dividend' },
  { id: '7', investmentId: '2', type: 'dividend', quantity: 0, price: 0.75, date: '2024-09-12', notes: 'Quarterly dividend' },
  { id: '8', investmentId: '10', type: 'buy', quantity: 0.3, price: 42000.00, date: '2024-02-01', notes: 'BTC allocation' },
  { id: '9', investmentId: '10', type: 'buy', quantity: 0.2, price: 65000.00, date: '2024-11-15', notes: 'Added on dip' },
];

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem('portfolio_investments');
    return saved ? JSON.parse(saved) : getSamplePortfolio();
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('portfolio_transactions');
    return saved ? JSON.parse(saved) : getSampleTransactions();
  });

  const [isLoading, setIsLoading] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('portfolio_investments', JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem('portfolio_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Calculate portfolio stats
  const stats: PortfolioStats = calculateStats(investments);
  const riskMetrics: RiskMetrics = calculateRiskMetrics(investments);

  const addInvestment = useCallback((investment: Omit<Investment, 'id'>) => {
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString(),
    };
    setInvestments(prev => [...prev, newInvestment]);
  }, []);

  const updateInvestment = useCallback((id: string, updates: Partial<Investment>) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === id ? { ...inv, ...updates } : inv
    ));
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
  }, []);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
  }, []);

  return (
    <PortfolioContext.Provider value={{
      investments,
      transactions,
      stats,
      riskMetrics,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      addTransaction,
      isLoading,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

function calculateStats(investments: Investment[]): PortfolioStats {
  if (investments.length === 0) {
    return {
      totalValue: 0,
      totalInvested: 0,
      totalGainLoss: 0,
      gainLossPercentage: 0,
      averageReturn: 0,
      diversificationScore: 0,
    };
  }

  const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
  const totalGainLoss = totalValue - totalInvested;
  const gainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  // Calculate day change
  const dayChange = investments.reduce((sum, inv) => {
    return sum + (inv.dayChange || 0) * inv.quantity;
  }, 0);
  const dayChangePercentage = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  // Calculate best and worst performers
  const performances = investments.map(inv => ({
    name: inv.name,
    percentage: ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100
  })).sort((a, b) => b.percentage - a.percentage);

  // Diversification score (0-100)
  const sectors = new Set(investments.map(inv => inv.sector || inv.type));
  const diversificationScore = Math.min(100, (sectors.size / investments.length) * 100 + (investments.length * 5));

  return {
    totalValue,
    totalInvested,
    totalGainLoss,
    gainLossPercentage,
    bestPerformer: performances[0],
    worstPerformer: performances[performances.length - 1],
    averageReturn: performances.reduce((sum, p) => sum + p.percentage, 0) / performances.length,
    diversificationScore,
    dayChange,
    dayChangePercentage,
  };
}

function calculateRiskMetrics(investments: Investment[]): RiskMetrics {
  if (investments.length === 0) {
    return {
      portfolioVolatility: 0,
      sharpeRatio: 0,
      beta: 1,
      maxDrawdown: 0,
      valueAtRisk: 0,
      riskLevel: 'moderate',
    };
  }

  // Simulated risk calculations (would use real data in production)
  const cryptoWeight = investments
    .filter(inv => inv.type === 'crypto')
    .reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0) /
    investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);

  const stockWeight = investments
    .filter(inv => inv.type === 'stock')
    .reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0) /
    investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);

  const bondWeight = investments
    .filter(inv => inv.type === 'bond')
    .reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0) /
    investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);

  // Volatility based on asset mix (simplified)
  const portfolioVolatility = 15 + (cryptoWeight * 50) + (stockWeight * 5) - (bondWeight * 10);
  
  // Beta approximation
  const beta = 1 + (cryptoWeight * 0.5) - (bondWeight * 0.3);
  
  // Sharpe ratio (assuming 5% risk-free rate)
  const expectedReturn = investments.reduce((sum, inv) => {
    const ret = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
    const weight = (inv.quantity * inv.currentPrice) / 
      investments.reduce((s, i) => s + i.quantity * i.currentPrice, 0);
    return sum + ret * weight;
  }, 0);
  const sharpeRatio = (expectedReturn - 5) / portfolioVolatility;

  // Max drawdown and VaR (simplified)
  const maxDrawdown = 15 + (cryptoWeight * 30) + (stockWeight * 10) - (bondWeight * 5);
  const valueAtRisk = portfolioVolatility * 1.65; // 95% confidence

  // Risk level
  let riskLevel: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
  if (portfolioVolatility < 12) riskLevel = 'conservative';
  else if (portfolioVolatility > 25) riskLevel = 'aggressive';

  return {
    portfolioVolatility,
    sharpeRatio,
    beta,
    maxDrawdown,
    valueAtRisk,
    riskLevel,
  };
}
