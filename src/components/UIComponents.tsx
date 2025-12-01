import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export function Sparkline({ data, width = 80, height = 30, color = '#3b82f6', showDots = false }: SparklineProps) {
  const { path, points } = useMemo(() => {
    if (data.length < 2) return { path: '', points: [] };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    const xStep = width / (data.length - 1);
    
    const pathData = data.map((value, index) => {
      const x = index * xStep;
      const y = height - ((value - min) / range) * height;
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');

    const pointsData = data.map((value, index) => ({
      x: index * xStep,
      y: height - ((value - min) / range) * height
    }));

    return { path: pathData, points: pointsData };
  }, [data, width, height]);

  if (data.length < 2) {
    return <div className="sparkline-empty" style={{ width, height }}>—</div>;
  }

  const isPositive = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} className="sparkline">
      <path
        d={path}
        fill="none"
        stroke={isPositive ? '#10b981' : '#ef4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="2"
          fill={color}
          opacity={index === points.length - 1 ? 1 : 0.5}
        />
      ))}
    </svg>
  );
}

interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function LoadingSkeleton({ width = '100%', height = '20px', variant = 'rect' }: LoadingSkeletonProps) {
  const className = `skeleton skeleton-${variant}`;
  return <div className={className} style={{ width, height }} />;
}

interface LoadingTableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function LoadingTableSkeleton({ rows = 5, columns = 6 }: LoadingTableSkeletonProps) {
  return (
    <div className="loading-table-skeleton">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <LoadingSkeleton key={i} width="80px" height="16px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton key={colIndex} width="100px" height="14px" />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">{title}</h3>
      <p className="error-text">{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

interface AsOfTimestampProps {
  timestamp: Date | string;
  label?: string;
}

export function AsOfTimestamp({ timestamp, label = 'As of' }: AsOfTimestampProps) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const formatted = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="as-of-timestamp">
      <span className="as-of-label">{label}:</span>
      <span className="as-of-value">{formatted}</span>
      <span className="as-of-indicator">●</span>
    </div>
  );
}
