/**
 * Watchlist Page - Palantir-Grade Securities Monitor
 * 
 * Dense, actionable watchlist with:
 * - Table view with sortable columns
 * - Visual target/upside indicators
 * - Quick-add with autocomplete
 * - Alert management
 * - Thesis tags and conviction levels
 * - Sparkline price trends
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Search, 
  Bell,
  BellOff,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  ChevronDown,
  Target,
  AlertTriangle,
  Check,
  X,
  Edit3,
  Eye,
  Zap,
} from 'lucide-react';
import './pages.css';

// ============================================================================
// Types
// ============================================================================

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  targetPrice?: number;
  stopLoss?: number;
  notes?: string;
  thesis?: string[];
  conviction: 'high' | 'medium' | 'low';
  alertEnabled: boolean;
  alertPrice?: number;
  alertType?: 'above' | 'below';
  addedAt: string;
  sector?: string;
  marketCap?: string;
  volume?: number;
  avgVolume?: number;
  priceHistory?: number[]; // Last 7 days for sparkline
}

type SortField = 'symbol' | 'price' | 'change' | 'changePercent' | 'upside' | 'conviction' | 'addedAt';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// Constants
// ============================================================================

const THESIS_TAGS = [
  'Value', 'Growth', 'Momentum', 'Quality', 'Turnaround', 
  'Catalyst', 'Dividend', 'Special Situation', 'Short'
];

const CONVICTION_LEVELS = [
  { value: 'high', label: 'High', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'low', label: 'Low', color: '#6b7280' },
];

// Enhanced sample data
const INITIAL_WATCHLIST: WatchlistItem[] = [
  { 
    id: '1', 
    symbol: 'TSLA', 
    name: 'Tesla Inc.', 
    price: 248.50, 
    previousClose: 243.30,
    change: 5.20, 
    changePercent: 2.14, 
    targetPrice: 300, 
    stopLoss: 220,
    notes: 'Watching for EV demand recovery. FSD progress key catalyst.', 
    thesis: ['Growth', 'Catalyst'],
    conviction: 'high',
    alertEnabled: true, 
    alertPrice: 260,
    alertType: 'above',
    addedAt: '2024-01-15',
    sector: 'Automotive',
    marketCap: '$790B',
    volume: 45_200_000,
    avgVolume: 52_000_000,
    priceHistory: [235, 238, 242, 240, 245, 243, 248],
  },
  { 
    id: '2', 
    symbol: 'AMD', 
    name: 'Advanced Micro Devices', 
    price: 178.30, 
    previousClose: 180.70,
    change: -2.40, 
    changePercent: -1.33, 
    targetPrice: 200, 
    stopLoss: 160,
    notes: 'AI chip competition heating up. Data center growth strong.',
    thesis: ['Growth', 'Momentum'],
    conviction: 'high',
    alertEnabled: true, 
    alertPrice: 170,
    alertType: 'below',
    addedAt: '2024-01-20',
    sector: 'Semiconductors',
    marketCap: '$288B',
    volume: 38_500_000,
    avgVolume: 42_000_000,
    priceHistory: [172, 175, 180, 178, 182, 180, 178],
  },
  { 
    id: '3', 
    symbol: 'SHOP', 
    name: 'Shopify Inc.', 
    price: 78.90, 
    previousClose: 77.40,
    change: 1.50, 
    changePercent: 1.94, 
    targetPrice: 95,
    notes: 'E-commerce growth play. Enterprise adoption accelerating.',
    thesis: ['Growth', 'Quality'],
    conviction: 'medium',
    alertEnabled: false, 
    addedAt: '2024-02-01',
    sector: 'Software',
    marketCap: '$99B',
    volume: 12_300_000,
    avgVolume: 15_000_000,
    priceHistory: [74, 75, 76, 78, 77, 77, 79],
  },
  { 
    id: '4', 
    symbol: 'SQ', 
    name: 'Block Inc.', 
    price: 68.20, 
    previousClose: 69.00,
    change: -0.80, 
    changePercent: -1.16, 
    targetPrice: 85,
    stopLoss: 60,
    notes: 'Fintech consolidation opportunity. Cash App growth solid.',
    thesis: ['Value', 'Turnaround'],
    conviction: 'medium',
    alertEnabled: false, 
    addedAt: '2024-02-10',
    sector: 'Fintech',
    marketCap: '$41B',
    volume: 8_200_000,
    avgVolume: 9_500_000,
    priceHistory: [65, 66, 68, 67, 69, 69, 68],
  },
  { 
    id: '5', 
    symbol: 'PLTR', 
    name: 'Palantir Technologies', 
    price: 22.40, 
    previousClose: 21.80,
    change: 0.60, 
    changePercent: 2.75, 
    targetPrice: 28,
    notes: 'AI/Data analytics potential. Government contracts stable base.',
    thesis: ['Growth', 'Catalyst', 'Quality'],
    conviction: 'high',
    alertEnabled: true,
    alertPrice: 25,
    alertType: 'above', 
    addedAt: '2024-02-15',
    sector: 'Software',
    marketCap: '$47B',
    volume: 52_000_000,
    avgVolume: 48_000_000,
    priceHistory: [20, 21, 21, 22, 21, 22, 22],
  },
  { 
    id: '6', 
    symbol: 'COIN', 
    name: 'Coinbase Global', 
    price: 185.60, 
    previousClose: 177.30,
    change: 8.30, 
    changePercent: 4.68,
    notes: 'Crypto infrastructure play. Regulatory clarity improving.',
    thesis: ['Momentum', 'Special Situation'],
    conviction: 'low',
    alertEnabled: false, 
    addedAt: '2024-02-20',
    sector: 'Crypto',
    marketCap: '$44B',
    volume: 18_500_000,
    avgVolume: 14_000_000,
    priceHistory: [165, 170, 175, 172, 178, 177, 186],
  },
];

// ============================================================================
// Sparkline Component
// ============================================================================

function Sparkline({ data, positive }: { data?: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="sparkline">
      <polyline
        fill="none"
        stroke={positive ? 'var(--color-positive, #10b981)' : 'var(--color-negative, #ef4444)'}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function WatchlistPage() {
  // State
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('watchlist_v2');
      return saved ? JSON.parse(saved) : INITIAL_WATCHLIST;
    } catch {
      return INITIAL_WATCHLIST;
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [convictionFilter, setConvictionFilter] = useState<string | null>(null);
  const [thesisFilter, setThesisFilter] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('watchlist_v2', JSON.stringify(watchlist));
    } catch {
      // localStorage not available
    }
  }, [watchlist]);

  // Computed values
  const stats = useMemo(() => {
    const withAlerts = watchlist.filter(w => w.alertEnabled).length;
    const highConviction = watchlist.filter(w => w.conviction === 'high').length;
    const avgUpside = watchlist
      .filter(w => w.targetPrice)
      .reduce((acc, w) => acc + ((w.targetPrice! - w.price) / w.price) * 100, 0) / 
      (watchlist.filter(w => w.targetPrice).length || 1);
    const positiveToday = watchlist.filter(w => w.change >= 0).length;
    
    return { withAlerts, highConviction, avgUpside, positiveToday };
  }, [watchlist]);

  // Filtered and sorted list
  const filteredWatchlist = useMemo(() => {
    let filtered = [...watchlist];

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.symbol.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.notes?.toLowerCase().includes(term) ||
        item.sector?.toLowerCase().includes(term)
      );
    }

    // Conviction filter
    if (convictionFilter) {
      filtered = filtered.filter(item => item.conviction === convictionFilter);
    }

    // Thesis filter
    if (thesisFilter) {
      filtered = filtered.filter(item => item.thesis?.includes(thesisFilter));
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'symbol':
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'change':
          aVal = a.change;
          bVal = b.change;
          break;
        case 'changePercent':
          aVal = a.changePercent;
          bVal = b.changePercent;
          break;
        case 'upside':
          aVal = a.targetPrice ? ((a.targetPrice - a.price) / a.price) : -999;
          bVal = b.targetPrice ? ((b.targetPrice - b.price) / b.price) : -999;
          break;
        case 'conviction':
          const convOrder = { high: 3, medium: 2, low: 1 };
          aVal = convOrder[a.conviction];
          bVal = convOrder[b.conviction];
          break;
        case 'addedAt':
          aVal = new Date(a.addedAt).getTime();
          bVal = new Date(b.addedAt).getTime();
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return filtered;
  }, [watchlist, searchTerm, sortField, sortDirection, convictionFilter, thesisFilter]);

  // Handlers
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  const handleAddItem = useCallback((item: Omit<WatchlistItem, 'id' | 'addedAt'>) => {
    const newItem: WatchlistItem = {
      ...item,
      id: Date.now().toString(),
      addedAt: new Date().toISOString().split('T')[0],
    };
    setWatchlist(prev => [newItem, ...prev]);
    setShowAddModal(false);
  }, []);

  const handleUpdateItem = useCallback((item: WatchlistItem) => {
    setWatchlist(prev => prev.map(w => w.id === item.id ? item : w));
    setEditingItem(null);
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setWatchlist(prev => prev.filter(w => w.id !== id));
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedItems.size === 0) return;
    if (window.confirm(`Delete ${selectedItems.size} selected items?`)) {
      setWatchlist(prev => prev.filter(w => !selectedItems.has(w.id)));
      setSelectedItems(new Set());
    }
  }, [selectedItems]);

  const toggleAlert = useCallback((id: string) => {
    setWatchlist(prev => prev.map(w => 
      w.id === id ? { ...w, alertEnabled: !w.alertEnabled } : w
    ));
  }, []);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedItems.size === filteredWatchlist.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredWatchlist.map(w => w.id)));
    }
  }, [filteredWatchlist, selectedItems.size]);

  const exportCSV = useCallback(() => {
    const headers = ['Symbol', 'Name', 'Price', 'Change', 'Change %', 'Target', 'Upside %', 'Stop Loss', 'Conviction', 'Thesis', 'Notes', 'Added'];
    const rows = filteredWatchlist.map(item => [
      item.symbol,
      `"${item.name}"`,
      item.price.toFixed(2),
      item.change.toFixed(2),
      item.changePercent.toFixed(2),
      item.targetPrice?.toFixed(2) || '',
      item.targetPrice ? ((item.targetPrice - item.price) / item.price * 100).toFixed(1) : '',
      item.stopLoss?.toFixed(2) || '',
      item.conviction,
      `"${item.thesis?.join(', ') || ''}"`,
      `"${item.notes?.replace(/"/g, '""') || ''}"`,
      item.addedAt,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredWatchlist]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setConvictionFilter(null);
    setThesisFilter(null);
  }, []);

  const hasFilters = searchTerm || convictionFilter || thesisFilter;

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="sort-icon sort-icon--inactive" />;
    return sortDirection === 'asc' 
      ? <ArrowUp size={12} className="sort-icon sort-icon--active" />
      : <ArrowDown size={12} className="sort-icon sort-icon--active" />;
  };

  return (
    <div className="page watchlist-page">
      {/* Header */}
      <header className="watchlist-header">
        <div className="watchlist-header__left">
          <h1 className="watchlist-header__title">Watchlist</h1>
          <div className="watchlist-header__stats">
            <span className="watchlist-stat">
              <Eye size={14} />
              {watchlist.length} securities
            </span>
            <span className="watchlist-stat watchlist-stat--highlight">
              <Zap size={14} />
              {stats.highConviction} high conviction
            </span>
            <span className="watchlist-stat">
              <Bell size={14} />
              {stats.withAlerts} alerts
            </span>
            <span className={`watchlist-stat ${stats.avgUpside >= 0 ? 'watchlist-stat--positive' : 'watchlist-stat--negative'}`}>
              <Target size={14} />
              {stats.avgUpside >= 0 ? '+' : ''}{stats.avgUpside.toFixed(1)}% avg upside
            </span>
          </div>
        </div>
        <div className="watchlist-header__right">
          <button className="btn btn--secondary btn--sm" onClick={exportCSV}>
            <Download size={14} />
            Export
          </button>
          <button className="btn btn--primary btn--sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} />
            Add Symbol
          </button>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="watchlist-filters">
        <div className="watchlist-filters__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search symbols, names, notes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="watchlist-filters__group">
          <div className="filter-dropdown">
            <button className={`filter-btn ${convictionFilter ? 'filter-btn--active' : ''}`}>
              <Filter size={14} />
              Conviction
              <ChevronDown size={14} />
            </button>
            <div className="filter-dropdown__menu">
              <button 
                className={`filter-option ${!convictionFilter ? 'filter-option--active' : ''}`}
                onClick={() => setConvictionFilter(null)}
              >
                All
              </button>
              {CONVICTION_LEVELS.map(level => (
                <button
                  key={level.value}
                  className={`filter-option ${convictionFilter === level.value ? 'filter-option--active' : ''}`}
                  onClick={() => setConvictionFilter(level.value)}
                >
                  <span className="conviction-dot" style={{ background: level.color }} />
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-dropdown">
            <button className={`filter-btn ${thesisFilter ? 'filter-btn--active' : ''}`}>
              <Target size={14} />
              Thesis
              <ChevronDown size={14} />
            </button>
            <div className="filter-dropdown__menu filter-dropdown__menu--wide">
              <button 
                className={`filter-option ${!thesisFilter ? 'filter-option--active' : ''}`}
                onClick={() => setThesisFilter(null)}
              >
                All
              </button>
              {THESIS_TAGS.map(tag => (
                <button
                  key={tag}
                  className={`filter-option ${thesisFilter === tag ? 'filter-option--active' : ''}`}
                  onClick={() => setThesisFilter(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button className="filter-clear-btn" onClick={clearFilters}>
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        {selectedItems.size > 0 && (
          <div className="watchlist-filters__selection">
            <span>{selectedItems.size} selected</span>
            <button className="btn btn--danger btn--sm" onClick={handleDeleteSelected}>
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="watchlist-table-container">
        <table className="watchlist-table">
          <thead>
            <tr>
              <th className="watchlist-table__checkbox">
                <input 
                  type="checkbox" 
                  checked={selectedItems.size === filteredWatchlist.length && filteredWatchlist.length > 0}
                  onChange={selectAll}
                />
              </th>
              <th className="watchlist-table__symbol" onClick={() => handleSort('symbol')}>
                Symbol <SortIcon field="symbol" />
              </th>
              <th className="watchlist-table__price" onClick={() => handleSort('price')}>
                Price <SortIcon field="price" />
              </th>
              <th className="watchlist-table__change" onClick={() => handleSort('changePercent')}>
                Change <SortIcon field="changePercent" />
              </th>
              <th className="watchlist-table__trend">7D</th>
              <th className="watchlist-table__target" onClick={() => handleSort('upside')}>
                Target / Upside <SortIcon field="upside" />
              </th>
              <th className="watchlist-table__conviction" onClick={() => handleSort('conviction')}>
                Conviction <SortIcon field="conviction" />
              </th>
              <th className="watchlist-table__thesis">Thesis</th>
              <th className="watchlist-table__notes">Notes</th>
              <th className="watchlist-table__actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWatchlist.map(item => {
              const upside = item.targetPrice 
                ? ((item.targetPrice - item.price) / item.price) * 100 
                : null;
              const convictionLevel = CONVICTION_LEVELS.find(l => l.value === item.conviction);
              
              return (
                <tr 
                  key={item.id} 
                  className={`watchlist-table__row ${selectedItems.has(item.id) ? 'watchlist-table__row--selected' : ''}`}
                >
                  <td className="watchlist-table__checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                    />
                  </td>
                  <td className="watchlist-table__symbol">
                    <div className="symbol-info">
                      <div className="symbol-info__main">
                        <span className="symbol-ticker">{item.symbol}</span>
                        <a 
                          href={`https://finance.yahoo.com/quote/${item.symbol}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="symbol-external"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      <span className="symbol-name">{item.name}</span>
                      {item.sector && <span className="symbol-sector">{item.sector}</span>}
                    </div>
                  </td>
                  <td className="watchlist-table__price">
                    <span className="price-value">${item.price.toFixed(2)}</span>
                    {item.volume && (
                      <span className="volume-info">
                        {(item.volume / 1_000_000).toFixed(1)}M vol
                      </span>
                    )}
                  </td>
                  <td className={`watchlist-table__change ${item.change >= 0 ? 'positive' : 'negative'}`}>
                    <div className="change-info">
                      {item.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span className="change-value">
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                      </span>
                      <span className="change-percent">
                        ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </td>
                  <td className="watchlist-table__trend">
                    <Sparkline data={item.priceHistory} positive={item.change >= 0} />
                  </td>
                  <td className="watchlist-table__target">
                    {item.targetPrice ? (
                      <div className="target-info">
                        <span className="target-price">${item.targetPrice.toFixed(0)}</span>
                        <span className={`target-upside ${upside! >= 0 ? 'positive' : 'negative'}`}>
                          {upside! >= 0 ? '+' : ''}{upside!.toFixed(1)}%
                        </span>
                        {item.stopLoss && (
                          <span className="target-stop">
                            <AlertTriangle size={10} />
                            ${item.stopLoss}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="no-target">—</span>
                    )}
                  </td>
                  <td className="watchlist-table__conviction">
                    <span 
                      className="conviction-badge"
                      style={{ 
                        background: `${convictionLevel?.color}20`,
                        color: convictionLevel?.color,
                        borderColor: `${convictionLevel?.color}40`,
                      }}
                    >
                      {convictionLevel?.label}
                    </span>
                  </td>
                  <td className="watchlist-table__thesis">
                    <div className="thesis-tags">
                      {item.thesis?.slice(0, 2).map(tag => (
                        <span key={tag} className="thesis-tag">{tag}</span>
                      ))}
                      {item.thesis && item.thesis.length > 2 && (
                        <span className="thesis-more">+{item.thesis.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="watchlist-table__notes">
                    {item.notes ? (
                      <span className="notes-preview" title={item.notes}>
                        {item.notes.length > 50 ? item.notes.substring(0, 50) + '...' : item.notes}
                      </span>
                    ) : (
                      <span className="no-notes">—</span>
                    )}
                  </td>
                  <td className="watchlist-table__actions">
                    <div className="action-buttons">
                      <button 
                        className={`action-btn ${item.alertEnabled ? 'action-btn--active' : ''}`}
                        onClick={() => toggleAlert(item.id)}
                        title={item.alertEnabled ? 'Disable alert' : 'Enable alert'}
                      >
                        {item.alertEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => setEditingItem(item)}
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        className="action-btn action-btn--danger"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredWatchlist.length === 0 && (
          <div className="watchlist-empty">
            {hasFilters ? (
              <>
                <Search size={40} />
                <h3>No matches found</h3>
                <p>Try adjusting your filters</p>
                <button className="btn btn--secondary" onClick={clearFilters}>
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <Star size={40} />
                <h3>Your watchlist is empty</h3>
                <p>Add symbols to start monitoring</p>
                <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
                  <Plus size={16} />
                  Add Symbol
                </button>
              </>
            )}
          </div>
        )}
      </div>

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

// ============================================================================
// Modal Component
// ============================================================================

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
    previousClose: item?.previousClose?.toString() || '',
    change: item?.change?.toString() || '0',
    changePercent: item?.changePercent?.toString() || '0',
    targetPrice: item?.targetPrice?.toString() || '',
    stopLoss: item?.stopLoss?.toString() || '',
    notes: item?.notes || '',
    thesis: item?.thesis || [],
    conviction: item?.conviction || 'medium',
    alertEnabled: item?.alertEnabled ?? false,
    alertPrice: item?.alertPrice?.toString() || '',
    alertType: item?.alertType || 'above',
    sector: item?.sector || '',
  });

  const toggleThesis = (tag: string) => {
    setForm(prev => ({
      ...prev,
      thesis: prev.thesis.includes(tag) 
        ? prev.thesis.filter(t => t !== tag)
        : [...prev.thesis, tag],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const price = parseFloat(form.price);
    const previousClose = parseFloat(form.previousClose) || price;
    const change = price - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;
    
    onSave({
      ...(item || {}),
      symbol: form.symbol.toUpperCase(),
      name: form.name,
      price,
      previousClose,
      change,
      changePercent,
      targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : undefined,
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
      notes: form.notes || undefined,
      thesis: form.thesis,
      conviction: form.conviction as WatchlistItem['conviction'],
      alertEnabled: form.alertEnabled,
      alertPrice: form.alertPrice ? parseFloat(form.alertPrice) : undefined,
      alertType: form.alertType as WatchlistItem['alertType'],
      sector: form.sector || undefined,
      priceHistory: item?.priceHistory || [price],
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{item ? 'Edit' : 'Add'} Watchlist Item</h2>
          <button className="modal__close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {/* Basic Info */}
            <div className="form-section">
              <h3 className="form-section__title">Basic Information</h3>
              <div className="form-row form-row--3">
                <div className="form-group">
                  <label className="form-label">Symbol *</label>
                  <input
                    className="form-input"
                    value={form.symbol}
                    onChange={e => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                    placeholder="AAPL"
                    required
                    disabled={!!item}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Apple Inc."
                    required
                  />
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
            </div>

            {/* Pricing */}
            <div className="form-section">
              <h3 className="form-section__title">Pricing</h3>
              <div className="form-row form-row--4">
                <div className="form-group">
                  <label className="form-label">Current Price *</label>
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
                  <label className="form-label">Previous Close</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.previousClose}
                    onChange={e => setForm({ ...form, previousClose: e.target.value })}
                    placeholder="148.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.targetPrice}
                    onChange={e => setForm({ ...form, targetPrice: e.target.value })}
                    placeholder="180.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stop Loss</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={form.stopLoss}
                    onChange={e => setForm({ ...form, stopLoss: e.target.value })}
                    placeholder="130.00"
                  />
                </div>
              </div>
            </div>

            {/* Conviction & Thesis */}
            <div className="form-section">
              <h3 className="form-section__title">Investment Thesis</h3>
              <div className="form-group">
                <label className="form-label">Conviction Level</label>
                <div className="conviction-selector">
                  {CONVICTION_LEVELS.map(level => (
                    <button
                      key={level.value}
                      type="button"
                      className={`conviction-option ${form.conviction === level.value ? 'conviction-option--active' : ''}`}
                      style={{ 
                        '--conviction-color': level.color,
                        borderColor: form.conviction === level.value ? level.color : undefined,
                        background: form.conviction === level.value ? `${level.color}15` : undefined,
                      } as React.CSSProperties}
                      onClick={() => setForm({ ...form, conviction: level.value as 'high' | 'medium' | 'low' })}
                    >
                      {form.conviction === level.value && <Check size={14} />}
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Thesis Tags</label>
                <div className="thesis-selector">
                  {THESIS_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`thesis-option ${form.thesis.includes(tag) ? 'thesis-option--active' : ''}`}
                      onClick={() => toggleThesis(tag)}
                    >
                      {form.thesis.includes(tag) && <Check size={12} />}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="form-section">
              <h3 className="form-section__title">Price Alert</h3>
              <div className="form-row">
                <div className="form-group form-group--inline">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      checked={form.alertEnabled}
                      onChange={e => setForm({ ...form, alertEnabled: e.target.checked })}
                    />
                    <span>Enable price alert</span>
                  </label>
                </div>
                {form.alertEnabled && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Alert when price goes</label>
                      <select
                        className="form-select"
                        value={form.alertType}
                        onChange={e => setForm({ ...form, alertType: e.target.value as 'above' | 'below' })}
                      >
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Alert Price</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={form.alertPrice}
                        onChange={e => setForm({ ...form, alertPrice: e.target.value })}
                        placeholder="160.00"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="form-section">
              <h3 className="form-section__title">Notes</h3>
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Investment thesis, key catalysts, risks to monitor..."
                  rows={4}
                />
              </div>
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">{item ? 'Save Changes' : 'Add to Watchlist'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
