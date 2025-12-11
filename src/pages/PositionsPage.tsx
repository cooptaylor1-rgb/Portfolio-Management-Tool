/**
 * Positions Page
 * 
 * Full data table of all positions with:
 * - Sorting, filtering, search
 * - Column customization
 * - Export functionality
 * - Click to open details panel
 * - Real data from PortfolioContext
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { Plus, Download, RefreshCw, Columns, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useShell } from '../layouts';
import { usePortfolio } from '../contexts/PortfolioContext';
import {
  ColumnCustomizationDialog,
  loadTablePreferences,
  saveTablePreferences,
  getOrderedVisibleColumns,
  updateSort,
  TablePreferences,
} from '../features/columns';
import {
  PositionColumnId,
  POSITION_COLUMNS,
  POSITION_CATEGORIES,
  DEFAULT_POSITION_COLUMNS,
} from '../features/positions';
import './pages.css';

interface Position {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  value: number;
  costBasis: number;
  gain: number;
  gainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weight: number;
  sector: string;
  type: string;
}

export default function PositionsPage() {
  const { openDetailsPanel } = useShell();
  const { investments, stats, isLoading, refreshPrices } = usePortfolio();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Column preferences
  const [preferences, setPreferences] = useState<TablePreferences<PositionColumnId>>(() =>
    loadTablePreferences('positions', POSITION_COLUMNS, DEFAULT_POSITION_COLUMNS)
  );

  // Save preferences when they change
  useEffect(() => {
    saveTablePreferences('positions', preferences);
  }, [preferences]);

  // Get visible columns in order
  const visibleColumns = useMemo(
    () => getOrderedVisibleColumns(POSITION_COLUMNS, preferences),
    [preferences]
  );

  // Transform investments to positions format
  const positions = useMemo<Position[]>(() => {
    return investments.map(inv => ({
      id: inv.id,
      symbol: inv.symbol,
      name: inv.name,
      quantity: inv.quantity,
      price: inv.currentPrice,
      value: inv.quantity * inv.currentPrice,
      costBasis: inv.quantity * inv.purchasePrice,
      gain: (inv.currentPrice - inv.purchasePrice) * inv.quantity,
      gainPercent: ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100,
      dayChange: (inv.dayChange || 0) * inv.quantity,
      dayChangePercent: inv.dayChangePercent || 0,
      weight: stats.totalValue > 0 
        ? (inv.quantity * inv.currentPrice / stats.totalValue) * 100 
        : 0,
      sector: inv.sector || 'Other',
      type: inv.type,
    }));
  }, [investments, stats.totalValue]);

  // Filter positions
  const filteredPositions = useMemo(() => {
    if (!searchTerm) return positions;
    const term = searchTerm.toLowerCase();
    return positions.filter(p => 
      p.symbol.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.sector.toLowerCase().includes(term)
    );
  }, [positions, searchTerm]);

  // Sort positions
  const sortedPositions = useMemo(() => {
    if (!preferences.sortBy) return filteredPositions;
    
    const { columnId, direction } = preferences.sortBy;
    const sorted = [...filteredPositions].sort((a, b) => {
      const aVal = a[columnId as keyof Position];
      const bVal = b[columnId as keyof Position];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    
    return sorted;
  }, [filteredPositions, preferences.sortBy]);

  // Format currency for display
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Handle sort click
  const handleSort = useCallback((columnId: PositionColumnId) => {
    setPreferences(prev => updateSort(prev, columnId));
  }, []);

  // Render cell value
  const renderCell = (position: Position, columnId: PositionColumnId) => {
    const value = position[columnId as keyof Position];
    const column = POSITION_COLUMNS.find(c => c.id === columnId);
    
    if (value === undefined || value === null) return '-';
    
    // Special rendering for symbol column
    if (columnId === 'symbol') {
      return (
        <div className="positions-table__symbol">
          <span className="positions-table__ticker">{position.symbol}</span>
          <span className="positions-table__name">{position.name}</span>
        </div>
      );
    }
    
    // Format based on column type
    if (column?.format === 'currency') {
      const numVal = value as number;
      const className = column.canBeNegative && numVal < 0 ? 'text-negative' : numVal > 0 && column.canBeNegative ? 'text-positive' : '';
      return <span className={className}>{formatCurrency(numVal)}</span>;
    }
    
    if (column?.format === 'percent') {
      const numVal = value as number;
      const className = column.canBeNegative ? (numVal >= 0 ? 'text-positive' : 'text-negative') : '';
      return <span className={className}>{numVal >= 0 ? '+' : ''}{numVal.toFixed(2)}%</span>;
    }
    
    if (column?.format === 'number') {
      return (value as number).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    
    if (columnId === 'sector') {
      return <span className="positions-table__badge">{value}</span>;
    }
    
    return String(value);
  };

  const handleRowClick = (position: Position) => {
    openDetailsPanel({
      type: 'position',
      data: {
        ...position,
      },
    });
  };

  const handleExport = () => {
    // Create CSV content based on visible columns
    const headers = visibleColumns.map(c => c.label);
    const rows = sortedPositions.map(p => 
      visibleColumns.map(col => {
        const val = p[col.id as keyof Position];
        if (typeof val === 'number') return val.toFixed(2);
        return val || '';
      })
    );
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `positions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get sort icon for column
  const getSortIcon = (columnId: PositionColumnId) => {
    if (preferences.sortBy?.columnId !== columnId) {
      return <ArrowUpDown size={12} className="sort-icon--inactive" />;
    }
    return preferences.sortBy.direction === 'asc' 
      ? <ArrowUp size={12} className="sort-icon--active" />
      : <ArrowDown size={12} className="sort-icon--active" />;
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Positions</h1>
          <p className="page__subtitle">
            {positions.length} holdings • {formatCurrency(stats.totalValue)} total value
          </p>
        </div>
        <div className="page__actions">
          <button 
            className="btn btn--ghost" 
            onClick={() => refreshPrices()}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn btn--secondary" onClick={() => setShowColumnDialog(true)}>
            <Columns size={16} />
            Columns
          </button>
          <button className="btn" onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Position
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="page__toolbar">
        <div className="search-input">
          <input
            type="text"
            placeholder="Search positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input__field"
          />
        </div>
        <span className="page__toolbar-info">
          {sortedPositions.length} of {positions.length} positions
        </span>
      </div>

      {positions.length > 0 ? (
        <div className="table-container">
          <table className="positions-table">
            <thead>
              <tr>
                {visibleColumns.map(col => (
                  <th
                    key={col.id}
                    className={`${col.sortable ? 'sortable' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                    onClick={() => col.sortable && handleSort(col.id)}
                    style={{ width: col.width }}
                  >
                    <div className="positions-table__th-content">
                      {col.label}
                      {col.sortable && getSortIcon(col.id)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPositions.map(position => (
                <tr 
                  key={position.id} 
                  className="positions-table__row"
                  onClick={() => handleRowClick(position)}
                >
                  {visibleColumns.map(col => (
                    <td 
                      key={col.id}
                      className={col.align === 'right' ? 'text-right' : ''}
                    >
                      {renderCell(position, col.id)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">📊</div>
          <h2 className="empty-state__title">No positions yet</h2>
          <p className="empty-state__description">
            Start building your portfolio by adding your first investment.
          </p>
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Your First Position
          </button>
        </div>
      )}

      {/* Column Customization Dialog */}
      {showColumnDialog && (
        <ColumnCustomizationDialog
          columns={POSITION_COLUMNS}
          categories={POSITION_CATEGORIES}
          preferences={preferences}
          onPreferencesChange={setPreferences}
          onClose={() => setShowColumnDialog(false)}
          defaultVisibleIds={DEFAULT_POSITION_COLUMNS}
          title="Customize Position Columns"
        />
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Add Position</h2>
              <button className="modal__close" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>
            <div className="modal__body">
              <p className="text-secondary">
                Adding positions from this page is not wired up yet.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--primary" onClick={() => setShowAddModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
