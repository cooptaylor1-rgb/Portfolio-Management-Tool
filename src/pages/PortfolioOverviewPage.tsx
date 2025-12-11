/**
 * Portfolio Overview Page
 * 
 * Comprehensive portfolio summary with:
 * - Asset allocation pie chart
 * - Sector breakdown
 * - Holdings summary table
 * - Add investment modal
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, ChevronRight, Briefcase } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { usePortfolio } from '../contexts/PortfolioContext';
import { KPICard, KPIGrid } from '../components/ui';
import { useShell } from '../layouts';
import './pages.css';

const COLORS = ['#58a6ff', '#3fb950', '#a855f7', '#f97316', '#ec4899', '#14b8a6', '#eab308', '#6366f1'];

export default function PortfolioOverviewPage() {
  const { investments, stats } = usePortfolio();
  const { openDetailsPanel } = useShell();
  const [showAddModal, setShowAddModal] = useState(false);

  // Calculate allocation by type
  const allocationByType = useMemo(() => {
    const totals: Record<string, number> = {};
    investments.forEach(inv => {
      const value = inv.quantity * inv.currentPrice;
      totals[inv.type] = (totals[inv.type] || 0) + value;
    });
    return Object.entries(totals).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percent: (value / stats.totalValue) * 100,
    })).sort((a, b) => b.value - a.value);
  }, [investments, stats.totalValue]);

  // Calculate allocation by sector
  const allocationBySector = useMemo(() => {
    const totals: Record<string, number> = {};
    investments.forEach(inv => {
      const sector = inv.sector || 'Other';
      const value = inv.quantity * inv.currentPrice;
      totals[sector] = (totals[sector] || 0) + value;
    });
    return Object.entries(totals).map(([name, value]) => ({
      name,
      value,
      percent: (value / stats.totalValue) * 100,
    })).sort((a, b) => b.value - a.value);
  }, [investments, stats.totalValue]);

  // Top holdings
  const topHoldings = useMemo(() => {
    return [...investments]
      .map(inv => ({
        ...inv,
        value: inv.quantity * inv.currentPrice,
        weight: (inv.quantity * inv.currentPrice / stats.totalValue) * 100,
        gain: ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [investments, stats.totalValue]);

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Portfolio Overview</h1>
          <p className="page__subtitle">
            {investments.length} holdings • Last updated just now
          </p>
        </div>
        <div className="page__actions">
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Investment
          </button>
        </div>
      </div>

      {/* KPIs */}
      <KPIGrid columns={4}>
        <KPICard
          label="Total Value"
          value={stats.totalValue}
          format="currency"
          change={stats.dayChangePercentage}
          changeLabel="today"
        />
        <KPICard
          label="Total Gain/Loss"
          value={stats.totalGainLoss}
          format="currency"
          change={stats.gainLossPercentage}
          variant={stats.totalGainLoss >= 0 ? 'highlight' : 'danger'}
        />
        <KPICard
          label="Day Change"
          value={stats.dayChange || 0}
          format="currency"
          change={stats.dayChangePercentage}
        />
        <KPICard
          label="Diversification"
          value={stats.diversificationScore}
          suffix="/100"
        />
      </KPIGrid>

      <div className="overview-grid">
        {/* Asset Allocation */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Asset Allocation</h2>
          </div>
          <div className="card__body">
            <div className="allocation-chart">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={allocationByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {allocationByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: '#161b22',
                      border: '1px solid #30363d',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="allocation-legend">
              {allocationByType.map((item, index) => (
                <div key={item.name} className="allocation-legend__item">
                  <span 
                    className="allocation-legend__dot" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                  />
                  <span className="allocation-legend__name">{item.name}</span>
                  <span className="allocation-legend__value">{item.percent.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sector Breakdown */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Sector Breakdown</h2>
          </div>
          <div className="card__body">
            <div className="sector-bars">
              {allocationBySector.map((sector, index) => (
                <div key={sector.name} className="sector-bar">
                  <div className="sector-bar__header">
                    <span className="sector-bar__name">{sector.name}</span>
                    <span className="sector-bar__value">
                      ${(sector.value / 1000).toFixed(0)}K ({sector.percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="sector-bar__track">
                    <div 
                      className="sector-bar__fill"
                      style={{ 
                        width: `${sector.percent}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Holdings */}
        <section className="card overview-holdings">
          <div className="card__header">
            <h2 className="card__title">Top Holdings</h2>
            <Link to="/portfolios/positions" className="card__link">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card__body card__body--flush">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Value</th>
                  <th>Weight</th>
                  <th>Return</th>
                </tr>
              </thead>
              <tbody>
                {topHoldings.map((holding) => (
                  <tr 
                    key={holding.id}
                    onClick={() => openDetailsPanel({
                      type: 'position',
                      data: {
                        symbol: holding.symbol,
                        name: holding.name,
                        quantity: holding.quantity,
                        price: holding.currentPrice,
                        value: holding.value,
                        costBasis: holding.quantity * holding.purchasePrice,
                        gain: holding.value - (holding.quantity * holding.purchasePrice),
                        gainPercent: holding.gain,
                        dayChange: holding.dayChange || 0,
                        dayChangePercent: holding.dayChangePercent || 0,
                        weight: holding.weight,
                        sector: holding.sector,
                      }
                    })}
                  >
                    <td>
                      <div className="holding-symbol">
                        <span className="holding-ticker">{holding.symbol}</span>
                        <span className="holding-name">{holding.name}</span>
                      </div>
                    </td>
                    <td>${holding.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td>{holding.weight.toFixed(1)}%</td>
                    <td className={holding.gain >= 0 ? 'text-positive' : 'text-negative'}>
                      {holding.gain >= 0 ? '+' : ''}{holding.gain.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Performance Summary */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Performance Summary</h2>
          </div>
          <div className="card__body">
            <div className="performance-stats">
              <div className="performance-stat">
                <div className="performance-stat__icon positive">
                  <TrendingUp size={20} />
                </div>
                <div className="performance-stat__content">
                  <span className="performance-stat__label">Best Performer</span>
                  <span className="performance-stat__value">
                    {stats.bestPerformer?.name || 'N/A'}
                  </span>
                  <span className="performance-stat__change positive">
                    +{stats.bestPerformer?.percentage.toFixed(2) || 0}%
                  </span>
                </div>
              </div>
              <div className="performance-stat">
                <div className="performance-stat__icon negative">
                  <TrendingDown size={20} />
                </div>
                <div className="performance-stat__content">
                  <span className="performance-stat__label">Worst Performer</span>
                  <span className="performance-stat__value">
                    {stats.worstPerformer?.name || 'N/A'}
                  </span>
                  <span className="performance-stat__change negative">
                    {stats.worstPerformer?.percentage.toFixed(2) || 0}%
                  </span>
                </div>
              </div>
              <div className="performance-stat">
                <div className="performance-stat__icon neutral">
                  <Briefcase size={20} />
                </div>
                <div className="performance-stat__content">
                  <span className="performance-stat__label">Average Return</span>
                  <span className="performance-stat__value">All Holdings</span>
                  <span className={`performance-stat__change ${stats.averageReturn >= 0 ? 'positive' : 'negative'}`}>
                    {stats.averageReturn >= 0 ? '+' : ''}{stats.averageReturn.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Add Investment Modal */}
      {showAddModal && (
        <AddInvestmentModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

function AddInvestmentModal({ onClose }: { onClose: () => void }) {
  const { addInvestment } = usePortfolio();
  const [form, setForm] = useState({
    symbol: '',
    name: '',
    type: 'stock' as const,
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    sector: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInvestment({
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      type: form.type,
      quantity: parseFloat(form.quantity),
      purchasePrice: parseFloat(form.purchasePrice),
      currentPrice: parseFloat(form.currentPrice || form.purchasePrice),
      purchaseDate: form.purchaseDate,
      sector: form.sector || undefined,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Add Investment</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Symbol</label>
                <input
                  className="form-input"
                  value={form.symbol}
                  onChange={e => setForm({ ...form, symbol: e.target.value })}
                  placeholder="AAPL"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Apple Inc."
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as 'stock' | 'etf' | 'bond' | 'crypto' | 'mutual-fund' | 'other' })}
                >
                  <option value="stock">Stock</option>
                  <option value="etf">ETF</option>
                  <option value="bond">Bond</option>
                  <option value="crypto">Crypto</option>
                  <option value="mutual-fund">Mutual Fund</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sector</label>
                <input
                  className="form-input"
                  value={form.sector}
                  onChange={e => setForm({ ...form, sector: e.target.value })}
                  placeholder="Technology"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  placeholder="100"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.purchasePrice}
                  onChange={e => setForm({ ...form, purchasePrice: e.target.value })}
                  placeholder="150.00"
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Current Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.currentPrice}
                  onChange={e => setForm({ ...form, currentPrice: e.target.value })}
                  placeholder="175.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.purchaseDate}
                  onChange={e => setForm({ ...form, purchaseDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Add Investment</button>
          </div>
        </form>
      </div>
    </div>
  );
}
