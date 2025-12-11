/**
 * Features Index
 * 
 * Central export for all feature modules
 */

// Generic column customization system
export * from './columns';

// Feature-specific column definitions
export * from './positions';
export * from './transactions';
export * from './dividends';
export * from './performance';
export * from './risk';

// Watchlist module - exported separately to avoid conflicts
export {
  WATCHLIST_COLUMNS,
  COLUMN_CATEGORIES as WATCHLIST_COLUMN_CATEGORIES,
  getColumnById as getWatchlistColumnById,
  getColumnsByCategory as getWatchlistColumnsByCategory,
  getAvailableColumns as getAvailableWatchlistColumns,
  getDefaultVisibleColumns as getDefaultVisibleWatchlistColumns,
  getDefaultColumnOrder as getDefaultWatchlistColumnOrder,
  type WatchlistColumnId,
  type WatchlistColumnDef,
} from './watchlist';
