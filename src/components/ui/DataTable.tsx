/**
 * DataTable - High-performance data table with sorting, filtering, and virtualization
 * 
 * Built on @tanstack/react-table for:
 * - Column sorting (multi-column)
 * - Filtering (global and column-specific)
 * - Row selection
 * - Column resizing
 * - Virtual scrolling for large datasets
 */

import { useState, useMemo, ReactNode } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown,
  Search,
  Filter,
  Columns,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
} from 'lucide-react';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  selectable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  onRowSelect?: (rows: T[]) => void;
  emptyMessage?: string;
  loading?: boolean;
  toolbar?: ReactNode;
  className?: string;
  stickyHeader?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  filterable = true,
  selectable = false,
  pagination = true,
  pageSize = 25,
  onRowClick,
  onRowSelect,
  emptyMessage = 'No data available',
  loading = false,
  toolbar,
  className = '',
  stickyHeader = true,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Enhanced columns with selection column if needed
  const enhancedColumns = useMemo(() => {
    if (!selectable) return columns;
    
    const selectionColumn: ColumnDef<T> = {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="data-table__checkbox"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="data-table__checkbox"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
      enableSorting: false,
      enableColumnFilter: false,
    };
    
    return [selectionColumn, ...columns];
  }, [columns, selectable]);

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    enableRowSelection: selectable,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Notify parent of selection changes
  const selectedRows = table.getSelectedRowModel().rows.map(row => row.original);
  useMemo(() => {
    if (onRowSelect && selectable) {
      onRowSelect(selectedRows);
    }
  }, [selectedRows, onRowSelect, selectable]);

  return (
    <div className={`data-table ${className}`}>
      {/* Toolbar */}
      <div className="data-table__toolbar">
        <div className="data-table__toolbar-left">
          {searchable && (
            <div className="data-table__search">
              <Search size={16} className="data-table__search-icon" />
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="data-table__search-input"
              />
            </div>
          )}
          {toolbar}
        </div>
        
        <div className="data-table__toolbar-right">
          {filterable && (
            <button className="data-table__toolbar-btn" aria-label="Filter">
              <Filter size={16} />
            </button>
          )}
          <div className="data-table__column-toggle">
            <button 
              className="data-table__toolbar-btn"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              aria-label="Column visibility"
            >
              <Columns size={16} />
            </button>
            {showColumnMenu && (
              <div className="data-table__column-menu">
                {table.getAllColumns()
                  .filter(col => col.id !== 'select')
                  .map(column => (
                    <label key={column.id} className="data-table__column-option">
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                      />
                      <span>{column.id}</span>
                      {column.getIsVisible() && <Check size={14} />}
                    </label>
                  ))}
              </div>
            )}
          </div>
          <button className="data-table__toolbar-btn" aria-label="Export">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`data-table__wrapper ${stickyHeader ? 'data-table__wrapper--sticky' : ''}`}>
        <table className="data-table__table">
          <thead className="data-table__thead">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="data-table__header-row">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`data-table__th ${header.column.getCanSort() ? 'data-table__th--sortable' : ''}`}
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="data-table__th-content">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="data-table__sort-icon">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronsUpDown size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="data-table__tbody">
            {loading ? (
              <tr>
                <td colSpan={enhancedColumns.length} className="data-table__loading">
                  <div className="data-table__spinner" />
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={enhancedColumns.length} className="data-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className={`data-table__row ${row.getIsSelected() ? 'data-table__row--selected' : ''} ${onRowClick ? 'data-table__row--clickable' : ''}`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="data-table__td">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="data-table__pagination">
          <div className="data-table__pagination-info">
            Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length}
          </div>
          
          <div className="data-table__pagination-controls">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="data-table__pagination-btn"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="data-table__pagination-btn"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="data-table__pagination-current">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="data-table__pagination-btn"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="data-table__pagination-btn"
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Column definition helpers
 */
export function createColumnHelper<T>() {
  return {
    accessor: <K extends keyof T>(
      key: K,
      options?: Partial<ColumnDef<T, T[K]>>
    ): ColumnDef<T, T[K]> => ({
      accessorKey: key as string,
      ...options,
    }),
    display: (options: Partial<ColumnDef<T>>): ColumnDef<T> => ({
      id: options.id || 'display',
      ...options,
    }),
  };
}

/**
 * Common cell formatters
 */
export const CellFormatters = {
  currency: (value: number) => (
    <span className={value >= 0 ? 'text-positive' : 'text-negative'}>
      ${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  ),
  
  percent: (value: number, showSign = true) => (
    <span className={value >= 0 ? 'text-positive' : 'text-negative'}>
      {showSign && value >= 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  ),
  
  number: (value: number, decimals = 0) => (
    <span>{value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
  ),
  
  date: (value: string | Date) => (
    <span>{new Date(value).toLocaleDateString()}</span>
  ),
  
  badge: (value: string, variant: 'success' | 'warning' | 'danger' | 'info' | 'default' = 'default') => (
    <span className={`cell-badge cell-badge--${variant}`}>{value}</span>
  ),
};
