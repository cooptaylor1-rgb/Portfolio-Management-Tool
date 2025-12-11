/**
 * Watchlist Page
 * 
 * Monitor potential investments and track market opportunities
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Star, Search, Bell, ExternalLink } from 'lucide-react';
import './pages.css';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  targetPrice?: number;
  notes?: string;
  alertEnabled: boolean;
  addedAt: string;
}

// Sample watchlist data
const INITIAL_WATCHLIST: WatchlistItem[] = [
  { id: '1', symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: 5.20, changePercent: 2.14, targetPrice: 300, notes: 'Watching for EV demand recovery', alertEnabled: true, addedAt: '2024-01-15' },
  { id: '2', symbol: 'AMD', name: 'Advanced Micro Devices', price: 178.30, change: -2.40, changePercent: -1.33, targetPrice: 200, alertEnabled: true, addedAt: '2024-01-20' },
  { id: '3', symbol: 'SHOP', name: 'Shopify Inc.', price: 78.90, change: 1.50, changePercent: 1.94, notes: 'E-commerce growth play', alertEnabled: false, addedAt: '2024-02-01' },
  { id: '4', symbol: 'SQ', name: 'Block Inc.', price: 68.20, change: -0.80, changePercent: -1.16, targetPrice: 85, alertEnabled: false, addedAt: '2024-02-10' },
  { id: '5', symbol: 'PLTR', name: 'Palantir Technologies', price: 22.40, change: 0.60, changePercent: 2.75, notes: 'AI/Data analytics potential', alertEnabled: true, addedAt: '2024-02-15' },
  { id: '6', symbol: 'COIN', name: 'Coinbase Global', price: 185.60, change: 8.30, changePercent: 4.68, alertEnabled: false, addedAt: '2024-02-20' },
];

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : INITIAL_WATCHLIST;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const filteredWatchlist = watchlist.filter(item =>
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (item: Omit<WatchlistItem, 'id' | 'addedAt'>) => {
    const newItem: WatchlistItem = {
      ...item,
      id: Date.now().toString(),
      addedAt: new Date().toISOString().split('T')[0],
    };
    setWatchlist([newItem, ...watchlist]);
    setShowAddModal(false);
  };

  const handleUpdateItem = (item: WatchlistItem) => {
    setWatchlist(watchlist.map(w => w.id === item.id ? item : w));
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    setWatchlist(watchlist.filter(w => w.id !== id));
  };

  const toggleAlert = (id: string) => {
    setWatchlist(watchlist.map(w => 
      w.id === id ? { ...w, alertEnabled: !w.alertEnabled } : w
    ));
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Watchlist</h1>
          <p className="page__subtitle">{watchlist.length} securities tracked</p>
        </div>
        <div className="page__actions">
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Symbol
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="page__filters">
        <div className="search-input">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Watchlist Grid */}
      <div className="watchlist-grid">
        {filteredWatchlist.map(item => (
          <div key={item.id} className="watchlist-card">
            <div className="watchlist-card__header">
              <div className="watchlist-card__title">
                <Star size={16} className="watchlist-star" />
                <span className="watchlist-symbol">{item.symbol}</span>
                <a 
                  href={`https://finance.yahoo.com/quote/${item.symbol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="watchlist-external"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className="watchlist-card__actions">
                <button 
                  className={`icon-btn ${item.alertEnabled ? 'active' : ''}`}
                  onClick={() => toggleAlert(item.id)}
                  title={item.alertEnabled ? 'Alerts enabled' : 'Enable alerts'}
                >
                  <Bell size={16} />
                </button>
                <button 
                  className="icon-btn danger"
                  onClick={() => handleDeleteItem(item.id)}
                  title="Remove from watchlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <p className="watchlist-card__name">{item.name}</p>
            
            <div className="watchlist-card__price">
              <span className="price-value">${item.price.toFixed(2)}</span>
              <span className={`price-change ${item.change >= 0 ? 'positive' : 'negative'}`}>
                {item.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
              </span>
            </div>

            {item.targetPrice && (
              <div className="watchlist-card__target">
                <span className="target-label">Target:</span>
                <span className="target-value">${item.targetPrice}</span>
                <span className={`target-diff ${item.targetPrice > item.price ? 'positive' : 'negative'}`}>
                  ({((item.targetPrice - item.price) / item.price * 100).toFixed(1)}%)
                </span>
              </div>
            )}

            {item.notes && (
              <p className="watchlist-card__notes">{item.notes}</p>
            )}

            <div className="watchlist-card__footer">
              <span className="added-date">Added {new Date(item.addedAt).toLocaleDateString()}</span>
              <button 
                className="btn btn--small"
                onClick={() => setEditingItem(item)}
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredWatchlist.length === 0 && (
        <div className="empty-state">
          <Star size={48} />
          <h3>No items in watchlist</h3>
          <p>Add symbols to track potential investments</p>
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Symbol
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <WatchlistModal
          item={editingItem}
          onSave={editingItem ? handleUpdateItem : handleAddItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

function WatchlistModal({
  item,
  onSave,
  onClose,
}: {
  item: WatchlistItem | null;
  onSave: (item: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    symbol: item?.symbol || '',
    name: item?.name || '',
    price: item?.price?.toString() || '',
    change: item?.change?.toString() || '0',
    changePercent: item?.changePercent?.toString() || '0',
    targetPrice: item?.targetPrice?.toString() || '',
    notes: item?.notes || '',
    alertEnabled: item?.alertEnabled ?? false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(item || {}),
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      price: parseFloat(form.price),
      change: parseFloat(form.change),
      changePercent: parseFloat(form.changePercent),
      targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : undefined,
      notes: form.notes || undefined,
      alertEnabled: form.alertEnabled,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{item ? 'Edit' : 'Add'} Watchlist Item</h2>
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
                  disabled={!!item}
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
                <label className="form-label">Current Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="150.00"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Price (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.targetPrice}
                  onChange={e => setForm({ ...form, targetPrice: e.target.value })}
                  placeholder="180.00"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Why are you watching this stock?"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={form.alertEnabled}
                  onChange={e => setForm({ ...form, alertEnabled: e.target.checked })}
                />
                Enable price alerts
              </label>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">
              {item ? 'Update' : 'Add to Watchlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
