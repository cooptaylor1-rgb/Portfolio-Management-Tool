/**
 * Portfolio Overview Page - Palantir-Grade Workstation
 * 
 * Dense, information-rich portfolio command center with:
 * - Compact KPI band with drill-down navigation
 * - Positions snapshot with filtering
 * - Asset allocation with interactive legend
 * - Risk metrics and active alerts
 * - Recent transactions feed
 */

import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ChevronRight, 
  Download,
  AlertTriangle,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Shield,
  X,
  ExternalLink,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useShell } from '../layouts';
import './pages.css';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444', '#6366f1'];

const TIME_RANGES = [
  { id: '1D', label: '1D' },
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
  { id: '3M', label: '3M' },
  { id: 'YTD', label: 'YTD' },
  { id: '1Y', label: '1Y' },
];

const RISK_THRESHOLDS = {
  maxPosition: 25,
  sectorConcentration: 40,
  volatility: 20,
};

export default function PortfolioOverviewPage() {
  const navigate = useNavigate();
  const { investments, transactions, stats, riskMetrics } = usePortfolio();
  const { openDetailsPanel } = useShell();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1M');
  const [allocationFilter, setAllocationFilter] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);

  const allocationByType = useMemo(() => {
    const totals: Record<string, number> = {};
    investments.forEach(inv => {
      const value = inv.quantity * inv.currentPrice;
      totals[inv.type] = (totals[inv.type] || 0) + value;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({
        name: formatTypeName(name),
        rawName: name,
        value,
        percent: stats.totalValue > 0 ? (value / stats.totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [investments, stats.totalValue]);

  const allocationBySector = useMemo(() => {
    const totals: Record<string, number> = {};
    investments.forEach(inv => {
      const sector = inv.sector || 'Other';
      const value = inv.quantity * inv.currentPrice;
      totals[sector] = (totals[sector] || 0) + value;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percent: stats.totalValue > 0 ? (value / stats.totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [investments, stats.totalValue]);

  const filteredHoldings = useMemo(() => {
    let filtered = [...investments];
    if (allocationFilter) filtered = filtered.filter(inv => inv.type === allocationFilter);
    if (sectorFilter) filtered = filtered.filter(inv => (inv.sector || 'Other') === sectorFilter);
    
    return filtered
      .map(inv => ({
        ...inv,
        value: inv.quantity * inv.currentPrice,
        weight: stats.totalValue > 0 ? (inv.quantity * inv.currentPrice / stats.totalValue) * 100 : 0,
        costBasis: inv.quantity * inv.purchasePrice,
        gain: (inv.currentPrice - inv.purchasePrice) * inv.quantity,
        gainPercent: ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100,
        dayPL: (inv.dayChange || 0) * inv.quantity,
      }))
      .sort((a, b) => b.value - a.value);
  }, [investments, stats.totalValue, allocationFilter, sectorFilter]);

  const recentTransactions = useMemo(() => {
    const investmentMap = new Map(investments.map(inv => [inv.id, inv]));
    return transactions
      .map(t => ({ ...t, investment: investmentMap.get(t.investmentId) }))
      .filter(t => t.investment)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [transactions, investments]);

  const riskAlerts = useMemo(() => {
    const alerts: Array<{ id: string; type: 'warning' | 'danger' | 'info'; message: string; action?: string }> = [];
    const maxPosition = filteredHoldings[0];
    if (maxPosition && maxPosition.weight > RISK_THRESHOLDS.maxPosition) {
      alerts.push({ id: 'max-position', type: 'warning', message: maxPosition.symbol + ' is ' + maxPosition.weight.toFixed(1) + '% of portfolio', action: '/analytics/risk' });
    }
    const topSector = allocationBySector[0];
    if (topSector && topSector.percent > RISK_THRESHOLDS.sectorConcentration) {
      alerts.push({ id: 'sector-concentration', type: 'warning', message: topSector.name + ' sector is ' + topSector.percent.toFixed(1) + '% concentrated', action: '/analytics/risk' });
    }
    if (riskMetrics.portfolioVolatility > RISK_THRESHOLDS.volatility / 100) {
      alerts.push({ id: 'high-volatility', type: 'danger', message: 'Portfolio volatility at ' + (riskMetrics.portfolioVolatility * 100).toFixed(1) + '%', action: '/analytics/risk' });
    }
    if (stats.diversificationScore < 50) {
      alerts.push({ id: 'low-diversification', type: 'info', message: 'Diversification score is ' + stats.diversificationScore + '/100', action: '/portfolios/positions' });
    }
    return alerts;
  }, [filteredHoldings, allocationBySector, riskMetrics, stats.diversificationScore]);

  const handleAllocationClick = useCallback((data: { rawName: string }) => {
    if (allocationFilter === data.rawName) setAllocationFilter(null);
    else { setAllocationFilter(data.rawName); setSectorFilter(null); }
  }, [allocationFilter]);

  const handleSectorClick = useCallback((sector: string) => {
    if (sectorFilter === sector) setSectorFilter(null);
    else { setSectorFilter(sector); setAllocationFilter(null); }
  }, [sectorFilter]);

  const clearFilters = useCallback(() => { setAllocationFilter(null); setSectorFilter(null); }, []);

  const handlePositionClick = useCallback((holding: typeof filteredHoldings[0]) => {
    openDetailsPanel({
      type: 'position',
      data: { symbol: holding.symbol, name: holding.name, quantity: holding.quantity, price: holding.currentPrice, value: holding.value, costBasis: holding.costBasis, gain: holding.gain, gainPercent: holding.gainPercent, dayChange: holding.dayChange || 0, dayChangePercent: holding.dayChangePercent || 0, weight: holding.weight, sector: holding.sector },
    });
  }, [openDetailsPanel]);

  const hasActiveFilters = allocationFilter || sectorFilter;

  return (
    <div className="page portfolio-overview">
      <header className="overview-header">
        <div className="overview-header__left">
          <div className="overview-header__title-group">
            <h1 className="overview-header__title">Portfolio Overview</h1>
            <span className="overview-header__meta">{investments.length} holdings • Updated just now</span>
          </div>
        </div>
        <div className="overview-header__center">
          <div className="time-range-pills">
            {TIME_RANGES.map(range => (
              <button key={range.id} className={'time-range-pill ' + (selectedTimeRange === range.id ? 'time-range-pill--active' : '')} onClick={() => setSelectedTimeRange(range.id)}>{range.label}</button>
            ))}
          </div>
        </div>
        <div className="overview-header__right">
          <button className="btn btn--secondary btn--sm"><Download size={14} />Export</button>
          <button className="btn btn--primary btn--sm" onClick={() => setShowAddModal(true)}><Plus size={14} />Add Investment</button>
        </div>
      </header>

      <div className="kpi-band">
        <div className="kpi-tile kpi-tile--clickable" onClick={() => navigate('/portfolios/positions')}>
          <span className="kpi-tile__label">Total Value</span>
          <span className="kpi-tile__value">{formatCurrency(stats.totalValue)}</span>
          <span className={'kpi-tile__badge ' + ((stats.dayChangePercentage || 0) >= 0 ? 'kpi-tile__badge--positive' : 'kpi-tile__badge--negative')}>{(stats.dayChangePercentage || 0) >= 0 ? '+' : ''}{(stats.dayChangePercentage || 0).toFixed(2)}% today</span>
        </div>
        <div className="kpi-tile kpi-tile--clickable" onClick={() => navigate('/analytics/performance')}>
          <span className="kpi-tile__label">Total Gain/Loss</span>
          <span className={'kpi-tile__value ' + (stats.totalGainLoss >= 0 ? 'text-positive' : 'text-negative')}>{stats.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(stats.totalGainLoss)}</span>
          <span className={'kpi-tile__badge ' + (stats.gainLossPercentage >= 0 ? 'kpi-tile__badge--positive' : 'kpi-tile__badge--negative')}>{stats.gainLossPercentage >= 0 ? '+' : ''}{stats.gainLossPercentage.toFixed(2)}% all time</span>
        </div>
        <div className="kpi-tile kpi-tile--clickable" onClick={() => navigate('/analytics/performance')}>
          <span className="kpi-tile__label">Day Change</span>
          <span className={'kpi-tile__value ' + ((stats.dayChange || 0) >= 0 ? 'text-positive' : 'text-negative')}>{(stats.dayChange || 0) >= 0 ? '+' : ''}{formatCurrency(stats.dayChange || 0)}</span>
          <span className="kpi-tile__badge kpi-tile__badge--neutral">{(stats.dayChangePercentage || 0).toFixed(2)}%</span>
        </div>
        <div className="kpi-tile kpi-tile--clickable" onClick={() => navigate('/analytics/risk')}>
          <span className="kpi-tile__label">Volatility</span>
          <span className="kpi-tile__value">{(riskMetrics.portfolioVolatility * 100).toFixed(1)}%</span>
          <span className={'kpi-tile__badge ' + (riskMetrics.portfolioVolatility > 0.2 ? 'kpi-tile__badge--warning' : 'kpi-tile__badge--neutral')}>{riskMetrics.riskLevel}</span>
        </div>
        <div className="kpi-tile kpi-tile--clickable" onClick={() => navigate('/analytics/risk')}>
          <span className="kpi-tile__label">Sharpe Ratio</span>
          <span className="kpi-tile__value">{riskMetrics.sharpeRatio.toFixed(2)}</span>
          <span className={'kpi-tile__badge ' + (riskMetrics.sharpeRatio >= 1 ? 'kpi-tile__badge--positive' : 'kpi-tile__badge--neutral')}>{riskMetrics.sharpeRatio >= 1 ? 'Good' : riskMetrics.sharpeRatio >= 0.5 ? 'Fair' : 'Low'}</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-tile__label">Diversification</span>
          <span className="kpi-tile__value">{stats.diversificationScore}<span className="kpi-tile__suffix">/100</span></span>
          <span className={'kpi-tile__badge ' + (stats.diversificationScore >= 70 ? 'kpi-tile__badge--positive' : stats.diversificationScore >= 50 ? 'kpi-tile__badge--warning' : 'kpi-tile__badge--negative')}>{stats.diversificationScore >= 70 ? 'Well diversified' : stats.diversificationScore >= 50 ? 'Moderate' : 'Concentrated'}</span>
        </div>
      </div>

      <div className="overview-main-grid">
        <div className="overview-main-grid__main">
          <section className="data-card">
            <div className="data-card__header">
              <div className="data-card__title-group">
                <h2 className="data-card__title">Positions</h2>
                {hasActiveFilters && (
                  <div className="active-filters">
                    {allocationFilter && <span className="filter-chip">{formatTypeName(allocationFilter)}<button onClick={() => setAllocationFilter(null)}><X size={12} /></button></span>}
                    {sectorFilter && <span className="filter-chip">{sectorFilter}<button onClick={() => setSectorFilter(null)}><X size={12} /></button></span>}
                    <button className="filter-clear" onClick={clearFilters}>Clear all</button>
                  </div>
                )}
              </div>
              <div className="data-card__actions">
                <span className="data-card__count">{filteredHoldings.length} holdings</span>
                <Link to="/portfolios/positions" className="data-card__link">View All <ChevronRight size={14} /></Link>
              </div>
            </div>
            <div className="data-card__body data-card__body--flush">
              <table className="positions-table">
                <thead><tr><th>Symbol</th><th>Market Value</th><th>Weight</th><th>Today P&L</th><th>Total P&L</th><th>Sector</th><th></th></tr></thead>
                <tbody>
                  {filteredHoldings.slice(0, 10).map((holding) => (
                    <tr key={holding.id} className="positions-table__row" onClick={() => handlePositionClick(holding)}>
                      <td><div className="symbol-cell"><span className="symbol-cell__ticker">{holding.symbol}</span><span className="symbol-cell__name">{holding.name}</span></div></td>
                      <td>{formatCurrency(holding.value)}</td>
                      <td><div className="weight-cell"><span>{holding.weight.toFixed(1)}%</span><div className="weight-cell__bar"><div className="weight-cell__fill" style={{ width: Math.min(holding.weight * 2, 100) + '%' }} /></div></div></td>
                      <td className={holding.dayPL >= 0 ? 'text-positive' : 'text-negative'}>{holding.dayPL >= 0 ? '+' : ''}{formatCurrency(holding.dayPL)}</td>
                      <td className={holding.gain >= 0 ? 'text-positive' : 'text-negative'}><div className="pl-cell"><span>{holding.gain >= 0 ? '+' : ''}{formatCurrency(holding.gain)}</span><span className="pl-cell__percent">{holding.gainPercent >= 0 ? '+' : ''}{holding.gainPercent.toFixed(2)}%</span></div></td>
                      <td><button className="sector-tag" onClick={(e) => { e.stopPropagation(); handleSectorClick(holding.sector || 'Other'); }}>{holding.sector || 'Other'}</button></td>
                      <td><ChevronRight size={14} className="row-arrow" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredHoldings.length === 0 && <div className="empty-state"><p>No positions match the current filters</p><button className="btn btn--secondary btn--sm" onClick={clearFilters}>Clear Filters</button></div>}
            </div>
          </section>

          <section className="data-card">
            <div className="data-card__header">
              <h2 className="data-card__title">Recent Transactions</h2>
              <Link to="/portfolios/transactions" className="data-card__link">View All <ChevronRight size={14} /></Link>
            </div>
            <div className="data-card__body data-card__body--flush">
              <div className="transactions-list">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="transaction-item">
                    <div className={'transaction-item__icon transaction-item__icon--' + tx.type}>{tx.type === 'buy' ? <ArrowUpRight size={14} /> : tx.type === 'sell' ? <ArrowDownRight size={14} /> : <Activity size={14} />}</div>
                    <div className="transaction-item__details"><span className="transaction-item__symbol">{tx.investment?.symbol}</span><span className="transaction-item__type">{tx.type.toUpperCase()} • {tx.quantity} shares</span></div>
                    <div className="transaction-item__meta"><span className={'transaction-item__amount ' + (tx.type === 'sell' ? 'text-positive' : tx.type === 'buy' ? 'text-negative' : 'text-info')}>{tx.type === 'sell' ? '+' : tx.type === 'buy' ? '-' : '+'}{formatCurrency(tx.quantity * tx.price)}</span><span className="transaction-item__date">{formatDate(tx.date)}</span></div>
                  </div>
                ))}
                {recentTransactions.length === 0 && <div className="empty-state empty-state--sm"><p>No recent transactions</p></div>}
              </div>
            </div>
          </section>
        </div>

        <div className="overview-main-grid__sidebar">
          <section className="data-card">
            <div className="data-card__header"><h2 className="data-card__title">Asset Allocation</h2></div>
            <div className="data-card__body">
              <div className="allocation-chart-compact">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={allocationByType} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" onClick={(_, index) => handleAllocationClick(allocationByType[index])} style={{ cursor: 'pointer' }}>
                      {allocationByType.map((entry, index) => <Cell key={'cell-' + index} fill={COLORS[index % COLORS.length]} opacity={allocationFilter && allocationFilter !== entry.rawName ? 0.3 : 1} stroke={allocationFilter === entry.rawName ? '#fff' : 'transparent'} strokeWidth={2} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1a1a1d', border: '1px solid #2a2a2e', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="allocation-legend-compact">
                  {allocationByType.map((item, index) => (
                    <button key={item.name} className={'allocation-legend-item ' + (allocationFilter === item.rawName ? 'allocation-legend-item--active' : '')} onClick={() => handleAllocationClick(item)}>
                      <span className="allocation-legend-item__dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="allocation-legend-item__name">{item.name}</span><span className="allocation-legend-item__value">{item.percent.toFixed(1)}%</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="data-card">
            <div className="data-card__header"><h2 className="data-card__title">Sectors</h2></div>
            <div className="data-card__body">
              <div className="sector-list">
                {allocationBySector.slice(0, 6).map((sector, index) => (
                  <button key={sector.name} className={'sector-row ' + (sectorFilter === sector.name ? 'sector-row--active' : '')} onClick={() => handleSectorClick(sector.name)}>
                    <div className="sector-row__info"><span className="sector-row__dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="sector-row__name">{sector.name}</span></div>
                    <div className="sector-row__data"><span className="sector-row__percent">{sector.percent.toFixed(1)}%</span><div className="sector-row__bar"><div className="sector-row__fill" style={{ width: sector.percent + '%', backgroundColor: COLORS[index % COLORS.length] }} /></div></div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="data-card data-card--risk">
            <div className="data-card__header"><h2 className="data-card__title"><Shield size={14} className="data-card__title-icon" />Risk & Alerts</h2><Link to="/analytics/risk" className="data-card__link">Details <ChevronRight size={14} /></Link></div>
            <div className="data-card__body">
              <div className="risk-metrics-grid">
                <div className="risk-metric"><span className="risk-metric__label">Max Position</span><span className={'risk-metric__value ' + (filteredHoldings[0]?.weight > RISK_THRESHOLDS.maxPosition ? 'text-warning' : '')}>{filteredHoldings[0]?.weight.toFixed(1) || 0}%</span></div>
                <div className="risk-metric"><span className="risk-metric__label">Beta</span><span className="risk-metric__value">{riskMetrics.beta.toFixed(2)}</span></div>
                <div className="risk-metric"><span className="risk-metric__label">Max Drawdown</span><span className="risk-metric__value text-negative">-{(riskMetrics.maxDrawdown * 100).toFixed(1)}%</span></div>
                <div className="risk-metric"><span className="risk-metric__label">VaR (95%)</span><span className="risk-metric__value">{formatCurrency(riskMetrics.valueAtRisk)}</span></div>
              </div>
              {riskAlerts.length > 0 && (
                <div className="alerts-section">
                  <h3 className="alerts-section__title"><Bell size={12} /> Active Alerts ({riskAlerts.length})</h3>
                  <div className="alerts-list">
                    {riskAlerts.map(alert => <Link key={alert.id} to={alert.action || '/alerts'} className={'alert-item alert-item--' + alert.type}><AlertTriangle size={12} /><span className="alert-item__message">{alert.message}</span><ExternalLink size={12} className="alert-item__arrow" /></Link>)}
                  </div>
                </div>
              )}
              {riskAlerts.length === 0 && <div className="alerts-empty"><Shield size={20} /><span>No active risk alerts</span></div>}
            </div>
          </section>
        </div>
      </div>

      {showAddModal && <AddInvestmentModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

function formatTypeName(type: string): string {
  const names: Record<string, string> = { stock: 'Stocks', etf: 'ETFs', bond: 'Bonds', crypto: 'Crypto', 'mutual-fund': 'Mutual Funds', other: 'Other' };
  return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: value >= 1000 ? 0 : 2 }).format(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return diffDays + 'd ago';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function AddInvestmentModal({ onClose }: { onClose: () => void }) {
  const { addInvestment } = usePortfolio();
  const [form, setForm] = useState<{ symbol: string; name: string; type: 'stock' | 'etf' | 'bond' | 'crypto' | 'mutual-fund' | 'other'; quantity: string; purchasePrice: string; purchaseDate: string; sector: string; }>({
    symbol: '', name: '', type: 'stock', quantity: '', purchasePrice: '', purchaseDate: new Date().toISOString().split('T')[0], sector: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInvestment({ symbol: form.symbol.toUpperCase(), name: form.name, type: form.type, quantity: parseFloat(form.quantity), purchasePrice: parseFloat(form.purchasePrice), purchaseDate: form.purchaseDate, sector: form.sector || undefined });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--sm" onClick={e => e.stopPropagation()}>
        <div className="modal__header"><h2 className="modal__title">Add Investment</h2><button className="modal__close" onClick={onClose}><X size={18} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="form-row"><div className="form-group"><label className="form-label">Symbol</label><input className="form-input" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="AAPL" required /></div><div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Apple Inc." required /></div></div>
            <div className="form-row"><div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as typeof form.type })}><option value="stock">Stock</option><option value="etf">ETF</option><option value="bond">Bond</option><option value="crypto">Crypto</option><option value="mutual-fund">Mutual Fund</option><option value="other">Other</option></select></div><div className="form-group"><label className="form-label">Sector</label><input className="form-input" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="Technology" /></div></div>
            <div className="form-row"><div className="form-group"><label className="form-label">Quantity</label><input type="number" step="any" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="100" required /></div><div className="form-group"><label className="form-label">Purchase Price</label><input type="number" step="0.01" className="form-input" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} placeholder="150.00" required /></div></div>
            <div className="form-group"><label className="form-label">Purchase Date</label><input type="date" className="form-input" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} required /></div>
          </div>
          <div className="modal__footer"><button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button><button type="submit" className="btn btn--primary">Add Investment</button></div>
        </form>
      </div>
    </div>
  );
}
