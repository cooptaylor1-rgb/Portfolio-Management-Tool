import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Bell, Plus, Search, ChevronUp, ChevronDown, Trash2, 
  Eye, EyeOff, X, TrendingUp, TrendingDown, Clock, AlertTriangle,
  Pause, RefreshCw, Settings
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type AlertStatus = 'active' | 'triggered' | 'snoozed' | 'disabled';
type AlertType = 'price_above' | 'price_below' | 'percent_change' | 'volume_spike';

interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  type: AlertType;
  targetPrice: number;
  currentPrice: number;
  status: AlertStatus;
  triggeredAt?: string;
  snoozedUntil?: string;
  createdAt: string;
  listName?: string;
  notes?: string;
}

type SortField = 'symbol' | 'type' | 'status' | 'currentPrice' | 'targetPrice' | 'distance' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// ============================================================================
// INITIAL DATA
// ============================================================================

const INITIAL_ALERTS: PriceAlert[] = [
  {
    id: '1',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'price_above',
    targetPrice: 200,
    currentPrice: 189.84,
    status: 'active',
    createdAt: '2024-01-15',
    listName: 'Tech Leaders',
    notes: 'Breakout level'
  },
  {
    id: '2',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'price_below',
    targetPrice: 140,
    currentPrice: 141.80,
    status: 'active',
    createdAt: '2024-01-14',
    listName: 'Tech Leaders'
  },
  {
    id: '3',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    type: 'price_above',
    targetPrice: 400,
    currentPrice: 378.91,
    status: 'active',
    createdAt: '2024-01-13'
  },
  {
    id: '4',
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    type: 'price_above',
    targetPrice: 500,
    currentPrice: 495.22,
    status: 'triggered',
    triggeredAt: '2024-01-18T10:30:00Z',
    createdAt: '2024-01-10',
    listName: 'AI Plays',
    notes: 'AI momentum play'
  },
  {
    id: '5',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    type: 'price_below',
    targetPrice: 200,
    currentPrice: 218.89,
    status: 'active',
    createdAt: '2024-01-12'
  },
  {
    id: '6',
    symbol: 'META',
    name: 'Meta Platforms',
    type: 'price_above',
    targetPrice: 380,
    currentPrice: 376.34,
    status: 'snoozed',
    snoozedUntil: '2024-01-20T09:00:00Z',
    createdAt: '2024-01-11',
    listName: 'Tech Leaders'
  },
  {
    id: '7',
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    type: 'price_below',
    targetPrice: 145,
    currentPrice: 153.42,
    status: 'disabled',
    createdAt: '2024-01-09'
  },
  {
    id: '8',
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    type: 'price_above',
    targetPrice: 140,
    currentPrice: 132.54,
    status: 'active',
    createdAt: '2024-01-16',
    listName: 'AI Plays'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const calculateDistance = (alert: PriceAlert): number => {
  const diff = alert.targetPrice - alert.currentPrice;
  return (diff / alert.currentPrice) * 100;
};

const formatDistance = (alert: PriceAlert): string => {
  const dist = calculateDistance(alert);
  const sign = dist >= 0 ? '+' : '';
  return `${sign}${dist.toFixed(2)}%`;
};

const getStatusColor = (status: AlertStatus): string => {
  switch (status) {
    case 'active': return 'var(--success)';
    case 'triggered': return 'var(--warning)';
    case 'snoozed': return 'var(--info)';
    case 'disabled': return 'var(--text-muted)';
  }
};

const getStatusIcon = (status: AlertStatus) => {
  switch (status) {
    case 'active': return <Eye size={14} />;
    case 'triggered': return <AlertTriangle size={14} />;
    case 'snoozed': return <Pause size={14} />;
    case 'disabled': return <EyeOff size={14} />;
  }
};

const getTypeLabel = (type: AlertType): string => {
  switch (type) {
    case 'price_above': return 'Above';
    case 'price_below': return 'Below';
    case 'percent_change': return '% Change';
    case 'volume_spike': return 'Volume';
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================================================
// SORTABLE HEADER COMPONENT
// ============================================================================

interface SortableHeaderProps {
  label: string;
  field: SortField;
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  align?: 'left' | 'right' | 'center';
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ 
  label, field, sortConfig, onSort, align = 'left' 
}) => {
  const isActive = sortConfig.field === field;
  
  return (
    <th 
      className={`alerts-table__th alerts-table__th--${align} ${isActive ? 'alerts-table__th--active' : ''}`}
      onClick={() => onSort(field)}
    >
      <div className="alerts-table__th-content">
        <span>{label}</span>
        <span className="alerts-table__sort-icon">
          {isActive ? (
            sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
          ) : (
            <ChevronUp size={14} className="alerts-table__sort-icon--inactive" />
          )}
        </span>
      </div>
    </th>
  );
};

// ============================================================================
// ALERT DETAIL PANEL COMPONENT
// ============================================================================

interface AlertDetailPanelProps {
  alert: PriceAlert;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
  onSnooze: (id: string) => void;
  onDelete: (id: string) => void;
}

const AlertDetailPanel: React.FC<AlertDetailPanelProps> = ({
  alert, onClose, onToggleStatus, onSnooze, onDelete
}) => {
  const distance = calculateDistance(alert);
  const isNearTarget = Math.abs(distance) < 5;
  
  return (
    <div className="alert-detail">
      <div className="alert-detail__header">
        <div className="alert-detail__title">
          <h3>{alert.symbol}</h3>
          <span className="alert-detail__name">{alert.name}</span>
        </div>
        <button className="alert-detail__close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      
      <div className="alert-detail__status">
        <span 
          className="alert-detail__status-badge"
          style={{ background: getStatusColor(alert.status) }}
        >
          {getStatusIcon(alert.status)}
          <span>{alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}</span>
        </span>
        <span className="alert-detail__type">
          {alert.type === 'price_above' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {getTypeLabel(alert.type)}
        </span>
      </div>
      
      <div className="alert-detail__prices">
        <div className="alert-detail__price-row">
          <span className="alert-detail__price-label">Current Price</span>
          <span className="alert-detail__price-value">${alert.currentPrice.toFixed(2)}</span>
        </div>
        <div className="alert-detail__price-row">
          <span className="alert-detail__price-label">Target Price</span>
          <span className="alert-detail__price-value">${alert.targetPrice.toFixed(2)}</span>
        </div>
        <div className="alert-detail__price-row alert-detail__price-row--highlight">
          <span className="alert-detail__price-label">Distance</span>
          <span 
            className={`alert-detail__price-value ${isNearTarget ? 'alert-detail__price-value--near' : ''}`}
            style={{ color: distance >= 0 ? 'var(--success)' : 'var(--danger)' }}
          >
            {formatDistance(alert)}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="alert-detail__progress">
        <div className="alert-detail__progress-bar">
          <div 
            className="alert-detail__progress-fill"
            style={{ 
              width: `${Math.min(100, Math.max(0, alert.type === 'price_above' 
                ? (alert.currentPrice / alert.targetPrice) * 100 
                : (alert.targetPrice / alert.currentPrice) * 100))}%`,
              background: isNearTarget ? 'var(--warning)' : 'var(--primary)'
            }}
          />
        </div>
        <span className="alert-detail__progress-label">
          {Math.abs(distance).toFixed(1)}% {distance >= 0 ? 'below' : 'above'} target
        </span>
      </div>
      
      {alert.listName && (
        <div className="alert-detail__meta">
          <span className="alert-detail__meta-label">Watchlist</span>
          <span className="alert-detail__meta-value">{alert.listName}</span>
        </div>
      )}
      
      {alert.notes && (
        <div className="alert-detail__notes">
          <span className="alert-detail__notes-label">Notes</span>
          <p className="alert-detail__notes-text">{alert.notes}</p>
        </div>
      )}
      
      <div className="alert-detail__meta">
        <span className="alert-detail__meta-label">Created</span>
        <span className="alert-detail__meta-value">{formatDate(alert.createdAt)}</span>
      </div>
      
      {alert.triggeredAt && (
        <div className="alert-detail__meta">
          <span className="alert-detail__meta-label">Triggered</span>
          <span className="alert-detail__meta-value">{formatDate(alert.triggeredAt)}</span>
        </div>
      )}
      
      <div className="alert-detail__actions">
        <button 
          className="alert-detail__action-btn alert-detail__action-btn--primary"
          onClick={() => onToggleStatus(alert.id)}
        >
          {alert.status === 'active' ? <EyeOff size={16} /> : <Eye size={16} />}
          {alert.status === 'active' ? 'Disable' : 'Enable'}
        </button>
        <button 
          className="alert-detail__action-btn"
          onClick={() => onSnooze(alert.id)}
        >
          <Clock size={16} />
          Snooze
        </button>
        <button 
          className="alert-detail__action-btn alert-detail__action-btn--danger"
          onClick={() => onDelete(alert.id)}
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// ADD ALERT MODAL COMPONENT
// ============================================================================

interface AddAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (alert: Omit<PriceAlert, 'id' | 'currentPrice' | 'status' | 'createdAt'>) => void;
}

const AddAlertModal: React.FC<AddAlertModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AlertType>('price_above');
  const [targetPrice, setTargetPrice] = useState('');
  const [listName, setListName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !targetPrice) return;
    
    onAdd({
      symbol: symbol.toUpperCase(),
      name: name || symbol.toUpperCase(),
      type,
      targetPrice: parseFloat(targetPrice),
      listName: listName || undefined,
      notes: notes || undefined
    });
    
    // Reset form
    setSymbol('');
    setName('');
    setType('price_above');
    setTargetPrice('');
    setListName('');
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--compact" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Bell size={20} />
            New Price Alert
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Symbol *</label>
              <input
                type="text"
                className="form-input"
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                placeholder="AAPL"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Apple Inc."
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Alert Type *</label>
              <select
                className="form-select"
                value={type}
                onChange={e => setType(e.target.value as AlertType)}
              >
                <option value="price_above">Price Above</option>
                <option value="price_below">Price Below</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target Price *</label>
              <input
                type="number"
                className="form-input"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder="150.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Watchlist (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={listName}
              onChange={e => setListName(e.target.value)}
              placeholder="Tech Leaders"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes about this alert..."
              rows={2}
            />
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              <Plus size={16} />
              Create Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN ALERTS PAGE COMPONENT
// ============================================================================

export default function AlertsPage() {
  // State
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    const saved = localStorage.getItem('portfolio-alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'symbol', direction: 'asc' });
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Persist alerts
  useEffect(() => {
    localStorage.setItem('portfolio-alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const filteredAlerts = getFilteredAlerts();
      const currentIndex = filteredAlerts.findIndex(a => a.id === selectedAlertId);
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < filteredAlerts.length - 1 ? currentIndex + 1 : 0;
        setSelectedAlertId(filteredAlerts[nextIndex]?.id || null);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredAlerts.length - 1;
        setSelectedAlertId(filteredAlerts[prevIndex]?.id || null);
      } else if (e.key === 'Escape') {
        setSelectedAlertId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAlertId, alerts, searchQuery, statusFilter, typeFilter]);

  // Filter and sort logic
  const getFilteredAlerts = useCallback(() => {
    let filtered = [...alerts];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.symbol.toLowerCase().includes(query) ||
        a.name.toLowerCase().includes(query) ||
        (a.listName && a.listName.toLowerCase().includes(query))
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === typeFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortConfig.field) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'currentPrice':
          comparison = a.currentPrice - b.currentPrice;
          break;
        case 'targetPrice':
          comparison = a.targetPrice - b.targetPrice;
          break;
        case 'distance':
          comparison = calculateDistance(a) - calculateDistance(b);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [alerts, searchQuery, statusFilter, typeFilter, sortConfig]);

  const filteredAlerts = useMemo(() => getFilteredAlerts(), [getFilteredAlerts]);
  const selectedAlert = alerts.find(a => a.id === selectedAlertId);

  // KPI calculations
  const kpis = useMemo(() => {
    const active = alerts.filter(a => a.status === 'active').length;
    const triggered = alerts.filter(a => a.status === 'triggered').length;
    const priceAbove = alerts.filter(a => a.type === 'price_above').length;
    const priceBelow = alerts.filter(a => a.type === 'price_below').length;
    const avgDistance = alerts.length > 0
      ? alerts.reduce((sum, a) => sum + Math.abs(calculateDistance(a)), 0) / alerts.length
      : 0;
    
    return { total: alerts.length, active, triggered, priceAbove, priceBelow, avgDistance };
  }, [alerts]);

  // Handlers
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleAddAlert = (alertData: Omit<PriceAlert, 'id' | 'currentPrice' | 'status' | 'createdAt'>) => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: Date.now().toString(),
      currentPrice: Math.random() * 100 + 100, // Simulated current price
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setAlerts(prev => [...prev, newAlert]);
  };

  const handleToggleStatus = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id 
        ? { ...a, status: a.status === 'active' ? 'disabled' : 'active' }
        : a
    ));
  };

  const handleSnooze = (id: string) => {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + 24);
    
    setAlerts(prev => prev.map(a => 
      a.id === id 
        ? { ...a, status: 'snoozed', snoozedUntil: snoozeUntil.toISOString() }
        : a
    ));
  };

  const handleDelete = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (selectedAlertId === id) {
      setSelectedAlertId(null);
    }
  };

  const handleClearTriggered = () => {
    setAlerts(prev => prev.filter(a => a.status !== 'triggered'));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="alerts-console">
      {/* Header */}
      <div className="alerts-console__header">
        <div className="alerts-console__title-section">
          <h1 className="alerts-console__title">
            <Bell size={24} />
            Alerts Console
          </h1>
          <span className="alerts-console__count">{filteredAlerts.length} alerts</span>
        </div>
        
        <div className="alerts-console__actions">
          <button className="btn btn--secondary btn--sm">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn--secondary btn--sm">
            <Settings size={16} />
            Settings
          </button>
          <button 
            className="btn btn--primary btn--sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} />
            New Alert
          </button>
        </div>
      </div>

      {/* KPI Band */}
      <div className="alerts-kpi">
        <div className="alerts-kpi__item">
          <span className="alerts-kpi__value">{kpis.total}</span>
          <span className="alerts-kpi__label">Total Alerts</span>
        </div>
        <div className="alerts-kpi__item">
          <span className="alerts-kpi__value" style={{ color: 'var(--success)' }}>{kpis.active}</span>
          <span className="alerts-kpi__label">Active</span>
        </div>
        <div className="alerts-kpi__item">
          <span className="alerts-kpi__value" style={{ color: 'var(--warning)' }}>{kpis.triggered}</span>
          <span className="alerts-kpi__label">Triggered</span>
        </div>
        <div className="alerts-kpi__item">
          <span className="alerts-kpi__value">{kpis.priceAbove}</span>
          <span className="alerts-kpi__label">Price Above</span>
        </div>
        <div className="alerts-kpi__item">
          <span className="alerts-kpi__value">{kpis.priceBelow}</span>
          <span className="alerts-kpi__label">Price Below</span>
        </div>
        <div className="alerts-kpi__item">
          <span className="alerts-kpi__value">{kpis.avgDistance.toFixed(1)}%</span>
          <span className="alerts-kpi__label">Avg Distance</span>
        </div>
      </div>

      {/* Filters */}
      <div className="alerts-filters">
        <div className="alerts-filters__search">
          <Search size={16} className="alerts-filters__search-icon" />
          <input
            type="text"
            className="alerts-filters__search-input"
            placeholder="Search by symbol, name, or list..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="alerts-filters__search-clear"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        <div className="alerts-filters__chips">
          <button 
            className={`alerts-filters__chip ${statusFilter === 'all' ? 'alerts-filters__chip--active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button 
            className={`alerts-filters__chip ${statusFilter === 'active' ? 'alerts-filters__chip--active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <Eye size={14} />
            Active
          </button>
          <button 
            className={`alerts-filters__chip ${statusFilter === 'triggered' ? 'alerts-filters__chip--active' : ''}`}
            onClick={() => setStatusFilter('triggered')}
          >
            <AlertTriangle size={14} />
            Triggered
          </button>
          <button 
            className={`alerts-filters__chip ${statusFilter === 'snoozed' ? 'alerts-filters__chip--active' : ''}`}
            onClick={() => setStatusFilter('snoozed')}
          >
            <Pause size={14} />
            Snoozed
          </button>
          <button 
            className={`alerts-filters__chip ${statusFilter === 'disabled' ? 'alerts-filters__chip--active' : ''}`}
            onClick={() => setStatusFilter('disabled')}
          >
            <EyeOff size={14} />
            Disabled
          </button>
        </div>
        
        <select
          className="alerts-filters__select"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as AlertType | 'all')}
        >
          <option value="all">All Types</option>
          <option value="price_above">Price Above</option>
          <option value="price_below">Price Below</option>
        </select>
        
        {kpis.triggered > 0 && (
          <button 
            className="btn btn--danger btn--sm"
            onClick={handleClearTriggered}
          >
            <Trash2 size={14} />
            Clear Triggered ({kpis.triggered})
          </button>
        )}
      </div>

      {/* Main Content: Table + Detail Panel */}
      <div className="alerts-console__content">
        {/* Table */}
        <div className="alerts-table-container">
          <table className="alerts-table">
            <thead>
              <tr>
                <SortableHeader label="Symbol" field="symbol" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Type" field="type" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Status" field="status" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader label="Current" field="currentPrice" sortConfig={sortConfig} onSort={handleSort} align="right" />
                <SortableHeader label="Target" field="targetPrice" sortConfig={sortConfig} onSort={handleSort} align="right" />
                <SortableHeader label="Distance" field="distance" sortConfig={sortConfig} onSort={handleSort} align="right" />
                <SortableHeader label="Created" field="createdAt" sortConfig={sortConfig} onSort={handleSort} align="right" />
                <th className="alerts-table__th alerts-table__th--actions"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map(alert => {
                const distance = calculateDistance(alert);
                const isNearTarget = Math.abs(distance) < 5;
                const isSelected = alert.id === selectedAlertId;
                
                return (
                  <tr 
                    key={alert.id}
                    className={`alerts-table__row ${isSelected ? 'alerts-table__row--selected' : ''} ${isNearTarget ? 'alerts-table__row--near' : ''}`}
                    onClick={() => setSelectedAlertId(alert.id)}
                  >
                    <td className="alerts-table__td">
                      <div className="alerts-table__symbol">
                        <span className="alerts-table__symbol-ticker">{alert.symbol}</span>
                        {alert.listName && (
                          <span className="alerts-table__symbol-list">{alert.listName}</span>
                        )}
                      </div>
                    </td>
                    <td className="alerts-table__td">
                      <span className="alerts-table__type">
                        {alert.type === 'price_above' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {getTypeLabel(alert.type)}
                      </span>
                    </td>
                    <td className="alerts-table__td">
                      <span 
                        className="alerts-table__status"
                        style={{ color: getStatusColor(alert.status) }}
                      >
                        {getStatusIcon(alert.status)}
                        {alert.status}
                      </span>
                    </td>
                    <td className="alerts-table__td alerts-table__td--right">
                      ${alert.currentPrice.toFixed(2)}
                    </td>
                    <td className="alerts-table__td alerts-table__td--right">
                      ${alert.targetPrice.toFixed(2)}
                    </td>
                    <td className="alerts-table__td alerts-table__td--right">
                      <span 
                        className={`alerts-table__distance ${isNearTarget ? 'alerts-table__distance--near' : ''}`}
                        style={{ color: distance >= 0 ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {formatDistance(alert)}
                      </span>
                    </td>
                    <td className="alerts-table__td alerts-table__td--right alerts-table__td--muted">
                      {formatDate(alert.createdAt)}
                    </td>
                    <td className="alerts-table__td alerts-table__td--actions">
                      <button 
                        className="alerts-table__action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(alert.id);
                        }}
                        title={alert.status === 'active' ? 'Disable' : 'Enable'}
                      >
                        {alert.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button 
                        className="alerts-table__action-btn alerts-table__action-btn--danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(alert.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredAlerts.length === 0 && (
            <div className="alerts-table__empty">
              <Bell size={48} className="alerts-table__empty-icon" />
              <p>No alerts found</p>
              <span>Try adjusting your filters or create a new alert</span>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedAlert && (
          <AlertDetailPanel
            alert={selectedAlert}
            onClose={() => setSelectedAlertId(null)}
            onToggleStatus={handleToggleStatus}
            onSnooze={handleSnooze}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Add Alert Modal */}
      <AddAlertModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddAlert}
      />
    </div>
  );
}
