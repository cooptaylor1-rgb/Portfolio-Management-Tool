/**
 * Transactions Page
 * 
 * Complete transaction history with filtering, sorting, and CRUD operations
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Plus,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Search,
  Split,
  Columns,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  X,
  ChevronDown,
} from 'lucide-react';
import { usePortfolio, type Transaction as PortfolioTransaction } from '../contexts/PortfolioContext';
import {
  ColumnCustomizationDialog,
  loadTablePreferences,
  saveTablePreferences,
  getOrderedVisibleColumns,
  updateSort,
  TablePreferences,
} from '../features/columns';
import {
  TransactionColumnId,
  TRANSACTION_COLUMNS,
  TRANSACTION_CATEGORIES,
  DEFAULT_TRANSACTION_COLUMNS,
  type TransactionFilters,
  type TransactionRow,
  type TransactionType,
  applyTransactionFilters,
  computeTransactionSummary,
  getTransactionTypeLabel,
} from '../features/transactions';
import './pages.css';

const TYPE_CONFIG: Record<TransactionType, { icon: typeof ArrowUpRight; color: string; label: string }> = {
  buy: { icon: ArrowUpRight, color: '#3fb950', label: 'Buy' },
  sell: { icon: ArrowDownRight, color: '#f85149', label: 'Sell' },
  dividend: { icon: Coins, color: '#58a6ff', label: 'Dividend' },
  split: { icon: Split, color: '#a371f7', label: 'Split' },
  interest: { icon: Coins, color: '#58a6ff', label: 'Interest' },
  fee: { icon: ArrowDownRight, color: '#f85149', label: 'Fee' },
  transfer: { icon: ArrowUpRight, color: '#58a6ff', label: 'Transfer' },
};

export default function TransactionsPage() {
  const { transactions, investments, addTransaction } = usePortfolio();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [filters, setFilters] = useState<TransactionFilters>({
    text: '',
    types: [],
    dateFrom: undefined,
    dateTo: undefined,
    minAbsNotional: undefined,
    maxAbsNotional: undefined,
  });
  
  // Column preferences
  const [preferences, setPreferences] = useState<TablePreferences<TransactionColumnId>>(() =>
    loadTablePreferences('transactions', TRANSACTION_COLUMNS, DEFAULT_TRANSACTION_COLUMNS)
  );

  // Save preferences when they change
  useEffect(() => {
    saveTablePreferences('transactions', preferences);
  }, [preferences]);

  // Get visible columns in order
  const visibleColumns = useMemo(
    () => getOrderedVisibleColumns(TRANSACTION_COLUMNS, preferences),
    [preferences]
  );

  // Create lookup for investment names
  const investmentLookup = useMemo(() => {
    const lookup: Record<string, { name: string; symbol: string }> = {};
    investments.forEach(inv => {
      lookup[inv.id] = { name: inv.name, symbol: inv.symbol };
    });
    return lookup;
  }, [investments]);

  const allRows = useMemo<TransactionRow[]>(() => {
    return transactions.map(t => {
      const inv = investmentLookup[t.investmentId];
      const symbol = inv?.symbol || '???';
      const name = inv?.name || 'Unknown';

      const notional = (t.quantity ?? 0) * (t.price ?? 0);
      const cashImpact =
        t.type === 'buy'
          ? -notional
          : t.type === 'sell'
            ? notional
            : t.type === 'dividend'
              ? notional
              : 0;

      return {
        id: t.id,
        date: t.date,
        type: t.type as TransactionType,
        symbol,
        name,
        quantity: t.quantity,
        price: t.price,
        notional,
        cashImpact,
        notes: t.notes,
      };
    });
  }, [transactions, investmentLookup]);

  const filteredRows = useMemo(() => applyTransactionFilters(allRows, filters), [allRows, filters]);

  // Sort transactions
  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];

    const getSortValue = (row: TransactionRow, columnId: TransactionColumnId): string | number => {
      switch (columnId) {
        case 'date':
          return new Date(row.date).getTime();
        case 'type':
          return getTransactionTypeLabel(row.type);
        case 'symbol':
          return row.symbol;
        case 'name':
          return row.name ?? '';
        case 'quantity':
          return row.quantity ?? 0;
        case 'price':
          return row.price ?? 0;
        case 'total':
        case 'netAmount':
          return row.notional;
        case 'notes':
          return row.notes ?? '';
        default:
          return '';
      }
    };

    if (!preferences.sortBy) {
      // Default sort by date descending
      return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    const { columnId, direction } = preferences.sortBy;
    return rows.sort((a, b) => {
      const aVal = getSortValue(a, columnId);
      const bVal = getSortValue(b, columnId);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredRows, preferences.sortBy]);

  const summary = useMemo(() => computeTransactionSummary(filteredRows), [filteredRows]);

  // Handle sort click
  const handleSort = useCallback((columnId: TransactionColumnId) => {
    setPreferences(prev => updateSort(prev, columnId));
  }, []);

  // Get sort icon
  const getSortIcon = (columnId: TransactionColumnId) => {
    if (preferences.sortBy?.columnId !== columnId) {
      return <ArrowUpDown size={12} className="sort-icon--inactive" />;
    }
    return preferences.sortBy.direction === 'asc' 
      ? <ArrowUp size={12} className="sort-icon--active" />
      : <ArrowDown size={12} className="sort-icon--active" />;
  };

  const renderCell = (row: TransactionRow, columnId: TransactionColumnId) => {
    switch (columnId) {
      case 'date':
        return (
          <span className="transaction-date">
            {new Date(row.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        );
      
      case 'type': {
        const config = TYPE_CONFIG[row.type] || { icon: ArrowUpDown, color: 'var(--text-tertiary)', label: row.type };
        const Icon = config.icon;
        return (
          <span className="transaction-type" style={{ color: config.color }}>
            <Icon size={14} />
            {config.label}
          </span>
        );
      }
      
      case 'symbol':
        return (
          <div className="transaction-investment">
            <span className="transaction-symbol">{row.symbol}</span>
            <span className="transaction-name">{row.name}</span>
          </div>
        );
      
      case 'name':
        return row.name;
      
      case 'quantity':
        return row.quantity?.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? '-';
      
      case 'price':
        return row.price != null 
          ? `$${row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
          : '-';
      
      case 'total':
      case 'netAmount': {
        const isSell = row.type === 'sell';
        const isBuy = row.type === 'buy';
        const isIncome = row.type === 'dividend' || row.type === 'interest';
        const sign = isSell || isIncome ? '+' : isBuy ? '-' : '';
        const className = isSell
          ? 'text-positive'
          : isBuy
            ? 'text-negative'
            : isIncome
              ? 'text-highlight'
              : '';

        return (
          <span className={className}>
            {sign}${Math.abs(row.notional).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
      
      case 'fees':
        // Fees not currently tracked in transaction type
        return '-';
      
      case 'notes':
        return (
          <span className="transaction-notes" title={row.notes}>
            {row.notes || '-'}
          </span>
        );
      
      default:
        return '-';
    }
  };

  const exportToCSV = () => {
    const headers = visibleColumns.map(c => c.label);

    const getExportValue = (row: TransactionRow, columnId: TransactionColumnId): string => {
      switch (columnId) {
        case 'date':
          return row.date;
        case 'type':
          return getTransactionTypeLabel(row.type);
        case 'symbol':
          return row.symbol;
        case 'name':
          return row.name ?? '';
        case 'quantity':
          return String(row.quantity ?? '');
        case 'price':
          return String(row.price ?? '');
        case 'total':
        case 'netAmount':
          return String(row.notional ?? '');
        case 'notes':
          return row.notes ?? '';
        default:
          return '';
      }
    };

    const rows = sortedRows.map(row => visibleColumns.map(col => getExportValue(row, col.id)));
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page page--transactions">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Transactions</h1>
          <p className="page__subtitle">
            {summary.count} in view • {allRows.length} total
          </p>
        </div>
        <div className="page__actions">
          <button className="btn btn--secondary" onClick={() => setShowColumnDialog(true)}>
            <Columns size={16} />
            Columns
          </button>
          <button className="btn" onClick={exportToCSV}>
            <Download size={16} />
            Export CSV
          </button>
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            Add Transaction
          </button>
        </div>
      </div>

      <div className="transactions-kpis" aria-label="Transaction KPI tiles">
        <KpiTile label="In View" value={summary.count.toLocaleString()} caption="In current filters" />
        <KpiTile label="Bought" value={formatMoney(summary.totalBought)} caption="Gross outflow" />
        <KpiTile label="Sold" value={formatMoney(summary.totalSold)} caption="Gross inflow" />
        <KpiTile label="Net Invested" value={formatMoney(summary.netInvested)} caption="Bought − sold" />
        <KpiTile label="Div/Int" value={formatMoney(summary.dividendsReceived)} caption="Income" />
      </div>

      <TransactionsFilterBar
        filters={filters}
        onChange={setFilters}
        showAdvanced={showAdvancedFilters}
        onToggleAdvanced={() => setShowAdvancedFilters(v => !v)}
      />

      {/* Transactions Table */}
      <div className={`transactions-workspace ${selectedTransactionId ? 'transactions-workspace--with-detail' : ''}`}>
        <section className="card transactions-table-card">
          <div className="card__body card__body--flush">
            <div className="table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    {visibleColumns.map(col => (
                      <th
                        key={col.id}
                        className={`${col.sortable ? 'sortable' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                        onClick={() => col.sortable && handleSort(col.id)}
                        style={{ width: col.width }}
                      >
                        <div className="transactions-table__th-content">
                          {col.label}
                          {col.sortable && getSortIcon(col.id)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map(row => (
                    <tr
                      key={row.id}
                      className={`transactions-table__row ${selectedTransactionId === row.id ? 'transactions-table__row--selected' : ''}`}
                      onClick={() => setSelectedTransactionId(row.id)}
                    >
                      {visibleColumns.map(col => (
                        <td key={col.id} className={col.align === 'right' ? 'text-right' : ''}>
                          {renderCell(row, col.id)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {selectedTransactionId && (
          <section className="card transactions-detail" aria-label="Transaction details">
            <div className="card__header">
              <div className="card__title">Details</div>
              <button className="btn btn--ghost" onClick={() => setSelectedTransactionId(null)} aria-label="Close details">
                <X size={16} />
              </button>
            </div>
            <div className="card__body">
              {(() => {
                const row = allRows.find(r => r.id === selectedTransactionId);
                if (!row) return <div className="text-secondary">No transaction selected.</div>;

                return (
                  <div className="transactions-detail__grid">
                    <div className="transactions-detail__item">
                      <span className="transactions-detail__label">Symbol</span>
                      <span className="transactions-detail__value">{row.symbol}</span>
                    </div>
                    <div className="transactions-detail__item">
                      <span className="transactions-detail__label">Name</span>
                      <span className="transactions-detail__value">{row.name}</span>
                    </div>
                    <div className="transactions-detail__item">
                      <span className="transactions-detail__label">Type</span>
                      <span className="transactions-detail__value">{getTransactionTypeLabel(row.type)}</span>
                    </div>
                    <div className="transactions-detail__item">
                      <span className="transactions-detail__label">Date</span>
                      <span className="transactions-detail__value">{new Date(row.date).toLocaleDateString()}</span>
                    </div>
                    <div className="transactions-detail__item">
                      <span className="transactions-detail__label">Quantity</span>
                      <span className="transactions-detail__value">{row.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                    </div>
                    <div className="transactions-detail__item">
                      <span className="transactions-detail__label">Price</span>
                      <span className="transactions-detail__value">${row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="transactions-detail__item">
                      <span className="transactions-detail__label">Notional</span>
                      <span className="transactions-detail__value">${row.notional.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="transactions-detail__item transactions-detail__item--full">
                      <span className="transactions-detail__label">Notes</span>
                      <span className="transactions-detail__value">{row.notes || '—'}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}
      </div>

      {/* Column Customization Dialog */}
      {showColumnDialog && (
        <ColumnCustomizationDialog
          columns={TRANSACTION_COLUMNS}
          categories={TRANSACTION_CATEGORIES}
          preferences={preferences}
          onPreferencesChange={setPreferences}
          onClose={() => setShowColumnDialog(false)}
          defaultVisibleIds={DEFAULT_TRANSACTION_COLUMNS}
          title="Customize Transaction Columns"
        />
      )}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal 
          investments={investments}
          onAdd={addTransaction}
          onClose={() => setShowAddModal(false)} 
        />
      )}
    </div>
  );
}

function KpiTile({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="kpi-tile">
      <div className="kpi-tile__label">{label}</div>
      <div className="kpi-tile__value">{value}</div>
      <div className="kpi-tile__caption">{caption}</div>
    </div>
  );
}

function TransactionsFilterBar({
  filters,
  onChange,
  showAdvanced,
  onToggleAdvanced,
}: {
  filters: TransactionFilters;
  onChange: (updater: (prev: TransactionFilters) => TransactionFilters) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}) {
  const hasAnyFilters =
    Boolean(filters.text) ||
    filters.types.length > 0 ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    filters.minAbsNotional != null ||
    filters.maxAbsNotional != null;

  return (
    <div className="transactions-filterbar" aria-label="Transaction filters">
      <div className="transactions-filterbar__row">
        <div className="transactions-search" role="search">
          <Search size={14} className="transactions-search__icon" />
          <input
            type="text"
            className="form-input transactions-search__input"
            placeholder="Search symbol, name, notes…"
            value={filters.text}
            onChange={e => onChange(prev => ({ ...prev, text: e.target.value }))}
          />
          {filters.text && (
            <button
              type="button"
              className="btn btn--ghost btn--sm transactions-search__clear"
              onClick={() => onChange(prev => ({ ...prev, text: '' }))}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="transactions-typepills" aria-label="Transaction type filters">
          {(['buy', 'sell', 'dividend', 'split'] as TransactionType[]).map(type => {
            const active = filters.types.includes(type);
            return (
              <button
                key={type}
                type="button"
                className={`transactions-pill ${active ? 'transactions-pill--active' : ''}`}
                onClick={() =>
                  onChange(prev => ({
                    ...prev,
                    types: active ? prev.types.filter(t => t !== type) : [...prev.types, type],
                  }))
                }
              >
                {getTransactionTypeLabel(type)}
              </button>
            );
          })}
        </div>

        <div className="transactions-daterange" aria-label="Date range">
          <span className="transactions-daterange__label">Date</span>
          <input
            type="date"
            className="form-input transactions-input--sm"
            value={filters.dateFrom ?? ''}
            onChange={e => onChange(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
            aria-label="From date"
          />
          <span className="transactions-daterange__sep">–</span>
          <input
            type="date"
            className="form-input transactions-input--sm"
            value={filters.dateTo ?? ''}
            onChange={e => onChange(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
            aria-label="To date"
          />
        </div>

        <button type="button" className="btn btn--ghost btn--sm" onClick={onToggleAdvanced}>
          Advanced
          <ChevronDown size={14} className={showAdvanced ? 'rotate-180' : ''} />
        </button>
      </div>

      {showAdvanced && (
        <div className="transactions-filterbar__row transactions-filterbar__row--advanced" aria-label="Advanced filters">
          <div className="transactions-advanced">
            <div className="transactions-advanced__group">
              <span className="transactions-advanced__label">Notional</span>
              <input
                type="number"
                className="form-input transactions-input--sm transactions-input--w"
                placeholder="Min"
                value={filters.minAbsNotional ?? ''}
                onChange={e =>
                  onChange(prev => ({
                    ...prev,
                    minAbsNotional: e.target.value === '' ? undefined : Number(e.target.value),
                  }))
                }
              />
              <input
                type="number"
                className="form-input transactions-input--sm transactions-input--w"
                placeholder="Max"
                value={filters.maxAbsNotional ?? ''}
                onChange={e =>
                  onChange(prev => ({
                    ...prev,
                    maxAbsNotional: e.target.value === '' ? undefined : Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}

      {hasAnyFilters && (
        <div className="transactions-chips" aria-label="Active filters">
          {filters.text && (
            <span className="transactions-chip">
              Search: {filters.text}
              <button onClick={() => onChange(prev => ({ ...prev, text: '' }))} aria-label="Clear search">
                <X size={12} />
              </button>
            </span>
          )}
          {filters.types.length > 0 && (
            <span className="transactions-chip">
              Type: {filters.types.map(getTransactionTypeLabel).join(', ')}
              <button onClick={() => onChange(prev => ({ ...prev, types: [] }))} aria-label="Clear types">
                <X size={12} />
              </button>
            </span>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <span className="transactions-chip">
              Date: {filters.dateFrom ?? '…'} – {filters.dateTo ?? '…'}
              <button
                onClick={() => onChange(prev => ({ ...prev, dateFrom: undefined, dateTo: undefined }))}
                aria-label="Clear date range"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {(filters.minAbsNotional != null || filters.maxAbsNotional != null) && (
            <span className="transactions-chip">
              Notional: {filters.minAbsNotional != null ? `≥ ${filters.minAbsNotional}` : '…'} / {filters.maxAbsNotional != null ? `≤ ${filters.maxAbsNotional}` : '…'}
              <button
                onClick={() =>
                  onChange(prev => ({
                    ...prev,
                    minAbsNotional: undefined,
                    maxAbsNotional: undefined,
                  }))
                }
                aria-label="Clear notional range"
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button
            className="filter-clear"
            onClick={() =>
              onChange(() => ({
                text: '',
                types: [],
                dateFrom: undefined,
                dateTo: undefined,
                minAbsNotional: undefined,
                maxAbsNotional: undefined,
              }))
            }
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

function AddTransactionModal({
  investments, 
  onAdd, 
  onClose 
}: { 
  investments: { id: string; name: string; symbol: string; currentPrice: number }[];
  onAdd: (transaction: Omit<PortfolioTransaction, 'id'>) => Promise<PortfolioTransaction | null>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    investmentId: investments[0]?.id || '',
    type: 'buy' as 'buy' | 'sell' | 'dividend',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    fees: '',
    notes: '',
  });

  // Auto-fill price when investment selected
  const handleInvestmentChange = (id: string) => {
    const investment = investments.find(i => i.id === id);
    setForm({ 
      ...form, 
      investmentId: id,
      price: investment ? investment.currentPrice.toString() : '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onAdd({
      investmentId: form.investmentId,
      type: form.type,
      quantity: parseFloat(form.quantity),
      price: parseFloat(form.price),
      date: form.date,
      notes: form.notes || undefined,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Add Transaction</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Investment</label>
                <select
                  className="form-select"
                  value={form.investmentId}
                  onChange={e => handleInvestmentChange(e.target.value)}
                  required
                >
                  {investments.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.symbol} - {inv.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as 'buy' | 'sell' | 'dividend' })}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                  <option value="dividend">Dividend</option>
                </select>
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
                <label className="form-label">Price per Share</label>
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
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fees (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.fees}
                  onChange={e => setForm({ ...form, fees: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Add any notes about this transaction..."
                rows={3}
              />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Add Transaction</button>
          </div>
        </form>
      </div>
    </div>
  );
}
