import { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helpText?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
}

export function Select({ label, error, helpText, options, className = '', ...props }: SelectProps) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={props.id} className="form-label">
          {label}
          {props.required && <span className="text-danger" style={{ marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <select
        className={`form-select ${error ? 'error' : ''} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
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
