import { Alert } from '../types'
import { Bell, X, AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface AlertsPanelProps {
  alerts: Alert[]
  onDismiss: (id: string) => void
  onMarkRead: (id: string) => void
}

export default function AlertsPanel({ alerts, onDismiss, onMarkRead }: AlertsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.read
    if (filter === 'critical') return alert.severity === 'critical'
    return true
  })

  const unreadCount = alerts.filter(a => !a.read).length
  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle size={20} />
      case 'warning': return <AlertTriangle size={20} />
      case 'info': return <Info size={20} />
      default: return <Bell size={20} />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'warning': return '#f59e0b'
      case 'info': return '#3b82f6'
      default: return '#6b7280'
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <h3>
          <Bell size={24} />
          Alerts & Notifications
          {unreadCount > 0 && <span className="alert-badge">{unreadCount}</span>}
        </h3>
        <div className="alert-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({alerts.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button 
            className={`filter-btn ${filter === 'critical' ? 'active' : ''}`}
            onClick={() => setFilter('critical')}
          >
            Critical ({criticalCount})
          </button>
        </div>
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="alerts-empty">
            <CheckCircle size={48} />
            <p>No alerts to show</p>
            <span>You're all caught up!</span>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id} 
              className={`alert-item ${alert.read ? 'read' : 'unread'}`}
              onClick={() => !alert.read && onMarkRead(alert.id)}
            >
              <div 
                className="alert-icon" 
                style={{ background: getSeverityColor(alert.severity) }}
              >
                {getIcon(alert.severity)}
              </div>
              <div className="alert-content">
                <div className="alert-header-row">
                  <h4>{alert.title}</h4>
                  <button 
                    className="alert-dismiss"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDismiss(alert.id)
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <p>{alert.message}</p>
                <div className="alert-meta">
                  <span className="alert-time">{formatTime(alert.date)}</span>
                  <span className="alert-type">{alert.type}</span>
                  {alert.actionable && (
                    <span className="alert-actionable">Action Required</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
