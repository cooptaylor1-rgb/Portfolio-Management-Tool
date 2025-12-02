import { ReactNode } from 'react'
import { LoadingSkeleton } from './ui'

interface ChartContainerProps {
  title?: string
  subtitle?: string
  height?: number
  loading?: boolean
  error?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function ChartContainer({
  title,
  subtitle,
  height = 400,
  loading = false,
  error,
  actions,
  children,
  className = ''
}: ChartContainerProps) {
  return (
    <div className={`chart-container ${className}`}>
      {(title || subtitle || actions) && (
        <div className="chart-header">
          <div className="chart-header-content">
            {title && <h3 className="chart-title">{title}</h3>}
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="chart-actions">{actions}</div>}
        </div>
      )}
      
      <div className="chart-body" style={{ height: `${height}px` }}>
        {loading ? (
          <div className="chart-loading">
            <LoadingSkeleton height="100%" />
          </div>
        ) : error ? (
          <div className="chart-error">
            <p className="text-danger">{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

interface TimeRangeSelectorProps {
  value: string
  onChange: (value: string) => void
  ranges?: Array<{ value: string; label: string }>
}

export function TimeRangeSelector({ 
  value, 
  onChange,
  ranges = [
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
    { value: '6M', label: '6M' },
    { value: '1Y', label: '1Y' },
    { value: 'ALL', label: 'ALL' }
  ]
}: TimeRangeSelectorProps) {
  return (
    <div className="time-range-selector">
      {ranges.map(range => (
        <button
          key={range.value}
          className={`time-range-btn ${value === range.value ? 'active' : ''}`}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

interface ChartLegendItemProps {
  color: string
  label: string
  value: string | number
  percentage?: string
}

export function ChartLegendItem({ color, label, value, percentage }: ChartLegendItemProps) {
  return (
    <div className="chart-legend-item">
      <div className="chart-legend-color" style={{ backgroundColor: color }} />
      <div className="chart-legend-content">
        <span className="chart-legend-label">{label}</span>
        <div className="chart-legend-values">
          <span className="chart-legend-value">{value}</span>
          {percentage && <span className="chart-legend-percentage">{percentage}</span>}
        </div>
      </div>
    </div>
  )
}

interface ChartStatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: ReactNode
}

export function ChartStatCard({ label, value, change, changeType = 'neutral', icon }: ChartStatCardProps) {
  return (
    <div className="chart-stat-card">
      {icon && <div className="chart-stat-icon">{icon}</div>}
      <div className="chart-stat-content">
        <span className="chart-stat-label">{label}</span>
        <span className="chart-stat-value">{value}</span>
        {change && (
          <span className={`chart-stat-change chart-stat-change-${changeType}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  )
}
