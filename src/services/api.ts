/**
 * API Service Layer
 * 
 * Centralized API client for all backend communications.
 * Handles authentication, caching, error handling, and retry logic.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v2';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    cached?: boolean;
    total?: number;
    page?: number;
  };
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from storage (safely handle sandboxed environments)
    try {
      this.token = localStorage.getItem('auth_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    } catch {
      // localStorage not available (e.g., sandboxed iframe)
      this.token = null;
      this.refreshToken = null;
    }
  }

  setTokens(access: string, refresh: string) {
    this.token = access;
    this.refreshToken = refresh;
    try {
      localStorage.setItem('auth_token', access);
      localStorage.setItem('refresh_token', refresh);
    } catch {
      // localStorage not available
    }
  }

  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    } catch {
      // localStorage not available
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (!skipAuth && this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 - try refresh token
        if (response.status === 401 && this.refreshToken) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry original request
            return this.request(endpoint, options);
          }
        }
        return { success: false, error: data.error || { code: 'ERROR', message: 'Request failed' } };
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Network request failed' },
      };
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.accessToken) {
          this.setTokens(data.data.accessToken, data.data.refreshToken || this.refreshToken!);
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ user: any; accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      }
    );

    if (response.success && response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async register(name: string, email: string, password: string) {
    const response = await this.request<{ user: any; accessToken: string; refreshToken: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
        skipAuth: true,
      }
    );

    if (response.success && response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearTokens();
  }

  // Portfolio endpoints
  async getPortfolios() {
    return this.request<{ portfolios: Portfolio[] }>('/portfolios');
  }

  async getPortfolio(id: string) {
    return this.request<{ portfolio: Portfolio }>(`/portfolios/${id}`);
  }

  async createPortfolio(data: { name: string; description?: string; isPublic?: boolean }) {
    return this.request<{ portfolio: Portfolio }>('/portfolios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePortfolio(id: string, data: Partial<{ name: string; description: string; isPublic: boolean }>) {
    return this.request<{ portfolio: Portfolio }>(`/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePortfolio(id: string) {
    return this.request<void>(`/portfolios/${id}`, { method: 'DELETE' });
  }

  // Investment endpoints
  async addInvestment(portfolioId: string, investment: CreateInvestmentData) {
    return this.request<{ investment: Investment }>(`/portfolios/${portfolioId}/investments`, {
      method: 'POST',
      body: JSON.stringify(investment),
    });
  }

  async updateInvestment(portfolioId: string, investmentId: string, data: Partial<Investment>) {
    return this.request<{ investment: Investment }>(
      `/portfolios/${portfolioId}/investments/${investmentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteInvestment(portfolioId: string, investmentId: string) {
    return this.request<void>(`/portfolios/${portfolioId}/investments/${investmentId}`, {
      method: 'DELETE',
    });
  }

  async recordTransaction(portfolioId: string, investmentId: string, transaction: TransactionData) {
    return this.request<{ transaction: Transaction }>(
      `/portfolios/${portfolioId}/investments/${investmentId}/transactions`,
      {
        method: 'POST',
        body: JSON.stringify(transaction),
      }
    );
  }

  // Market data endpoints
  async getQuote(symbol: string) {
    return this.request<Quote>(`/market/quote/${symbol}`);
  }

  async getBatchQuotes(symbols: string[]) {
    return this.request<{ quotes: Quote[] }>('/market/quotes', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    });
  }

  async getHistoricalData(symbol: string, options?: { from?: string; to?: string; interval?: string }) {
    const params = new URLSearchParams();
    if (options?.from) params.append('from', options.from);
    if (options?.to) params.append('to', options.to);
    if (options?.interval) params.append('interval', options.interval);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ symbol: string; data: HistoricalDataPoint[] }>(`/market/historical/${symbol}${query}`);
  }

  async getFundamentals(symbol: string) {
    return this.request<Fundamentals>(`/market/fundamentals/${symbol}`);
  }

  async searchSymbols(query: string) {
    return this.request<{ results: SymbolSearchResult[] }>(`/market/search?q=${encodeURIComponent(query)}`);
  }

  async getMarketNews(symbols?: string[], limit?: number) {
    const params = new URLSearchParams();
    if (symbols?.length) params.append('symbols', symbols.join(','));
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ news: NewsItem[] }>(`/market/news${query}`);
  }

  // Analytics endpoints
  async getPortfolioAnalytics(portfolioId: string) {
    return this.request<PortfolioAnalytics>(`/analytics/portfolio/${portfolioId}`);
  }

  async getRiskMetrics(portfolioId: string) {
    return this.request<RiskMetrics>(`/analytics/risk/${portfolioId}`);
  }

  async getCorrelationMatrix(portfolioId: string) {
    return this.request<CorrelationMatrix>(`/analytics/correlation/${portfolioId}`);
  }

  async runScenarioAnalysis(portfolioId: string, scenario: ScenarioParams) {
    return this.request<ScenarioResult>(`/analytics/scenario/${portfolioId}`, {
      method: 'POST',
      body: JSON.stringify(scenario),
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Type definitions
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  ownerId: string;
  investments: Investment[];
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  symbol: string;
  name: string;
  type: 'STOCK' | 'BOND' | 'ETF' | 'MUTUAL_FUND' | 'CRYPTO' | 'OTHER';
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  purchaseDate: string;
  sector?: string;
  notes?: string;
}

export interface CreateInvestmentData {
  symbol: string;
  name: string;
  type: 'STOCK' | 'BOND' | 'ETF' | 'MUTUAL_FUND' | 'CRYPTO' | 'OTHER';
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  sector?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  investmentId: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT';
  quantity: number;
  price: number;
  date: string;
  notes?: string;
}

export interface TransactionData {
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT';
  quantity: number;
  price: number;
  date: string;
  notes?: string;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
  mock?: boolean;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Fundamentals {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  marketCap: number;
  pe: number;
  eps: number;
  revenue?: number;
  revenueGrowth?: number;
  netIncome?: number;
  netMargin?: number;
  roe?: number;
  roa?: number;
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  type: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  symbols?: string[];
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  allocations: { type: string; value: number; percent: number }[];
  sectorAllocations: { sector: string; value: number; percent: number }[];
}

export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  beta: number;
  alpha: number;
  maxDrawdown: number;
  valueAtRisk: number;
  sortino: number;
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

export interface ScenarioParams {
  type: 'market_crash' | 'bull_run' | 'rate_hike' | 'recession' | 'custom';
  parameters?: Record<string, number>;
}

export interface ScenarioResult {
  scenario: string;
  portfolioImpact: number;
  impactPercent: number;
  holdingImpacts: { symbol: string; impact: number; percent: number }[];
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing
export { ApiClient };
