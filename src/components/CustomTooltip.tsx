import { chartConfig, chartColors, formatters } from '../config/chartTheme'

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (value: number) => string
}

export function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  return (
    <div style={chartConfig.tooltip.contentStyle}>
      <p style={chartConfig.tooltip.labelStyle}>
        {typeof label === 'string' && label.includes('-') 
          ? formatters.dateLong(label) 
          : label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ ...chartConfig.tooltip.itemStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: entry.color 
          }} />
          <span style={{ color: chartColors.text }}>
            {entry.name}:{' '}
          </span>
          <span style={{ color: chartColors.textPrimary, fontWeight: 600 }}>
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}
