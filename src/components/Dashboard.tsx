import { PortfolioStats, Investment } from '../types'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, Award, Target, BarChart3 } from 'lucide-react'
import { AsOfTimestamp, Sparkline } from './UIComponents'
import { ChartContainer, ChartLegendItem } from './ChartComponents'
import { CustomTooltip } from './CustomTooltip'
import { chartColors, chartPalette, chartConfig, formatters } from '../config/chartTheme'
import { useState, useEffect } from 'react'

interface DashboardProps {
  stats: PortfolioStats
  investments: Investment[]
}

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
    <div>
      {/* Timestamp Indicator */}
      <div className="flex justify-end mb-md">
        <AsOfTimestamp timestamp={lastUpdate} label="Data as of" />
      </div>

      <div className="grid grid-cols-4 gap-lg">
        <div className="card card-compact">
          <div className="flex items-center gap-md">
            <div className="btn-icon" style={{ background: 'var(--accent-primary)', color: 'white' }}>
              <DollarSign size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="text-sm text-secondary mb-xs">
                Total Value
                <span className="text-tertiary" title="The current market value of all your investments combined" style={{ marginLeft: '4px', cursor: 'help' }}>ⓘ</span>
              </p>
              <p className="text-xl font-bold text-primary">{formatters.currency(stats.totalValue)}</p>
              <Sparkline data={generateSparklineData(stats.totalValue)} width={100} height={30} />
            </div>
          </div>
        </div>

        <div className="card card-compact">
          <div className="flex items-center gap-md">
            <div className="btn-icon" style={{ background: 'var(--accent-secondary)', color: 'white' }}>
              <DollarSign size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="text-sm text-secondary mb-xs">
                Total Invested
                <span className="text-tertiary" title="The total amount of money you've put into your investments" style={{ marginLeft: '4px', cursor: 'help' }}>ⓘ</span>
              </p>
              <p className="text-xl font-bold text-primary">{formatters.currency(stats.totalInvested)}</p>
            </div>
          </div>
        </div>

        <div className="card card-compact">
          <div className="flex items-center gap-md">
            <div className="btn-icon" style={{ background: stats.totalGainLoss >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', color: 'white' }}>
              {stats.totalGainLoss >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <p className="text-sm text-secondary mb-xs">
                Total Gain/Loss
                <span className="text-tertiary" title="How much money you've made or lost compared to your initial investment" style={{ marginLeft: '4px', cursor: 'help' }}>ⓘ</span>
              </p>
              <p className={`text-xl font-bold ${stats.totalGainLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatters.currency(stats.totalGainLoss)}
              </p>
              <p className={`text-sm font-medium ${stats.gainLossPercentage >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatters.percentage(stats.gainLossPercentage)}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-compact">
          <div className="flex items-center gap-md">
            <div className="btn-icon" style={{ background: 'var(--accent-secondary)', color: 'white' }}>
              <PieChartIcon size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p className="text-sm text-secondary mb-xs">
                Total Holdings
                <span className="text-tertiary" title="The number of different investments in your portfolio" style={{ marginLeft: '4px', cursor: 'help' }}>ⓘ</span>
              </p>
              <p className="text-xl font-bold text-primary">{investments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      {investments.length > 0 && (
        <div className="card mt-xl">
          <h3 className="card-title">Advanced Metrics</h3>
          <div className="grid grid-cols-3 gap-lg mt-lg">
            <div className="flex items-center gap-md">
              <div className="btn-icon" style={{ background: 'var(--accent-warning)', color: 'white' }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary mb-xs">
                  Average Return
                  <span className="text-tertiary" title="The average performance across all your investments" style={{ marginLeft: '4px', cursor: 'help' }}>ⓘ</span>
                </p>
                <p className={`text-xl font-bold ${stats.averageReturn >= 0 ? 'text-success' : 'text-danger'}`}>
                  {stats.averageReturn >= 0 ? '+' : ''}{stats.averageReturn.toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-md">
              <div className="btn-icon" style={{ background: 'var(--accent-success)', color: 'white' }}>
                <Award size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary mb-xs">
                  Best Performer
                  <span className="text-tertiary" title="Your top-performing investment by percentage gain" style={{ marginLeft: '4px', cursor: 'help' }}>ⓘ</span>
                </p>
                {stats.bestPerformer && (
                  <>
                    <p className="text-sm font-medium text-primary">{stats.bestPerformer.name}</p>
                    <p className="text-lg font-bold text-success">
                      +{stats.bestPerformer.percentage.toFixed(2)}%
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-md">
              <div className="btn-icon" style={{ background: 'var(--accent-danger)', color: 'white' }}>
                <TrendingDown size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary mb-xs">
                  Worst Performer
                  <span className="text-tertiary" title="Your lowest-performing investment by percentage" style={{ marginLeft: '4px', cursor: 'help' }}>ⓘ</span>
                </p>
                {stats.worstPerformer && (
                  <>
                    <p className="text-sm font-medium text-primary">{stats.worstPerformer.name}</p>
                    <p className={`text-lg font-bold ${stats.worstPerformer.percentage >= 0 ? 'text-success' : 'text-danger'}`}>
                      {stats.worstPerformer.percentage >= 0 ? '+' : ''}{stats.worstPerformer.percentage.toFixed(2)}%
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-md">
              <div className="btn-icon" style={{ background: '#06b6d4', color: 'white' }}>
                <Target size={20} />
              </div>
              <div>
                <p className="text-sm text-secondary mb-xs">
                  Diversification Score
                  <span className="text-tertiary" title="How well-spread your investments are across different types (0-100)" style={{ marginLeft: '4px', cursor: 'help' }}>ⓘ</span>
                </p>
                <p className="text-xl font-bold text-primary">{stats.diversificationScore.toFixed(0)}/100</p>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '8px' }}>
                  <div 
                    style={{ 
                      width: `${stats.diversificationScore}%`,
                      height: '100%',
                      background: stats.diversificationScore >= 70 ? 'var(--accent-success)' : stats.diversificationScore >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                      transition: 'width var(--transition-base)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {allocationData.length > 0 && (
        <ChartContainer 
          title="Asset Allocation"
          subtitle="How your money is distributed across different investment types. Diversification helps reduce risk."
          height={350}
        >
          <div className="flex gap-xl">
            <div style={{ flex: '0 0 350px' }}>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <defs>
                    {allocationData.map((_, index) => (
                      <filter key={`glow-${index}`} id={`glow-${index}`}>
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    ))}
                  </defs>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                    strokeWidth={2}
                    stroke={chartColors.background}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {allocationData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={chartPalette[index % chartPalette.length]}
                        style={{ filter: `url(#glow-${index})` }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatter={formatters.currency} />} />
                  <Legend 
                    iconType={chartConfig.legend.iconType}
                    wrapperStyle={chartConfig.legend.wrapperStyle}
                    iconSize={chartConfig.legend.iconSize}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {allocationData.map((item, index) => (
                <ChartLegendItem
                  key={item.name}
                  color={chartPalette[index % chartPalette.length]}
                  label={item.name}
                  value={formatters.currency(item.value)}
                  percentage={`${item.percentage}%`}
                />
              ))}
            </div>
          </div>
        </ChartContainer>
      )}
    </div>
  )
}
