import { PortfolioStats, Investment } from '../types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, Legend } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, Award, Target, BarChart3 } from 'lucide-react'
import { AsOfTimestamp, Sparkline } from './UIComponents'
import { useState, useEffect } from 'react'

interface DashboardProps {
  stats: PortfolioStats
  investments: Investment[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function Dashboard({ stats, investments }: DashboardProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Update timestamp every minute
    return () => clearInterval(interval);
  }, []);

  // Generate mock historical data for sparklines
  const generateSparklineData = (currentValue: number, days: number = 7) => {
    const data: number[] = [];
    for (let i = 0; i < days; i++) {
      const variance = (Math.random() - 0.5) * 0.1;
      data.push(currentValue * (1 + variance));
    }
    return data;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getAssetAllocation = () => {
    const allocation: Record<string, number> = {}
    investments.forEach(inv => {
      const value = inv.quantity * inv.currentPrice
      allocation[inv.type] = (allocation[inv.type] || 0) + value
    })

    return Object.entries(allocation).map(([type, value]) => ({
      name: type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value: value,
      percentage: ((value / stats.totalValue) * 100).toFixed(1)
    }))
  }

  const allocationData = getAssetAllocation()

  return (
    <div className="dashboard">
      {/* Timestamp Indicator */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <AsOfTimestamp timestamp={lastUpdate} label="Data as of" />
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f6' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">
              Total Value
              <span className="tooltip-trigger" title="The current market value of all your investments combined">ⓘ</span>
            </p>
            <p className="stat-value">{formatCurrency(stats.totalValue)}</p>
            <Sparkline data={generateSparklineData(stats.totalValue)} width={100} height={30} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#6366f1' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">
              Total Invested
              <span className="tooltip-trigger" title="The total amount of money you've put into your investments">ⓘ</span>
            </p>
            <p className="stat-value">{formatCurrency(stats.totalInvested)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon ${stats.totalGainLoss >= 0 ? 'gain' : 'loss'}`}>
            {stats.totalGainLoss >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div className="stat-content">
            <p className="stat-label">
              Total Gain/Loss
              <span className="tooltip-trigger" title="How much money you've made or lost compared to your initial investment">ⓘ</span>
            </p>
            <p className={`stat-value ${stats.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(stats.totalGainLoss)}
            </p>
            <p className={`stat-change ${stats.gainLossPercentage >= 0 ? 'positive' : 'negative'}`}>
              {formatPercentage(stats.gainLossPercentage)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf6' }}>
            <PieChartIcon size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">
              Total Holdings
              <span className="tooltip-trigger" title="The number of different investments in your portfolio">ⓘ</span>
            </p>
            <p className="stat-value">{investments.length}</p>
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      {investments.length > 0 && (
        <div className="advanced-metrics">
          <h3>Advanced Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon" style={{ background: '#f59e0b' }}>
                <BarChart3 size={20} />
              </div>
              <div className="metric-content">
                <p className="metric-label">
                  Average Return
                  <span className="tooltip-trigger" title="The average performance across all your investments">ⓘ</span>
                </p>
                <p className={`metric-value ${stats.averageReturn >= 0 ? 'positive' : 'negative'}`}>
                  {stats.averageReturn >= 0 ? '+' : ''}{stats.averageReturn.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ background: '#10b981' }}>
                <Award size={20} />
              </div>
              <div className="metric-content">
                <p className="metric-label">
                  Best Performer
                  <span className="tooltip-trigger" title="Your top-performing investment by percentage gain">ⓘ</span>
                </p>
                {stats.bestPerformer && (
                  <>
                    <p className="metric-name">{stats.bestPerformer.name}</p>
                    <p className="metric-value positive">
                      +{stats.bestPerformer.percentage.toFixed(2)}%
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ background: '#ef4444' }}>
                <TrendingDown size={20} />
              </div>
              <div className="metric-content">
                <p className="metric-label">
                  Worst Performer
                  <span className="tooltip-trigger" title="Your lowest-performing investment by percentage">ⓘ</span>
                </p>
                {stats.worstPerformer && (
                  <>
                    <p className="metric-name">{stats.worstPerformer.name}</p>
                    <p className={`metric-value ${stats.worstPerformer.percentage >= 0 ? 'positive' : 'negative'}`}>
                      {stats.worstPerformer.percentage >= 0 ? '+' : ''}{stats.worstPerformer.percentage.toFixed(2)}%
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon" style={{ background: '#06b6d4' }}>
                <Target size={20} />
              </div>
              <div className="metric-content">
                <p className="metric-label">
                  Diversification Score
                  <span className="tooltip-trigger" title="How well-spread your investments are across different types (0-100)">ⓘ</span>
                </p>
                <p className="metric-value">{stats.diversificationScore.toFixed(0)}/100</p>
                <div className="diversification-bar">
                  <div 
                    className="diversification-fill"
                    style={{ 
                      width: `${stats.diversificationScore}%`,
                      background: stats.diversificationScore >= 70 ? '#10b981' : stats.diversificationScore >= 40 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {allocationData.length > 0 && (
        <div className="allocation-section">
          <h3>Asset Allocation</h3>
          <p className="section-description">
            This shows how your money is distributed across different types of investments. 
            Diversification (spreading investments across different types) can help reduce risk.
          </p>
          <div className="allocation-content">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {allocationData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="allocation-list">
              {allocationData.map((item, index) => (
                <div key={item.name} className="allocation-item">
                  <div 
                    className="allocation-color"
                    style={{ background: COLORS[index % COLORS.length] }}
                  />
                  <div className="allocation-info">
                    <span className="allocation-name">{item.name}</span>
                    <span className="allocation-value">{formatCurrency(item.value)}</span>
                    <span className="allocation-percentage">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
