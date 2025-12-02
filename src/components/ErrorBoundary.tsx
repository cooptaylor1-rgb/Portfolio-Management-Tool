import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div 
          className="card"
          style={{
            margin: 'var(--spacing-xl) auto',
            maxWidth: '600px',
            textAlign: 'center',
            padding: 'var(--spacing-xl)'
          }}
        >
          <AlertTriangle 
            size={48} 
            style={{ 
              color: 'var(--color-danger)',
              marginBottom: 'var(--spacing-md)'
            }} 
          />
          <h2 className="text-xl font-semibold text-primary mb-md">
            Something went wrong
          </h2>
          <p className="text-secondary mb-lg">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          
          {this.state.error && (
            <details 
              className="text-left mb-lg"
              style={{
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-primary)'
              }}
            >
              <summary 
                className="text-sm font-medium text-secondary cursor-pointer"
                style={{ marginBottom: 'var(--spacing-sm)' }}
              >
                Error details
              </summary>
              <pre 
                className="text-xs text-tertiary"
                style={{
                  overflow: 'auto',
                  padding: 'var(--spacing-sm)',
                  backgroundColor: 'var(--bg-base)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo && (
                  <>
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
            <Button
              variant="secondary"
              onClick={this.handleReset}
            >
              Try Again
            </Button>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
