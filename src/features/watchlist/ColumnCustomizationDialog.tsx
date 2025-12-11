/**
 * Column Customization Dialog
 * 
 * Allows users to:
 * - Toggle column visibility
 * - Reorder visible columns
 * - Reset to defaults
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  X,
  GripVertical,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Search,
  Info,
  Clock,
} from 'lucide-react';
import {
  WatchlistColumnId,
  WatchlistColumnDef,
  WATCHLIST_COLUMNS,
  COLUMN_CATEGORIES,
  ColumnCategory,
} from './columns';
import {
  WatchlistPreferences,
  getDefaultPreferences,
  getOrderedVisibleColumns,
} from './preferences';

interface ColumnCustomizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: WatchlistPreferences;
  onSave: (prefs: WatchlistPreferences) => void;
}

export function ColumnCustomizationDialog({
  isOpen,
  onClose,
  preferences,
  onSave,
}: ColumnCustomizationDialogProps) {
  // Local state for editing
  const [localPrefs, setLocalPrefs] = useState<WatchlistPreferences>(preferences);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<ColumnCategory>>(
    new Set(['identity', 'price_performance', 'user_defined'])
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset local state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalPrefs(preferences);
      setSearchTerm('');
    }
  }, [isOpen, preferences]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Get ordered visible columns
  const orderedVisible = useMemo(() => 
    getOrderedVisibleColumns(localPrefs),
    [localPrefs]
  );

  // Filter columns by search
  const filteredColumns = useMemo(() => {
    if (!searchTerm) return WATCHLIST_COLUMNS;
    const term = searchTerm.toLowerCase();
    return WATCHLIST_COLUMNS.filter(col =>
      col.label.toLowerCase().includes(term) ||
      col.shortLabel?.toLowerCase().includes(term) ||
      col.description?.toLowerCase().includes(term) ||
      col.id.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Group columns by category
  const columnsByCategory = useMemo(() => {
    const groups = new Map<ColumnCategory, WatchlistColumnDef[]>();
    for (const col of filteredColumns) {
      const existing = groups.get(col.category) || [];
      groups.set(col.category, [...existing, col]);
    }
    return groups;
  }, [filteredColumns]);

  // Handlers
  const toggleColumn = useCallback((columnId: WatchlistColumnId) => {
    setLocalPrefs(prev => {
      const isVisible = prev.visibleColumnIds.includes(columnId);
      
      if (isVisible) {
        // Don't allow removing the last column
        if (prev.visibleColumnIds.length === 1) return prev;
        return {
          ...prev,
          visibleColumnIds: prev.visibleColumnIds.filter(id => id !== columnId),
          columnOrder: prev.columnOrder.filter(id => id !== columnId),
        };
      } else {
        return {
          ...prev,
          visibleColumnIds: [...prev.visibleColumnIds, columnId],
          columnOrder: [...prev.columnOrder, columnId],
        };
      }
    });
  }, []);

  const toggleCategory = useCallback((category: ColumnCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setLocalPrefs(prev => {
        const newOrder = [...orderedVisible];
        const [moved] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(dragOverIndex, 0, moved);
        return {
          ...prev,
          columnOrder: newOrder,
        };
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, orderedVisible]);

  const moveColumn = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= orderedVisible.length) return;
    
    setLocalPrefs(prev => {
      const newOrder = [...orderedVisible];
      const [moved] = newOrder.splice(index, 1);
      newOrder.splice(newIndex, 0, moved);
      return {
        ...prev,
        columnOrder: newOrder,
      };
    });
  }, [orderedVisible]);

  const resetToDefaults = useCallback(() => {
    if (window.confirm('Reset column settings to defaults?')) {
      setLocalPrefs(getDefaultPreferences());
    }
  }, []);

  const handleSave = useCallback(() => {
    onSave(localPrefs);
    onClose();
  }, [localPrefs, onSave, onClose]);

  const visibleCount = localPrefs.visibleColumnIds.length;
  const totalCount = WATCHLIST_COLUMNS.length;
  const availableCount = WATCHLIST_COLUMNS.filter(c => c.available).length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        ref={dialogRef}
        className="column-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="column-dialog-title"
      >
        {/* Header */}
        <div className="column-dialog__header">
          <div>
            <h2 id="column-dialog-title" className="column-dialog__title">
              Customize Columns
            </h2>
            <p className="column-dialog__subtitle">
              Configure visible columns to match your investment process
            </p>
          </div>
          <button className="column-dialog__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="column-dialog__content">
          {/* Left Panel - Active Columns */}
          <div className="column-dialog__panel column-dialog__panel--active">
            <div className="column-dialog__panel-header">
              <h3>Active Columns</h3>
              <span className="column-dialog__count">{visibleCount} columns</span>
            </div>
            <p className="column-dialog__hint">
              Drag to reorder. These columns will appear in your watchlist.
            </p>
            
            <div className="column-dialog__active-list">
              {orderedVisible.map((columnId, index) => {
                const col = WATCHLIST_COLUMNS.find(c => c.id === columnId);
                if (!col) return null;
                
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;
                
                return (
                  <div
                    key={columnId}
                    className={`column-dialog__active-item ${isDragging ? 'column-dialog__active-item--dragging' : ''} ${isDragOver ? 'column-dialog__active-item--drag-over' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver(index);
                    }}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="column-dialog__drag-handle">
                      <GripVertical size={14} />
                    </div>
                    <div className="column-dialog__active-info">
                      <span className="column-dialog__active-label">
                        {col.shortLabel || col.label}
                      </span>
                      {col.comingSoon && (
                        <span className="column-dialog__coming-soon">
                          <Clock size={10} />
                        </span>
                      )}
                    </div>
                    <div className="column-dialog__active-actions">
                      <button
                        className="column-dialog__move-btn"
                        onClick={() => moveColumn(index, 'up')}
                        disabled={index === 0}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className="column-dialog__move-btn"
                        onClick={() => moveColumn(index, 'down')}
                        disabled={index === orderedVisible.length - 1}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <button
                        className="column-dialog__remove-btn"
                        onClick={() => toggleColumn(columnId)}
                        disabled={visibleCount === 1}
                        aria-label="Remove column"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Available Columns */}
          <div className="column-dialog__panel column-dialog__panel--available">
            <div className="column-dialog__panel-header">
              <h3>Available Columns</h3>
              <span className="column-dialog__count">{availableCount} / {totalCount}</span>
            </div>
            
            {/* Search */}
            <div className="column-dialog__search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search columns..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="column-dialog__categories">
              {COLUMN_CATEGORIES.map(category => {
                const columns = columnsByCategory.get(category.id) || [];
                if (columns.length === 0) return null;
                
                const isExpanded = expandedCategories.has(category.id);
                const visibleInCategory = columns.filter(c => 
                  localPrefs.visibleColumnIds.includes(c.id)
                ).length;
                
                return (
                  <div key={category.id} className="column-dialog__category">
                    <button
                      className="column-dialog__category-header"
                      onClick={() => toggleCategory(category.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="column-dialog__category-label">{category.label}</span>
                      <span className="column-dialog__category-count">
                        {visibleInCategory} / {columns.length}
                      </span>
                    </button>
                    
                    {isExpanded && (
                      <div className="column-dialog__category-columns">
                        {columns.map(col => {
                          const isVisible = localPrefs.visibleColumnIds.includes(col.id);
                          const isDisabled = !col.available;
                          
                          return (
                            <div
                              key={col.id}
                              className={`column-dialog__column ${isVisible ? 'column-dialog__column--visible' : ''} ${isDisabled ? 'column-dialog__column--disabled' : ''}`}
                            >
                              <button
                                className="column-dialog__column-toggle"
                                onClick={() => !isDisabled && toggleColumn(col.id)}
                                disabled={isDisabled || (isVisible && visibleCount === 1)}
                                aria-pressed={isVisible}
                              >
                                <span className={`column-dialog__checkbox ${isVisible ? 'column-dialog__checkbox--checked' : ''}`}>
                                  {isVisible && <Check size={12} />}
                                </span>
                                <span className="column-dialog__column-label">
                                  {col.label}
                                </span>
                                {col.comingSoon && (
                                  <span className="column-dialog__badge column-dialog__badge--soon">
                                    Soon
                                  </span>
                                )}
                              </button>
                              {col.description && (
                                <div className="column-dialog__column-desc" title={col.description}>
                                  <Info size={12} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="column-dialog__footer">
          <button className="btn btn--ghost" onClick={resetToDefaults}>
            <RotateCcw size={14} />
            Reset to Defaults
          </button>
          <div className="column-dialog__footer-actions">
            <button className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn--primary" onClick={handleSave}>
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
