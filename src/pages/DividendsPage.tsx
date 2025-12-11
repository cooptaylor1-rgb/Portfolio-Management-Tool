/**
 * Dividends Page
 * 
 * Track dividend income, payment schedules, and yield analysis
 */

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { DollarSign, Calendar, TrendingUp, Percent } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { KPICard, KPIGrid } from '../components/ui';
import './pages.css';

// Mock dividend data - in production, this would come from API
const DIVIDEND_DATA: Record<string, { yield: number; frequency: 'quarterly' | 'monthly' | 'annual'; lastPaid: string; nextPay: string }> = {
  'AAPL': { yield: 0.5, frequency: 'quarterly', lastPaid: '2024-02-15', nextPay: '2024-05-15' },
  'MSFT': { yield: 0.72, frequency: 'quarterly', lastPaid: '2024-02-08', nextPay: '2024-05-09' },
  'JNJ': { yield: 2.9, frequency: 'quarterly', lastPaid: '2024-03-05', nextPay: '2024-06-04' },
  'V': { yield: 0.75, frequency: 'quarterly', lastPaid: '2024-03-01', nextPay: '2024-06-01' },
  'VOO': { yield: 1.35, frequency: 'quarterly', lastPaid: '2024-03-28', nextPay: '2024-06-28' },
};

const COLORS = ['#58a6ff', '#3fb950', '#a855f7', '#f97316', '#ec4899', '#14b8a6'];

export default function DividendsPage() {
  const { investments, transactions } = usePortfolio();

  // Calculate dividend holdings
  const dividendHoldings = useMemo(() => {
    return investments
      .filter(inv => DIVIDEND_DATA[inv.symbol])
      .map(inv => {
        const divData = DIVIDEND_DATA[inv.symbol];
        const value = inv.quantity * inv.currentPrice;
        const annualDividend = value * (divData.yield / 100);
        
        return {
          symbol: inv.symbol,
          name: inv.name,
          shares: inv.quantity,
          value,
          yield: divData.yield,
          frequency: divData.frequency,
          annualDividend,
          quarterlyDividend: annualDividend / 4,
          lastPaid: divData.lastPaid,
          nextPay: divData.nextPay,
          daysUntilNext: Math.ceil((new Date(divData.nextPay).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        };
      })
      .sort((a, b) => b.annualDividend - a.annualDividend);
  }, [investments]);

  // Dividend history from transactions
  const dividendHistory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'dividend')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  // Monthly dividend totals
  const monthlyDividends = useMemo(() => {
    const months: Record<string, number> = {};
    dividendHistory.forEach(div => {
      const month = div.date.substring(0, 7); // YYYY-MM
      months[month] = (months[month] || 0) + (div.quantity * div.price);
    });
    
    return Object.entries(months).map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      amount,
    }));
  }, [dividendHistory]);

  // Summary stats
  const stats = useMemo(() => {
    const totalAnnualDividend = dividendHoldings.reduce((sum, h) => sum + h.annualDividend, 0);
    const portfolioYield = dividendHoldings.length > 0
      ? dividendHoldings.reduce((sum, h) => sum + h.value * h.yield / 100, 0) / 
        dividendHoldings.reduce((sum, h) => sum + h.value, 0) * 100
      : 0;
    const ytdDividends = dividendHistory
      .filter(d => d.date.startsWith('2024'))
      .reduce((sum, d) => sum + d.quantity * d.price, 0);
    const upcomingPayments = dividendHoldings.filter(h => h.daysUntilNext <= 30);

    return {
      totalAnnualDividend,
      portfolioYield,
      ytdDividends,
      monthlyAverage: totalAnnualDividend / 12,
      upcomingCount: upcomingPayments.length,
      upcomingAmount: upcomingPayments.reduce((sum, h) => sum + h.quarterlyDividend, 0),
    };
  }, [dividendHoldings, dividendHistory]);

  // Dividend allocation by holding
  const allocationData = useMemo(() => {
    return dividendHoldings.map(h => ({
      name: h.symbol,
      value: h.annualDividend,
    }));
  }, [dividendHoldings]);

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Dividend Tracker</h1>
          <p className="page__subtitle">{dividendHoldings.length} dividend-paying holdings</p>
        </div>
      </div>

      {/* KPIs */}
      <KPIGrid columns={4}>
        <KPICard
          label="Annual Dividend Income"
          value={stats.totalAnnualDividend}
          format="currency"
          icon={<DollarSign size={18} />}
          variant="highlight"
        />
        <KPICard
          label="Portfolio Yield"
          value={stats.portfolioYield}
          format="percent"
          icon={<Percent size={18} />}
        />
        <KPICard
          label="YTD Dividends"
          value={stats.ytdDividends}
          format="currency"
          icon={<TrendingUp size={18} />}
        />
        <KPICard
          label="Monthly Average"
          value={stats.monthlyAverage}
          format="currency"
          icon={<Calendar size={18} />}
        />
      </KPIGrid>

      <div className="dividends-grid">
        {/* Dividend Income Chart */}
        <section className="card dividend-chart-card">
          <div className="card__header">
            <h2 className="card__title">Dividend Income History</h2>
          </div>
          <div className="card__body">
            {monthlyDividends.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyDividends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis dataKey="month" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} />
                  <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Dividend']}
                  />
                  <Bar dataKey="amount" fill="#3fb950" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <p>No dividend history yet</p>
              </div>
            )}
          </div>
        </section>

        {/* Dividend Allocation */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Dividend by Holding</h2>
          </div>
          <div className="card__body">
            <div className="dividend-allocation">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                  >
                    {allocationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(0)}/yr`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="dividend-legend">
                {allocationData.map((item, index) => (
                  <div key={item.name} className="dividend-legend__item">
                    <span className="legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="legend-name">{item.name}</span>
                    <span className="legend-value">${item.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Payments */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Upcoming Payments</h2>
            <span className="card__badge">{stats.upcomingCount} this month</span>
          </div>
          <div className="card__body card__body--flush">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Expected</th>
                  <th>Pay Date</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                {dividendHoldings
                  .filter(h => h.daysUntilNext > 0)
                  .sort((a, b) => a.daysUntilNext - b.daysUntilNext)
                  .slice(0, 5)
                  .map(h => (
                    <tr key={h.symbol}>
                      <td><span className="holding-ticker">{h.symbol}</span></td>
                      <td>${h.quarterlyDividend.toFixed(2)}</td>
                      <td>{new Date(h.nextPay).toLocaleDateString()}</td>
                      <td>
                        <span className={`days-badge ${h.daysUntilNext <= 14 ? 'soon' : ''}`}>
                          {h.daysUntilNext}d
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dividend Holdings */}
        <section className="card dividend-holdings-card">
          <div className="card__header">
            <h2 className="card__title">Dividend Holdings</h2>
          </div>
          <div className="card__body card__body--flush">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Shares</th>
                  <th>Yield</th>
                  <th>Frequency</th>
                  <th>Annual Income</th>
                </tr>
              </thead>
              <tbody>
                {dividendHoldings.map(h => (
                  <tr key={h.symbol}>
                    <td>
                      <div className="holding-symbol">
                        <span className="holding-ticker">{h.symbol}</span>
                        <span className="holding-name">{h.name}</span>
                      </div>
                    </td>
                    <td>{h.shares}</td>
                    <td className="text-highlight">{h.yield.toFixed(2)}%</td>
                    <td className="text-muted">{h.frequency}</td>
                    <td className="text-positive">${h.annualDividend.toFixed(2)}</td>
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
