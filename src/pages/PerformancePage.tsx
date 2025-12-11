/**
 * Performance Page
 * 
 * Detailed performance analytics with charts, benchmarking, and returns analysis
 */

import { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, Target, Award } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { KPICard, KPIGrid } from '../components/ui';
import './pages.css';

// Generate mock historical data
function generateHistoricalData(currentValue: number, days: number) {
  const data = [];
  let value = currentValue * (1 - (Math.random() * 0.3 + 0.1)); // Start lower
  const dailyReturn = Math.pow(currentValue / value, 1 / days);
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some volatility
    const volatility = 1 + (Math.random() - 0.5) * 0.02;
    value *= dailyReturn * volatility;
    
    // Calculate benchmark (S&P 500 approximation)
    const benchmarkReturn = Math.pow(1.10, (days - i) / 365);
    const benchmarkValue = currentValue * 0.85 * benchmarkReturn;
    
    data.push({
      date: date.toISOString().split('T')[0],
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      portfolio: Math.round(value),
      benchmark: Math.round(benchmarkValue),
    });
  }
  return data;
}

type TimeRange = '1M' | '3M' | '6M' | 'YTD' | '1Y' | 'ALL';

export default function PerformancePage() {
  const { investments, stats } = usePortfolio();
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');

  // Generate historical data based on time range
  const daysMap: Record<TimeRange, number> = {
    '1M': 30, '3M': 90, '6M': 180, 'YTD': Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)),
    '1Y': 365, 'ALL': 730,
  };

  const historicalData = useMemo(() => 
    generateHistoricalData(stats.totalValue, daysMap[timeRange]),
    [stats.totalValue, timeRange, daysMap]
  );

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (historicalData.length < 2) return null;
    
    const startValue = historicalData[0].portfolio;
    const endValue = historicalData[historicalData.length - 1].portfolio;
    const totalReturn = ((endValue - startValue) / startValue) * 100;
    
    const benchmarkStart = historicalData[0].benchmark;
    const benchmarkEnd = historicalData[historicalData.length - 1].benchmark;
    const benchmarkReturn = ((benchmarkEnd - benchmarkStart) / benchmarkStart) * 100;
    
    const alpha = totalReturn - benchmarkReturn;
    
    // Calculate max drawdown
    let peak = historicalData[0].portfolio;
    let maxDrawdown = 0;
    historicalData.forEach(d => {
      if (d.portfolio > peak) peak = d.portfolio;
      const drawdown = ((peak - d.portfolio) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Annualized return
    const years = daysMap[timeRange] / 365;
    const annualizedReturn = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;

    return {
      totalReturn,
      benchmarkReturn,
      alpha,
      maxDrawdown,
      annualizedReturn,
    };
  }, [historicalData, timeRange, daysMap]);

  // Individual holding performance
  const holdingPerformance = useMemo(() => {
    return investments.map(inv => ({
      symbol: inv.symbol,
      name: inv.name,
      return: ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100,
      value: inv.quantity * inv.currentPrice,
      contribution: ((inv.currentPrice - inv.purchasePrice) * inv.quantity / stats.totalValue) * 100,
    })).sort((a, b) => b.return - a.return);
  }, [investments, stats.totalValue]);

  // Monthly returns
  const monthlyReturns = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      return: (Math.random() - 0.3) * 10, // Mock data
    }));
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Performance Analytics</h1>
          <p className="page__subtitle">Track your portfolio returns vs benchmark</p>
        </div>
        <div className="page__actions">
          <div className="time-range-selector">
            {(['1M', '3M', '6M', 'YTD', '1Y', 'ALL'] as TimeRange[]).map(range => (
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
      </div>

      {/* KPIs */}
      {performanceMetrics && (
        <KPIGrid columns={5}>
          <KPICard
            label="Total Return"
            value={performanceMetrics.totalReturn}
            format="percent"
            icon={<TrendingUp size={18} />}
            variant={performanceMetrics.totalReturn >= 0 ? 'highlight' : 'danger'}
          />
          <KPICard
            label="Annualized Return"
            value={performanceMetrics.annualizedReturn}
            format="percent"
            icon={<Target size={18} />}
          />
          <KPICard
            label="Benchmark Return"
            value={performanceMetrics.benchmarkReturn}
            format="percent"
            icon={<TrendingUp size={18} />}
          />
          <KPICard
            label="Alpha"
            value={performanceMetrics.alpha}
            format="percent"
            icon={<Award size={18} />}
            variant={performanceMetrics.alpha >= 0 ? 'highlight' : 'danger'}
          />
          <KPICard
            label="Max Drawdown"
            value={-performanceMetrics.maxDrawdown}
            format="percent"
            icon={<TrendingDown size={18} />}
            variant="danger"
          />
        </KPIGrid>
      )}

      <div className="performance-grid">
        {/* Portfolio Value Chart */}
        <section className="card performance-chart-card">
          <div className="card__header">
            <h2 className="card__title">Portfolio Value vs Benchmark</h2>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#58a6ff' }} />
                Portfolio
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#8b949e' }} />
                S&P 500
              </span>
            </div>
          </div>
          <div className="card__body">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis 
                  dataKey="dateLabel" 
                  stroke="#8b949e"
                  tick={{ fill: '#8b949e', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#8b949e"
                  tick={{ fill: '#8b949e', fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="portfolio"
                  stroke="#58a6ff"
                  fill="url(#portfolioGradient)"
                  strokeWidth={2}
                  name="Portfolio"
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#8b949e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="S&P 500"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Monthly Returns */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Monthly Returns</h2>
          </div>
          <div className="card__body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyReturns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis 
                  dataKey="month" 
                  stroke="#8b949e"
                  tick={{ fill: '#8b949e', fontSize: 11 }}
                />
                <YAxis 
                  stroke="#8b949e"
                  tick={{ fill: '#8b949e', fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                />
                <Bar
                  dataKey="return"
                  fill="#58a6ff"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Top Performers */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Top Performers</h2>
          </div>
          <div className="card__body card__body--flush">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Return</th>
                  <th>Contribution</th>
                </tr>
              </thead>
              <tbody>
                {holdingPerformance.slice(0, 5).map(h => (
                  <tr key={h.symbol}>
                    <td>
                      <div className="holding-symbol">
                        <span className="holding-ticker">{h.symbol}</span>
                        <span className="holding-name">{h.name}</span>
                      </div>
                    </td>
                    <td className={h.return >= 0 ? 'text-positive' : 'text-negative'}>
                      {h.return >= 0 ? '+' : ''}{h.return.toFixed(2)}%
                    </td>
                    <td className={h.contribution >= 0 ? 'text-positive' : 'text-negative'}>
                      {h.contribution >= 0 ? '+' : ''}{h.contribution.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom Performers */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Underperformers</h2>
          </div>
          <div className="card__body card__body--flush">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Return</th>
                  <th>Contribution</th>
                </tr>
              </thead>
              <tbody>
                {holdingPerformance.slice(-5).reverse().map(h => (
                  <tr key={h.symbol}>
                    <td>
                      <div className="holding-symbol">
                        <span className="holding-ticker">{h.symbol}</span>
                        <span className="holding-name">{h.name}</span>
                      </div>
                    </td>
                    <td className={h.return >= 0 ? 'text-positive' : 'text-negative'}>
                      {h.return >= 0 ? '+' : ''}{h.return.toFixed(2)}%
                    </td>
                    <td className={h.contribution >= 0 ? 'text-positive' : 'text-negative'}>
                      {h.contribution >= 0 ? '+' : ''}{h.contribution.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
