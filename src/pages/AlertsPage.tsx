/**
 * Alerts Page
 * 
 * Manage price alerts and notifications
 */

import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Check, X, TrendingUp, TrendingDown, AlertTriangle, BellOff } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import './pages.css';

interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  type: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  enabled: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
  notes?: string;
}

// Sample alerts
const INITIAL_ALERTS: PriceAlert[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', type: 'above', targetPrice: 200, currentPrice: 178.50, enabled: true, triggered: false, createdAt: '2024-02-01', notes: 'New ATH target' },
  { id: '2', symbol: 'TSLA', name: 'Tesla Inc.', type: 'below', targetPrice: 200, currentPrice: 248.50, enabled: true, triggered: false, createdAt: '2024-02-05', notes: 'Buy zone' },
  { id: '3', symbol: 'NVDA', name: 'NVIDIA Corp', type: 'above', targetPrice: 800, currentPrice: 875.30, enabled: false, triggered: true, triggeredAt: '2024-02-10', createdAt: '2024-01-15' },
  { id: '4', symbol: 'AMD', name: 'Advanced Micro', type: 'below', targetPrice: 150, currentPrice: 178.30, enabled: true, triggered: false, createdAt: '2024-02-08' },
];

export default function AlertsPage() {
  const { investments } = usePortfolio();
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    const saved = localStorage.getItem('priceAlerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'triggered'>('all');

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('priceAlerts', JSON.stringify(alerts));
  }, [alerts]);

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return alert.enabled && !alert.triggered;
    if (filter === 'triggered') return alert.triggered;
    return true;
  });

  const activeAlerts = alerts.filter(a => a.enabled && !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  const handleAddAlert = (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const newAlert: PriceAlert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      triggered: false,
    };
    setAlerts([newAlert, ...alerts]);
    setShowAddModal(false);
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const clearTriggered = () => {
    setAlerts(alerts.filter(a => !a.triggered));
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Price Alerts</h1>
          <p className="page__subtitle">
            {activeAlerts.length} active • {triggeredAlerts.length} triggered
          </p>
        </div>
        <div className="page__actions">
          {triggeredAlerts.length > 0 && (
            <button className="btn" onClick={clearTriggered}>
              <Check size={16} />
              Clear Triggered
            </button>
          )}
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            New Alert
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="alert-stats">
        <div className="stat-card">
          <div className="stat-card__icon" style={{ backgroundColor: 'rgba(88, 166, 255, 0.1)', color: '#58a6ff' }}>
            <Bell size={20} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{alerts.length}</span>
            <span className="stat-card__label">Total Alerts</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ backgroundColor: 'rgba(63, 185, 80, 0.1)', color: '#3fb950' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{activeAlerts.filter(a => a.type === 'above').length}</span>
            <span className="stat-card__label">Price Above</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ backgroundColor: 'rgba(248, 81, 73, 0.1)', color: '#f85149' }}>
            <TrendingDown size={20} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{activeAlerts.filter(a => a.type === 'below').length}</span>
            <span className="stat-card__label">Price Below</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ backgroundColor: 'rgba(210, 153, 34, 0.1)', color: '#d29922' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{triggeredAlerts.length}</span>
            <span className="stat-card__label">Triggered</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({activeAlerts.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'triggered' ? 'active' : ''}`}
          onClick={() => setFilter('triggered')}
        >
          Triggered ({triggeredAlerts.length})
        </button>
      </div>

      {/* Alerts List */}
      <div className="alerts-list">
        {filteredAlerts.map(alert => {
          const distance = alert.type === 'above'
            ? ((alert.targetPrice - alert.currentPrice) / alert.currentPrice) * 100
            : ((alert.currentPrice - alert.targetPrice) / alert.currentPrice) * 100;
          
          return (
            <div 
              key={alert.id} 
              className={`alert-card ${alert.triggered ? 'triggered' : ''} ${!alert.enabled ? 'disabled' : ''}`}
            >
              <div className="alert-card__header">
                <div className="alert-card__symbol">
                  <span className={`alert-type-icon ${alert.type}`}>
                    {alert.type === 'above' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </span>
                  <div>
                    <span className="symbol">{alert.symbol}</span>
                    <span className="name">{alert.name}</span>
                  </div>
                </div>
                <div className="alert-card__actions">
                  <button 
                    className={`icon-btn ${alert.enabled ? '' : 'off'}`}
                    onClick={() => toggleAlert(alert.id)}
                    title={alert.enabled ? 'Disable' : 'Enable'}
                  >
                    {alert.enabled ? <Bell size={16} /> : <BellOff size={16} />}
                  </button>
                  <button 
                    className="icon-btn danger"
                    onClick={() => deleteAlert(alert.id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="alert-card__body">
                <div className="alert-prices">
                  <div className="price-item">
                    <span className="label">Current</span>
                    <span className="value">${alert.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="price-arrow">
                    {alert.type === 'above' ? '→' : '→'}
                  </div>
                  <div className="price-item target">
                    <span className="label">Target ({alert.type})</span>
                    <span className="value">${alert.targetPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="alert-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${alert.triggered ? 'complete' : ''}`}
                      style={{ width: `${Math.min(100, Math.max(0, 100 - distance))}%` }}
                    />
                  </div>
                  <span className={`distance ${distance <= 5 ? 'close' : ''}`}>
                    {alert.triggered ? 'Triggered!' : `${distance.toFixed(1)}% away`}
                  </span>
                </div>

                {alert.notes && (
                  <p className="alert-notes">{alert.notes}</p>
                )}
              </div>

              <div className="alert-card__footer">
                <span className="created-date">
                  Created {new Date(alert.createdAt).toLocaleDateString()}
                </span>
                {alert.triggered && alert.triggeredAt && (
                  <span className="triggered-date">
                    Triggered {new Date(alert.triggeredAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="empty-state">
          <Bell size={48} />
          <h3>No alerts found</h3>
          <p>Create price alerts to get notified when stocks hit your targets</p>
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Create Alert
          </button>
        </div>
      )}

      {/* Add Alert Modal */}
      {showAddModal && (
        <AddAlertModal
          investments={investments}
          onAdd={handleAddAlert}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function AddAlertModal({
  investments,
  onAdd,
  onClose,
}: {
  investments: { symbol: string; name: string; currentPrice: number }[];
  onAdd: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    symbol: '',
    name: '',
    type: 'above' as const,
    targetPrice: '',
    currentPrice: '',
    enabled: true,
    notes: '',
  });

  const handleInvestmentSelect = (symbol: string) => {
    const investment = investments.find(i => i.symbol === symbol);
    if (investment) {
      setForm({
        ...form,
        symbol: investment.symbol,
        name: investment.name,
        currentPrice: investment.currentPrice.toString(),
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      type: form.type,
      targetPrice: parseFloat(form.targetPrice),
      currentPrice: parseFloat(form.currentPrice),
      enabled: form.enabled,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Create Price Alert</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="form-group">
              <label className="form-label">Select from Portfolio</label>
              <select
                className="form-select"
                value={form.symbol}
                onChange={e => handleInvestmentSelect(e.target.value)}
              >
                <option value="">-- Select or enter manually --</option>
                {investments.map(inv => (
                  <option key={inv.symbol} value={inv.symbol}>
                    {inv.symbol} - {inv.name}
                  </option>
                ))}
              </select>
            </div>

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
                <label className="form-label">Company Name</label>
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
                <label className="form-label">Alert Type</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as 'above' | 'below' })}
                >
                  <option value="above">Price Goes Above</option>
                  <option value="below">Price Goes Below</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.targetPrice}
                  onChange={e => setForm({ ...form, targetPrice: e.target.value })}
                  placeholder="200.00"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Current Price</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={form.currentPrice}
                onChange={e => setForm({ ...form, currentPrice: e.target.value })}
                placeholder="175.00"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Why are you setting this alert?"
                rows={2}
              />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Create Alert</button>
          </div>
        </form>
      </div>
    </div>
  );
}
