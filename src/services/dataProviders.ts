/**
 * Data Provider Interfaces
 * 
 * These interfaces define the contract for data providers.
 * Implement these interfaces to connect to real APIs (Alpha Vantage, Financial Modeling Prep, etc.)
 * 
 * SETUP INSTRUCTIONS:
 * 1. Sign up for API keys from your preferred provider:
 *    - Alpha Vantage: https://www.alphavantage.co/support/#api-key
 *    - Financial Modeling Prep: https://financialmodelingprep.com/developer/docs/
 *    - IEX Cloud: https://iexcloud.io/
 * 
 * 2. Store API keys in environment variables:
 *    - Configure provider keys server-side in backend/.env
 *    - The frontend should call the backend proxy endpoints under /api/v2/market
 * 
 * 3. Implement the provider interfaces (see RealEquityDataProvider example below)
 * 
 * 4. Replace MockEquityProvider with RealEquityDataProvider in components
 */

import { API_BASE } from './runtimeConfig'

// ============================================================================
// EQUITY DATA
// ============================================================================

export interface EquityQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  pe: number
  lastUpdated: string
}

export interface EquityFundamentals {
  symbol: string
  companyName: string
  sector: string
  industry: string
  // Financial metrics
  revenue: number
  revenueGrowth: number
  ebitda: number
  ebitdaMargin: number
  netIncome: number
  netMargin: number
  eps: number
  // Balance sheet
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  cash: number
  debt: number
  // Returns
  roe: number
  roa: number
  roic: number
  // Valuation
  pe: number
  pb: number
  ps: number
  evToEbitda: number
  fcfYield: number
}

export interface EquityHistoricalPrice {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface EquityDataProvider {
  getQuote(symbol: string): Promise<EquityQuote>
  getFundamentals(symbol: string): Promise<EquityFundamentals>
  getHistoricalPrices(symbol: string, from: Date, to: Date): Promise<EquityHistoricalPrice[]>
}

// ============================================================================
// MACRO DATA
// ============================================================================

export interface MacroIndicator {
  id: string
  name: string
  value: number | string
  change: number
  changePercent: number
  unit: string
  lastUpdate: string
  trend: 'up' | 'down' | 'neutral'
}

export interface YieldCurvePoint {
  maturity: string
  rate: number
}

export interface CreditSpread {
  name: string
  spread: number
  change: number
  lastUpdate: string
}

export interface MacroDataProvider {
  getFedFundsRate(): Promise<MacroIndicator>
  getInflationRate(): Promise<MacroIndicator>
  getUnemploymentRate(): Promise<MacroIndicator>
  getGDPGrowth(): Promise<MacroIndicator>
  getYieldCurve(): Promise<YieldCurvePoint[]>
  getCreditSpreads(): Promise<CreditSpread[]>
}

// ============================================================================
// THEME / SECTOR DATA
// ============================================================================

export interface ThemeConstituent {
  symbol: string
  name: string
  weight: number
  sector: string
}

export interface ThemePerformance {
  ytd: number
  oneYear: number
  threeYear: number
  fiveYear: number
  volatility: number
  sharpe: number
}

export interface ThemeDataProvider {
  getThemeConstituents(themeId: string): Promise<ThemeConstituent[]>
  getThemePerformance(themeId: string): Promise<ThemePerformance>
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

export class MockEquityProvider implements EquityDataProvider {
  private mockData: Record<string, any> = {
    'AAPL': {
      companyName: 'Apple Inc.',
      price: 175.50,
      change: 2.30,
      changePercent: 1.33,
      volume: 54200000,
      marketCap: 2750000000000,
      pe: 28.5,
      revenue: 383285000000,
      revenueGrowth: 0.03,
      ebitda: 123000000000,
      ebitdaMargin: 0.32,
      netIncome: 96995000000,
      netMargin: 0.253,
      eps: 6.16,
      roe: 1.474,
      roa: 0.283,
      roic: 0.526,
      pb: 42.5,
      ps: 7.18,
      evToEbitda: 23.5,
      fcfYield: 0.042,
      sector: 'Technology',
      industry: 'Consumer Electronics'
    },
    'MSFT': {
      companyName: 'Microsoft Corporation',
      price: 295.25,
      change: -1.80,
      changePercent: -0.61,
      volume: 22100000,
      marketCap: 2200000000000,
      pe: 31.2,
      revenue: 211915000000,
      revenueGrowth: 0.07,
      ebitda: 95000000000,
      ebitdaMargin: 0.45,
      netIncome: 72738000000,
      netMargin: 0.343,
      eps: 9.72,
      roe: 0.423,
      roa: 0.186,
      roic: 0.325,
      pb: 12.8,
      ps: 10.4,
      evToEbitda: 22.1,
      fcfYield: 0.038,
      sector: 'Technology',
      industry: 'Software'
    },
    'GOOGL': {
      companyName: 'Alphabet Inc.',
      price: 138.75,
      change: 0.95,
      changePercent: 0.69,
      volume: 27300000,
      marketCap: 1750000000000,
      pe: 24.8,
      revenue: 307394000000,
      revenueGrowth: 0.09,
      ebitda: 95000000000,
      ebitdaMargin: 0.31,
      netIncome: 73795000000,
      netMargin: 0.240,
      eps: 5.80,
      roe: 0.285,
      roa: 0.148,
      roic: 0.210,
      pb: 6.9,
      ps: 5.7,
      evToEbitda: 18.4,
      fcfYield: 0.045,
      sector: 'Technology',
      industry: 'Internet Content & Information'
    },
    'NVDA': {
      companyName: 'NVIDIA Corporation',
      price: 485.20,
      change: 8.40,
      changePercent: 1.76,
      volume: 45200000,
      marketCap: 1200000000000,
      pe: 68.5,
      revenue: 26974000000,
      revenueGrowth: 1.25,
      ebitda: 16500000000,
      ebitdaMargin: 0.61,
      netIncome: 12285000000,
      netMargin: 0.455,
      eps: 4.98,
      roe: 0.985,
      roa: 0.445,
      roic: 0.625,
      pb: 52.5,
      ps: 44.5,
      evToEbitda: 72.7,
      fcfYield: 0.018,
      sector: 'Technology',
      industry: 'Semiconductors'
    }
  }

  async getQuote(symbol: string): Promise<EquityQuote> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const data = this.mockData[symbol.toUpperCase()]
    if (!data) {
      throw new Error(`Symbol ${symbol} not found`)
    }

    return {
      symbol: symbol.toUpperCase(),
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      marketCap: data.marketCap,
      pe: data.pe,
      lastUpdated: new Date().toISOString()
    }
  }

  async getFundamentals(symbol: string): Promise<EquityFundamentals> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const data = this.mockData[symbol.toUpperCase()]
    if (!data) {
      throw new Error(`Symbol ${symbol} not found`)
    }

    return {
      symbol: symbol.toUpperCase(),
      companyName: data.companyName,
      sector: data.sector,
      industry: data.industry,
      revenue: data.revenue,
      revenueGrowth: data.revenueGrowth,
      ebitda: data.ebitda,
      ebitdaMargin: data.ebitdaMargin,
      netIncome: data.netIncome,
      netMargin: data.netMargin,
      eps: data.eps,
      totalAssets: data.revenue * 2.5, // Mock calculation
      totalLiabilities: data.revenue * 1.2,
      totalEquity: data.revenue * 1.3,
      cash: data.revenue * 0.4,
      debt: data.revenue * 0.6,
      roe: data.roe,
      roa: data.roa,
      roic: data.roic,
      pe: data.pe,
      pb: data.pb,
      ps: data.ps,
      evToEbitda: data.evToEbitda,
      fcfYield: data.fcfYield
    }
  }

  async getHistoricalPrices(symbol: string, from: Date, to: Date): Promise<EquityHistoricalPrice[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const data = this.mockData[symbol.toUpperCase()]
    if (!data) {
      throw new Error(`Symbol ${symbol} not found`)
    }

    // Generate mock historical data
    const prices: EquityHistoricalPrice[] = []
    const daysDiff = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(from)
      date.setDate(date.getDate() + i)
      
      const basePrice = data.price * (0.95 + Math.random() * 0.1)
      prices.push({
        date: date.toISOString().split('T')[0],
        open: basePrice,
        high: basePrice * 1.02,
        low: basePrice * 0.98,
        close: basePrice * (0.99 + Math.random() * 0.02),
        volume: data.volume * (0.8 + Math.random() * 0.4)
      })
    }

    return prices
  }
}

export class MockMacroProvider implements MacroDataProvider {
  async getFedFundsRate(): Promise<MacroIndicator> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      id: 'fed-funds',
      name: 'Fed Funds Rate',
      value: '5.50%',
      change: 0.25,
      changePercent: 4.76,
      unit: '%',
      lastUpdate: new Date().toISOString(),
      trend: 'neutral'
    }
  }

  async getInflationRate(): Promise<MacroIndicator> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      id: 'cpi',
      name: 'CPI (YoY)',
      value: '3.2%',
      change: -0.3,
      changePercent: -8.57,
      unit: '%',
      lastUpdate: new Date().toISOString(),
      trend: 'down'
    }
  }

  async getUnemploymentRate(): Promise<MacroIndicator> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      id: 'unemployment',
      name: 'Unemployment Rate',
      value: '3.8%',
      change: 0.1,
      changePercent: 2.70,
      unit: '%',
      lastUpdate: new Date().toISOString(),
      trend: 'up'
    }
  }

  async getGDPGrowth(): Promise<MacroIndicator> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      id: 'gdp',
      name: 'GDP Growth (QoQ)',
      value: '2.4%',
      change: -0.6,
      changePercent: -20.00,
      unit: '%',
      lastUpdate: new Date().toISOString(),
      trend: 'down'
    }
  }

  async getYieldCurve(): Promise<YieldCurvePoint[]> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return [
      { maturity: '1M', rate: 5.50 },
      { maturity: '3M', rate: 5.48 },
      { maturity: '6M', rate: 5.42 },
      { maturity: '1Y', rate: 5.20 },
      { maturity: '2Y', rate: 4.95 },
      { maturity: '3Y', rate: 4.75 },
      { maturity: '5Y', rate: 4.60 },
      { maturity: '7Y', rate: 4.55 },
      { maturity: '10Y', rate: 4.50 },
      { maturity: '20Y', rate: 4.70 },
      { maturity: '30Y', rate: 4.65 }
    ]
  }

  async getCreditSpreads(): Promise<CreditSpread[]> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return [
      { name: 'IG Corporate', spread: 90, change: -5, lastUpdate: new Date().toISOString() },
      { name: 'HY Corporate', spread: 320, change: 10, lastUpdate: new Date().toISOString() },
      { name: 'Emerging Markets', spread: 285, change: -8, lastUpdate: new Date().toISOString() }
    ]
  }
}

export class MockThemeProvider implements ThemeDataProvider {
  async getThemeConstituents(themeId: string): Promise<ThemeConstituent[]> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const themes: Record<string, ThemeConstituent[]> = {
      'ai-infrastructure': [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', weight: 18.5, sector: 'Semiconductors' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', weight: 15.2, sector: 'Software' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', weight: 12.8, sector: 'Internet' },
        { symbol: 'AMD', name: 'Advanced Micro Devices', weight: 10.5, sector: 'Semiconductors' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', weight: 9.8, sector: 'Internet' }
      ]
    }

    return themes[themeId] || []
  }

  async getThemePerformance(themeId: string): Promise<ThemePerformance> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const performance: Record<string, ThemePerformance> = {
      'ai-infrastructure': {
        ytd: 45.3,
        oneYear: 82.5,
        threeYear: 125.8,
        fiveYear: 285.2,
        volatility: 32.5,
        sharpe: 1.85
      }
    }

    return performance[themeId] || {
      ytd: 0,
      oneYear: 0,
      threeYear: 0,
      fiveYear: 0,
      volatility: 0,
      sharpe: 0
    }
  }
}

// ============================================================================
// EXAMPLE: REAL API IMPLEMENTATION
// ============================================================================

/**
 * Example implementation using the backend market proxy.
 *
 * SETUP (server-side only):
 * 1. Configure backend provider keys in backend/.env (e.g. ALPHA_VANTAGE_KEY)
 * 2. The frontend calls the backend /api/v2/market endpoints (no secrets in browser)
 */
export class RealEquityDataProvider implements EquityDataProvider {
  private apiBase = API_BASE

  async getQuote(symbol: string): Promise<EquityQuote> {
    const response = await fetch(`${this.apiBase}/market/quote/${encodeURIComponent(symbol)}`)
    const payload = await response.json().catch(() => null)
    const quote = payload?.data

    if (!response.ok || !quote) {
      throw new Error(`Failed to fetch quote for ${symbol}`)
    }

    return {
      symbol: quote.symbol || symbol,
      price: Number(quote.price || 0),
      change: Number(quote.change || 0),
      changePercent: Number(quote.changePercent || 0),
      volume: Number(quote.volume || 0),
      marketCap: 0,
      pe: 0,
      lastUpdated: quote.lastUpdated || new Date().toISOString(),
    }
  }

  async getFundamentals(symbol: string): Promise<EquityFundamentals> {
    const response = await fetch(`${this.apiBase}/market/fundamentals/${encodeURIComponent(symbol)}`)
    const payload = await response.json().catch(() => null)
    const data = payload?.data

    if (!response.ok || !data) {
      throw new Error(`Failed to fetch fundamentals for ${symbol}`)
    }

    return {
      symbol: data.symbol || symbol,
      companyName: data.companyName,
      sector: data.sector,
      industry: data.industry,
      revenue: Number(data.revenue || 0),
      revenueGrowth: Number(data.revenueGrowth || 0),
      ebitda: Number(data.ebitda || 0),
      ebitdaMargin: Number(data.ebitdaMargin || 0),
      netIncome: Number(data.netIncome || 0),
      netMargin: Number(data.netMargin || 0),
      eps: Number(data.eps || 0),
      totalAssets: Number(data.totalAssets || 0),
      totalLiabilities: Number(data.totalLiabilities || 0),
      totalEquity: Number(data.totalEquity || 0),
      cash: Number(data.cash || 0),
      debt: Number(data.debt || 0),
      roe: Number(data.roe || 0),
      roa: Number(data.roa || 0),
      roic: Number(data.roic || 0),
      pe: Number(data.pe || 0),
      pb: Number(data.pb || 0),
      ps: Number(data.ps || 0),
      evToEbitda: Number(data.evToEbitda || 0),
      fcfYield: Number(data.fcfYield || 0),
    }
  }

  async getHistoricalPrices(symbol: string, from: Date, to: Date): Promise<EquityHistoricalPrice[]> {
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      interval: '1d',
    })

    const response = await fetch(
      `${this.apiBase}/market/historical/${encodeURIComponent(symbol)}?${params.toString()}`
    )
    const payload = await response.json().catch(() => null)
    const series = payload?.data?.data

    if (!response.ok || !Array.isArray(series)) {
      throw new Error(`Failed to fetch historical prices for ${symbol}`)
    }

    return series
      .map((c: any) => ({
        date: c.date,
        open: Number(c.open || 0),
        high: Number(c.high || 0),
        low: Number(c.low || 0),
        close: Number(c.close || 0),
        volume: Number(c.volume || 0),
      }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Get the configured equity data provider
 * Switch between Mock and Real based on environment or configuration
 */
export function getEquityDataProvider(): EquityDataProvider {
  // Prefer the backend proxy provider (it can use real keys server-side or mock data)
  console.log('Using Real Equity Data Provider (Backend Proxy)')
  return new RealEquityDataProvider()
}

export function getMacroDataProvider(): MacroDataProvider {
  // For now, only mock is implemented
  // Add real provider when you have FRED API access
  return new MockMacroProvider()
}

export function getThemeDataProvider(): ThemeDataProvider {
  return new MockThemeProvider()
}
