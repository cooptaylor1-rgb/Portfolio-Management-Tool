/**
 * API Client for Portfolio Backend
 * 
 * This module provides a type-safe client for communicating with the backend API.
 * Replace the localStorage-based services with these functions when backend is ready.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Token storage
let accessToken: string | null = null;
let refreshToken: string | null = null;

/**
 * Initialize tokens from localStorage (for page refresh persistence)
 */
export function initializeAuth() {
  accessToken = localStorage.getItem('accessToken');
  refreshToken = localStorage.getItem('refreshToken');
}

/**
 * Store tokens after login/register
 */
function storeTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

/**
 * Clear tokens on logout
 */
function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

/**
 * Generic API request with auth handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle token refresh
  if (response.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiClientError(
      data.error?.message || 'Request failed',
      data.error?.code || 'UNKNOWN_ERROR',
      response.status
    );
  }

  return data.data;
}

/**
 * Refresh the access token
 */
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    storeTokens(data.data.accessToken, data.data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

// ============================================================================
// AUTH API
// ============================================================================

export const authApi = {
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiClientError(
        data.error?.message || 'Login failed',
        data.error?.code || 'LOGIN_ERROR',
        response.status
      );
    }

    storeTokens(data.data.accessToken, data.data.refreshToken);
    return data.data.user;
  },

  async register(name: string, email: string, password: string) {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiClientError(
        data.error?.message || 'Registration failed',
        data.error?.code || 'REGISTER_ERROR',
        response.status
      );
    }

    storeTokens(data.data.accessToken, data.data.refreshToken);
    return data.data.user;
  },

  async logout() {
    if (refreshToken) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore logout errors
      }
    }
    clearTokens();
  },

  async getCurrentUser() {
    return apiRequest<{ user: any }>('/api/auth/me');
  },

  async getSessions() {
    return apiRequest<{ sessions: any[] }>('/api/auth/sessions');
  },

  async revokeSession(sessionId: string) {
    return apiRequest(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
  },

  isAuthenticated() {
    return !!accessToken;
  },
};

// ============================================================================
// PORTFOLIO API
// ============================================================================

export const portfolioApi = {
  async list() {
    return apiRequest<{ portfolios: any[] }>('/api/portfolios');
  },

  async get(id: string) {
    return apiRequest<{ portfolio: any }>(`/api/portfolios/${id}`);
  },

  async create(name: string, description?: string) {
    return apiRequest<{ portfolio: any }>('/api/portfolios', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  async update(id: string, updates: { name?: string; description?: string; isPublic?: boolean }) {
    return apiRequest<{ portfolio: any }>(`/api/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async delete(id: string) {
    return apiRequest(`/api/portfolios/${id}`, { method: 'DELETE' });
  },

  async addInvestment(portfolioId: string, investment: {
    symbol: string;
    name: string;
    type: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: string;
    sector?: string;
    notes?: string;
  }) {
    return apiRequest<{ investment: any }>(`/api/portfolios/${portfolioId}/investments`, {
      method: 'POST',
      body: JSON.stringify(investment),
    });
  },

  async updateInvestment(portfolioId: string, investmentId: string, updates: any) {
    return apiRequest(`/api/portfolios/${portfolioId}/investments/${investmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async removeInvestment(portfolioId: string, investmentId: string) {
    return apiRequest(`/api/portfolios/${portfolioId}/investments/${investmentId}`, {
      method: 'DELETE',
    });
  },

  async share(portfolioId: string, email: string, permission: 'VIEW' | 'EDIT' | 'ADMIN') {
    return apiRequest(`/api/portfolios/${portfolioId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    });
  },

  async getActivity(portfolioId: string, limit = 50) {
    return apiRequest<{ activities: any[] }>(`/api/portfolios/${portfolioId}/activity?limit=${limit}`);
  },
};

// ============================================================================
// MARKET DATA API
// ============================================================================

export const marketApi = {
  async getQuote(symbol: string) {
    return apiRequest<any>(`/api/market/quote/${symbol}`);
  },

  async getBatchQuotes(symbols: string[]) {
    return apiRequest<{ quotes: any[] }>('/api/market/quotes', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    });
  },

  async getHistorical(symbol: string, from?: Date, to?: Date, interval = '1d') {
    const params = new URLSearchParams({ interval });
    if (from) params.set('from', from.toISOString());
    if (to) params.set('to', to.toISOString());
    
    return apiRequest<any>(`/api/market/historical/${symbol}?${params}`);
  },

  async getFundamentals(symbol: string) {
    return apiRequest<any>(`/api/market/fundamentals/${symbol}`);
  },

  async search(query: string) {
    return apiRequest<{ results: any[] }>(`/api/market/search?q=${encodeURIComponent(query)}`);
  },

  async getNews(symbols?: string[], limit = 20) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (symbols?.length) params.set('symbols', symbols.join(','));
    
    return apiRequest<{ news: any[] }>(`/api/market/news?${params}`);
  },

  /**
   * Create WebSocket connection for real-time prices
   */
  createPriceStream(onMessage: (data: any) => void, onError?: (error: any) => void) {
    const ws = new WebSocket(`${API_BASE.replace('http', 'ws')}/api/market/stream`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        onError?.(e);
      }
    };

    ws.onerror = (error) => {
      onError?.(error);
    };

    return {
      subscribe(symbols: string[]) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'subscribe', symbols }));
        }
      },
      unsubscribe(symbols: string[]) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'unsubscribe', symbols }));
        }
      },
      close() {
        ws.close();
      },
    };
  },
};

// ============================================================================
// ANALYTICS API
// ============================================================================

export const analyticsApi = {
  async getPortfolioAnalytics(portfolioId: string) {
    return apiRequest<any>(`/api/analytics/portfolio/${portfolioId}`);
  },

  async getRiskAnalysis(portfolioId: string) {
    return apiRequest<any>(`/api/analytics/portfolio/${portfolioId}/risk`);
  },

  async getRebalanceRecommendations(portfolioId: string, targetAllocation?: Record<string, number>) {
    return apiRequest<any>(`/api/analytics/portfolio/${portfolioId}/rebalance`, {
      method: 'POST',
      body: JSON.stringify({ targetAllocation }),
    });
  },

  async getTaxAnalysis(portfolioId: string) {
    return apiRequest<any>(`/api/analytics/portfolio/${portfolioId}/tax`);
  },

  async getCorrelation(portfolioId: string) {
    return apiRequest<any>(`/api/analytics/portfolio/${portfolioId}/correlation`);
  },

  async runMonteCarloSimulation(portfolioId: string, scenarios = 1000, horizon = 252) {
    return apiRequest<any>(`/api/analytics/portfolio/${portfolioId}/scenario`, {
      method: 'POST',
      body: JSON.stringify({ scenarios, horizon }),
    });
  },
};

// Initialize auth on module load
initializeAuth();
