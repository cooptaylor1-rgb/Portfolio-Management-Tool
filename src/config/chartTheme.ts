// Modern Night-Mode Chart Theme Configuration

export const chartColors = {
  primary: '#3b82f6',      // Blue
  secondary: '#8b5cf6',    // Purple
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Amber
  danger: '#ef4444',       // Red
  info: '#06b6d4',         // Cyan
  purple: '#a855f7',       // Bright Purple
  pink: '#ec4899',         // Pink
  teal: '#14b8a6',         // Teal
  lime: '#84cc16',         // Lime
  
  // Gradients
  gradient1: ['#3b82f6', '#8b5cf6'],
  gradient2: ['#10b981', '#14b8a6'],
  gradient3: ['#ef4444', '#f59e0b'],
  gradient4: ['#ec4899', '#a855f7'],
  
  // Chart specific
  grid: '#1f1f23',
  gridLight: '#2a2a2e',
  axis: '#52525b',
  text: '#a1a1aa',
  textPrimary: '#e4e4e7',
  background: '#0a0a0b',
  tooltip: '#18181b',
  tooltipBorder: '#3f3f46',
}

export const chartPalette = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#a855f7', // Bright Purple
  '#14b8a6', // Teal
]

export const chartConfig = {
  // Spacing
  margin: { top: 20, right: 30, left: 0, bottom: 20 },
  marginLarge: { top: 30, right: 40, left: 20, bottom: 30 },
  
  // Grid
  grid: {
    stroke: chartColors.grid,
    strokeDasharray: '3 3',
    strokeWidth: 1,
    opacity: 0.3,
  },
  
  // Axes
  axis: {
    stroke: chartColors.axis,
    fontSize: 12,
    fontFamily: "'Inter', system-ui, sans-serif",
    fill: chartColors.text,
  },
  
  // Tooltips
  tooltip: {
    contentStyle: {
      backgroundColor: chartColors.tooltip,
      border: `1px solid ${chartColors.tooltipBorder}`,
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    },
    labelStyle: {
      color: chartColors.textPrimary,
      fontWeight: 600,
      marginBottom: '8px',
      fontSize: '13px',
    },
    itemStyle: {
      color: chartColors.text,
      fontSize: '12px',
      padding: '4px 0',
    },
  },
  
  // Legend
  legend: {
    iconType: 'circle' as const,
    wrapperStyle: {
      paddingTop: '20px',
      fontSize: '12px',
      fontFamily: "'Inter', system-ui, sans-serif",
    },
    iconSize: 8,
  },
  
  // Animations
  animation: {
    duration: 800,
    easing: 'ease-out' as const,
  },
  
  // Line/Area charts
  line: {
    strokeWidth: 2,
    dot: false,
    activeDot: { r: 6, strokeWidth: 2 },
  },
  
  // Bar charts
  bar: {
    radius: [4, 4, 0, 0] as [number, number, number, number],
    maxBarSize: 60,
  },
  
  // Pie charts
  pie: {
    innerRadius: 0,
    outerRadius: 100,
    paddingAngle: 2,
    strokeWidth: 2,
    stroke: chartColors.background,
  },
}

// Gradient IDs for recharts - Use these in defs
export const getChartGradients = () => ({
  primary: 'gradientPrimary',
  success: 'gradientSuccess',
  danger: 'gradientDanger',
  secondary: 'gradientSecondary',
})

// Format helpers
export const formatters = {
  currency: (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  },
  
  currencyPrecise: (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  },
  
  percentage: (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  },
  
  number: (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  },
  
  date: (dateStr: string | Date) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  },
  
  dateLong: (dateStr: string | Date) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  },
}
