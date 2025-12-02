import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  message?: string
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48
}

export function LoadingSpinner({ size = 'md', className = '', message }: LoadingSpinnerProps) {
  const iconSize = sizeMap[size]
  
  return (
    <div className={`loading-spinner ${className}`}>
      <Loader2 
        size={iconSize} 
        className="animate-spin" 
        style={{ 
          animation: 'spin 1s linear infinite',
          color: 'var(--color-primary)'
        }} 
      />
      {message && (
        <p className="text-secondary text-sm" style={{ marginTop: 'var(--spacing-sm)' }}>
          {message}
        </p>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div 
      className="loading-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 10, 11, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="card"
        style={{
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          minWidth: '250px'
        }}
      >
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  )
}

interface LoadingSkeletonProps {
  width?: string
  height?: string
  className?: string
}

export function LoadingSkeleton({ width = '100%', height = '20px', className = '' }: LoadingSkeletonProps) {
  return (
    <div 
      className={`loading-skeleton ${className}`}
      style={{
        width,
        height,
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        animation: 'shimmer 1.5s ease-in-out infinite',
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        backgroundSize: '200% 100%'
      }}
    />
  )
}
