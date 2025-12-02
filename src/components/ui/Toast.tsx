import { ReactNode } from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  description?: string
  onClose?: () => void
}

export function Toast({ type, message, description, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
  }

  const alertClass = {
    success: 'alert-success',
    error: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info',
  }

  return (
    <div className={`alert ${alertClass[type]} slide-up`} role="alert" style={{ marginBottom: 'var(--spacing-sm)' }}>
      {icons[type]}
      <div style={{ flex: 1 }}>
        <strong>{message}</strong>
        {description && <div className="text-sm mt-xs">{description}</div>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="btn-icon btn-ghost"
          style={{ padding: '4px', marginLeft: 'auto' }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  )
}

interface ToastContainerProps {
  children: ReactNode
}

export function ToastContainer({ children }: ToastContainerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 'var(--spacing-lg)',
        right: 'var(--spacing-lg)',
        zIndex: 'var(--z-tooltip)',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  )
}
