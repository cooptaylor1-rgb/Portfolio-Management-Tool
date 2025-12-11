/**
 * Generic Column Customization Types
 * 
 * Reusable types for column customization across all data tables
 */

/**
 * Column metadata definition
 */
export interface ColumnDef<TColumnId extends string = string> {
  /** Unique column identifier */
  id: TColumnId;
  /** Display label */
  label: string;
  /** Detailed description for tooltips */
  description?: string;
  /** Category for grouping in customization dialog */
  category: string;
  /** Whether column can be sorted */
  sortable?: boolean;
  /** Whether column is available (vs coming soon) */
  available?: boolean;
  /** Whether column is coming soon */
  comingSoon?: boolean;
  /** Whether column should be visible by default */
  defaultVisible?: boolean;
  /** Whether column can be hidden (some columns like ID are required) */
  hideable?: boolean;
  /** Column width in pixels */
  width?: number;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
  /** Data format type for cell rendering */
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'badge' | 'custom';
  /** Whether value can be negative (for conditional coloring) */
  canBeNegative?: boolean;
}

/**
 * User preferences for a specific table
 */
export interface TablePreferences<TColumnId extends string = string> {
  /** Array of visible column IDs in display order */
  visibleColumnIds: TColumnId[];
  /** Column display order (can differ from visibleColumnIds for hidden columns) */
  columnOrder: TColumnId[];
  /** Current sort configuration */
  sortBy?: {
    columnId: TColumnId;
    direction: 'asc' | 'desc';
  };
  /** Schema version for migrations */
  version: number;
}

/**
 * Column category for grouping in customization dialog
 */
export interface ColumnCategory {
  id: string;
  label: string;
  description?: string;
}

/**
 * Create a preferences storage key for a table
 */
export function createStorageKey(tableId: string): string {
  return `table_preferences_${tableId}_v1`;
}

/**
 * Get default preferences for a table
 */
export function getDefaultPreferences<TColumnId extends string>(
  columns: ColumnDef<TColumnId>[],
  defaultVisibleIds?: TColumnId[]
): TablePreferences<TColumnId> {
  const visibleColumnIds = defaultVisibleIds || 
    columns.filter(c => c.defaultVisible !== false && c.available !== false).map(c => c.id);
  
  return {
    visibleColumnIds,
    columnOrder: columns.map(c => c.id),
    version: 1,
  };
}

/**
 * Load preferences from localStorage
 */
export function loadTablePreferences<TColumnId extends string>(
  tableId: string,
  columns: ColumnDef<TColumnId>[],
  defaultVisibleIds?: TColumnId[]
): TablePreferences<TColumnId> {
  const key = createStorageKey(tableId);
  const defaults = getDefaultPreferences(columns, defaultVisibleIds);
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaults;
    
    const parsed = JSON.parse(stored) as TablePreferences<TColumnId>;
    
    // Validate stored column IDs still exist
    const validColumnIds = new Set(columns.map(c => c.id));
    const validVisibleIds = parsed.visibleColumnIds.filter(id => validColumnIds.has(id));
    const validColumnOrder = parsed.columnOrder.filter(id => validColumnIds.has(id));
    
    // Add any new columns that weren't in stored preferences
    columns.forEach(col => {
      if (!validColumnOrder.includes(col.id)) {
        validColumnOrder.push(col.id);
      }
    });
    
    return {
      ...parsed,
      visibleColumnIds: validVisibleIds.length > 0 ? validVisibleIds : defaults.visibleColumnIds,
      columnOrder: validColumnOrder,
    };
  } catch {
    return defaults;
  }
}

/**
 * Save preferences to localStorage
 */
export function saveTablePreferences<TColumnId extends string>(
  tableId: string,
  preferences: TablePreferences<TColumnId>
): void {
  const key = createStorageKey(tableId);
  try {
    localStorage.setItem(key, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save table preferences:', error);
  }
}

/**
 * Get columns in the order they should be displayed, filtered to visible only
 */
export function getOrderedVisibleColumns<TColumnId extends string>(
  columns: ColumnDef<TColumnId>[],
  preferences: TablePreferences<TColumnId>
): ColumnDef<TColumnId>[] {
  const columnMap = new Map(columns.map(c => [c.id, c]));
  const visibleSet = new Set(preferences.visibleColumnIds);
  
  return preferences.columnOrder
    .filter(id => visibleSet.has(id))
    .map(id => columnMap.get(id))
    .filter((col): col is ColumnDef<TColumnId> => col !== undefined && col.available !== false);
}

/**
 * Update sort in preferences
 */
export function updateSort<TColumnId extends string>(
  preferences: TablePreferences<TColumnId>,
  columnId: TColumnId
): TablePreferences<TColumnId> {
  const currentSort = preferences.sortBy;
  
  if (currentSort?.columnId === columnId) {
    // Toggle direction or clear
    if (currentSort.direction === 'asc') {
      return { ...preferences, sortBy: { columnId, direction: 'desc' } };
    } else {
      return { ...preferences, sortBy: undefined };
    }
  }
  
  return { ...preferences, sortBy: { columnId, direction: 'asc' } };
}

/**
 * Toggle column visibility
 */
export function toggleColumnVisibility<TColumnId extends string>(
  preferences: TablePreferences<TColumnId>,
  columnId: TColumnId
): TablePreferences<TColumnId> {
  const isVisible = preferences.visibleColumnIds.includes(columnId);
  
  if (isVisible) {
    return {
      ...preferences,
      visibleColumnIds: preferences.visibleColumnIds.filter(id => id !== columnId),
    };
  } else {
    // Add column back in its original order position
    const orderIndex = preferences.columnOrder.indexOf(columnId);
    const newVisibleIds = [...preferences.visibleColumnIds];
    
    // Find the right insertion point based on column order
    let insertIndex = newVisibleIds.length;
    for (let i = 0; i < newVisibleIds.length; i++) {
      const existingOrderIndex = preferences.columnOrder.indexOf(newVisibleIds[i]);
      if (existingOrderIndex > orderIndex) {
        insertIndex = i;
        break;
      }
    }
    
    newVisibleIds.splice(insertIndex, 0, columnId);
    return { ...preferences, visibleColumnIds: newVisibleIds };
  }
}

/**
 * Reorder columns via drag and drop
 */
export function reorderColumns<TColumnId extends string>(
  preferences: TablePreferences<TColumnId>,
  sourceIndex: number,
  destinationIndex: number
): TablePreferences<TColumnId> {
  const newVisibleIds = [...preferences.visibleColumnIds];
  const [removed] = newVisibleIds.splice(sourceIndex, 1);
  newVisibleIds.splice(destinationIndex, 0, removed);
  
  // Also update the full column order to reflect this change
  const sourceColumnId = preferences.visibleColumnIds[sourceIndex];
  const newColumnOrder = [...preferences.columnOrder];
  const orderSourceIndex = newColumnOrder.indexOf(sourceColumnId);
  
  if (orderSourceIndex !== -1) {
    newColumnOrder.splice(orderSourceIndex, 1);
    // Find where to insert based on destination
    const destColumnId = newVisibleIds[destinationIndex];
    let orderDestIndex = newColumnOrder.indexOf(destColumnId);
    if (orderDestIndex === -1) orderDestIndex = newColumnOrder.length;
    newColumnOrder.splice(orderDestIndex, 0, sourceColumnId);
  }
  
  return {
    ...preferences,
    visibleColumnIds: newVisibleIds,
    columnOrder: newColumnOrder,
  };
}
