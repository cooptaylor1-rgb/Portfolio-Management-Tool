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

import { useMemo, useState } from 'react';
import { Plus, Download, Filter, RefreshCw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, CellFormatters } from '../components/ui';
import { useShell } from '../layouts';
import { usePortfolio } from '../contexts/PortfolioContext';
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

  // Format currency for display
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const columns = useMemo<ColumnDef<Position>[]>(() => [
    {
      accessorKey: 'symbol',
      header: 'Symbol',
      cell: ({ row }) => (
        <div className="dashboard__position-symbol">
          <span className="dashboard__position-ticker">{row.original.symbol}</span>
          <span className="dashboard__position-name">{row.original.name}</span>
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: 'quantity',
      header: 'Shares',
      cell: ({ getValue }) => CellFormatters.number(getValue() as number),
      size: 100,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
      size: 100,
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      size: 120,
    },
    {
      accessorKey: 'costBasis',
      header: 'Cost Basis',
      cell: ({ getValue }) => formatCurrency(getValue() as number),
      size: 120,
    },
    {
      accessorKey: 'gainPercent',
      header: 'Total Return',
      cell: ({ getValue }) => CellFormatters.percent(getValue() as number),
      size: 110,
    },
    {
      accessorKey: 'dayChangePercent',
      header: 'Day Change',
      cell: ({ getValue }) => CellFormatters.percent(getValue() as number),
      size: 100,
    },
    {
      accessorKey: 'weight',
      header: 'Weight',
      cell: ({ getValue }) => `${(getValue() as number).toFixed(1)}%`,
      size: 80,
    },
    {
      accessorKey: 'sector',
      header: 'Sector',
      cell: ({ getValue }) => CellFormatters.badge(getValue() as string, 'default'),
      size: 120,
    },
  ], []);

  const handleRowClick = (position: Position) => {
    openDetailsPanel({
      type: 'position',
      data: {
        ...position,
      },
    });
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Symbol', 'Name', 'Shares', 'Price', 'Value', 'Cost Basis', 'Gain', 'Gain %', 'Weight', 'Sector'];
    const rows = positions.map(p => [
      p.symbol,
      p.name,
      p.quantity,
      p.price.toFixed(2),
      p.value.toFixed(2),
      p.costBasis.toFixed(2),
      p.gain.toFixed(2),
      p.gainPercent.toFixed(2),
      p.weight.toFixed(2),
      p.sector,
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `positions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

      {positions.length > 0 ? (
        <DataTable
          data={positions}
          columns={columns}
          searchPlaceholder="Search positions..."
          onRowClick={handleRowClick}
          pagination
          pageSize={25}
        />
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
    </div>
  );
}
