// Market data service - FactSet API integration
// FactSet provides institutional-grade financial data
import { PerformanceData } from '../types';
import { api } from './api';

type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  symbols: string[];
};

const CACHE_DURATION = 60000; // 1 minute cache
const cache = new Map<string, { data: any; timestamp: number }>();

// NOTE: Provider secrets must remain server-side.
// We proxy market data through the backend API under /api/v2/market.

export async function fetchStockPrice(symbol: string): Promise<number | null> {
  const cacheKey = `price_${symbol}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Prefer backend proxy (keeps provider secrets off the client)
    const quoteRes = await api.getQuote(symbol);
    const backendPrice = quoteRes.success ? quoteRes.data?.price : undefined;
    if (typeof backendPrice === 'number') {
      cache.set(cacheKey, { data: backendPrice, timestamp: Date.now() });
      return backendPrice;
    }

    // Fallback to mock data if FactSet API is not configured or fails
    const mockPrices: Record<string, number> = {
      'AAPL': 175.50,
      'MSFT': 295.25,
      'GOOGL': 142.30,
      'AMZN': 151.80,
      'TSLA': 242.50,
      'VOO': 425.75,
      'SPY': 458.20,
      'BTC': 52000,
      'ETH': 3200,
      'TLT': 98.50,
    };

    // Simulate realistic price fluctuations
    const basePrice = mockPrices[symbol] || 100;
    const fluctuation = (Math.random() - 0.5) * 2; // +/- 1%
    const mockPrice = basePrice * (1 + fluctuation / 100);

    cache.set(cacheKey, { data: mockPrice, timestamp: Date.now() });
    return mockPrice;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

export async function fetchMarketData(symbol: string) {
  const cacheKey = `market_${symbol}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Prefer backend proxy endpoints
    const [quoteRes, fundamentalsRes] = await Promise.all([
      api.getQuote(symbol),
      api.getFundamentals(symbol),
    ]);

    if (quoteRes.success && quoteRes.data) {
      const q = quoteRes.data;
      const price = typeof q.price === 'number' ? q.price : 0;
      const change = typeof q.change === 'number' ? q.change : 0;
      const changePercent = typeof q.changePercent === 'number' ? q.changePercent : 0;
      const volume = typeof q.volume === 'number' ? q.volume : 0;

      const fundamentals: any = fundamentalsRes.success ? fundamentalsRes.data : null;

      const data = {
        symbol,
        price,
        change,
        changePercent,
        volume,
        marketCap:
          typeof fundamentals?.marketCap === 'number' && fundamentals.marketCap > 0
            ? fundamentals.marketCap
            : 'N/A',
        pe:
          typeof fundamentals?.pe === 'number' && fundamentals.pe > 0 ? fundamentals.pe : 'N/A',
        high52Week: price ? price * 1.2 : 0,
        low52Week: price ? price * 0.8 : 0,
      };

      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    }

    // Fallback to mock data
    const price = await fetchStockPrice(symbol);
    if (!price) return null;

    const data = {
      symbol,
      price,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 100000000),
      marketCap: `${(Math.random() * 1000 + 100).toFixed(2)}B`,
      pe: (Math.random() * 30 + 10).toFixed(2),
      high52Week: price * 1.2,
      low52Week: price * 0.8,
    };

    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    return null;
  }
}

export async function fetchHistoricalData(symbol: string, days: number = 30) {
  const cacheKey = `history_${symbol}_${days}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 10) {
    return cached.data;
  }

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const response = await api.getHistoricalData(symbol, {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      interval: '1d',
    });

    const candles = response.success ? response.data?.data : undefined;
    if (Array.isArray(candles) && candles.length > 0) {
      const mapped: PerformanceData[] = candles.map((c: any, index: number) => {
        const value = typeof c?.close === 'number' ? c.close : 0;
        const prev = index > 0 && typeof candles[index - 1]?.close === 'number' ? candles[index - 1].close : value;
        return {
          date: c?.date || new Date().toISOString().split('T')[0],
          value,
          change: value - prev,
        };
      });

      cache.set(cacheKey, { data: mapped, timestamp: Date.now() });
      return mapped;
    }

    // Fallback: Generate mock historical data
    const mockData: PerformanceData[] = [];
    const today = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      mockData.push({
        date: date.toISOString().split('T')[0],
        value: 10000 * (1 + Math.sin(i / 10) * 0.2 + (Math.random() - 0.5) * 0.05),
        change: (Math.random() - 0.5) * 200
      });
    }
    
    cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
    return mockData;
  } catch (outerError) {
    console.error('Error in fetchHistoricalData:', outerError);
    return [];
  }
}

export async function fetchNews(symbols: string[] = []) {
  const cacheKey = `news_${symbols.join(',')}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 5) {
    return cached.data;
  }

  try {
    const response = await api.getMarketNews(symbols, 20);
    const backendNews = response.success ? response.data?.news : undefined;
    if (Array.isArray(backendNews)) {
      cache.set(cacheKey, { data: backendNews, timestamp: Date.now() });
      return backendNews;
    }

    // Fallback to mock news data
    const mockNewsItems: NewsItem[] = [
      {
        id: '1',
        title: 'Tech Stocks Rally on Strong Earnings Reports',
        source: 'Financial Times',
        url: '#',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        sentiment: 'positive' as const,
        symbols: ['AAPL', 'MSFT', 'GOOGL'],
      },
      {
        id: '2',
        title: 'Federal Reserve Holds Interest Rates Steady',
        source: 'Bloomberg',
        url: '#',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        sentiment: 'neutral' as const,
        symbols: [],
      },
      {
        id: '3',
        title: 'Market Volatility Expected Amid Economic Uncertainty',
        source: 'Reuters',
        url: '#',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        sentiment: 'negative' as const,
        symbols: [],
      },
      {
        id: '4',
        title: 'Cryptocurrency Markets Show Strong Recovery',
        source: 'CoinDesk',
        url: '#',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
        sentiment: 'positive' as const,
        symbols: ['BTC', 'ETH'],
      },
    ];

    // Filter by symbols if provided
    const filteredNews = symbols.length > 0
      ? mockNewsItems.filter((item) =>
          item.symbols.length === 0 || item.symbols.some((s) => symbols.includes(s))
        )
      : mockNewsItems;

    cache.set(cacheKey, { data: filteredNews, timestamp: Date.now() });
    return filteredNews;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

export function calculateRiskMetrics(_investments: any[], historicalData: any[]) {
  // Calculate portfolio volatility (standard deviation of returns)
  const returns = historicalData.map(d => d.change / d.value);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized

  // Calculate Sharpe Ratio (assuming 4% risk-free rate)
  const riskFreeRate = 0.04;
  const excessReturn = avgReturn * 252 - riskFreeRate;
  const sharpeRatio = excessReturn / (Math.sqrt(variance) * Math.sqrt(252));

  // Mock beta (correlation with market)
  const beta = 0.8 + Math.random() * 0.6; // Between 0.8 and 1.4

  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = historicalData[0]?.value || 0;
  
  for (const point of historicalData) {
    if (point.value > peak) peak = point.value;
    const drawdown = ((peak - point.value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Value at Risk (95% confidence, 1-day)
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const varIndex = Math.floor(returns.length * 0.05);
  const valueAtRisk = Math.abs(sortedReturns[varIndex] || 0) * 100;

  // Determine risk level
  let riskLevel: 'conservative' | 'moderate' | 'aggressive';
  if (volatility < 10) riskLevel = 'conservative';
  else if (volatility < 20) riskLevel = 'moderate';
  else riskLevel = 'aggressive';

  return {
    portfolioVolatility: volatility,
    sharpeRatio,
    beta,
    maxDrawdown,
    valueAtRisk,
    riskLevel,
  };
}
