import { useState, useMemo } from 'react'
import { Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react'
import { ChartContainer, ChartStatCard, TimeRangeSelector } from './ChartComponents'
import { CustomTooltip } from './CustomTooltip'
import { chartColors, chartConfig, formatters } from '../config/chartTheme'

interface MonteCarloProps {
  initialValue: number
  years?: number
  simulations?: number
  expectedReturn?: number
  volatility?: number
}

export function MonteCarloSimulation({ 
  initialValue,
  simulations = 1000,
  expectedReturn = 0.08,
  volatility = 0.15
}: MonteCarloProps) {
  const [timeHorizon, setTimeHorizon] = useState<'5' | '10' | '20' | '30'>('10')

  const yearsToUse = parseInt(timeHorizon)

  // Generate Monte Carlo simulations
  const { statistics, percentiles } = useMemo(() => {
    const monthsPerYear = 12
    const totalMonths = yearsToUse * monthsPerYear
    const dt = 1 / monthsPerYear
    
    const allPaths: number[][] = []
    const finalValues: number[] = []
    
    // Run simulations
    for (let sim = 0; sim < simulations; sim++) {
      const path: number[] = [initialValue]
      let currentValue = initialValue
      
      for (let month = 1; month <= totalMonths; month++) {
        const randomShock = (Math.random() - 0.5) * 2
        const drift = expectedReturn * dt
        const diffusion = volatility * Math.sqrt(dt) * randomShock
        const return_ = drift + diffusion
        currentValue = currentValue * (1 + return_)
        path.push(currentValue)
      }
      
      allPaths.push(path)
      finalValues.push(currentValue)
    }
    
    // Calculate statistics
    finalValues.sort((a, b) => a - b)
    const median = finalValues[Math.floor(simulations / 2)]
    const mean = finalValues.reduce((a, b) => a + b, 0) / simulations
    const p10 = finalValues[Math.floor(simulations * 0.1)]
    const p25 = finalValues[Math.floor(simulations * 0.25)]
    const p75 = finalValues[Math.floor(simulations * 0.75)]
    const p90 = finalValues[Math.floor(simulations * 0.9)]
    const p95 = finalValues[Math.floor(simulations * 0.95)]
    const worst = finalValues[0]
    const best = finalValues[finalValues.length - 1]
    
    // Calculate percentile paths
    const p10Path: number[] = []
    const p50Path: number[] = []
    const p90Path: number[] = []
    
    for (let month = 0; month <= totalMonths; month++) {
      const monthValues = allPaths.map(path => path[month]).sort((a, b) => a - b)
      p10Path.push(monthValues[Math.floor(simulations * 0.1)])
      p50Path.push(monthValues[Math.floor(simulations * 0.5)])
      p90Path.push(monthValues[Math.floor(simulations * 0.9)])
    }
    
    // Format chart data
    const chartData = []
    for (let month = 0; month <= totalMonths; month++) {
      chartData.push({
        month,
        year: (month / monthsPerYear).toFixed(1),
        p10: p10Path[month],
        p50: p50Path[month],
        p90: p90Path[month]
      })
    }
    
    return {
      paths: allPaths.slice(0, 50), // Show only 50 paths for performance
      statistics: { median, mean, p10, p25, p75, p90, p95, worst, best },
      percentiles: chartData
    }
  }, [initialValue, yearsToUse, simulations, expectedReturn, volatility])

  const probabilityOfGain = ((statistics.median - initialValue) / initialValue * 100).toFixed(1)
  const worstCase = ((statistics.p10 - initialValue) / initialValue * 100).toFixed(1)
  const bestCase = ((statistics.p90 - initialValue) / initialValue * 100).toFixed(1)

  return (
    <div className="chart-grid-2">
      {/* Main Monte Carlo Chart */}
      <div className="chart-full-width">
        <ChartContainer
          title="Monte Carlo Simulation"
          subtitle={`${simulations.toLocaleString()} simulations with ${(expectedReturn * 100).toFixed(1)}% expected return and ${(volatility * 100).toFixed(1)}% volatility`}
          height={450}
          actions={
            <TimeRangeSelector 
              value={timeHorizon}
              onChange={(value) => setTimeHorizon(value as typeof timeHorizon)}
              ranges={[
                { value: '5', label: '5Y' },
                { value: '10', label: '10Y' },
                { value: '20', label: '20Y' },
                { value: '30', label: '30Y' }
              ]}
            />
          }
        >
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={percentiles} margin={chartConfig.marginLarge}>
              <defs>
                <linearGradient id="confidenceArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid {...chartConfig.grid} />
              <XAxis 
                dataKey="year"
                label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: chartColors.text }}
                {...chartConfig.axis}
                tick={{ fill: chartColors.text }}
              />
              <YAxis 
                tickFormatter={formatters.currency}
                label={{ value: 'Portfolio Value', angle: -90, position: 'insideLeft', fill: chartColors.text }}
                {...chartConfig.axis}
                tick={{ fill: chartColors.text }}
              />
              <CustomTooltip formatter={formatters.currencyPrecise} />
              
              {/* 80% confidence interval */}
              <Area
                type="monotone"
                dataKey="p90"
                stroke="none"
                fill="url(#confidenceArea)"
                fillOpacity={1}
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="p10"
                stroke="none"
                fill={chartColors.background}
                fillOpacity={1}
                legendType="none"
              />
              
              {/* Median path */}
              <Line
                type="monotone"
                dataKey="p50"
                stroke={chartColors.primary}
                strokeWidth={3}
                dot={false}
                name="Median (50th percentile)"
                animationDuration={800}
              />
              
              {/* 10th percentile */}
              <Line
                type="monotone"
                dataKey="p10"
                stroke={chartColors.danger}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="10th percentile (worst case)"
                animationDuration={800}
              />
              
              {/* 90th percentile */}
              <Line
                type="monotone"
                dataKey="p90"
                stroke={chartColors.success}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="90th percentile (best case)"
                animationDuration={800}
              />
              
              <ReferenceLine 
                y={initialValue} 
                stroke={chartColors.text} 
                strokeDasharray="3 3"
                label={{ value: 'Initial Value', fill: chartColors.text }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Statistics Cards */}
      <ChartStatCard
        label="Median Outcome"
        value={formatters.currency(statistics.median)}
        change={probabilityOfGain + '%'}
        changeType={parseFloat(probabilityOfGain) >= 0 ? 'positive' : 'negative'}
        icon={<Activity size={20} />}
      />
      
      <ChartStatCard
        label="Best Case (90th %ile)"
        value={formatters.currency(statistics.p90)}
        change={bestCase + '%'}
        changeType="positive"
        icon={<TrendingUp size={20} />}
      />
      
      <ChartStatCard
        label="Worst Case (10th %ile)"
        value={formatters.currency(statistics.p10)}
        change={worstCase + '%'}
        changeType={parseFloat(worstCase) >= 0 ? 'positive' : 'negative'}
        icon={<TrendingDown size={20} />}
      />
      
      <ChartStatCard
        label="Range of Outcomes"
        value={formatters.currency(statistics.p90 - statistics.p10)}
        icon={<Target size={20} />}
      />

      {/* Distribution Details */}
      <div className="chart-full-width">
        <ChartContainer
          title="Outcome Distribution"
          subtitle={`Final portfolio values after ${yearsToUse} years`}
          height={200}
        >
          <div className="grid grid-cols-2 gap-md">
            <div className="chart-stat-card">
              <div className="chart-stat-content">
                <span className="chart-stat-label">25th Percentile</span>
                <span className="chart-stat-value">{formatters.currency(statistics.p25)}</span>
                <span className="chart-stat-change chart-stat-change-neutral">
                  {((statistics.p25 - initialValue) / initialValue * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="chart-stat-card">
              <div className="chart-stat-content">
                <span className="chart-stat-label">75th Percentile</span>
                <span className="chart-stat-value">{formatters.currency(statistics.p75)}</span>
                <span className="chart-stat-change chart-stat-change-positive">
                  {((statistics.p75 - initialValue) / initialValue * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="chart-stat-card">
              <div className="chart-stat-content">
                <span className="chart-stat-label">Mean Outcome</span>
                <span className="chart-stat-value">{formatters.currency(statistics.mean)}</span>
                <span className="chart-stat-change chart-stat-change-positive">
                  {((statistics.mean - initialValue) / initialValue * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="chart-stat-card">
              <div className="chart-stat-content">
                <span className="chart-stat-label">95th Percentile</span>
                <span className="chart-stat-value">{formatters.currency(statistics.p95)}</span>
                <span className="chart-stat-change chart-stat-change-positive">
                  {((statistics.p95 - initialValue) / initialValue * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </ChartContainer>
      </div>
    </div>
  )
}
