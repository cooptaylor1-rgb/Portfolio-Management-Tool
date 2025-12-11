/**
 * Dashboard Page
 * 
 * Executive summary view with:
 * - Portfolio KPIs
 * - Performance chart
 * - Top positions
 * - Recent activity
 * - Alerts/notifications
 */

import { Link } from 'react-router-dom';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  ChevronRight,
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

// Mock data - replace with actual API calls
const mockKPIs = {
  totalValue: 1547832.45,
  totalGain: 234567.89,
  totalGainPercent: 17.85,
  dayChange: 12345.67,
  dayChangePercent: 0.81,
  positions: 24,
  cashBalance: 45678.90,
  allocatedPercent: 97.05,
};

const mockPerformanceData = [
  { date: '2024-01', value: 1320000, benchmark: 1300000 },
  { date: '2024-02', value: 1380000, benchmark: 1340000 },
  { date: '2024-03', value: 1350000, benchmark: 1320000 },
  { date: '2024-04', value: 1420000, benchmark: 1380000 },
  { date: '2024-05', value: 1480000, benchmark: 1420000 },
  { date: '2024-06', value: 1520000, benchmark: 1460000 },
  { date: '2024-07', value: 1547832, benchmark: 1490000 },
];

const mockTopPositions = [
  { symbol: 'AAPL', name: 'Apple Inc.', value: 245000, weight: 15.8, change: 2.34 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', value: 198000, weight: 12.8, change: 1.56 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', value: 167000, weight: 10.8, change: -0.89 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', value: 145000, weight: 9.4, change: 3.21 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', value: 134000, weight: 8.7, change: 5.67 },
];

const mockSectorAllocation = [
  { name: 'Technology', value: 45, color: '#58a6ff' },
  { name: 'Healthcare', value: 18, color: '#3fb950' },
  { name: 'Finance', value: 15, color: '#a855f7' },
  { name: 'Consumer', value: 12, color: '#f97316' },
  { name: 'Other', value: 10, color: '#6e7681' },
];

const mockRecentActivity = [
  { type: 'BUY', symbol: 'NVDA', shares: 50, price: 875.50, time: '2 hours ago' },
  { type: 'DIVIDEND', symbol: 'AAPL', amount: 234.56, time: '1 day ago' },
  { type: 'SELL', symbol: 'TSLA', shares: 25, price: 245.30, time: '2 days ago' },
  { type: 'BUY', symbol: 'GOOGL', shares: 10, price: 178.45, time: '3 days ago' },
];

const mockAlerts = [
  { id: 1, type: 'price', message: 'AAPL crossed above $195', time: '1 hour ago', severity: 'info' },
  { id: 2, type: 'risk', message: 'Portfolio volatility increased 15%', time: '4 hours ago', severity: 'warning' },
  { id: 3, type: 'dividend', message: 'MSFT dividend payment received', time: '1 day ago', severity: 'success' },
];

export default function DashboardPage() {
  const { openDetailsPanel } = useShell();

  return (
    <div className="dashboard">
      {/* KPI Grid */}
      <section className="dashboard__kpis">
        <KPIGrid columns={4}>
          <KPICard
            label="Portfolio Value"
            value={mockKPIs.totalValue}
            format="currency"
            change={mockKPIs.dayChangePercent}
            changeLabel="today"
            sparkline={[1320, 1380, 1350, 1420, 1480, 1520, 1548]}
          />
          <KPICard
            label="Total Return"
            value={mockKPIs.totalGainPercent}
            format="percent"
            prefix="+"
            change={mockKPIs.totalGainPercent}
            variant="highlight"
          />
          <KPICard
            label="Today's Change"
            value={mockKPIs.dayChange}
            format="currency"
            change={mockKPIs.dayChangePercent}
          />
          <KPICard
            label="Positions"
            value={mockKPIs.positions}
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
              <p className="card__subtitle">Portfolio vs S&P 500</p>
            </div>
            <Link to="/analytics/performance" className="card__link">
              View Details <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card__body">
            <div className="dashboard__chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={mockPerformanceData}>
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
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161b22',
                      border: '1px solid #30363d',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#e6edf3' }}
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
                    name="S&P 500"
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
            <div className="dashboard__allocation-chart">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={mockSectorAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {mockSectorAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="dashboard__allocation-legend">
              {mockSectorAllocation.map((sector) => (
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
                {mockTopPositions.map((position) => (
                  <tr 
                    key={position.symbol}
                    onClick={() => openDetailsPanel({
                      type: 'position',
                      data: {
                        symbol: position.symbol,
                        name: position.name,
                        quantity: 100,
                        price: position.value / 100,
                        value: position.value,
                        costBasis: position.value * 0.85,
                        gain: position.value * 0.15,
                        gainPercent: 15,
                        dayChange: position.change * 10,
                        dayChangePercent: position.change,
                        weight: position.weight,
                        sector: 'Technology',
                      }
                    })}
                  >
                    <td>
                      <div className="dashboard__position-symbol">
                        <span className="dashboard__position-ticker">{position.symbol}</span>
                        <span className="dashboard__position-name">{position.name}</span>
                      </div>
                    </td>
                    <td>${(position.value / 1000).toFixed(0)}K</td>
                    <td>{position.weight}%</td>
                    <td className={position.change >= 0 ? 'text-positive' : 'text-negative'}>
                      {position.change >= 0 ? '+' : ''}{position.change}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <div className="dashboard__activity-list">
              {mockRecentActivity.map((activity, index) => (
                <div key={index} className="dashboard__activity-item">
                  <div className={`dashboard__activity-icon dashboard__activity-icon--${activity.type.toLowerCase()}`}>
                    {activity.type === 'BUY' && <ArrowUpRight size={16} />}
                    {activity.type === 'SELL' && <ArrowDownRight size={16} />}
                    {activity.type === 'DIVIDEND' && <DollarSign size={16} />}
                  </div>
                  <div className="dashboard__activity-content">
                    <span className="dashboard__activity-type">{activity.type}</span>
                    <span className="dashboard__activity-detail">
                      {activity.type === 'DIVIDEND' 
                        ? `${activity.symbol} - $${activity.amount}`
                        : `${activity.shares} ${activity.symbol} @ $${activity.price}`
                      }
                    </span>
                  </div>
                  <span className="dashboard__activity-time">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section className="card dashboard__alerts">
          <div className="card__header">
            <div>
              <h2 className="card__title">Alerts</h2>
              <p className="card__subtitle">{mockAlerts.length} active</p>
            </div>
            <Link to="/alerts" className="card__link">
              Manage <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card__body card__body--flush">
            <div className="dashboard__alerts-list">
              {mockAlerts.map((alert) => (
                <div key={alert.id} className={`dashboard__alert dashboard__alert--${alert.severity}`}>
                  <Bell size={16} className="dashboard__alert-icon" />
                  <div className="dashboard__alert-content">
                    <span className="dashboard__alert-message">{alert.message}</span>
                    <span className="dashboard__alert-time">{alert.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
