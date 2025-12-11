/**
 * Watchlist User Preferences
 * 
 * Handles loading and saving user preferences for watchlist columns,
 * order, and sorting. Uses localStorage with a clean abstraction
 * for easy migration to an API-based solution.
 */

import { WatchlistColumnId, getDefaultVisibleColumns, getDefaultColumnOrder } from './columns';

// ============================================================================
// Types
// ============================================================================

export interface WatchlistPreferences {
  visibleColumnIds: WatchlistColumnId[];
  columnOrder: WatchlistColumnId[];
  sortBy?: {
    id: WatchlistColumnId;
    direction: 'asc' | 'desc';
  };
  version: number; // For migrations
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'watchlist_preferences_v1';
const CURRENT_VERSION = 1;

// ============================================================================
// Default Preferences
// ============================================================================

export function getDefaultPreferences(): WatchlistPreferences {
  return {
    visibleColumnIds: getDefaultVisibleColumns(),
    columnOrder: getDefaultColumnOrder(),
    sortBy: {
      id: 'addedAt',
      direction: 'desc',
    },
    version: CURRENT_VERSION,
  };
}

// ============================================================================
// Persistence Layer (localStorage implementation)
// Can be swapped for API-based implementation later
// ============================================================================

/**
 * Load watchlist preferences from storage
 */
export function loadWatchlistPreferences(userId?: string): WatchlistPreferences {
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return getDefaultPreferences();
    }
    
    const parsed = JSON.parse(stored) as WatchlistPreferences;
    
    // Validate and migrate if needed
    if (!parsed.version || parsed.version < CURRENT_VERSION) {
      return migratePreferences(parsed);
    }
    
    // Validate required fields
    if (!Array.isArray(parsed.visibleColumnIds) || !Array.isArray(parsed.columnOrder)) {
      return getDefaultPreferences();
    }
    
    // Ensure at least one column is visible
    if (parsed.visibleColumnIds.length === 0) {
      parsed.visibleColumnIds = ['symbol'];
    }
    
    return parsed;
  } catch (error) {
    console.warn('Failed to load watchlist preferences:', error);
    return getDefaultPreferences();
  }
}

/**
 * Save watchlist preferences to storage
 */
export function saveWatchlistPreferences(
  prefs: WatchlistPreferences,
  userId?: string
): boolean {
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    
    // Validate before saving
    if (!prefs.visibleColumnIds || prefs.visibleColumnIds.length === 0) {
      console.warn('Cannot save preferences with no visible columns');
      return false;
    }
    
    // Ensure version is set
    prefs.version = CURRENT_VERSION;
    
    localStorage.setItem(key, JSON.stringify(prefs));
    return true;
  } catch (error) {
    console.warn('Failed to save watchlist preferences:', error);
    return false;
  }
}

/**
 * Reset preferences to defaults
 */
export function resetWatchlistPreferences(userId?: string): WatchlistPreferences {
  const defaults = getDefaultPreferences();
  saveWatchlistPreferences(defaults, userId);
  return defaults;
}

/**
 * Migrate old preferences format to new version
 */
function migratePreferences(old: Partial<WatchlistPreferences>): WatchlistPreferences {
  const defaults = getDefaultPreferences();
  
  return {
    visibleColumnIds: old.visibleColumnIds?.length ? old.visibleColumnIds : defaults.visibleColumnIds,
    columnOrder: old.columnOrder?.length ? old.columnOrder : defaults.columnOrder,
    sortBy: old.sortBy || defaults.sortBy,
    version: CURRENT_VERSION,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Update visible columns while preserving order
 */
export function updateVisibleColumns(
  prefs: WatchlistPreferences,
  columnId: WatchlistColumnId,
  visible: boolean
): WatchlistPreferences {
  const newVisible = visible
    ? [...prefs.visibleColumnIds, columnId]
    : prefs.visibleColumnIds.filter(id => id !== columnId);
  
  // Ensure at least one column remains visible
  if (newVisible.length === 0) {
    return prefs;
  }
  
  // Update column order to include new column at the end if not present
  let newOrder = [...prefs.columnOrder];
  if (visible && !newOrder.includes(columnId)) {
    newOrder.push(columnId);
  }
  
  return {
    ...prefs,
    visibleColumnIds: newVisible,
    columnOrder: newOrder,
  };
}

/**
 * Reorder columns
 */
export function reorderColumns(
  prefs: WatchlistPreferences,
  fromIndex: number,
  toIndex: number
): WatchlistPreferences {
  const visibleInOrder = getOrderedVisibleColumns(prefs);
  const [moved] = visibleInOrder.splice(fromIndex, 1);
  visibleInOrder.splice(toIndex, 0, moved);
  
  return {
    ...prefs,
    columnOrder: visibleInOrder,
  };
}

/**
 * Get visible columns in their display order
 */
export function getOrderedVisibleColumns(prefs: WatchlistPreferences): WatchlistColumnId[] {
  // Get columns that are both visible and in the order array
  const ordered = prefs.columnOrder.filter(id => prefs.visibleColumnIds.includes(id));
  
  // Add any visible columns not in order (append at end)
  const remaining = prefs.visibleColumnIds.filter(id => !ordered.includes(id));
  
  return [...ordered, ...remaining];
}

/**
 * Update sort settings
 */
export function updateSort(
  prefs: WatchlistPreferences,
  columnId: WatchlistColumnId
): WatchlistPreferences {
  if (prefs.sortBy?.id === columnId) {
    // Toggle direction
    return {
      ...prefs,
      sortBy: {
        id: columnId,
        direction: prefs.sortBy.direction === 'asc' ? 'desc' : 'asc',
      },
    };
  }
  
  // New sort column, default to descending
  return {
    ...prefs,
    sortBy: {
      id: columnId,
      direction: 'desc',
    },
  };
}
