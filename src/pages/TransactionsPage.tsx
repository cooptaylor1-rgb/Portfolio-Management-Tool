/**
 * Transactions Page
 * 
 * Complete transaction history with filtering, sorting, and CRUD operations
 */

import { useState, useMemo } from 'react';
import { Plus, Download, Filter, ArrowUpRight, ArrowDownRight, Coins, Search } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { DataTable } from '../components/ui';
import { ColumnDef } from '@tanstack/react-table';
import type { Transaction } from '../types';
import './pages.css';

const TYPE_CONFIG = {
  buy: { icon: ArrowUpRight, color: '#3fb950', label: 'Buy' },
  sell: { icon: ArrowDownRight, color: '#f85149', label: 'Sell' },
  dividend: { icon: Coins, color: '#58a6ff', label: 'Dividend' },
};

export default function TransactionsPage() {
  const { transactions, investments, addTransaction } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Create lookup for investment names
  const investmentLookup = useMemo(() => {
    const lookup: Record<string, { name: string; symbol: string }> = {};
    investments.forEach(inv => {
      lookup[inv.id] = { name: inv.name, symbol: inv.symbol };
    });
    return lookup;
  }, [investments]);

  // Filter and enrich transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .map(t => ({
        ...t,
        investmentName: investmentLookup[t.investmentId]?.name || 'Unknown',
        symbol: investmentLookup[t.investmentId]?.symbol || '???',
        total: t.quantity * t.price + (t.fees || 0),
      }))
      .filter(t => {
        const matchesSearch = 
          t.investmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, investmentLookup, searchTerm, typeFilter]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const buys = filteredTransactions.filter(t => t.type === 'buy');
    const sells = filteredTransactions.filter(t => t.type === 'sell');
    const dividends = filteredTransactions.filter(t => t.type === 'dividend');
    
    return {
      totalTransactions: filteredTransactions.length,
      totalBuys: buys.reduce((sum, t) => sum + t.total, 0),
      totalSells: sells.reduce((sum, t) => sum + t.total, 0),
      totalDividends: dividends.reduce((sum, t) => sum + t.total, 0),
    };
  }, [filteredTransactions]);

  const columns: ColumnDef<typeof filteredTransactions[0]>[] = [
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'date',
      cell: (info) => {
        const row = info.row.original;
        return (
          <span className="transaction-date">
            {new Date(row.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        );
      },
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      cell: (info) => {
        const row = info.row.original;
        const config = TYPE_CONFIG[row.type];
        const Icon = config.icon;
        return (
          <span className="transaction-type" style={{ color: config.color }}>
            <Icon size={14} />
            {config.label}
          </span>
        );
      },
    },
    {
      id: 'investment',
      header: 'Investment',
      accessorKey: 'symbol',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="transaction-investment">
            <span className="transaction-symbol">{row.symbol}</span>
            <span className="transaction-name">{row.investmentName}</span>
          </div>
        );
      },
    },
    {
      id: 'quantity',
      header: 'Quantity',
      accessorKey: 'quantity',
      cell: (info) => {
        const row = info.row.original;
        return row.quantity?.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? '-';
      },
    },
    {
      id: 'price',
      header: 'Price',
      accessorKey: 'price',
      cell: (info) => {
        const row = info.row.original;
        return row.price != null ? `$${row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
      },
    },
    {
      id: 'fees',
      header: 'Fees',
      accessorKey: 'fees',
      cell: (info) => {
        const row = info.row.original;
        return row.fees ? `$${row.fees.toFixed(2)}` : '-';
      },
    },
    {
      id: 'total',
      header: 'Total',
      accessorKey: 'total',
      cell: (info) => {
        const row = info.row.original;
        return (
          <span className={row.type === 'sell' ? 'text-positive' : row.type === 'buy' ? 'text-negative' : 'text-highlight'}>
            {row.type === 'sell' ? '+' : row.type === 'buy' ? '-' : '+'}
            ${row.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
          </span>
        );
      },
    },
    {
      id: 'notes',
      header: 'Notes',
      accessorKey: 'notes',
      cell: (info) => {
        const row = info.row.original;
        return (
          <span className="transaction-notes" title={row.notes}>
            {row.notes || '-'}
          </span>
        );
      },
    },
  ];

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Symbol', 'Name', 'Quantity', 'Price', 'Fees', 'Total', 'Notes'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type,
      t.symbol,
      t.investmentName,
      t.quantity,
      t.price,
      t.fees || 0,
      t.total,
      t.notes || '',
    ]);
    
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
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Transactions</h1>
          <p className="page__subtitle">
            {filteredTransactions.length} transactions
          </p>
        </div>
        <div className="page__actions">
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

      {/* Summary Cards */}
      <div className="transaction-summary">
        <div className="summary-card">
          <span className="summary-card__label">Total Bought</span>
          <span className="summary-card__value text-negative">
            ${summaryStats.totalBuys.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-card__label">Total Sold</span>
          <span className="summary-card__value text-positive">
            ${summaryStats.totalSells.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-card__label">Dividends Received</span>
          <span className="summary-card__value text-highlight">
            ${summaryStats.totalDividends.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="page__filters">
        <div className="search-input">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Types</option>
            <option value="buy">Buys Only</option>
            <option value="sell">Sells Only</option>
            <option value="dividend">Dividends Only</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <section className="card">
        <div className="card__body card__body--flush">
          <DataTable
            data={filteredTransactions}
            columns={columns}
            pageSize={20}
          />
        </div>
      </section>

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

function AddTransactionModal({ 
  investments, 
  onAdd, 
  onClose 
}: { 
  investments: { id: string; name: string; symbol: string; currentPrice: number }[];
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
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
    onAdd({
      investmentId: form.investmentId,
      type: form.type,
      quantity: parseFloat(form.quantity),
      price: parseFloat(form.price),
      date: form.date,
      fees: form.fees ? parseFloat(form.fees) : undefined,
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
