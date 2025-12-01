import React, { useState } from 'react'
import { Investment } from '../types'
import { TrendingDown, AlertTriangle, DollarSign, Activity } from 'lucide-react'

interface ScenarioAnalysisProps {
  investments: Investment[]
}

interface Scenario {
  id: string
  name: string
  description: string
  impacts: {
    stock: number
    bond: number
    crypto: number
    'real-estate': number
    commodities: number
    'mutual-fund': number
    etf: number
    other: number
  }
  icon: React.ReactNode
  color: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'market-crash',
    name: 'Market Crash (-30%)',
    description: 'Severe market downturn similar to 2008 or 2020',
    impacts: {
      stock: -0.30,
      bond: -0.05,
      crypto: -0.50,
      'real-estate': -0.20,
      commodities: -0.15,
      'mutual-fund': -0.25,
      etf: -0.28,
      other: -0.10
    },
    icon: <TrendingDown size={20} />,
    color: '#ff3366'
  },
  {
    id: 'recession',
    name: 'Recession',
    description: 'Economic slowdown with rising unemployment',
    impacts: {
      stock: -0.20,
      bond: 0.05,
      crypto: -0.35,
      'real-estate': -0.15,
      commodities: -0.10,
      'mutual-fund': -0.18,
      etf: -0.18,
      other: -0.08
    },
    icon: <Activity size={20} />,
    color: '#ffaa00'
  },
  {
    id: 'inflation-spike',
    name: 'Inflation Spike (+5%)',
    description: 'Rapid inflation forcing Fed rate hikes',
    impacts: {
      stock: -0.15,
      bond: -0.20,
      crypto: -0.10,
      'real-estate': 0.10,
      commodities: 0.25,
      'mutual-fund': -0.12,
      etf: -0.10,
      other: 0.05
    },
    icon: <DollarSign size={20} />,
    color: '#ffaa00'
  },
  {
    id: 'rate-hikes',
    name: 'Aggressive Rate Hikes',
    description: 'Fed raises rates by 200+ bps quickly',
    impacts: {
      stock: -0.18,
      bond: -0.15,
      crypto: -0.25,
      'real-estate': -0.12,
      commodities: 0.05,
      'mutual-fund': -0.16,
      etf: -0.16,
      other: -0.05
    },
    icon: <AlertTriangle size={20} />,
    color: '#ff3366'
  },
  {
    id: 'tech-bubble',
    name: 'Tech Sector Crash',
    description: 'Technology stocks correct 40%+',
    impacts: {
      stock: -0.25,
      bond: 0.02,
      crypto: -0.30,
      'real-estate': -0.05,
      commodities: 0.00,
      'mutual-fund': -0.20,
      etf: -0.22,
      other: -0.05
    },
    icon: <TrendingDown size={20} />,
    color: '#ff3366'
  },
  {
    id: 'currency-crisis',
    name: 'Dollar Crisis',
    description: 'US dollar weakens significantly',
    impacts: {
      stock: -0.10,
      bond: -0.08,
      crypto: 0.20,
      'real-estate': -0.05,
      commodities: 0.30,
      'mutual-fund': -0.08,
      etf: -0.05,
      other: 0.10
    },
    icon: <DollarSign size={20} />,
    color: '#ffaa00'
  }
]

export const ScenarioAnalysis: React.FC<ScenarioAnalysisProps> = ({ investments }) => {
  const [selectedScenario, setSelectedScenario] = useState<string>(SCENARIOS[0].id)

  const calculateScenarioImpact = (scenario: Scenario) => {
    if (investments.length === 0) {
      return {
        currentValue: 0,
        projectedValue: 0,
        loss: 0,
        lossPercent: 0,
        byAssetType: {}
      }
    }

    let currentValue = 0
    let projectedValue = 0
    const byAssetType: Record<string, { current: number, projected: number, impact: number }> = {}

    investments.forEach(inv => {
      const value = inv.quantity * inv.currentPrice
      const impact = scenario.impacts[inv.type] || 0
      const newValue = value * (1 + impact)

      currentValue += value
      projectedValue += newValue

      if (!byAssetType[inv.type]) {
        byAssetType[inv.type] = { current: 0, projected: 0, impact: 0 }
      }
      byAssetType[inv.type].current += value
      byAssetType[inv.type].projected += newValue
      byAssetType[inv.type].impact = impact
    })

    return {
      currentValue,
      projectedValue,
      loss: projectedValue - currentValue,
      lossPercent: ((projectedValue - currentValue) / currentValue) * 100,
      byAssetType
    }
  }

  const selectedScenarioObj = SCENARIOS.find(s => s.id === selectedScenario) || SCENARIOS[0]
  const impact = calculateScenarioImpact(selectedScenarioObj)

  return (
    <div className="scenario-analysis">
      <div className="scenario-header">
        <div>
          <h2>Scenario Analysis & Stress Testing</h2>
          <p className="section-subtitle">Test portfolio resilience under adverse market conditions</p>
        </div>
      </div>

      <div className="scenario-grid">
        {/* Scenario selection cards */}
        <div className="scenario-cards">
          {SCENARIOS.map(scenario => (
            <button
              key={scenario.id}
              className={`scenario-card ${selectedScenario === scenario.id ? 'active' : ''}`}
              onClick={() => setSelectedScenario(scenario.id)}
              style={{ borderColor: selectedScenario === scenario.id ? scenario.color : 'var(--border-light)' }}
            >
              <div className="scenario-card-icon" style={{ color: scenario.color }}>
                {scenario.icon}
              </div>
              <div className="scenario-card-content">
                <h4>{scenario.name}</h4>
                <p>{scenario.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Impact summary */}
        <div className="scenario-results">
          <div className="results-header">
            <h3>Impact Analysis: {selectedScenarioObj.name}</h3>
            <p>{selectedScenarioObj.description}</p>
          </div>

          {investments.length === 0 ? (
            <div className="empty-state-small">
              <p>Add investments to see scenario analysis</p>
            </div>
          ) : (
            <>
              <div className="impact-summary">
                <div className="impact-metric">
                  <span className="metric-label">Current Portfolio Value</span>
                  <span className="metric-value">${impact.currentValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="impact-arrow">→</div>
                <div className="impact-metric">
                  <span className="metric-label">Projected Value</span>
                  <span className="metric-value" style={{ color: impact.loss >= 0 ? '#00ff88' : '#ff3366' }}>
                    ${impact.projectedValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="impact-change">
                <div className="impact-change-box" style={{ 
                  background: impact.loss >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 51, 102, 0.1)',
                  borderColor: impact.loss >= 0 ? '#00ff88' : '#ff3366'
                }}>
                  <div className="impact-change-amount" style={{ color: impact.loss >= 0 ? '#00ff88' : '#ff3366' }}>
                    {impact.loss >= 0 ? '+' : ''}${impact.loss.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="impact-change-percent" style={{ color: impact.loss >= 0 ? '#00ff88' : '#ff3366' }}>
                    {impact.lossPercent >= 0 ? '+' : ''}{impact.lossPercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* By asset type breakdown */}
              <div className="asset-impacts">
                <h4>Impact by Asset Type</h4>
                <div className="asset-impacts-list">
                  {Object.entries(impact.byAssetType)
                    .sort((a, b) => b[1].current - a[1].current)
                    .map(([type, data]) => {
                      const impactPercent = data.impact * 100
                      const lossAmount = data.projected - data.current
                      
                      return (
                        <div key={type} className="asset-impact-row">
                          <div className="asset-impact-type">
                            <span className="asset-type-name">
                              {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </span>
                            <span className="asset-type-value">
                              ${data.current.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className="asset-impact-change">
                            <div 
                              className="impact-bar" 
                              style={{
                                width: `${Math.abs(impactPercent)}%`,
                                background: impactPercent >= 0 ? '#00ff88' : '#ff3366',
                                marginLeft: impactPercent < 0 ? 'auto' : '0'
                              }}
                            />
                            <span style={{ color: impactPercent >= 0 ? '#00ff88' : '#ff3366' }}>
                              {impactPercent >= 0 ? '+' : ''}{impactPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="asset-impact-amount" style={{ color: lossAmount >= 0 ? '#00ff88' : '#ff3366' }}>
                            {lossAmount >= 0 ? '+' : ''}${lossAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Risk assessment */}
              <div className="risk-assessment">
                <h4>Risk Assessment</h4>
                <div className="risk-insights">
                  {impact.lossPercent < -25 && (
                    <div className="risk-insight severe">
                      <AlertTriangle size={16} />
                      <span><strong>Severe exposure:</strong> Portfolio could lose over 25% in this scenario. Consider increasing defensive positions.</span>
                    </div>
                  )}
                  {impact.lossPercent >= -25 && impact.lossPercent < -15 && (
                    <div className="risk-insight moderate">
                      <AlertTriangle size={16} />
                      <span><strong>High risk:</strong> Potential 15-25% drawdown. Ensure you can handle this volatility.</span>
                    </div>
                  )}
                  {impact.lossPercent >= -15 && impact.lossPercent < 0 && (
                    <div className="risk-insight low">
                      <Activity size={16} />
                      <span><strong>Moderate risk:</strong> Well-positioned to weather this scenario with limited downside.</span>
                    </div>
                  )}
                  {impact.lossPercent >= 0 && (
                    <div className="risk-insight positive">
                      <Activity size={16} />
                      <span><strong>Positive exposure:</strong> Portfolio positioned to benefit from this scenario.</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
