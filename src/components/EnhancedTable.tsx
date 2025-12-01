import { useState, useMemo } from 'react';
import { Investment } from '../types';
import { TrendingUp, TrendingDown, Edit2, Trash2, GripVertical, Filter, Download, Settings } from 'lucide-react';

interface EnhancedTableProps {
  investments: Investment[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Investment>) => void;
}

type SortConfig = {
  key: keyof Investment | 'value' | 'gainLoss' | 'gainLossPercent';
  direction: 'asc' | 'desc';
} | null;

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  pinned: boolean;
}

export default function EnhancedTable({ investments, onDelete, onUpdate }: EnhancedTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Investment>>({});
  const [filterText, setFilterText] = useState('');
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'sector'>('none');
  
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'symbol', label: 'Symbol', visible: true, pinned: true },
    { id: 'name', label: 'Name', visible: true, pinned: false },
    { id: 'type', label: 'Type', visible: true, pinned: false },
    { id: 'quantity', label: 'Quantity', visible: true, pinned: false },
    { id: 'purchasePrice', label: 'Purchase Price', visible: true, pinned: false },
    { id: 'currentPrice', label: 'Current Price', visible: true, pinned: false },
    { id: 'value', label: 'Current Value', visible: true, pinned: false },
    { id: 'gainLoss', label: 'Gain/Loss ($)', visible: true, pinned: false },
    { id: 'gainLossPercent', label: 'Gain/Loss (%)', visible: true, pinned: false },
    { id: 'purchaseDate', label: 'Purchase Date', visible: true, pinned: false },
    { id: 'sector', label: 'Sector', visible: true, pinned: false },
  ]);

  const visibleColumns = columns.filter(col => col.visible);
  const pinnedColumns = visibleColumns.filter(col => col.pinned);
  const unpinnedColumns = visibleColumns.filter(col => !col.pinned);

  const calculateMetrics = (inv: Investment) => {
    const value = inv.quantity * inv.currentPrice;
    const invested = inv.quantity * inv.purchasePrice;
    const gainLoss = value - invested;
    const gainLossPercent = (gainLoss / invested) * 100;
    return { value, gainLoss, gainLossPercent };
  };

  const filteredInvestments = useMemo(() => {
    return investments.filter(inv => {
      if (!filterText) return true;
      const searchLower = filterText.toLowerCase();
      return (
        inv.symbol.toLowerCase().includes(searchLower) ||
        inv.name.toLowerCase().includes(searchLower) ||
        inv.type.toLowerCase().includes(searchLower) ||
        (inv.sector?.toLowerCase() || '').includes(searchLower)
      );
    });
  }, [investments, filterText]);

  const sortedInvestments = useMemo(() => {
    if (!sortConfig) return filteredInvestments;

    return [...filteredInvestments].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'value') {
        aValue = calculateMetrics(a).value;
        bValue = calculateMetrics(b).value;
      } else if (sortConfig.key === 'gainLoss') {
        aValue = calculateMetrics(a).gainLoss;
        bValue = calculateMetrics(b).gainLoss;
      } else if (sortConfig.key === 'gainLossPercent') {
        aValue = calculateMetrics(a).gainLossPercent;
        bValue = calculateMetrics(b).gainLossPercent;
      } else {
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInvestments, sortConfig]);

  const groupedInvestments = useMemo(() => {
    if (groupBy === 'none') return { 'All': sortedInvestments };

    const groups: Record<string, Investment[]> = {};
    sortedInvestments.forEach(inv => {
      const key = groupBy === 'type' ? inv.type : (inv.sector || 'Other');
      if (!groups[key]) groups[key] = [];
      groups[key].push(inv);
    });
    return groups;
  }, [sortedInvestments, groupBy]);

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  const startEdit = (inv: Investment) => {
    setEditingId(inv.id);
    setEditValues({
      quantity: inv.quantity,
      currentPrice: inv.currentPrice,
      purchasePrice: inv.purchasePrice,
    });
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdate(editingId, editValues);
      setEditingId(null);
      setEditValues({});
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumns(cols =>
      cols.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const togglePinColumn = (columnId: string) => {
    setColumns(cols =>
      cols.map(col =>
        col.id === columnId ? { ...col, pinned: !col.pinned } : col
      )
    );
  };

  const exportToCSV = () => {
    const headers = visibleColumns.map(col => col.label).join(',');
    const rows = sortedInvestments.map(inv => {
      const metrics = calculateMetrics(inv);
      return visibleColumns.map(col => {
        switch (col.id) {
          case 'value': return metrics.value.toFixed(2);
          case 'gainLoss': return metrics.gainLoss.toFixed(2);
          case 'gainLossPercent': return metrics.gainLossPercent.toFixed(2);
          default: return inv[col.id as keyof Investment] || '';
        }
      }).join(',');
    }).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const renderCell = (inv: Investment, columnId: string) => {
    const metrics = calculateMetrics(inv);
    const isEditing = editingId === inv.id;

    switch (columnId) {
      case 'symbol':
        return <span className="table-cell-symbol">{inv.symbol}</span>;
      case 'name':
        return <span className="table-cell-name">{inv.name}</span>;
      case 'type':
        return <span className={`badge badge-${inv.type}`}>{inv.type.toUpperCase()}</span>;
      case 'quantity':
        return isEditing ? (
          <input
            type="number"
            value={editValues.quantity || ''}
            onChange={e => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) })}
            className="table-edit-input"
          />
        ) : inv.quantity;
      case 'purchasePrice':
        return isEditing ? (
          <input
            type="number"
            value={editValues.purchasePrice || ''}
            onChange={e => setEditValues({ ...editValues, purchasePrice: parseFloat(e.target.value) })}
            className="table-edit-input"
          />
        ) : `$${inv.purchasePrice.toFixed(2)}`;
      case 'currentPrice':
        return isEditing ? (
          <input
            type="number"
            value={editValues.currentPrice || ''}
            onChange={e => setEditValues({ ...editValues, currentPrice: parseFloat(e.target.value) })}
            className="table-edit-input"
          />
        ) : `$${inv.currentPrice.toFixed(2)}`;
      case 'value':
        return <span className="table-cell-currency">${metrics.value.toFixed(2)}</span>;
      case 'gainLoss':
        return (
          <span className={metrics.gainLoss >= 0 ? 'positive' : 'negative'}>
            {metrics.gainLoss >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            ${Math.abs(metrics.gainLoss).toFixed(2)}
          </span>
        );
      case 'gainLossPercent':
        return (
          <span className={metrics.gainLossPercent >= 0 ? 'positive' : 'negative'}>
            {metrics.gainLossPercent >= 0 ? '+' : ''}{metrics.gainLossPercent.toFixed(2)}%
          </span>
        );
      case 'purchaseDate':
        return new Date(inv.purchaseDate).toLocaleDateString();
      case 'sector':
        return inv.sector ? <span className="badge badge-sector">{inv.sector}</span> : '—';
      default:
        return '';
    }
  };

  const getSortIcon = (columnId: string) => {
    if (!sortConfig || sortConfig.key !== columnId) return '⇅';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="enhanced-table-container">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="table-search">
            <Filter size={16} />
            <input
              type="text"
              placeholder="Filter by symbol, name, type, or sector..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
            />
          </div>
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value as any)}
            className="table-group-select"
          >
            <option value="none">No Grouping</option>
            <option value="type">Group by Type</option>
            <option value="sector">Group by Sector</option>
          </select>
        </div>
        <div className="table-toolbar-right">
          <button className="btn-icon" onClick={exportToCSV} title="Export to CSV">
            <Download size={18} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            title="Column Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Column Picker */}
      {showColumnPicker && (
        <div className="column-picker">
          <h4>Column Settings</h4>
          <div className="column-picker-list">
            {columns.map(col => (
              <div key={col.id} className="column-picker-item">
                <label>
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => toggleColumn(col.id)}
                  />
                  <span>{col.label}</span>
                </label>
                {col.visible && (
                  <button
                    className={`btn-pin ${col.pinned ? 'pinned' : ''}`}
                    onClick={() => togglePinColumn(col.id)}
                    title={col.pinned ? 'Unpin' : 'Pin column'}
                  >
                    <GripVertical size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-scroll-container">
        <table className="enhanced-table">
          <thead>
            <tr>
              {pinnedColumns.map(col => (
                <th
                  key={col.id}
                  className="pinned-column"
                  onClick={() => handleSort(col.id as any)}
                >
                  {col.label} <span className="sort-icon">{getSortIcon(col.id)}</span>
                </th>
              ))}
              {unpinnedColumns.map(col => (
                <th key={col.id} onClick={() => handleSort(col.id as any)}>
                  {col.label} <span className="sort-icon">{getSortIcon(col.id)}</span>
                </th>
              ))}
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedInvestments).map(([groupName, groupInvs]) => (
              <>
                {groupBy !== 'none' && (
                  <tr className="group-header-row">
                    <td colSpan={visibleColumns.length + 1}>
                      <strong>{groupName}</strong> ({groupInvs.length} items)
                    </td>
                  </tr>
                )}
                {groupInvs.map(inv => (
                  <tr key={inv.id} className="table-row">
                    {pinnedColumns.map(col => (
                      <td key={col.id} className="pinned-column">
                        {renderCell(inv, col.id)}
                      </td>
                    ))}
                    {unpinnedColumns.map(col => (
                      <td key={col.id}>{renderCell(inv, col.id)}</td>
                    ))}
                    <td className="actions-column">
                      {editingId === inv.id ? (
                        <>
                          <button className="btn-icon btn-success" onClick={saveEdit}>
                            ✓
                          </button>
                          <button className="btn-icon" onClick={() => setEditingId(null)}>
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn-icon" onClick={() => startEdit(inv)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon btn-danger" onClick={() => onDelete(inv.id)}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="table-footer">
        <span className="table-count">
          Showing {sortedInvestments.length} of {investments.length} investments
        </span>
        <span className="table-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
