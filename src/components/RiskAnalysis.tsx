import { RiskMetrics } from '../types'
import { Shield, AlertTriangle, TrendingUp, Activity } from 'lucide-react'

interface RiskAnalysisProps {
  metrics: RiskMetrics
}

export default function RiskAnalysis({ metrics }: RiskAnalysisProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'conservative': return '#10b981'
      case 'moderate': return '#f59e0b'
      case 'aggressive': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'conservative': return 'Conservative - Lower risk, steady returns'
      case 'moderate': return 'Moderate - Balanced risk and growth'
      case 'aggressive': return 'Aggressive - Higher risk, higher potential'
      default: return 'Unknown'
    }
  }

  return (
    <div className="risk-analysis">
      <div className="section-header-inline">
        <h3>
          <Shield size={24} />
          Risk Analysis
        </h3>
        <div className="risk-level-badge" style={{ background: getRiskColor(metrics.riskLevel) }}>
          {metrics.riskLevel.toUpperCase()}
        </div>
      </div>
      <p className="risk-description">{getRiskLabel(metrics.riskLevel)}</p>

      <div className="risk-metrics-grid">
        <div className="risk-metric-card">
          <div className="risk-metric-icon" style={{ background: '#3b82f6' }}>
            <Activity size={20} />
          </div>
          <div className="risk-metric-content">
            <p className="risk-metric-label">
              Portfolio Volatility
              <span className="tooltip-trigger" title="How much your portfolio value fluctuates. Lower is more stable.">ⓘ</span>
            </p>
            <p className="risk-metric-value">{metrics.portfolioVolatility.toFixed(2)}%</p>
            <p className="risk-metric-hint">
              {metrics.portfolioVolatility < 10 ? 'Low volatility' : 
               metrics.portfolioVolatility < 20 ? 'Moderate volatility' : 'High volatility'}
            </p>
          </div>
        </div>

        <div className="risk-metric-card">
          <div className="risk-metric-icon" style={{ background: '#10b981' }}>
            <TrendingUp size={20} />
          </div>
          <div className="risk-metric-content">
            <p className="risk-metric-label">
              Sharpe Ratio
              <span className="tooltip-trigger" title="Risk-adjusted return. Higher means better return per unit of risk.">ⓘ</span>
            </p>
            <p className="risk-metric-value">{metrics.sharpeRatio.toFixed(2)}</p>
            <p className="risk-metric-hint">
              {metrics.sharpeRatio > 1 ? 'Excellent' : 
               metrics.sharpeRatio > 0.5 ? 'Good' : 'Needs improvement'}
            </p>
          </div>
        </div>

        <div className="risk-metric-card">
          <div className="risk-metric-icon" style={{ background: '#8b5cf6' }}>
            <Activity size={20} />
          </div>
          <div className="risk-metric-content">
            <p className="risk-metric-label">
              Beta
              <span className="tooltip-trigger" title="Correlation with market. 1.0 means moves with market, >1.0 more volatile.">ⓘ</span>
            </p>
            <p className="risk-metric-value">{metrics.beta.toFixed(2)}</p>
            <p className="risk-metric-hint">
              {metrics.beta < 0.8 ? 'Less volatile than market' : 
               metrics.beta < 1.2 ? 'Tracks market' : 'More volatile than market'}
            </p>
          </div>
        </div>

        <div className="risk-metric-card">
          <div className="risk-metric-icon" style={{ background: '#ef4444' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="risk-metric-content">
            <p className="risk-metric-label">
              Max Drawdown
              <span className="tooltip-trigger" title="Largest peak-to-trough decline. Shows worst-case loss scenario.">ⓘ</span>
            </p>
            <p className="risk-metric-value negative">-{metrics.maxDrawdown.toFixed(2)}%</p>
            <p className="risk-metric-hint">Largest historical decline</p>
          </div>
        </div>

        <div className="risk-metric-card">
          <div className="risk-metric-icon" style={{ background: '#f59e0b' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="risk-metric-content">
            <p className="risk-metric-label">
              Value at Risk (95%)
              <span className="tooltip-trigger" title="Maximum expected loss on 95% of days. Only 5% of days will be worse.">ⓘ</span>
            </p>
            <p className="risk-metric-value negative">-{metrics.valueAtRisk.toFixed(2)}%</p>
            <p className="risk-metric-hint">95% confidence, 1-day</p>
          </div>
        </div>
      </div>

      <div className="risk-tips">
        <h4>Risk Management Tips</h4>
        <ul>
          {metrics.riskLevel === 'aggressive' && (
            <li>⚠️ Consider adding more bonds or stable assets to reduce volatility</li>
          )}
          {metrics.sharpeRatio < 0.5 && (
            <li>📊 Your risk-adjusted returns could be improved through better diversification</li>
          )}
          {metrics.maxDrawdown > 25 && (
            <li>🛡️ High drawdown risk - consider stop-loss strategies or hedging</li>
          )}
          <li>💡 Regularly rebalance to maintain your target risk level</li>
          <li>📚 Review your risk tolerance annually or after major life changes</li>
        </ul>
      </div>
    </div>
  )
}
