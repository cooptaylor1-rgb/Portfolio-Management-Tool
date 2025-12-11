import React, { useState } from 'react'
import { TrendingUp, Layers, Globe, AlertTriangle, Info, PieChart as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartLegendItem } from './ChartComponents'
import { CustomTooltip } from './CustomTooltip'
import { chartColors, chartConfig, chartPalette, formatters } from '../config/chartTheme'

interface ThemeConstituent {
  ticker: string
  name: string
  weight: number
  sector: string
  country: string
  marketCap: number
}

interface ThemeDefinition {
  id: string
  name: string
  description: string
  keyDrivers: string[]
  macroLinkages: string[]
  primarySectors: string[]
  investmentHorizon: 'Short-term' | 'Medium-term' | 'Long-term'
  riskLevel: 'Low' | 'Medium' | 'High'
}

interface ThemeAnalytics {
  returns: {
    ytd: number
    oneYear: number
    threeYear: number
    fiveYear: number
  }
  risk: {
    volatility: number
    sharpeRatio: number
    maxDrawdown: number
  }
  concentration: {
    top5Weight: number
    top10Weight: number
    effectiveNStocks: number
  }
  sectorBreakdown: Array<{ sector: string; weight: number }>
  regionBreakdown: Array<{ region: string; weight: number }>
}

const THEMES: ThemeDefinition[] = [
  {
    id: 'ai-infrastructure',
    name: 'AI Infrastructure',
    description: 'Companies building the foundational infrastructure for artificial intelligence, including semiconductors, cloud computing, and data centers',
    keyDrivers: [
      'Exponential growth in AI model training compute requirements',
      'Enterprise adoption of generative AI applications',
      'Government investments in AI sovereignty',
      'Increasing energy demands for AI data centers'
    ],
    macroLinkages: [
      'Capital expenditure cycles in technology',
      'Power infrastructure and energy transition',
      'Geopolitical competition in chip manufacturing'
    ],
    primarySectors: ['Technology', 'Semiconductors', 'Utilities'],
    investmentHorizon: 'Long-term',
    riskLevel: 'High'
  },
  {
    id: 'healthcare-innovation',
    name: 'Healthcare Innovation',
    description: 'Companies driving breakthrough innovations in biotechnology, precision medicine, medical devices, and digital health',
    keyDrivers: [
      'Aging global demographics increasing healthcare demand',
      'Breakthroughs in gene therapy and immunotherapy',
      'AI-powered drug discovery reducing development timelines',
      'Shift towards preventive and personalized medicine'
    ],
    macroLinkages: [
      'Government healthcare spending trends',
      'Regulatory environment for drug approvals',
      'Healthcare inflation and pricing power'
    ],
    primarySectors: ['Healthcare', 'Biotechnology', 'Medical Devices'],
    investmentHorizon: 'Long-term',
    riskLevel: 'Medium'
  },
  {
    id: 'energy-transition',
    name: 'Energy Transition',
    description: 'Companies enabling the shift from fossil fuels to renewable energy and electrification of transportation and industry',
    keyDrivers: [
      'Net-zero commitments from governments and corporations',
      'Declining costs of solar, wind, and battery storage',
      'Electric vehicle adoption accelerating globally',
      'Grid modernization and energy storage deployment'
    ],
    macroLinkages: [
      'Commodity prices (lithium, copper, rare earths)',
      'Energy policy and subsidy regimes',
      'Interest rates affecting infrastructure investment'
    ],
    primarySectors: ['Utilities', 'Industrials', 'Materials'],
    investmentHorizon: 'Long-term',
    riskLevel: 'Medium'
  },
  {
    id: 'onshoring-reshoring',
    name: 'Onshoring & Reshoring',
    description: 'Companies benefiting from the shift of manufacturing and supply chains back to domestic or near-shore locations',
    keyDrivers: [
      'Supply chain resilience after pandemic disruptions',
      'Geopolitical tensions reducing reliance on China',
      'Government incentives for domestic manufacturing',
      'Automation reducing labor cost advantages of offshoring'
    ],
    macroLinkages: [
      'Trade policy and tariffs',
      'Labor market dynamics and wages',
      'Infrastructure investment cycles'
    ],
    primarySectors: ['Industrials', 'Technology', 'Materials'],
    investmentHorizon: 'Medium-term',
    riskLevel: 'Low'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Companies providing security solutions for increasingly digital and cloud-based enterprise and consumer infrastructure',
    keyDrivers: [
      'Rising frequency and sophistication of cyberattacks',
      'Regulatory mandates for data protection',
      'Cloud migration increasing attack surface',
      'AI-powered threats requiring AI-powered defenses'
    ],
    macroLinkages: [
      'Digital transformation spending trends',
      'Geopolitical cyber warfare escalation',
      'Corporate IT budget allocation'
    ],
    primarySectors: ['Technology', 'Software'],
    investmentHorizon: 'Long-term',
    riskLevel: 'Medium'
  }
]

const MOCK_CONSTITUENTS: Record<string, ThemeConstituent[]> = {
  'ai-infrastructure': [
    { ticker: 'NVDA', name: 'NVIDIA Corporation', weight: 18.5, sector: 'Semiconductors', country: 'US', marketCap: 1200000000000 },
    { ticker: 'MSFT', name: 'Microsoft Corporation', weight: 15.2, sector: 'Software', country: 'US', marketCap: 2750000000000 },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', weight: 12.8, sector: 'Technology', country: 'US', marketCap: 1800000000000 },
    { ticker: 'AMD', name: 'Advanced Micro Devices', weight: 10.5, sector: 'Semiconductors', country: 'US', marketCap: 220000000000 },
    { ticker: 'AMZN', name: 'Amazon.com Inc.', weight: 9.8, sector: 'Technology', country: 'US', marketCap: 1500000000000 }
  ],
  'healthcare-innovation': [
    { ticker: 'UNH', name: 'UnitedHealth Group', weight: 14.5, sector: 'Healthcare', country: 'US', marketCap: 520000000000 },
    { ticker: 'JNJ', name: 'Johnson & Johnson', weight: 13.2, sector: 'Healthcare', country: 'US', marketCap: 380000000000 },
    { ticker: 'ABBV', name: 'AbbVie Inc.', weight: 11.8, sector: 'Biotechnology', country: 'US', marketCap: 290000000000 },
    { ticker: 'LLY', name: 'Eli Lilly and Company', weight: 10.9, sector: 'Healthcare', country: 'US', marketCap: 650000000000 },
    { ticker: 'TMO', name: 'Thermo Fisher Scientific', weight: 9.5, sector: 'Healthcare', country: 'US', marketCap: 210000000000 }
  ]
}

const MOCK_ANALYTICS: Record<string, ThemeAnalytics> = {
  'ai-infrastructure': {
    returns: { ytd: 45.3, oneYear: 62.8, threeYear: 28.4, fiveYear: 35.2 },
    risk: { volatility: 32.5, sharpeRatio: 1.85, maxDrawdown: -28.4 },
    concentration: { top5Weight: 66.8, top10Weight: 88.3, effectiveNStocks: 12.4 },
    sectorBreakdown: [
      { sector: 'Semiconductors', weight: 42 },
      { sector: 'Software', weight: 31 },
      { sector: 'Hardware', weight: 18 },
      { sector: 'Cloud Services', weight: 9 }
    ],
    regionBreakdown: [
      { region: 'United States', weight: 72 },
      { region: 'Taiwan', weight: 15 },
      { region: 'Europe', weight: 8 },
      { region: 'Other', weight: 5 }
    ]
  },
  'healthcare-innovation': {
    returns: { ytd: 12.5, oneYear: 18.3, threeYear: 15.2, fiveYear: 14.8 },
    risk: { volatility: 18.2, sharpeRatio: 0.92, maxDrawdown: -15.3 },
    concentration: { top5Weight: 59.9, top10Weight: 82.1, effectiveNStocks: 15.8 },
    sectorBreakdown: [
      { sector: 'Pharmaceuticals', weight: 45 },
      { sector: 'Biotechnology', weight: 28 },
      { sector: 'Medical Devices', weight: 18 },
      { sector: 'Health Tech', weight: 9 }
    ],
    regionBreakdown: [
      { region: 'United States', weight: 68 },
      { region: 'Europe', weight: 22 },
      { region: 'Asia', weight: 7 },
      { region: 'Other', weight: 3 }
    ]
  }
}

export const ThemeResearch: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<string>('ai-infrastructure')

  const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0]
  const constituents = MOCK_CONSTITUENTS[selectedTheme] || []
  const analytics = MOCK_ANALYTICS[selectedTheme] || MOCK_ANALYTICS['ai-infrastructure']

  const performanceData = [
    { period: 'YTD', return: analytics.returns.ytd },
    { period: '1Y', return: analytics.returns.oneYear },
    { period: '3Y Ann.', return: analytics.returns.threeYear },
    { period: '5Y Ann.', return: analytics.returns.fiveYear }
  ]

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Low':
        return '#00ff88'
      case 'Medium':
        return '#ffaa00'
      case 'High':
        return '#ff3366'
      default:
        return '#00d9ff'
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return `$${value.toLocaleString()}`
  }

  return (
    <div className="theme-research">
      <div className="theme-research-header">
        <h2>Thematic Research & Analysis</h2>
        <p className="section-subtitle">Long-term secular trends and investment themes</p>
      </div>

      {/* Theme Selection */}
      <div className="theme-selector-grid">
        {THEMES.map(t => (
          <button
            key={t.id}
            className={`theme-selector-card ${selectedTheme === t.id ? 'active' : ''}`}
            onClick={() => setSelectedTheme(t.id)}
          >
            <div className="theme-card-header">
              <Layers size={20} />
              <span className="theme-name">{t.name}</span>
            </div>
            <p className="theme-brief">{t.description.substring(0, 80)}...</p>
            <div className="theme-meta">
              <span className="theme-horizon">{t.investmentHorizon}</span>
              <span className="theme-risk" style={{ color: getRiskLevelColor(t.riskLevel) }}>
                {t.riskLevel} Risk
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Theme Definition */}
      <div className="theme-definition-section">
        <div className="theme-def-header">
          <div>
            <h3>
              <Layers size={20} />
              {theme.name}
            </h3>
            <p>{theme.description}</p>
          </div>
          <div className="theme-badges">
            <span className="horizon-badge">{theme.investmentHorizon}</span>
            <span className="risk-badge" style={{ background: `${getRiskLevelColor(theme.riskLevel)}22`, color: getRiskLevelColor(theme.riskLevel) }}>
              {theme.riskLevel} Risk
            </span>
          </div>
        </div>

        <div className="theme-details-grid">
          <div className="theme-detail-card">
            <h4>
              <TrendingUp size={16} />
              Key Drivers
            </h4>
            <ul>
              {theme.keyDrivers.map((driver, idx) => (
                <li key={idx}>{driver}</li>
              ))}
            </ul>
          </div>

          <div className="theme-detail-card">
            <h4>
              <Globe size={16} />
              Macro Linkages
            </h4>
            <ul>
              {theme.macroLinkages.map((link, idx) => (
                <li key={idx}>{link}</li>
              ))}
            </ul>
          </div>

          <div className="theme-detail-card">
            <h4>
              <PieChartIcon size={16} />
              Primary Sectors
            </h4>
            <div className="sector-tags">
              {theme.primarySectors.map((sector, idx) => (
                <span key={idx} className="sector-tag">
                  {sector}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance & Risk */}
      <div className="theme-analytics-grid">
        <ChartContainer title="Performance" height={300}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData} margin={chartConfig.margin}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.9} />
                  <stop offset="95%" stopColor={chartColors.success} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={chartColors.grid} 
                opacity={0.5}
                vertical={false}
              />
              <XAxis 
                dataKey="period" 
                stroke={chartColors.border}
                tick={{ fill: chartColors.textTertiary, fontSize: 12 }}
                axisLine={{ stroke: chartColors.border }}
                tickLine={false}
              />
              <YAxis 
                stroke={chartColors.border}
                tick={{ fill: chartColors.textTertiary, fontSize: 12 }}
                tickFormatter={(val) => formatters.percentage(val / 100)}
                axisLine={{ stroke: chartColors.border }}
                tickLine={false}
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip 
                    {...props}
                    formatter={(value) => `${(value as number).toFixed(1)}%`}
                  />
                )}
              />
              <Bar 
                dataKey="return" 
                fill="url(#barGradient)" 
                radius={chartConfig.bar.radius}
                animationDuration={chartConfig.animation.duration}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="theme-analytics-card">
          <h3>Risk Metrics</h3>
          <div className="risk-metrics-list">
            <div className="risk-metric-item">
              <span className="risk-metric-label">Volatility (1Y)</span>
              <span className="risk-metric-value">{analytics.risk.volatility.toFixed(1)}%</span>
            </div>
            <div className="risk-metric-item">
              <span className="risk-metric-label">Sharpe Ratio</span>
              <span className="risk-metric-value" style={{ color: analytics.risk.sharpeRatio >= 1 ? '#00ff88' : '#ffaa00' }}>
                {analytics.risk.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <div className="risk-metric-item">
              <span className="risk-metric-label">Max Drawdown</span>
              <span className="risk-metric-value" style={{ color: '#ff3366' }}>
                {analytics.risk.maxDrawdown.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="theme-analytics-card">
          <h3>Concentration</h3>
          <div className="concentration-metrics">
            <div className="concentration-item">
              <span className="conc-label">Top 5 Weight</span>
              <div className="conc-bar-container">
                <div className="conc-bar" style={{ width: `${analytics.concentration.top5Weight}%`, background: '#00d9ff' }} />
              </div>
              <span className="conc-value">{analytics.concentration.top5Weight.toFixed(1)}%</span>
            </div>
            <div className="concentration-item">
              <span className="conc-label">Top 10 Weight</span>
              <div className="conc-bar-container">
                <div className="conc-bar" style={{ width: `${analytics.concentration.top10Weight}%`, background: '#00ff88' }} />
              </div>
              <span className="conc-value">{analytics.concentration.top10Weight.toFixed(1)}%</span>
            </div>
            <div className="concentration-stat">
              <span className="conc-label">Effective N Stocks</span>
              <span className="conc-value-large">{analytics.concentration.effectiveNStocks.toFixed(1)}</span>
            </div>
          </div>
          <div className="concentration-note">
            <Info size={14} />
            <span>
              {analytics.concentration.top10Weight > 80 ? 'Highly concentrated' : 'Moderately concentrated'} theme with {analytics.concentration.effectiveNStocks < 15 ? 'significant' : 'moderate'} idiosyncratic risk
            </span>
          </div>
        </div>
      </div>

      {/* Sector & Region Breakdown */}
      <div className="breakdown-grid">
        <ChartContainer title="Sector Breakdown" height={280}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <ResponsiveContainer width="40%" height={200}>
              <PieChart>
                <defs>
                  {chartPalette.map((_, idx) => (
                    <filter key={`glow-${idx}`} id={`sector-glow-${idx}`}>
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={analytics.sectorBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="weight"
                  stroke={chartColors.background}
                  strokeWidth={2}
                  animationDuration={chartConfig.animation.duration}
                >
                  {analytics.sectorBreakdown.map((_entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={chartPalette[index % chartPalette.length]}
                      filter={`url(#sector-glow-${index % chartPalette.length})`}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={(props) => (
                    <CustomTooltip 
                      {...props}
                      formatter={(value) => `${value}%`}
                    />
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="breakdown-legend" style={{ flex: 1 }}>
              {analytics.sectorBreakdown.map((item, index) => (
                <ChartLegendItem
                  key={item.sector}
                  color={chartPalette[index % chartPalette.length]}
                  label={item.sector}
                  value={`${item.weight}%`}
                />
              ))}
            </div>
          </div>
        </ChartContainer>

        <ChartContainer title="Regional Exposure" height={280}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <ResponsiveContainer width="40%" height={200}>
              <PieChart>
                <defs>
                  {chartPalette.map((_, idx) => (
                    <filter key={`glow-${idx}`} id={`region-glow-${idx}`}>
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={analytics.regionBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="weight"
                  stroke={chartColors.background}
                  strokeWidth={2}
                  animationDuration={chartConfig.animation.duration}
                >
                  {analytics.regionBreakdown.map((_entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={chartPalette[index % chartPalette.length]}
                      filter={`url(#region-glow-${index % chartPalette.length})`}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={(props) => (
                    <CustomTooltip 
                      {...props}
                      formatter={(value) => `${value}%`}
                    />
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="breakdown-legend" style={{ flex: 1 }}>
              {analytics.regionBreakdown.map((item, index) => (
                <ChartLegendItem
                  key={item.region}
                  color={chartPalette[index % chartPalette.length]}
                  label={item.region}
                  value={`${item.weight}%`}
                />
              ))}
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* Top Constituents */}
      {constituents.length > 0 && (
        <div className="constituents-section">
          <h3>Top Constituents</h3>
          <div className="constituents-table">
            <div className="constituents-header">
              <span>Ticker</span>
              <span>Company</span>
              <span>Sector</span>
              <span>Country</span>
              <span>Market Cap</span>
              <span>Weight</span>
            </div>
            {constituents.map(stock => (
              <div key={stock.ticker} className="constituent-row">
                <span className="constituent-ticker">{stock.ticker}</span>
                <span className="constituent-name">{stock.name}</span>
                <span className="constituent-sector">{stock.sector}</span>
                <span className="constituent-country">{stock.country}</span>
                <span className="constituent-mcap">{formatCurrency(stock.marketCap)}</span>
                <span className="constituent-weight">{stock.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Investment Considerations */}
      <div className="considerations-section">
        <h3>
          <AlertTriangle size={18} />
          Investment Considerations
        </h3>
        <div className="considerations-grid">
          <div className="consideration-card opportunities">
            <h4>Opportunities</h4>
            <ul>
              <li>Long-term secular tailwinds provide sustained growth potential</li>
              <li>Early stage of adoption curve across multiple end markets</li>
              <li>Significant barriers to entry protect leading players</li>
            </ul>
          </div>
          <div className="consideration-card risks">
            <h4>Key Risks</h4>
            <ul>
              <li>High valuation multiples leave limited margin for disappointment</li>
              <li>Concentrated exposure to a narrow set of macro factors</li>
              <li>Technology disruption risk from unexpected innovations</li>
              <li>Regulatory uncertainty in rapidly evolving sectors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
