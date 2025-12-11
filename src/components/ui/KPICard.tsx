/**
 * KPICard - Key Performance Indicator display component
 * 
 * Used for displaying financial metrics in a compact,
 * scannable format with optional sparklines and trends.
 */

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'percent' | 'number';
  prefix?: string;
  suffix?: string;
  sparkline?: number[];
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'highlight' | 'warning' | 'danger';
  tooltip?: string;
  onClick?: () => void;
}

export function KPICard({
  label,
  value,
  change,
  changeLabel,
  trend,
  format = 'number',
  prefix,
  suffix,
  sparkline,
  icon,
  size = 'md',
  variant = 'default',
  tooltip,
  onClick,
}: KPICardProps) {
  const formattedValue = formatValue(value, format, prefix, suffix);
  const trendIcon = getTrendIcon(trend, change);
  const trendClass = getTrendClass(trend, change);

  return (
    <div 
      className={`kpi-card kpi-card--${size} kpi-card--${variant} ${onClick ? 'kpi-card--clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="kpi-card__header">
        <span className="kpi-card__label">{label}</span>
        {tooltip && (
          <button className="kpi-card__info" aria-label={tooltip}>
            <Info size={12} />
          </button>
        )}
      </div>
      
      <div className="kpi-card__content">
        {icon && <div className="kpi-card__icon">{icon}</div>}
        <div className="kpi-card__value-wrapper">
          <span className="kpi-card__value">{formattedValue}</span>
          {change !== undefined && (
            <span className={`kpi-card__change ${trendClass}`}>
              {trendIcon}
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              {changeLabel && <span className="kpi-card__change-label">{changeLabel}</span>}
            </span>
          )}
        </div>
      </div>

      {sparkline && sparkline.length > 0 && (
        <div className="kpi-card__sparkline">
          <Sparkline data={sparkline} trend={trend} />
        </div>
      )}
    </div>
  );
}

function formatValue(
  value: string | number, 
  format: string, 
  prefix?: string, 
  suffix?: string
): string {
  if (typeof value === 'string') return `${prefix || ''}${value}${suffix || ''}`;
  
  let formatted: string;
  switch (format) {
    case 'currency':
      formatted = value.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      break;
    case 'percent':
      formatted = `${value.toFixed(2)}%`;
      break;
    default:
      formatted = value.toLocaleString();
  }
  
  return `${prefix || ''}${formatted}${suffix || ''}`;
}

function getTrendIcon(trend?: string, change?: number) {
  const size = 14;
  
  if (trend === 'up' || (trend === undefined && change !== undefined && change > 0)) {
    return <TrendingUp size={size} />;
  }
  if (trend === 'down' || (trend === undefined && change !== undefined && change < 0)) {
    return <TrendingDown size={size} />;
  }
  return <Minus size={size} />;
}

function getTrendClass(trend?: string, change?: number): string {
  if (trend === 'up' || (trend === undefined && change !== undefined && change > 0)) {
    return 'kpi-card__change--positive';
  }
  if (trend === 'down' || (trend === undefined && change !== undefined && change < 0)) {
    return 'kpi-card__change--negative';
  }
  return 'kpi-card__change--neutral';
}

// Simple sparkline component
function Sparkline({ data, trend }: { data: number[]; trend?: string }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = trend === 'down' 
    ? 'var(--color-danger)' 
    : trend === 'up' 
      ? 'var(--color-success)' 
      : 'var(--text-tertiary)';

  return (
    <svg width={width} height={height} className="sparkline">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}


/**
 * KPIGrid - Grid layout for KPI cards
 */
interface KPIGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function KPIGrid({ children, columns = 4 }: KPIGridProps) {
  return (
    <div className={`kpi-grid kpi-grid--${columns}`}>
      {children}
    </div>
  );
}
