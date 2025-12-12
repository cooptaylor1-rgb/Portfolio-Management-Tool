/**
 * API Service Layer
 * 
 * Centralized API client for all backend communications.
 * Handles authentication, caching, error handling, and retry logic.
 */

import { API_BASE } from './runtimeConfig';

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
    const response = await this.request<{ user: ApiUser; accessToken: string; refreshToken: string }>(
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
    const response = await this.request<{ user: ApiUser; accessToken: string; refreshToken: string }>(
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

  async me() {
    return this.request<{ user: ApiUser }>('/auth/me');
  }

  async logout() {
    const refreshToken = this.refreshToken;
    if (refreshToken) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    this.clearTokens();
  }

  // Portfolio endpoints
  async getPortfolios() {
    return this.request<{ portfolios: ApiPortfolioSummary[] }>('/portfolios');
  }

  async getPortfolio(id: string) {
    return this.request<{ portfolio: ApiPortfolioDetail }>(`/portfolios/${id}`);
  }

  async createPortfolio(data: { name: string; description?: string; isPublic?: boolean }) {
    return this.request<{ portfolio: ApiPortfolio }>('/portfolios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePortfolio(id: string, data: Partial<{ name: string; description: string; isPublic: boolean }>) {
    return this.request<{ portfolio: ApiPortfolio }>(`/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePortfolio(id: string) {
    return this.request<void>(`/portfolios/${id}`, { method: 'DELETE' });
  }

  async sharePortfolio(portfolioId: string, email: string, permission: 'VIEW' | 'EDIT' | 'ADMIN') {
    return this.request<{ share: ApiPortfolioShare }>(`/portfolios/${portfolioId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    });
  }

  async unsharePortfolio(portfolioId: string, userId: string) {
    return this.request<{ message: string }>(`/portfolios/${portfolioId}/share/${userId}`, {
      method: 'DELETE',
    });
  }

  async getPortfolioActivity(portfolioId: string, limit: number = 50) {
    return this.request<{ activities: ApiPortfolioActivityRow[] }>(`/portfolios/${portfolioId}/activity?limit=${limit}`);
  }

  async getUserActivity(limit: number = 50) {
    return this.request<{ activities: ApiPortfolioActivityRow[] }>(`/portfolios/activity?limit=${limit}`);
  }

  // Import/export endpoints
  async exportPortfolios() {
    return this.request<ApiPortfoliosExport>(`/portfolios/export`);
  }

  async importPortfolios(payload: ApiPortfoliosImport) {
    return this.request<{ importedCount: number; portfolios: Array<{ id: string; name: string }> }>(
      `/portfolios/import`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  async clearOwnedPortfolios() {
    return this.request<{ deletedCount: number }>(`/portfolios/owned`, {
      method: 'DELETE',
    });
  }

  async searchUsers(query: string, limit: number = 10) {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    return this.request<{ users: ApiUser[] }>(`/users/search?${params.toString()}`);
  }

  // Investment endpoints
  async addInvestment(portfolioId: string, investment: ApiCreateInvestmentData) {
    return this.request<{ investment: ApiInvestment }>(`/portfolios/${portfolioId}/investments`, {
      method: 'POST',
      body: JSON.stringify(investment),
    });
  }

  async updateInvestment(portfolioId: string, investmentId: string, data: Partial<ApiInvestment>) {
    return this.request<{ investment: ApiInvestment }>(
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

  async recordTransaction(portfolioId: string, investmentId: string, transaction: ApiTransactionData) {
    return this.request<{ transaction: ApiTransaction }>(
      `/portfolios/${portfolioId}/investments/${investmentId}/transactions`,
      {
        method: 'POST',
        body: JSON.stringify(transaction),
      }
    );
  }

  // Market data endpoints
  async getQuote(symbol: string) {
    return this.request<ApiQuote>(`/market/quote/${symbol}`);
  }

  async getBatchQuotes(symbols: string[]) {
    return this.request<{ quotes: ApiQuote[] }>('/market/quotes', {
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
    return this.request<{ symbol: string; data: ApiHistoricalDataPoint[] }>(`/market/historical/${symbol}${query}`);
  }

  async getFundamentals(symbol: string) {
    return this.request<ApiFundamentals>(`/market/fundamentals/${symbol}`);
  }

  async searchSymbols(query: string) {
    return this.request<{ results: ApiSymbolSearchResult[] }>(`/market/search?q=${encodeURIComponent(query)}`);
  }

  async getMarketNews(symbols?: string[], limit?: number) {
    const params = new URLSearchParams();
    if (symbols?.length) params.append('symbols', symbols.join(','));
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ news: ApiNewsItem[] }>(`/market/news${query}`);
  }

  // Analytics endpoints
  async getPortfolioAnalytics(portfolioId: string) {
    return this.request<ApiPortfolioAnalytics>(`/analytics/portfolio/${portfolioId}`);
  }

  async getRiskMetrics(portfolioId: string) {
    return this.request<ApiRiskMetrics>(`/analytics/risk/${portfolioId}`);
  }

  async getCorrelationMatrix(portfolioId: string) {
    return this.request<ApiCorrelationMatrix>(`/analytics/correlation/${portfolioId}`);
  }

  async runScenarioAnalysis(portfolioId: string, scenario: ScenarioParams) {
    return this.request<ApiScenarioResult>(`/analytics/scenario/${portfolioId}`, {
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
export interface ApiUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  createdAt: string;
}

export interface ApiPortfolio {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  ownerId: string;
  investments?: ApiInvestment[];
  createdAt: string;
  updatedAt: string;
  importedFrom?: {
    sourcePortfolioId?: string;
    sourceOwnerEmail?: string;
    sourceOwnerName?: string;
    exportedAt?: string;
    version?: string;
  };
}

export interface ApiPortfolioSummary extends ApiPortfolio {
  investmentCount?: number;
  shareCount?: number;
  permission?: 'OWNER' | 'VIEW' | 'EDIT' | 'ADMIN';
  isOwner?: boolean;
}

export interface ApiPortfolioShare {
  portfolioId: string;
  userId: string;
  permission: 'VIEW' | 'EDIT' | 'ADMIN';
  createdAt?: string;
  user?: ApiUser;
}

export interface ApiPortfolioDetail extends ApiPortfolio {
  investments?: ApiInvestment[];
  shares?: ApiPortfolioShare[];
  permission?: 'OWNER' | 'VIEW' | 'EDIT' | 'ADMIN';
  isOwner?: boolean;
}

export interface ApiPortfolioActivityRow {
  id: string;
  portfolioId: string;
  userId: string;
  action: string;
  details?: unknown;
  createdAt: string;
  user?: ApiUser;
  portfolio?: { id: string; name: string };
}

export interface ApiInvestment {
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

export interface ApiCreateInvestmentData {
  symbol: string;
  name: string;
  type: 'STOCK' | 'BOND' | 'ETF' | 'MUTUAL_FUND' | 'CRYPTO' | 'OTHER';
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  sector?: string;
  notes?: string;
}

export interface ApiTransaction {
  id: string;
  investmentId: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  quantity: number;
  price: number;
  fees?: number;
  date: string;
  notes?: string;
}

export interface ApiTransactionData {
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'SPLIT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  quantity: number;
  price: number;
  fees?: number;
  date: string;
  notes?: string;
}

export interface ApiPortfoliosExport {
  version: string;
  exportedAt: string;
  portfolios: ApiPortfolioExport[];
}

export interface ApiPortfoliosImport {
  version?: string;
  exportedAt?: string;
  portfolios: ApiPortfolioExport[];
}

export interface ApiPortfolioExport {
  id?: string;
  owner?: { id: string; name: string; email: string };
  permission?: 'OWNER' | 'VIEW' | 'EDIT' | 'ADMIN';
  isOwner?: boolean;
  investmentCount?: number;
  shareCount?: number;
  name: string;
  description?: string | null;
  isPublic?: boolean;
  investments?: ApiPortfolioExportInvestment[];
}

export interface ApiPortfolioExportInvestment {
  symbol: string;
  name: string;
  type:
    | 'STOCK'
    | 'BOND'
    | 'ETF'
    | 'MUTUAL_FUND'
    | 'CRYPTO'
    | 'OTHER'
    | 'stock'
    | 'bond'
    | 'etf'
    | 'mutual-fund'
    | 'mutual_fund'
    | 'crypto'
    | 'other';
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  sector?: string | null;
  notes?: string | null;
  transactions?: ApiPortfolioExportTransaction[];
}

export interface ApiPortfolioExportTransaction {
  type:
    | 'BUY'
    | 'SELL'
    | 'DIVIDEND'
    | 'SPLIT'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT'
    | 'buy'
    | 'sell'
    | 'dividend'
    | 'split'
    | 'transfer_in'
    | 'transfer_out';
  quantity: number;
  price: number;
  fees?: number | null;
  date: string;
  notes?: string | null;
}

export interface ApiQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
  mock?: boolean;
}

export interface ApiHistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ApiFundamentals {
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

export interface ApiSymbolSearchResult {
  symbol: string;
  name: string;
  type: string;
}

export interface ApiNewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  symbols?: string[];
}

export interface ApiPortfolioAnalytics {
  totalValue: number;
  totalInvested: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  allocations: { type: string; value: number; percent: number }[];
  sectorAllocations: { sector: string; value: number; percent: number }[];
}

export interface ApiRiskMetrics {
  volatility: number;
  sharpeRatio: number;
  beta: number;
  alpha: number;
  maxDrawdown: number;
  valueAtRisk: number;
  sortino: number;
}

export interface ApiCorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

export interface ScenarioParams {
  type: 'market_crash' | 'bull_run' | 'rate_hike' | 'recession' | 'custom';
  parameters?: Record<string, number>;
}

export interface ApiScenarioResult {
  scenario: string;
  portfolioImpact: number;
  impactPercent: number;
  holdingImpacts: { symbol: string; impact: number; percent: number }[];
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing
export { ApiClient };
