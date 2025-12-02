import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { PerformanceData } from '../types'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import { ChartContainer, TimeRangeSelector, ChartStatCard } from './ChartComponents'
import { CustomTooltip } from './CustomTooltip'
import { chartColors, chartConfig, formatters } from '../config/chartTheme'

interface PerformanceChartProps {
  data: PerformanceData[]
  title?: string
  showComparison?: boolean
  benchmarkData?: PerformanceData[]
  loading?: boolean
}

export default function PerformanceChart({ 
  data, 
  title = 'Portfolio Performance', 
  showComparison, 
  benchmarkData,
  loading = false 
}: PerformanceChartProps) {
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M')

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
    <ChartContainer
      title={title}
      subtitle={`${formatters.date(filteredData[0]?.date || new Date())} - ${formatters.date(filteredData[filteredData.length - 1]?.date || new Date())}`}
      height={450}
      loading={loading}
      actions={
        <TimeRangeSelector 
          value={timeRange} 
          onChange={(value) => setTimeRange(value as typeof timeRange)} 
        />
      }
    >
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-md mb-lg">
        <ChartStatCard
          label="Current Value"
          value={formatters.currency(latestValue)}
          icon={<TrendingUp size={20} />}
        />
        <ChartStatCard
          label="Total Change"
          value={formatters.currency(totalChange)}
          change={formatters.percentage(totalChangePercent)}
          changeType={totalChange >= 0 ? 'positive' : 'negative'}
          icon={totalChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        />
        <ChartStatCard
          label="Period Return"
          value={formatters.percentage(totalChangePercent)}
          changeType={totalChangePercent >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart 
          data={filteredData}
          margin={chartConfig.margin}
        >
          <defs>
            <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
            </linearGradient>
            {showComparison && (
              <linearGradient id="gradientSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={chartColors.success} stopOpacity={0}/>
              </linearGradient>
            )}
          </defs>
          <CartesianGrid 
            {...chartConfig.grid}
          />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatters.date}
            {...chartConfig.axis}
            tick={{ fill: chartColors.text }}
          />
          <YAxis 
            tickFormatter={formatters.currency}
            {...chartConfig.axis}
            tick={{ fill: chartColors.text }}
          />
          <CustomTooltip formatter={formatters.currencyPrecise} />
          <Legend 
            {...chartConfig.legend}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColors.primary}
            strokeWidth={chartConfig.line.strokeWidth}
            fillOpacity={1}
            fill="url(#gradientPrimary)"
            name="Portfolio Value"
            dot={chartConfig.line.dot}
            activeDot={chartConfig.line.activeDot}
            animationDuration={chartConfig.animation.duration}
            animationEasing={chartConfig.animation.easing}
          />
          {showComparison && benchmarkData && (
            <Area
              type="monotone"
              dataKey="benchmarkValue"
              stroke={chartColors.success}
              strokeWidth={chartConfig.line.strokeWidth}
              fillOpacity={1}
              fill="url(#gradientSuccess)"
              name="S&P 500"
              dot={chartConfig.line.dot}
              activeDot={chartConfig.line.activeDot}
              animationDuration={chartConfig.animation.duration}
              animationEasing={chartConfig.animation.easing}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
