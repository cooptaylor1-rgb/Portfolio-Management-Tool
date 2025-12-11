/**
 * Dashboard Page
 * 
 * Executive summary view with:
 * - Portfolio KPIs (from real data)
 * - Performance chart
 * - Top positions (from real holdings)
 * - Recent activity (from transactions)
 * - Alerts/notifications
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Coins,
  Activity,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { KPICard, KPIGrid } from '../components/ui';
import { useShell } from '../layouts';
import { usePortfolio } from '../contexts/PortfolioContext';

const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#58a6ff',
  'Healthcare': '#3fb950',
  'Financials': '#a855f7',
  'Consumer Discretionary': '#f97316',
  'Broad Market': '#14b8a6',
  'Cryptocurrency': '#eab308',
  'Other': '#6e7681',
};

export default function DashboardPage() {
  const { openDetailsPanel } = useShell();
  const { investments, transactions, stats, riskMetrics, isLoading, refreshPrices, isOnline } = usePortfolio();

  // Generate performance data based on portfolio (simulated historical)
  const performanceData = useMemo(() => {
    const baseValue = stats.totalInvested || 100000;
    const currentValue = stats.totalValue || 100000;
    const growthRate = (currentValue / baseValue - 1) / 7; // Spread growth over 7 periods
    
    return Array.from({ length: 7 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (6 - i));
      const progress = i / 6;
      const value = baseValue * (1 + growthRate * i * 1.1);
      const benchmark = baseValue * (1 + growthRate * i * 0.85);
      
      return {
        date: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        value: Math.round(value),
        benchmark: Math.round(benchmark),
      };
    });
  }, [stats.totalInvested, stats.totalValue]);

  // Top positions from real holdings
  const topPositions = useMemo(() => {
    return [...investments]
      .map(inv => ({
        symbol: inv.symbol,
        name: inv.name,
        value: inv.quantity * inv.currentPrice,
        weight: stats.totalValue > 0 
          ? (inv.quantity * inv.currentPrice / stats.totalValue) * 100 
          : 0,
        change: inv.dayChangePercent || 0,
        quantity: inv.quantity,
        price: inv.currentPrice,
        costBasis: inv.purchasePrice * inv.quantity,
        gain: (inv.currentPrice - inv.purchasePrice) * inv.quantity,
        gainPercent: ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100,
        sector: inv.sector || 'Other',
        dayChange: inv.dayChange || 0,
        dayChangePercent: inv.dayChangePercent || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [investments, stats.totalValue]);

  // Sector allocation from real holdings
  const sectorAllocation = useMemo(() => {
    const sectorTotals: Record<string, number> = {};
    
    investments.forEach(inv => {
      const sector = inv.sector || 'Other';
      const value = inv.quantity * inv.currentPrice;
      sectorTotals[sector] = (sectorTotals[sector] || 0) + value;
    });

    return Object.entries(sectorTotals)
      .map(([name, value]) => ({
        name,
        value: stats.totalValue > 0 ? Math.round((value / stats.totalValue) * 100) : 0,
        color: SECTOR_COLORS[name] || '#6e7681',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [investments, stats.totalValue]);

  // Recent activity from real transactions
  const recentActivity = useMemo(() => {
    const investmentLookup = new Map(investments.map(inv => [inv.id, inv]));
    
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(t => {
        const inv = investmentLookup.get(t.investmentId);
        const daysDiff = Math.floor((Date.now() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24));
        const timeAgo = daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Yesterday' : `${daysDiff} days ago`;
        
        return {
          type: t.type.toUpperCase(),
          symbol: inv?.symbol || '???',
          shares: t.quantity,
          price: t.price,
          amount: t.quantity * t.price,
          time: timeAgo,
        };
      });
  }, [transactions, investments]);

  // Alerts based on portfolio state
  const alerts = useMemo(() => {
    const alertList: { id: number; type: string; message: string; time: string; severity: string }[] = [];
    let alertId = 1;
    
    // High volatility alert
    if (riskMetrics.portfolioVolatility > 25) {
      alertList.push({
        id: alertId++,
        type: 'risk',
        message: `Portfolio volatility is high (${riskMetrics.portfolioVolatility.toFixed(1)}%)`,
        time: 'Now',
        severity: 'warning',
      });
    }
    
    // Large day change alert
    if (Math.abs(stats.dayChangePercentage || 0) > 3) {
      alertList.push({
        id: alertId++,
        type: 'price',
        message: `Portfolio moved ${stats.dayChangePercentage?.toFixed(2)}% today`,
        time: 'Today',
        severity: stats.dayChangePercentage! > 0 ? 'info' : 'warning',
      });
    }
    
    // Best performer alert
    if (stats.bestPerformer && stats.bestPerformer.percentage > 20) {
      alertList.push({
        id: alertId++,
        type: 'performer',
        message: `${stats.bestPerformer.name} up ${stats.bestPerformer.percentage.toFixed(1)}%`,
        time: 'All time',
        severity: 'success',
      });
    }
    
    // Low diversification alert
    if (stats.diversificationScore < 40) {
      alertList.push({
        id: alertId++,
        type: 'risk',
        message: 'Portfolio diversification is low',
        time: 'Now',
        severity: 'warning',
      });
    }
    
    // Worst performer alert
    if (stats.worstPerformer && stats.worstPerformer.percentage < -10) {
      alertList.push({
        id: alertId++,
        type: 'performer',
        message: `${stats.worstPerformer.name} down ${Math.abs(stats.worstPerformer.percentage).toFixed(1)}%`,
        time: 'All time',
        severity: 'danger',
      });
    }
    
    return alertList.slice(0, 3);
  }, [riskMetrics, stats]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="dashboard">
      {/* Connection status banner */}
      {!isOnline && (
        <div className="dashboard__offline-banner">
          <Activity size={14} />
          Offline mode - data may not be current
        </div>
      )}

      {/* KPI Grid */}
      <section className="dashboard__kpis">
        <div className="dashboard__kpis-header">
          <h2 className="sr-only">Portfolio Overview</h2>
          <button 
            className="btn btn--ghost btn--sm" 
            onClick={() => refreshPrices()}
            disabled={isLoading}
            title="Refresh prices"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
        <KPIGrid columns={4}>
          <KPICard
            label="Portfolio Value"
            value={stats.totalValue}
            format="currency"
            change={stats.dayChangePercentage}
            changeLabel="today"
            sparkline={performanceData.map(d => d.value / 10000)}
          />
          <KPICard
            label="Total Return"
            value={stats.gainLossPercentage}
            format="percent"
            prefix={stats.gainLossPercentage >= 0 ? '+' : ''}
            change={stats.gainLossPercentage}
            variant={stats.gainLossPercentage >= 0 ? 'highlight' : 'danger'}
          />
          <KPICard
            label="Today's Change"
            value={stats.dayChange || 0}
            format="currency"
            change={stats.dayChangePercentage}
          />
          <KPICard
            label="Positions"
            value={investments.length}
            suffix=" holdings"
          />
        </KPIGrid>
      </section>

      {/* Main content grid */}
      <div className="dashboard__grid">
        {/* Performance Chart */}
        <section className="card dashboard__chart">
          <div className="card__header">
            <div>
              <h2 className="card__title">Performance</h2>
              <p className="card__subtitle">Portfolio vs Benchmark</p>
            </div>
            <Link to="/analytics/performance" className="card__link">
              View Details <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card__body">
            <div className="dashboard__chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#58a6ff" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#58a6ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6e7681', fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6e7681', fontSize: 11 }}
                    tickFormatter={(value) => formatCurrency(value)}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161b22',
                      border: '1px solid #30363d',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#e6edf3' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#58a6ff"
                    strokeWidth={2}
                    fill="url(#portfolioGradient)"
                    name="Portfolio"
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#6e7681"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Benchmark"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Sector Allocation */}
        <section className="card dashboard__allocation">
          <div className="card__header">
            <div>
              <h2 className="card__title">Allocation</h2>
              <p className="card__subtitle">By sector</p>
            </div>
          </div>
          <div className="card__body">
            {sectorAllocation.length > 0 ? (
              <>
                <div className="dashboard__allocation-chart">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={sectorAllocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {sectorAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="dashboard__allocation-legend">
                  {sectorAllocation.map((sector) => (
                    <div key={sector.name} className="dashboard__allocation-item">
                      <span 
                        className="dashboard__allocation-dot" 
                        style={{ backgroundColor: sector.color }}
                      />
                      <span className="dashboard__allocation-name">{sector.name}</span>
                      <span className="dashboard__allocation-value">{sector.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="dashboard__empty">
                <p>No holdings to display</p>
                <Link to="/portfolios/overview" className="btn btn--primary btn--sm">
                  Add Investments
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Top Positions */}
        <section className="card dashboard__positions">
          <div className="card__header">
            <div>
              <h2 className="card__title">Top Holdings</h2>
              <p className="card__subtitle">By market value</p>
            </div>
            <Link to="/portfolios/positions" className="card__link">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card__body card__body--flush">
            {topPositions.length > 0 ? (
              <table className="dashboard__positions-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Value</th>
                    <th>Weight</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {topPositions.map((position) => (
                    <tr 
                      key={position.symbol}
                      onClick={() => openDetailsPanel({
                        type: 'position',
                        data: position
                      })}
                    >
                      <td>
                        <div className="dashboard__position-symbol">
                          <span className="dashboard__position-ticker">{position.symbol}</span>
                          <span className="dashboard__position-name">{position.name}</span>
                        </div>
                      </td>
                      <td>{formatCurrency(position.value)}</td>
                      <td>{position.weight.toFixed(1)}%</td>
                      <td className={position.change >= 0 ? 'text-positive' : 'text-negative'}>
                        {position.change >= 0 ? '+' : ''}{position.change.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="dashboard__empty">
                <p>No positions yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="card dashboard__activity">
          <div className="card__header">
            <div>
              <h2 className="card__title">Recent Activity</h2>
              <p className="card__subtitle">Latest transactions</p>
            </div>
            <Link to="/portfolios/transactions" className="card__link">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card__body card__body--flush">
            {recentActivity.length > 0 ? (
              <div className="dashboard__activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="dashboard__activity-item">
                    <div className={`dashboard__activity-icon dashboard__activity-icon--${activity.type.toLowerCase()}`}>
                      {activity.type === 'BUY' && <ArrowUpRight size={16} />}
                      {activity.type === 'SELL' && <ArrowDownRight size={16} />}
                      {activity.type === 'DIVIDEND' && <Coins size={16} />}
                      {!['BUY', 'SELL', 'DIVIDEND'].includes(activity.type) && <Activity size={16} />}
                    </div>
                    <div className="dashboard__activity-content">
                      <span className="dashboard__activity-type">{activity.type}</span>
                      <span className="dashboard__activity-detail">
                        {activity.type === 'DIVIDEND' 
                          ? `${activity.symbol} - ${formatCurrency(activity.amount)}`
                          : `${activity.shares} ${activity.symbol} @ $${activity.price.toFixed(2)}`
                        }
                      </span>
                    </div>
                    <span className="dashboard__activity-time">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty">
                <p>No transactions yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Alerts */}
        <section className="card dashboard__alerts">
          <div className="card__header">
            <div>
              <h2 className="card__title">Alerts</h2>
              <p className="card__subtitle">{alerts.length} active</p>
            </div>
            <Link to="/alerts" className="card__link">
              Manage <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card__body card__body--flush">
            {alerts.length > 0 ? (
              <div className="dashboard__alerts-list">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`dashboard__alert dashboard__alert--${alert.severity}`}>
                    <Bell size={16} className="dashboard__alert-icon" />
                    <div className="dashboard__alert-content">
                      <span className="dashboard__alert-message">{alert.message}</span>
                      <span className="dashboard__alert-time">{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty">
                <p>No alerts</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
