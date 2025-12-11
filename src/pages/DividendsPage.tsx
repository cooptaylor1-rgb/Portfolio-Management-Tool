/**
 * Dividends Page
 * 
 * Track dividend income, payment schedules, and yield analysis
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { DollarSign, Calendar, TrendingUp, Percent, Columns, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { KPICard, KPIGrid } from '../components/ui';
import {
  ColumnCustomizationDialog,
  loadTablePreferences,
  saveTablePreferences,
  getOrderedVisibleColumns,
  updateSort,
  TablePreferences,
} from '../features/columns';
import {
  DividendHoldingColumnId,
  DIVIDEND_HOLDING_COLUMNS,
  DIVIDEND_HOLDING_CATEGORIES,
  DEFAULT_DIVIDEND_HOLDING_COLUMNS,
  DividendPaymentColumnId,
  DIVIDEND_PAYMENT_COLUMNS,
  DIVIDEND_PAYMENT_CATEGORIES,
  DEFAULT_DIVIDEND_PAYMENT_COLUMNS,
} from '../features/dividends';
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
  const [showHoldingsColumnDialog, setShowHoldingsColumnDialog] = useState(false);
  const [showPaymentsColumnDialog, setShowPaymentsColumnDialog] = useState(false);
  
  // Holdings column preferences
  const [holdingsPreferences, setHoldingsPreferences] = useState<TablePreferences<DividendHoldingColumnId>>(() =>
    loadTablePreferences('dividend_holdings', DIVIDEND_HOLDING_COLUMNS, DEFAULT_DIVIDEND_HOLDING_COLUMNS)
  );
  
  // Payments column preferences
  const [paymentsPreferences, setPaymentsPreferences] = useState<TablePreferences<DividendPaymentColumnId>>(() =>
    loadTablePreferences('dividend_payments', DIVIDEND_PAYMENT_COLUMNS, DEFAULT_DIVIDEND_PAYMENT_COLUMNS)
  );

  // Save preferences when they change
  useEffect(() => {
    saveTablePreferences('dividend_holdings', holdingsPreferences);
  }, [holdingsPreferences]);
  
  useEffect(() => {
    saveTablePreferences('dividend_payments', paymentsPreferences);
  }, [paymentsPreferences]);

  // Get visible columns in order
  const visibleHoldingsColumns = useMemo(
    () => getOrderedVisibleColumns(DIVIDEND_HOLDING_COLUMNS, holdingsPreferences),
    [holdingsPreferences]
  );
  
  const visiblePaymentsColumns = useMemo(
    () => getOrderedVisibleColumns(DIVIDEND_PAYMENT_COLUMNS, paymentsPreferences),
    [paymentsPreferences]
  );

  // Handle sort
  const handleHoldingsSort = useCallback((columnId: DividendHoldingColumnId) => {
    setHoldingsPreferences(prev => updateSort(prev, columnId));
  }, []);
  
  const handlePaymentsSort = useCallback((columnId: DividendPaymentColumnId) => {
    setPaymentsPreferences(prev => updateSort(prev, columnId));
  }, []);

  // Get sort icons
  const getHoldingsSortIcon = (columnId: DividendHoldingColumnId) => {
    if (holdingsPreferences.sortBy?.columnId !== columnId) {
      return <ArrowUpDown size={12} className="sort-icon--inactive" />;
    }
    return holdingsPreferences.sortBy.direction === 'asc' 
      ? <ArrowUp size={12} className="sort-icon--active" />
      : <ArrowDown size={12} className="sort-icon--active" />;
  };
  
  const getPaymentsSortIcon = (columnId: DividendPaymentColumnId) => {
    if (paymentsPreferences.sortBy?.columnId !== columnId) {
      return <ArrowUpDown size={12} className="sort-icon--inactive" />;
    }
    return paymentsPreferences.sortBy.direction === 'asc' 
      ? <ArrowUp size={12} className="sort-icon--active" />
      : <ArrowDown size={12} className="sort-icon--active" />;
  };

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
            <div className="card__header-actions">
              <span className="card__badge">{stats.upcomingCount} this month</span>
              <button 
                className="btn btn--ghost btn--sm"
                onClick={() => setShowPaymentsColumnDialog(true)}
                title="Customize columns"
              >
                <Columns size={14} />
              </button>
            </div>
          </div>
          <div className="card__body card__body--flush">
            <table className="holdings-table">
              <thead>
                <tr>
                  {visiblePaymentsColumns.map(col => (
                    <th
                      key={col.id}
                      className={col.sortable ? 'sortable' : ''}
                      onClick={() => col.sortable && handlePaymentsSort(col.id)}
                    >
                      {col.label}
                      {col.sortable && getPaymentsSortIcon(col.id)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dividendHoldings
                  .filter(h => h.daysUntilNext > 0)
                  .sort((a, b) => a.daysUntilNext - b.daysUntilNext)
                  .slice(0, 5)
                  .map(h => (
                    <tr key={h.symbol}>
                      {visiblePaymentsColumns.map(col => (
                        <td key={col.id}>
                          {col.id === 'symbol' && <span className="holding-ticker">{h.symbol}</span>}
                          {col.id === 'expectedAmount' && `$${h.quarterlyDividend.toFixed(2)}`}
                          {col.id === 'payDate' && new Date(h.nextPay).toLocaleDateString()}
                          {col.id === 'daysUntil' && (
                            <span className={`days-badge ${h.daysUntilNext <= 14 ? 'soon' : ''}`}>
                              {h.daysUntilNext}d
                            </span>
                          )}
                          {col.id === 'name' && h.name}
                          {col.id === 'shares' && h.shares}
                          {col.id === 'yield' && `${h.yield.toFixed(2)}%`}
                          {col.id === 'frequency' && h.frequency}
                        </td>
                      ))}
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
            <button 
              className="btn btn--ghost btn--sm"
              onClick={() => setShowHoldingsColumnDialog(true)}
              title="Customize columns"
            >
              <Columns size={14} />
            </button>
          </div>
          <div className="card__body card__body--flush">
            <table className="holdings-table">
              <thead>
                <tr>
                  {visibleHoldingsColumns.map(col => (
                    <th
                      key={col.id}
                      className={col.sortable ? 'sortable' : ''}
                      onClick={() => col.sortable && handleHoldingsSort(col.id)}
                    >
                      {col.label}
                      {col.sortable && getHoldingsSortIcon(col.id)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dividendHoldings.map(h => (
                  <tr key={h.symbol}>
                    {visibleHoldingsColumns.map(col => (
                      <td key={col.id}>
                        {col.id === 'symbol' && (
                          <div className="holding-symbol">
                            <span className="holding-ticker">{h.symbol}</span>
                            <span className="holding-name">{h.name}</span>
                          </div>
                        )}
                        {col.id === 'name' && h.name}
                        {col.id === 'shares' && h.shares}
                        {col.id === 'yield' && <span className="text-highlight">{h.yield.toFixed(2)}%</span>}
                        {col.id === 'frequency' && <span className="text-muted">{h.frequency}</span>}
                        {col.id === 'annualIncome' && <span className="text-positive">${h.annualDividend.toFixed(2)}</span>}
                        {col.id === 'value' && `$${h.value.toFixed(2)}`}
                        {col.id === 'quarterlyIncome' && `$${h.quarterlyDividend.toFixed(2)}`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Column Customization Dialogs */}
      {showHoldingsColumnDialog && (
        <ColumnCustomizationDialog
          columns={DIVIDEND_HOLDING_COLUMNS}
          categories={DIVIDEND_HOLDING_CATEGORIES}
          preferences={holdingsPreferences}
          onPreferencesChange={setHoldingsPreferences}
          onClose={() => setShowHoldingsColumnDialog(false)}
          defaultVisibleIds={DEFAULT_DIVIDEND_HOLDING_COLUMNS}
          title="Customize Dividend Holdings Columns"
        />
      )}
      
      {showPaymentsColumnDialog && (
        <ColumnCustomizationDialog
          columns={DIVIDEND_PAYMENT_COLUMNS}
          categories={DIVIDEND_PAYMENT_CATEGORIES}
          preferences={paymentsPreferences}
          onPreferencesChange={setPaymentsPreferences}
          onClose={() => setShowPaymentsColumnDialog(false)}
          defaultVisibleIds={DEFAULT_DIVIDEND_PAYMENT_COLUMNS}
          title="Customize Upcoming Payments Columns"
        />
      )}
    </div>
  );
}
