import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  onClear?: () => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, leftIcon, rightIcon, onClear, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={props.id} className="form-label">
            {label}
            {props.required && <span className="text-danger" style={{ marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }}>
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={`form-input ${error ? 'error' : ''} ${leftIcon ? 'pl-xl' : ''} ${className}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
            {...props}
          />
          {(rightIcon || onClear) && (
            <span style={{ position: 'absolute', right: '12px', display: 'flex', gap: '4px' }}>
              {onClear && props.value && (
                <button
                  type="button"
                  onClick={onClear}
                  className="btn-icon btn-ghost"
                  style={{ padding: '4px' }}
                  aria-label="Clear input"
                >
                  ✕
                </button>
              )}
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span className="form-error text-sm mt-xs" id={`${props.id}-error`} role="alert">
            {error}
          </span>
        )}
        {!error && helpText && (
          <span className="form-helper text-xs mt-xs" id={`${props.id}-help`}>
            {helpText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
