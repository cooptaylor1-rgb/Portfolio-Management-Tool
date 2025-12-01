// Market data service - FactSet API integration
// FactSet provides institutional-grade financial data

const CACHE_DURATION = 60000; // 1 minute cache
const cache = new Map<string, { data: any; timestamp: number }>();

// FactSet API Configuration
// Get your API credentials from: https://developer.factset.com/
const FACTSET_API_BASE = 'https://api.factset.com/content';
const FACTSET_USERNAME = process.env.FACTSET_USERNAME || 'YOUR_FACTSET_USERNAME';
const FACTSET_API_KEY = process.env.FACTSET_API_KEY || 'YOUR_FACTSET_API_KEY';

// Helper function to create Basic Auth header for FactSet
function getFactSetHeaders() {
  const credentials = btoa(`${FACTSET_USERNAME}-serial:${FACTSET_API_KEY}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

export async function fetchStockPrice(symbol: string): Promise<number | null> {
  const cacheKey = `price_${symbol}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Try FactSet API first
    if (FACTSET_USERNAME !== 'YOUR_FACTSET_USERNAME' && FACTSET_API_KEY !== 'YOUR_FACTSET_API_KEY') {
      const response = await fetch(
        `${FACTSET_API_BASE}/factset-prices/v1/prices`,
        {
          method: 'POST',
          headers: getFactSetHeaders(),
          body: JSON.stringify({
            ids: [symbol],
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            frequency: 'D',
            calendar: 'FIVEDAY'
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0 && data.data[0].price) {
          const price = data.data[0].price;
          cache.set(cacheKey, { data: price, timestamp: Date.now() });
          return price;
        }
      }
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
    const price = basePrice * (1 + fluctuation / 100);

    cache.set(cacheKey, { data: price, timestamp: Date.now() });
    return price;
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
    // Try FactSet Company Fundamentals API
    if (FACTSET_USERNAME !== 'YOUR_FACTSET_USERNAME' && FACTSET_API_KEY !== 'YOUR_FACTSET_API_KEY') {
      try {
        // Fetch price data
        const priceResponse = await fetch(
          `${FACTSET_API_BASE}/factset-prices/v1/prices`,
          {
            method: 'POST',
            headers: getFactSetHeaders(),
            body: JSON.stringify({
              ids: [symbol],
              startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
              endDate: new Date().toISOString().split('T')[0], // Today
              frequency: 'D',
              calendar: 'FIVEDAY'
            })
          }
        );

        // Fetch company profile
        const profileResponse = await fetch(
          `${FACTSET_API_BASE}/factset-entity/v1/entity-profile`,
          {
            method: 'POST',
            headers: getFactSetHeaders(),
            body: JSON.stringify({
              ids: [symbol]
            })
          }
        );

        if (priceResponse.ok && profileResponse.ok) {
          const priceData = await priceResponse.json();
          const profileData = await profileResponse.json();

          if (priceData.data && priceData.data.length >= 1) {
            const current = priceData.data[priceData.data.length - 1];
            const previous = priceData.data.length > 1 ? priceData.data[priceData.data.length - 2] : current;
            
            const price = current.price || 0;
            const prevPrice = previous.price || price;
            const change = price - prevPrice;
            const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

            const profile = profileData.data?.[0] || {};

            const data = {
              symbol,
              price,
              change,
              changePercent,
              volume: current.volume || 0,
              marketCap: profile.marketCap || 'N/A',
              pe: profile.peRatio || 'N/A',
              high52Week: current.high52Week || price * 1.2,
              low52Week: current.low52Week || price * 0.8,
            };

            cache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
          }
        }
      } catch (factsetError) {
        console.warn('FactSet API error, falling back to mock data:', factsetError);
      }
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
    // Try FactSet Time Series API
    if (FACTSET_USERNAME !== 'YOUR_FACTSET_USERNAME' && FACTSET_API_KEY !== 'YOUR_FACTSET_API_KEY') {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const response = await fetch(
          `${FACTSET_API_BASE}/factset-prices/v1/prices`,
          {
            method: 'POST',
            headers: getFactSetHeaders(),
            body: JSON.stringify({
              ids: [symbol],
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0],
              frequency: 'D',
              calendar: 'FIVEDAY'
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0) {
            const data = result.data.map((item: any, index: number) => ({
              date: item.date,
              value: item.price || 0,
              change: index > 0 ? (item.price || 0) - (result.data[index - 1].price || 0) : 0,
export async function fetchNews(symbols: string[] = []) {
  const cacheKey = `news_${symbols.join(',')}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION * 5) {
    return cached.data;
  }

  try {
    // Try FactSet News API
    if (FACTSET_USERNAME !== 'YOUR_FACTSET_USERNAME' && FACTSET_API_KEY !== 'YOUR_FACTSET_API_KEY') {
      try {
        const response = await fetch(
          `${FACTSET_API_BASE}/news/v1/list-articles`,
          {
            method: 'POST',
            headers: getFactSetHeaders(),
            body: JSON.stringify({
              symbols: symbols.length > 0 ? symbols : undefined,
              startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Last 24 hours
              endDate: new Date().toISOString().split('T')[0],
              limit: 20
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0) {
            const newsItems = result.data.map((item: any) => ({
              id: item.articleId || String(Math.random()),
              title: item.headline || 'No title',
              source: item.source || 'FactSet',
              url: item.url || '#',
              publishedAt: item.publishedDate || new Date().toISOString(),
              sentiment: item.sentiment?.label?.toLowerCase() || 'neutral',
              symbols: item.symbols || [],
            }));

            cache.set(cacheKey, { data: newsItems, timestamp: Date.now() });
            return newsItems;
          }
        }
      } catch (factsetError) {
        console.warn('FactSet News API error, falling back to mock data:', factsetError);
      }
    }

    // Fallback to mock news data
    const newsItems = [
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
      ? newsItems.filter(item => 
          item.symbols.length === 0 || 
          item.symbols.some(s => symbols.includes(s))
        )
      : newsItems;

    cache.set(cacheKey, { data: filteredNews, timestamp: Date.now() });
    return filteredNews;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}       url: '#',
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

    cache.set(cacheKey, { data: newsItems, timestamp: Date.now() });
    return newsItems;
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
