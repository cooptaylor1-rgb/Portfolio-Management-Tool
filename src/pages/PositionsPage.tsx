/**
 * Positions Page
 * 
 * Full data table of all positions with:
 * - Sorting, filtering, search
 * - Column customization
 * - Export functionality
 * - Click to open details panel
 */

import { useMemo } from 'react';
import { Plus, Download, Filter } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, CellFormatters } from '../components/ui';
import { useShell } from '../layouts';
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
}

// Mock data - replace with API
const mockPositions: Position[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', quantity: 150, price: 195.50, value: 29325, costBasis: 24500, gain: 4825, gainPercent: 19.69, dayChange: 2.34, dayChangePercent: 1.21, weight: 15.8, sector: 'Technology' },
  { id: '2', symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 85, price: 420.30, value: 35725.50, costBasis: 30000, gain: 5725.50, gainPercent: 19.08, dayChange: -1.20, dayChangePercent: -0.28, weight: 12.8, sector: 'Technology' },
  { id: '3', symbol: 'GOOGL', name: 'Alphabet Inc.', quantity: 45, price: 175.80, value: 7911, costBasis: 6500, gain: 1411, gainPercent: 21.71, dayChange: 3.45, dayChangePercent: 2.00, weight: 10.8, sector: 'Technology' },
  { id: '4', symbol: 'AMZN', name: 'Amazon.com Inc.', quantity: 60, price: 185.20, value: 11112, costBasis: 9800, gain: 1312, gainPercent: 13.39, dayChange: -0.85, dayChangePercent: -0.46, weight: 9.4, sector: 'Consumer' },
  { id: '5', symbol: 'NVDA', name: 'NVIDIA Corp.', quantity: 30, price: 875.50, value: 26265, costBasis: 18000, gain: 8265, gainPercent: 45.92, dayChange: 15.30, dayChangePercent: 1.78, weight: 8.7, sector: 'Technology' },
  { id: '6', symbol: 'META', name: 'Meta Platforms Inc.', quantity: 40, price: 505.40, value: 20216, costBasis: 17500, gain: 2716, gainPercent: 15.52, dayChange: 8.20, dayChangePercent: 1.65, weight: 7.2, sector: 'Technology' },
  { id: '7', symbol: 'JNJ', name: 'Johnson & Johnson', quantity: 70, price: 155.80, value: 10906, costBasis: 11200, gain: -294, gainPercent: -2.62, dayChange: 0.45, dayChangePercent: 0.29, weight: 5.5, sector: 'Healthcare' },
  { id: '8', symbol: 'V', name: 'Visa Inc.', quantity: 35, price: 280.60, value: 9821, costBasis: 8400, gain: 1421, gainPercent: 16.92, dayChange: 1.80, dayChangePercent: 0.65, weight: 4.8, sector: 'Finance' },
  { id: '9', symbol: 'UNH', name: 'UnitedHealth Group', quantity: 20, price: 520.30, value: 10406, costBasis: 9500, gain: 906, gainPercent: 9.54, dayChange: -3.20, dayChangePercent: -0.61, weight: 4.5, sector: 'Healthcare' },
  { id: '10', symbol: 'HD', name: 'Home Depot Inc.', quantity: 25, price: 345.60, value: 8640, costBasis: 7800, gain: 840, gainPercent: 10.77, dayChange: 2.10, dayChangePercent: 0.61, weight: 3.8, sector: 'Consumer' },
];

export default function PositionsPage() {
  const { openDetailsPanel } = useShell();

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
      cell: ({ getValue }) => CellFormatters.currency(getValue() as number),
      size: 120,
    },
    {
      accessorKey: 'costBasis',
      header: 'Cost Basis',
      cell: ({ getValue }) => `$${(getValue() as number).toLocaleString()}`,
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

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Positions</h1>
          <p className="page__subtitle">{mockPositions.length} holdings • $185,327 total value</p>
        </div>
        <div className="page__actions">
          <button className="btn">
            <Filter size={16} />
            Filter
          </button>
          <button className="btn">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn--primary">
            <Plus size={16} />
            Add Position
          </button>
        </div>
      </div>

      <DataTable
        data={mockPositions}
        columns={columns}
        searchPlaceholder="Search positions..."
        onRowClick={handleRowClick}
        pagination
        pageSize={25}
      />
    </div>
  );
}
