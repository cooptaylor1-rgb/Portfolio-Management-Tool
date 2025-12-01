import { MacroIndicator, YieldCurvePoint } from '../types'
import { TrendingUp, TrendingDown, DollarSign, Activity, Globe, AlertCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useState, useEffect } from 'react'

export default function MacroIndicators() {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([])
  const [yieldCurve, setYieldCurve] = useState<YieldCurvePoint[]>([])

  useEffect(() => {
    // Mock macro indicators - in production, fetch from Fed, Bloomberg, or FactSet APIs
    const mockIndicators: MacroIndicator[] = [
      {
        id: 'fed-funds',
        name: 'Fed Funds Rate',
        value: '5.50%',
        change: 0.25,
        changePercent: 4.76,
        unit: '%',
        lastUpdate: new Date().toISOString(),
        trend: 'neutral',
        significance: 'neutral'
      },
      {
        id: 'inflation-cpi',
        name: 'CPI (YoY)',
        value: '3.2%',
        change: -0.3,
        changePercent: -8.57,
        unit: '%',
        lastUpdate: new Date().toISOString(),
        trend: 'down',
        significance: 'bullish'
      },
      {
        id: 'unemployment',
        name: 'Unemployment Rate',
        value: '3.8%',
        change: 0.1,
        changePercent: 2.70,
        unit: '%',
        lastUpdate: new Date().toISOString(),
        trend: 'up',
        significance: 'bearish'
      },
      {
        id: 'gdp-growth',
        name: 'GDP Growth (QoQ)',
        value: '2.4%',
        change: -0.6,
        changePercent: -20.00,
        unit: '%',
        lastUpdate: new Date().toISOString(),
        trend: 'down',
        significance: 'bearish'
      },
      {
        id: 'vix',
        name: 'VIX (Volatility Index)',
        value: 15.3,
        change: -1.2,
        changePercent: -7.27,
        unit: '',
        lastUpdate: new Date().toISOString(),
        trend: 'down',
        significance: 'bullish'
      },
      {
        id: 'dxy',
        name: 'Dollar Index (DXY)',
        value: 103.5,
        change: 0.4,
        changePercent: 0.39,
        unit: '',
        lastUpdate: new Date().toISOString(),
        trend: 'up',
        significance: 'bearish'
      },
      {
        id: 'oil',
        name: 'Crude Oil (WTI)',
        value: 78.50,
        change: -1.20,
        changePercent: -1.51,
        unit: '/bbl',
        lastUpdate: new Date().toISOString(),
        trend: 'down',
        significance: 'bullish'
      },
      {
        id: 'gold',
        name: 'Gold',
        value: 1950,
        change: 12,
        changePercent: 0.62,
        unit: '/oz',
        lastUpdate: new Date().toISOString(),
        trend: 'up',
        significance: 'bullish'
      }
    ]

    // Mock yield curve data
    const mockYieldCurve: YieldCurvePoint[] = [
      { maturity: '1M', yield: 5.50 },
      { maturity: '3M', yield: 5.48 },
      { maturity: '6M', yield: 5.42 },
      { maturity: '1Y', yield: 5.25 },
      { maturity: '2Y', yield: 4.95 },
      { maturity: '5Y', yield: 4.65 },
      { maturity: '10Y', yield: 4.55 },
      { maturity: '20Y', yield: 4.75 },
      { maturity: '30Y', yield: 4.70 }
    ]

    setIndicators(mockIndicators)
    setYieldCurve(mockYieldCurve)
  }, [])

  const getIndicatorIcon = (id: string) => {
    if (id.includes('rate') || id.includes('inflation')) return DollarSign
    if (id.includes('vix') || id.includes('volatility')) return Activity
    if (id.includes('dxy') || id.includes('dollar')) return Globe
    return AlertCircle
  }

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case 'bullish': return '#00ff88'
      case 'bearish': return '#ff3366'
      default: return 'var(--text-secondary)'
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={16} />
    if (trend === 'down') return <TrendingDown size={16} />
    return null
  }

  const isYieldCurveInverted = yieldCurve.length >= 2 && 
    yieldCurve[0]?.yield > yieldCurve[yieldCurve.length - 1]?.yield

  return (
    <div className="macro-indicators-panel">
      <div className="section-header">
        <div>
          <h2>Macro & Market Indicators</h2>
          <p className="section-description">Key economic indicators and market conditions</p>
        </div>
      </div>

      {/* Economic Indicators Grid */}
      <div className="macro-grid">
        {indicators.map(indicator => {
          const Icon = getIndicatorIcon(indicator.id)
          return (
            <div key={indicator.id} className="macro-card">
              <div className="macro-card-header">
                <div className="macro-icon">
                  <Icon size={18} />
                </div>
                <span className="macro-label">{indicator.name}</span>
              </div>
              <div className="macro-value">
                {typeof indicator.value === 'number' ? indicator.value.toFixed(2) : indicator.value}
                <span className="macro-unit">{indicator.unit}</span>
              </div>
              <div className="macro-change">
                <span className={indicator.trend === 'up' ? 'positive' : indicator.trend === 'down' ? 'negative' : ''}>
                  {getTrendIcon(indicator.trend)}
                  {indicator.change >= 0 ? '+' : ''}{indicator.change.toFixed(2)} ({indicator.changePercent >= 0 ? '+' : ''}{indicator.changePercent.toFixed(2)}%)
                </span>
                <span 
                  className="macro-significance" 
                  style={{ color: getSignificanceColor(indicator.significance) }}
                >
                  {indicator.significance}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Yield Curve */}
      <div className="yield-curve-section">
        <div className="section-header-inline">
          <h3>US Treasury Yield Curve</h3>
          {isYieldCurveInverted && (
            <div className="alert-badge" style={{ background: '#ff3366' }}>
              ⚠️ INVERTED
            </div>
          )}
        </div>
        <p className="section-description">
          {isYieldCurveInverted 
            ? 'Yield curve inversion detected - historically precedes recession'
            : 'Normal yield curve - longer maturities yielding more than shorter'
          }
        </p>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yieldCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="maturity" 
                stroke="var(--text-secondary)"
                style={{ fontSize: '0.875rem' }}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                style={{ fontSize: '0.875rem' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Yield']}
                contentStyle={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="yield"
                stroke={isYieldCurveInverted ? '#ff3366' : '#00d9ff'}
                strokeWidth={3}
                dot={{ fill: isYieldCurveInverted ? '#ff3366' : '#00d9ff', r: 5 }}
                name="Treasury Yield"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Insights */}
      <div className="macro-insights">
        <h4>🎯 Market Intelligence</h4>
        <ul>
          {indicators.find(i => i.id === 'vix')?.value as number < 20 && (
            <li>✅ Low volatility environment - favorable for risk-on strategies</li>
          )}
          {indicators.find(i => i.id === 'fed-funds')?.trend === 'up' && (
            <li>📈 Rising rates environment - consider defensive positioning and quality stocks</li>
          )}
          {isYieldCurveInverted && (
            <li>⚠️ Inverted yield curve - historically signals recession within 12-18 months</li>
          )}
          {(indicators.find(i => i.id === 'dxy')?.value as number) > 105 && (
            <li>💵 Strong dollar - headwind for US multinationals, opportunity in domestic plays</li>
          )}
          {(indicators.find(i => i.id === 'inflation-cpi')?.trend) === 'down' && (
            <li>📉 Disinflation trend - supportive for growth stocks and longer duration bonds</li>
          )}
        </ul>
      </div>
    </div>
  )
}
