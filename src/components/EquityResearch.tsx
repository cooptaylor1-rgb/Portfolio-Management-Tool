import React, { useState } from 'react'
import { Search, TrendingUp, DollarSign, Shield, BarChart3, Activity, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { ChartContainer } from './ChartComponents'
import { CustomTooltip } from './CustomTooltip'
import { chartColors, chartConfig } from '../config/chartTheme'

interface EquityData {
  ticker: string
  name: string
  sector: string
  industry: string
  country: string
  marketCap: number
  enterpriseValue: number
  avgVolume: number
  profile: {
    description: string
    employees: number
    founded: number
  }
  fundamentals: {
    revenue: number
    ebitda: number
    eps: number
    fcf: number
    revenueGrowth: number
    ebitdaMargin: number
    netMargin: number
    roe: number
    roic: number
    debtToEbitda: number
    interestCoverage: number
  }
  valuation: {
    pe: number
    peForward: number
    evToEbitda: number
    priceToFcf: number
    priceToSales: number
    pePercentile: number
    evToEbitdaPercentile: number
  }
  quality: {
    earningsStability: number // 0-100
    balanceSheetStrength: number // 0-100
    profitabilityConsistency: number // 0-100
    growthQuality: number // 0-100
  }
  risk: {
    volatility: number
    beta: number
    maxDrawdown: number
    sharpeRatio: number
    cyclicality: 'Low' | 'Medium' | 'High'
  }
  compositeScore: {
    overall: number // 0-100
    valuation: number
    quality: number
    growth: number
    risk: number
  }
}

// Mock data - in production, this would come from an API
const MOCK_EQUITY_DATA: Record<string, EquityData> = {
  'AAPL': {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    country: 'United States',
    marketCap: 2800000000000,
    enterpriseValue: 2900000000000,
    avgVolume: 55000000,
    profile: {
      description: 'Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
      employees: 164000,
      founded: 1976
    },
    fundamentals: {
      revenue: 383285000000,
      ebitda: 123217000000,
      eps: 6.11,
      fcf: 99584000000,
      revenueGrowth: 2.1,
      ebitdaMargin: 32.1,
      netMargin: 25.3,
      roe: 147.4,
      roic: 54.2,
      debtToEbitda: 0.8,
      interestCoverage: 35.2
    },
    valuation: {
      pe: 28.5,
      peForward: 26.2,
      evToEbitda: 23.5,
      priceToFcf: 28.1,
      priceToSales: 7.3,
      pePercentile: 68,
      evToEbitdaPercentile: 72
    },
    quality: {
      earningsStability: 92,
      balanceSheetStrength: 88,
      profitabilityConsistency: 95,
      growthQuality: 78
    },
    risk: {
      volatility: 24.5,
      beta: 1.21,
      maxDrawdown: -31.2,
      sharpeRatio: 1.42,
      cyclicality: 'Medium'
    },
    compositeScore: {
      overall: 84,
      valuation: 72,
      quality: 93,
      growth: 75,
      risk: 88
    }
  },
  'MSFT': {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    industry: 'Software',
    country: 'United States',
    marketCap: 2750000000000,
    enterpriseValue: 2825000000000,
    avgVolume: 22000000,
    profile: {
      description: 'Microsoft develops, licenses, and supports software products, services, and devices worldwide.',
      employees: 221000,
      founded: 1975
    },
    fundamentals: {
      revenue: 211915000000,
      ebitda: 97480000000,
      eps: 11.05,
      fcf: 71150000000,
      revenueGrowth: 11.8,
      ebitdaMargin: 46.0,
      netMargin: 36.7,
      roe: 38.6,
      roic: 28.4,
      debtToEbitda: 0.6,
      interestCoverage: 42.8
    },
    valuation: {
      pe: 34.2,
      peForward: 30.5,
      evToEbitda: 29.0,
      priceToFcf: 38.7,
      priceToSales: 13.0,
      pePercentile: 78,
      evToEbitdaPercentile: 82
    },
    quality: {
      earningsStability: 89,
      balanceSheetStrength: 91,
      profitabilityConsistency: 94,
      growthQuality: 88
    },
    risk: {
      volatility: 22.1,
      beta: 0.89,
      maxDrawdown: -28.4,
      sharpeRatio: 1.58,
      cyclicality: 'Low'
    },
    compositeScore: {
      overall: 88,
      valuation: 68,
      quality: 91,
      growth: 88,
      risk: 91
    }
  }
}

const SEARCH_RESULTS = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Financial Services' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { ticker: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Defensive' },
  { ticker: 'PG', name: 'Procter & Gamble Co.', sector: 'Consumer Defensive' }
]

export const EquityResearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicker, setSelectedTicker] = useState<string>('AAPL')
  const [showSearch, setShowSearch] = useState(false)

  const equityData = MOCK_EQUITY_DATA[selectedTicker]

  const filteredResults = searchQuery
    ? SEARCH_RESULTS.filter(
        r =>
          r.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SEARCH_RESULTS

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return `$${value.toLocaleString()}`
  }

  const formatNumber = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
    return value.toFixed(0)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#00ff88'
    if (score >= 60) return '#00d9ff'
    if (score >= 40) return '#ffaa00'
    return '#ff3366'
  }

  const getValuationAssessment = (percentile: number) => {
    if (percentile < 30) return { label: 'Attractive', color: '#00ff88' }
    if (percentile < 50) return { label: 'Fair', color: '#00d9ff' }
    if (percentile < 70) return { label: 'Full', color: '#ffaa00' }
    return { label: 'Expensive', color: '#ff3366' }
  }

  if (!equityData) {
    return <div className="equity-research">Loading...</div>
  }

  const qualityRadarData = [
    { metric: 'Earnings Stability', value: equityData.quality.earningsStability },
    { metric: 'Balance Sheet', value: equityData.quality.balanceSheetStrength },
    { metric: 'Profitability', value: equityData.quality.profitabilityConsistency },
    { metric: 'Growth Quality', value: equityData.quality.growthQuality }
  ]

  const scoreBreakdownData = [
    { name: 'Valuation', score: equityData.compositeScore.valuation },
    { name: 'Quality', score: equityData.compositeScore.quality },
    { name: 'Growth', score: equityData.compositeScore.growth },
    { name: 'Risk', score: equityData.compositeScore.risk }
  ]

  return (
    <div className="equity-research">
      {/* Search Bar */}
      <div className="research-header">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by ticker or company name..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
              className="research-search-input"
            />
          </div>
          {showSearch && (
            <div className="search-results-dropdown">
              {filteredResults.map(result => (
                <button
                  key={result.ticker}
                  className="search-result-item"
                  onClick={() => {
                    setSelectedTicker(result.ticker)
                    setSearchQuery('')
                    setShowSearch(false)
                  }}
                >
                  <div>
                    <span className="result-ticker">{result.ticker}</span>
                    <span className="result-name">{result.name}</span>
                  </div>
                  <span className="result-sector">{result.sector}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Company Header */}
      <div className="company-header">
        <div className="company-title">
          <h2>
            {equityData.name}
            <span className="ticker-badge">{equityData.ticker}</span>
          </h2>
          <p className="company-meta">
            {equityData.sector} • {equityData.industry} • {equityData.country}
          </p>
        </div>
        <div className="composite-score-card">
          <div className="score-label">Composite Score</div>
          <div
            className="score-value-large"
            style={{ color: getScoreColor(equityData.compositeScore.overall) }}
          >
            {equityData.compositeScore.overall}/100
          </div>
          <div className="score-breakdown-mini">
            {scoreBreakdownData.map(item => (
              <div key={item.name} className="mini-score">
                <span>{item.name.charAt(0)}</span>
                <span style={{ color: getScoreColor(item.score) }}>{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-summary-grid">
        <div className="metric-summary-card">
          <DollarSign size={20} className="metric-icon" />
          <div>
            <div className="metric-label">Market Cap</div>
            <div className="metric-value">{formatCurrency(equityData.marketCap)}</div>
          </div>
        </div>
        <div className="metric-summary-card">
          <BarChart3 size={20} className="metric-icon" />
          <div>
            <div className="metric-label">Enterprise Value</div>
            <div className="metric-value">{formatCurrency(equityData.enterpriseValue)}</div>
          </div>
        </div>
        <div className="metric-summary-card">
          <Activity size={20} className="metric-icon" />
          <div>
            <div className="metric-label">Avg Volume</div>
            <div className="metric-value">{formatNumber(equityData.avgVolume)}</div>
          </div>
        </div>
        <div className="metric-summary-card">
          <Shield size={20} className="metric-icon" />
          <div>
            <div className="metric-label">Beta</div>
            <div className="metric-value">{equityData.risk.beta.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="research-content-grid">
        {/* Valuation Section */}
        <div className="research-section">
          <h3>
            <DollarSign size={18} />
            Valuation Analysis
          </h3>
          <div className="valuation-grid">
            <div className="valuation-metric">
              <span className="val-label">P/E (TTM)</span>
              <span className="val-value">{equityData.valuation.pe.toFixed(1)}x</span>
              <span className="val-percentile">{equityData.valuation.pePercentile}th %ile</span>
            </div>
            <div className="valuation-metric">
              <span className="val-label">P/E (Fwd)</span>
              <span className="val-value">{equityData.valuation.peForward.toFixed(1)}x</span>
            </div>
            <div className="valuation-metric">
              <span className="val-label">EV/EBITDA</span>
              <span className="val-value">{equityData.valuation.evToEbitda.toFixed(1)}x</span>
              <span className="val-percentile">{equityData.valuation.evToEbitdaPercentile}th %ile</span>
            </div>
            <div className="valuation-metric">
              <span className="val-label">P/FCF</span>
              <span className="val-value">{equityData.valuation.priceToFcf.toFixed(1)}x</span>
            </div>
            <div className="valuation-metric">
              <span className="val-label">P/S</span>
              <span className="val-value">{equityData.valuation.priceToSales.toFixed(1)}x</span>
            </div>
          </div>
          <div
            className="valuation-assessment"
            style={{
              borderLeftColor: getValuationAssessment(equityData.valuation.pePercentile).color
            }}
          >
            <AlertCircle size={16} />
            <span>
              <strong>Assessment:</strong>{' '}
              {getValuationAssessment(equityData.valuation.pePercentile).label} valuation based on
              historical percentiles
            </span>
          </div>
        </div>

        {/* Fundamentals Section */}
        <div className="research-section">
          <h3>
            <BarChart3 size={18} />
            Fundamentals & Profitability
          </h3>
          <div className="fundamentals-grid">
            <div className="fund-metric">
              <span className="fund-label">Revenue</span>
              <span className="fund-value">{formatCurrency(equityData.fundamentals.revenue)}</span>
              <span
                className="fund-change"
                style={{ color: equityData.fundamentals.revenueGrowth >= 0 ? '#00ff88' : '#ff3366' }}
              >
                {equityData.fundamentals.revenueGrowth >= 0 ? '+' : ''}
                {equityData.fundamentals.revenueGrowth.toFixed(1)}% YoY
              </span>
            </div>
            <div className="fund-metric">
              <span className="fund-label">EBITDA</span>
              <span className="fund-value">{formatCurrency(equityData.fundamentals.ebitda)}</span>
              <span className="fund-change">{equityData.fundamentals.ebitdaMargin.toFixed(1)}% margin</span>
            </div>
            <div className="fund-metric">
              <span className="fund-label">EPS (TTM)</span>
              <span className="fund-value">${equityData.fundamentals.eps.toFixed(2)}</span>
            </div>
            <div className="fund-metric">
              <span className="fund-label">Free Cash Flow</span>
              <span className="fund-value">{formatCurrency(equityData.fundamentals.fcf)}</span>
            </div>
            <div className="fund-metric">
              <span className="fund-label">Net Margin</span>
              <span className="fund-value">{equityData.fundamentals.netMargin.toFixed(1)}%</span>
            </div>
            <div className="fund-metric">
              <span className="fund-label">ROE</span>
              <span className="fund-value">{equityData.fundamentals.roe.toFixed(1)}%</span>
            </div>
            <div className="fund-metric">
              <span className="fund-label">ROIC</span>
              <span className="fund-value">{equityData.fundamentals.roic.toFixed(1)}%</span>
            </div>
            <div className="fund-metric">
              <span className="fund-label">Debt/EBITDA</span>
              <span className="fund-value">{equityData.fundamentals.debtToEbitda.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        {/* Quality Radar */}
        <ChartContainer 
          title="Quality Profile"
          subtitle="Business quality metrics across key dimensions"
          height={350}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={qualityRadarData}>
                <PolarGrid stroke={chartColors.grid} strokeWidth={1} opacity={0.5} />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fill: chartColors.text, fontSize: 12 }} 
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fill: chartColors.text, fontSize: 11 }} 
                  stroke={chartColors.axis}
                />
                <Radar
                  name="Quality"
                  dataKey="value"
                  stroke={chartColors.success}
                  strokeWidth={2}
                  fill={chartColors.success}
                  fillOpacity={0.25}
                  animationDuration={800}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="quality-summary">
            {Object.entries(equityData.quality).map(([key, value]) => (
              <div key={key} className="quality-item">
                <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="quality-bar">
                  <div
                    className="quality-fill"
                    style={{
                      width: `${value}%`,
                      background: getScoreColor(value)
                    }}
                  />
                </div>
                <span style={{ color: getScoreColor(value) }}>{value}/100</span>
              </div>
            ))}
          </div>
        </ChartContainer>

        {/* Risk Profile */}
        <div className="research-section">
          <h3>
            <AlertCircle size={18} />
            Risk Profile
          </h3>
          <div className="risk-grid">
            <div className="risk-metric">
              <span className="risk-label">Volatility (1Y)</span>
              <span className="risk-value">{equityData.risk.volatility.toFixed(1)}%</span>
            </div>
            <div className="risk-metric">
              <span className="risk-label">Beta</span>
              <span className="risk-value">{equityData.risk.beta.toFixed(2)}</span>
            </div>
            <div className="risk-metric">
              <span className="risk-label">Max Drawdown</span>
              <span className="risk-value" style={{ color: '#ff3366' }}>
                {equityData.risk.maxDrawdown.toFixed(1)}%
              </span>
            </div>
            <div className="risk-metric">
              <span className="risk-label">Sharpe Ratio</span>
              <span className="risk-value" style={{ color: '#00ff88' }}>
                {equityData.risk.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <div className="risk-metric">
              <span className="risk-label">Cyclicality</span>
              <span className="risk-badge" data-level={equityData.risk.cyclicality.toLowerCase()}>
                {equityData.risk.cyclicality}
              </span>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <ChartContainer 
          title="Composite Score Breakdown"
          subtitle="Combines valuation, quality, growth, and risk factors"
          height={280}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreBreakdownData} layout="horizontal" margin={chartConfig.margin}>
              <CartesianGrid {...chartConfig.grid} />
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                {...chartConfig.axis}
                tick={{ fill: chartColors.text }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                {...chartConfig.axis}
                tick={{ fill: chartColors.text }}
                width={90}
              />
              <CustomTooltip />
              <Bar 
                dataKey="score" 
                fill={chartColors.info} 
                radius={chartConfig.bar.radius}
                maxBarSize={chartConfig.bar.maxBarSize}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="score-explanation" style={{ marginTop: 'var(--spacing-md)' }}>
            <p>
              <strong>Composite methodology:</strong> Combines valuation (30%), quality (30%), growth
              (20%), and risk (20%) factors using normalized metrics and historical percentiles.
              Conservative scoring favors balance sheet strength and earnings consistency.
            </p>
          </div>
        </ChartContainer>
      </div>
    </div>
  )
}
