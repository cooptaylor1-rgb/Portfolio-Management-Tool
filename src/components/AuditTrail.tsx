import { useState } from 'react';
import { Clock, User, FileText, Filter } from 'lucide-react';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: 'add' | 'edit' | 'delete' | 'trade' | 'rebalance';
  entity: string;
  before?: any;
  after?: any;
  comment?: string;
}

interface AuditTrailProps {
  entries: AuditEntry[];
  maxHeight?: string;
}

export function AuditTrail({ entries, maxHeight = '400px' }: AuditTrailProps) {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter(entry => {
    const matchesAction = filterAction === 'all' || entry.action === filterAction;
    const matchesSearch = !searchQuery || 
      entry.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.user.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'add': return 'success';
      case 'edit': return 'warning';
      case 'delete': return 'danger';
      case 'trade': return 'info';
      case 'rebalance': return 'primary';
      default: return 'neutral';
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="audit-trail">
      <div className="audit-trail-header">
        <h3><FileText size={20} /> Activity Log</h3>
        <div className="audit-trail-filters">
          <div className="audit-search">
            <Filter size={16} />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            className="audit-filter-select"
          >
            <option value="all">All Actions</option>
            <option value="add">Add</option>
            <option value="edit">Edit</option>
            <option value="delete">Delete</option>
            <option value="trade">Trade</option>
            <option value="rebalance">Rebalance</option>
          </select>
        </div>
      </div>

      <div className="audit-trail-list" style={{ maxHeight }}>
        {filteredEntries.length === 0 ? (
          <div className="audit-empty">No activity found</div>
        ) : (
          filteredEntries.map(entry => (
            <div key={entry.id} className="audit-entry">
              <div className="audit-entry-header">
                <span className={`audit-badge audit-badge-${getActionColor(entry.action)}`}>
                  {entry.action.toUpperCase()}
                </span>
                <span className="audit-timestamp">
                  <Clock size={14} />
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
              
              <div className="audit-entry-body">
                <div className="audit-user">
                  <User size={14} />
                  <strong>{entry.user}</strong>
                </div>
                <div className="audit-entity">{entry.entity}</div>
                
                {entry.before && entry.after && (
                  <div className="audit-changes">
                    <div className="audit-change-row">
                      <span className="audit-change-label">Before:</span>
                      <span className="audit-change-value">{JSON.stringify(entry.before)}</span>
                    </div>
                    <div className="audit-change-row">
                      <span className="audit-change-label">After:</span>
                      <span className="audit-change-value">{JSON.stringify(entry.after)}</span>
                    </div>
                  </div>
                )}
                
                {entry.comment && (
                  <div className="audit-comment">"{entry.comment}"</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
