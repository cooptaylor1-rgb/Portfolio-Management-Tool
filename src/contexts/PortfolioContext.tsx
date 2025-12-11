/**
 * Portfolio Context - Enhanced with API Integration
 * 
 * Centralized state management for portfolio data with:
 * - Backend API integration
 * - Real-time price updates
 * - Local caching for offline support
 * - Optimistic updates
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { api, Portfolio, Investment as ApiInvestment } from '../services/api';
import { realTimeMarket } from '../services/realTimeMarket';

// Type conversion helpers
type FrontendInvestmentType = 'stock' | 'etf' | 'bond' | 'crypto' | 'mutual_fund' | 'other';
type ApiInvestmentType = 'STOCK' | 'ETF' | 'BOND' | 'CRYPTO' | 'MUTUAL_FUND' | 'OTHER';

const typeToApi = (type: FrontendInvestmentType): ApiInvestmentType => {
  const map: Record<FrontendInvestmentType, ApiInvestmentType> = {
    stock: 'STOCK',
    etf: 'ETF',
    bond: 'BOND',
    crypto: 'CRYPTO',
    mutual_fund: 'MUTUAL_FUND',
    other: 'OTHER',
  };
  return map[type] || 'OTHER';
};

// Frontend-friendly types
export interface Investment {
  id: string;
  name: string;
  symbol: string;
  type: FrontendInvestmentType;
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
  type: 'buy' | 'sell' | 'dividend' | 'split';
  quantity: number;
  price: number;
  date: string;
  notes?: string;
}

export interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  gainLossPercentage: number;
  averageReturn: number;
  diversificationScore: number;
  dayChange?: number;
  dayChangePercentage?: number;
  bestPerformer?: { name: string; percentage: number };
  worstPerformer?: { name: string; percentage: number };
}

export interface RiskMetrics {
  portfolioVolatility: number;
  sharpeRatio: number;
  beta: number;
  maxDrawdown: number;
  valueAtRisk: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

interface PortfolioContextType {
  // Portfolio data
  portfolios: Portfolio[];
  activePortfolio: Portfolio | null;
  investments: Investment[];
  transactions: Transaction[];
  stats: PortfolioStats;
  riskMetrics: RiskMetrics;
  
  // Actions
  selectPortfolio: (id: string) => Promise<void>;
  createPortfolio: (name: string, description?: string) => Promise<Portfolio | null>;
  deletePortfolio: (id: string) => Promise<boolean>;
  addInvestment: (investment: Omit<Investment, 'id' | 'currentPrice' | 'dayChange' | 'dayChangePercent'>) => Promise<Investment | null>;
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<boolean>;
  deleteInvestment: (id: string) => Promise<boolean>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<Transaction | null>;
  refreshPrices: () => Promise<void>;
  
  // State
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return context;
}

// Sample data for demo mode (when not connected to backend)
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

// Safe localStorage helper
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage not available
    }
  },
};

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null);
  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = safeLocalStorage.getItem('portfolio_investments');
    return saved ? JSON.parse(saved) : getSamplePortfolio();
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = safeLocalStorage.getItem('portfolio_transactions');
    return saved ? JSON.parse(saved) : getSampleTransactions();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const priceUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist to localStorage
  useEffect(() => {
    safeLocalStorage.setItem('portfolio_investments', JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    safeLocalStorage.setItem('portfolio_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Fetch portfolios from backend if authenticated
  useEffect(() => {
    if (api.isAuthenticated()) {
      loadPortfolios();
    }
  }, []);

  // Real-time price updates
  useEffect(() => {
    const symbols = investments.map(inv => inv.symbol);
    if (symbols.length === 0) return;

    // Subscribe to real-time updates
    let unsubscribe: (() => void) | undefined;
    
    realTimeMarket.subscribe(symbols, (quote) => {
      setInvestments(prev => prev.map(inv => {
        if (inv.symbol.toUpperCase() === quote.symbol.toUpperCase()) {
          return {
            ...inv,
            currentPrice: quote.price,
            dayChange: quote.change,
            dayChangePercent: quote.changePercent,
          };
        }
        return inv;
      }));
    }).then(unsub => {
      unsubscribe = unsub;
    }).catch(() => {
      // WebSocket not available, fall back to polling
      startPricePolling();
    });

    return () => {
      unsubscribe?.();
      if (priceUpdateInterval.current) {
        clearInterval(priceUpdateInterval.current);
      }
    };
  }, [investments.map(i => i.symbol).join(',')]);

  const startPricePolling = () => {
    if (priceUpdateInterval.current) {
      clearInterval(priceUpdateInterval.current);
    }
    
    priceUpdateInterval.current = setInterval(async () => {
      await refreshPrices();
    }, 30000); // Poll every 30 seconds
  };

  const loadPortfolios = async () => {
    setIsLoading(true);
    const response = await api.getPortfolios();
    
    if (response.success && response.data) {
      setPortfolios(response.data.portfolios);
      if (response.data.portfolios.length > 0 && !activePortfolio) {
        await selectPortfolio(response.data.portfolios[0].id);
      }
    } else if (response.error?.code === 'MISSING_TOKEN' || response.error?.code === 'INVALID_TOKEN') {
      // Clear stale tokens and use sample data
      api.clearTokens();
      console.info('Using demo mode with sample portfolio data');
    }
    setIsLoading(false);
  };

  const selectPortfolio = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    const response = await api.getPortfolio(id);
    
    if (response.success && response.data) {
      setActivePortfolio(response.data.portfolio);
      
      // Convert API investments to frontend format
      const apiInvestments = response.data.portfolio.investments || [];
      const frontendInvestments: Investment[] = apiInvestments.map((inv: ApiInvestment) => ({
        id: inv.id,
        name: inv.name,
        symbol: inv.symbol,
        type: inv.type.toLowerCase() as Investment['type'],
        quantity: inv.quantity,
        purchasePrice: inv.purchasePrice,
        currentPrice: inv.currentPrice || inv.purchasePrice,
        purchaseDate: inv.purchaseDate,
        sector: inv.sector,
        notes: inv.notes,
        dayChange: 0,
        dayChangePercent: 0,
      }));
      
      setInvestments(frontendInvestments);
      
      // Refresh prices for the new portfolio
      await refreshPrices();
    } else {
      setError(response.error?.message || 'Failed to load portfolio');
    }
    
    setIsLoading(false);
  }, []);

  const createPortfolio = useCallback(async (name: string, description?: string): Promise<Portfolio | null> => {
    setIsLoading(true);
    setError(null);
    
    const response = await api.createPortfolio({ name, description });
    
    if (response.success && response.data) {
      const newPortfolio = response.data.portfolio;
      setPortfolios(prev => [...prev, newPortfolio]);
      setIsLoading(false);
      return newPortfolio;
    }
    
    setError(response.error?.message || 'Failed to create portfolio');
    setIsLoading(false);
    return null;
  }, []);

  const deletePortfolio = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    const response = await api.deletePortfolio(id);
    
    if (response.success) {
      setPortfolios(prev => prev.filter(p => p.id !== id));
      if (activePortfolio?.id === id) {
        setActivePortfolio(null);
        setInvestments([]);
      }
      setIsLoading(false);
      return true;
    }
    
    setError(response.error?.message || 'Failed to delete portfolio');
    setIsLoading(false);
    return false;
  }, [activePortfolio]);

  const addInvestment = useCallback(async (
    investment: Omit<Investment, 'id' | 'currentPrice' | 'dayChange' | 'dayChangePercent'>
  ): Promise<Investment | null> => {
    // For demo mode without backend
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString(),
      currentPrice: investment.purchasePrice,
      dayChange: 0,
      dayChangePercent: 0,
    };
    
    // Optimistic update
    setInvestments(prev => [...prev, newInvestment]);
    
    // If connected to backend, sync
    if (activePortfolio && api.isAuthenticated()) {
      const response = await api.addInvestment(activePortfolio.id, {
        symbol: investment.symbol,
        name: investment.name,
        type: investment.type.toUpperCase() as ApiInvestment['type'],
        quantity: investment.quantity,
        purchasePrice: investment.purchasePrice,
        purchaseDate: new Date(investment.purchaseDate).toISOString(),
        sector: investment.sector,
        notes: investment.notes,
      });
      
      if (response.success && response.data) {
        // Update with server-generated ID
        setInvestments(prev => prev.map(inv => 
          inv.id === newInvestment.id 
            ? { ...inv, id: response.data!.investment.id }
            : inv
        ));
        return { ...newInvestment, id: response.data.investment.id };
      } else {
        // Rollback on failure
        setInvestments(prev => prev.filter(inv => inv.id !== newInvestment.id));
        setError(response.error?.message || 'Failed to add investment');
        return null;
      }
    }
    
    // Add initial transaction
    const transaction: Transaction = {
      id: Date.now().toString(),
      investmentId: newInvestment.id,
      type: 'buy',
      quantity: investment.quantity,
      price: investment.purchasePrice,
      date: investment.purchaseDate,
      notes: 'Initial position',
    };
    setTransactions(prev => [...prev, transaction]);
    
    return newInvestment;
  }, [activePortfolio]);

  const updateInvestment = useCallback(async (id: string, updates: Partial<Investment>): Promise<boolean> => {
    // Optimistic update
    setInvestments(prev => prev.map(inv => 
      inv.id === id ? { ...inv, ...updates } : inv
    ));
    
    // If connected to backend, sync
    if (activePortfolio && api.isAuthenticated()) {
      // Convert frontend type to API type if present
      const apiUpdates: Record<string, unknown> = { ...updates };
      if (updates.type) {
        apiUpdates.type = typeToApi(updates.type);
      }
      const response = await api.updateInvestment(activePortfolio.id, id, apiUpdates as Partial<ApiInvestment>);
      
      if (!response.success) {
        // Rollback on failure
        setInvestments(prev => {
          const saved = localStorage.getItem('portfolio_investments');
          return saved ? JSON.parse(saved) : prev;
        });
        setError(response.error?.message || 'Failed to update investment');
        return false;
      }
    }
    
    return true;
  }, [activePortfolio]);

  const deleteInvestment = useCallback(async (id: string): Promise<boolean> => {
    const deletedInvestment = investments.find(inv => inv.id === id);
    
    // Optimistic update
    setInvestments(prev => prev.filter(inv => inv.id !== id));
    setTransactions(prev => prev.filter(t => t.investmentId !== id));
    
    // If connected to backend, sync
    if (activePortfolio && api.isAuthenticated()) {
      const response = await api.deleteInvestment(activePortfolio.id, id);
      
      if (!response.success) {
        // Rollback on failure
        if (deletedInvestment) {
          setInvestments(prev => [...prev, deletedInvestment]);
        }
        setError(response.error?.message || 'Failed to delete investment');
        return false;
      }
    }
    
    return true;
  }, [activePortfolio, investments]);

  const addTransaction = useCallback(async (
    transaction: Omit<Transaction, 'id'>
  ): Promise<Transaction | null> => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    
    // Update investment quantity based on transaction
    setInvestments(prev => prev.map(inv => {
      if (inv.id === transaction.investmentId) {
        let newQuantity = inv.quantity;
        if (transaction.type === 'buy') {
          newQuantity += transaction.quantity;
        } else if (transaction.type === 'sell') {
          newQuantity -= transaction.quantity;
        } else if (transaction.type === 'split') {
          newQuantity *= transaction.quantity;
        }
        return { ...inv, quantity: newQuantity };
      }
      return inv;
    }));
    
    setTransactions(prev => [...prev, newTransaction]);
    
    // Sync with backend if connected
    if (activePortfolio && api.isAuthenticated()) {
      const response = await api.recordTransaction(
        activePortfolio.id, 
        transaction.investmentId,
        {
          type: transaction.type.toUpperCase() as 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT',
          quantity: transaction.quantity,
          price: transaction.price,
          date: new Date(transaction.date).toISOString(),
          notes: transaction.notes,
        }
      );
      
      if (response.success && response.data) {
        setTransactions(prev => prev.map(t =>
          t.id === newTransaction.id
            ? { ...t, id: response.data!.transaction.id }
            : t
        ));
      }
    }
    
    return newTransaction;
  }, [activePortfolio]);

  const refreshPrices = useCallback(async () => {
    const symbols = investments.map(inv => inv.symbol);
    if (symbols.length === 0) return;
    
    try {
      const response = await api.getBatchQuotes(symbols);
      
      if (response.success && response.data) {
        const quoteMap = new Map(response.data.quotes.map(q => [q.symbol.toUpperCase(), q]));
        
        setInvestments(prev => prev.map(inv => {
          const quote = quoteMap.get(inv.symbol.toUpperCase());
          if (quote && !('error' in quote)) {
            return {
              ...inv,
              currentPrice: quote.price,
              dayChange: quote.change,
              dayChangePercent: quote.changePercent,
            };
          }
          return inv;
        }));
      }
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    }
  }, [investments]);

  // Calculate portfolio stats
  const stats: PortfolioStats = calculateStats(investments);
  const riskMetrics: RiskMetrics = calculateRiskMetrics(investments);

  return (
    <PortfolioContext.Provider value={{
      portfolios,
      activePortfolio,
      investments,
      transactions,
      stats,
      riskMetrics,
      selectPortfolio,
      createPortfolio,
      deletePortfolio,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      addTransaction,
      refreshPrices,
      isLoading,
      error,
      isOnline,
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

  const totalValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);

  const cryptoWeight = investments
    .filter(inv => inv.type === 'crypto')
    .reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0) / totalValue;

  const stockWeight = investments
    .filter(inv => inv.type === 'stock')
    .reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0) / totalValue;

  const bondWeight = investments
    .filter(inv => inv.type === 'bond')
    .reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0) / totalValue;

  // Volatility based on asset mix
  const portfolioVolatility = 15 + (cryptoWeight * 50) + (stockWeight * 5) - (bondWeight * 10);
  
  // Beta approximation
  const beta = 1 + (cryptoWeight * 0.5) - (bondWeight * 0.3);
  
  // Sharpe ratio
  const expectedReturn = investments.reduce((sum, inv) => {
    const ret = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
    const weight = (inv.quantity * inv.currentPrice) / totalValue;
    return sum + ret * weight;
  }, 0);
  const sharpeRatio = portfolioVolatility > 0 ? (expectedReturn - 5) / portfolioVolatility : 0;

  // Max drawdown and VaR
  const maxDrawdown = 15 + (cryptoWeight * 30) + (stockWeight * 10) - (bondWeight * 5);
  const valueAtRisk = portfolioVolatility * 1.65 * (totalValue / 100);

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
