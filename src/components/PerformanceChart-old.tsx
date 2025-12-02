import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PerformanceData } from '../types'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import { AsOfTimestamp } from './UIComponents'

interface PerformanceChartProps {
  data: PerformanceData[]
  title?: string
  showComparison?: boolean
  benchmarkData?: PerformanceData[]
}

export default function PerformanceChart({ data, title = 'Portfolio Performance', showComparison, benchmarkData }: PerformanceChartProps) {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getFilteredData = () => {
    const now = new Date()
    const daysBack = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      'ALL': Infinity,
    }[timeRange]

    const cutoffDate = new Date(now)
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)

    return data.filter(d => new Date(d.date) >= cutoffDate)
  }

  const filteredData = getFilteredData()
  const latestValue = filteredData[filteredData.length - 1]?.value || 0
  const firstValue = filteredData[0]?.value || 0
  const totalChange = latestValue - firstValue
  const totalChangePercent = firstValue > 0 ? (totalChange / firstValue) * 100 : 0

  return (
    <div className="performance-chart">
      <div className="chart-header">
        <div className="chart-title-section">
          <h3>{title}</h3>
          <div className="chart-stats">
            <span className="chart-value">{formatCurrency(latestValue)}</span>
            <span className={`chart-change ${totalChange >= 0 ? 'positive' : 'negative'}`}>
              {totalChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)} ({totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%)
            </span>
          </div>
          <AsOfTimestamp timestamp={filteredData[filteredData.length - 1]?.date || new Date()} />
        </div>
        <div className="time-range-selector">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map(range => (
            <button
              key={range}
              className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container-large">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              {showComparison && (
                <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#6b7280"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              stroke="#6b7280"
              style={{ fontSize: '0.875rem' }}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label: string) => new Date(label).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              name="Portfolio Value"
            />
            {showComparison && benchmarkData && (
              <Area
                type="monotone"
                dataKey="benchmarkValue"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBenchmark)"
                name="S&P 500"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
