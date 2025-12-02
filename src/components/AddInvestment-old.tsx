import { useState } from 'react'
import { Investment } from '../types'
import { Button, Input, Select } from './ui'
import { DollarSign } from 'lucide-react'

interface AddInvestmentProps {
  onAdd: (investment: Omit<Investment, 'id'>) => void
  onCancel: () => void
}

export default function AddInvestment({ onAdd, onCancel }: AddInvestmentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'stock' as Investment['type'],
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const investmentTypes = [
    { value: 'stock', label: 'Stock', description: 'Shares of individual companies' },
    { value: 'etf', label: 'ETF', description: 'Exchange-Traded Fund - basket of stocks/bonds' },
    { value: 'mutual-fund', label: 'Mutual Fund', description: 'Professionally managed investment fund' },
    { value: 'bond', label: 'Bond', description: 'Loan to government or company with fixed interest' },
    { value: 'crypto', label: 'Cryptocurrency', description: 'Digital currency like Bitcoin or Ethereum' },
    { value: 'other', label: 'Other', description: 'Other investment types' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = 'Required'
    if (!formData.symbol.trim()) newErrors.symbol = 'Required'
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Must be greater than 0'
    }
    if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = 'Must be greater than 0'
    }
    if (!formData.currentPrice || parseFloat(formData.currentPrice) <= 0) {
      newErrors.currentPrice = 'Must be greater than 0'
    }
    if (!formData.purchaseDate) newErrors.purchaseDate = 'Required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    
    // Simulate async operation for smoother UX
    await new Promise(resolve => setTimeout(resolve, 300))

    onAdd({
      name: formData.name.trim(),
      symbol: formData.symbol.trim().toUpperCase(),
      type: formData.type,
      quantity: parseFloat(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      currentPrice: parseFloat(formData.currentPrice),
      purchaseDate: formData.purchaseDate
    })

    setIsSubmitting(false)
    // Form will be unmounted after onAdd, no need to reset
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <div className="card" style={{ marginTop: 'var(--spacing-md)', background: 'var(--bg-elevated)' }}>
      <h3 className="text-lg font-semibold text-primary mb-sm">Add New Investment</h3>
      <p className="text-secondary text-sm mb-lg">
        Fill in the details about your investment below. Hover over the ⓘ icons for helpful explanations!
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label htmlFor="name">
              Investment Name *
              <span className="tooltip-trigger" title="The full name of your investment (e.g., 'Apple Inc.' or 'S&P 500 ETF')">ⓘ</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Apple Inc."
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="symbol">
              Symbol/Ticker *
              <span className="tooltip-trigger" title="The trading symbol (e.g., 'AAPL' for Apple, 'SPY' for S&P 500 ETF)">ⓘ</span>
            </label>
            <input
              type="text"
              id="symbol"
              value={formData.symbol}
              onChange={(e) => handleChange('symbol', e.target.value)}
              placeholder="e.g., AAPL"
              className={errors.symbol ? 'error' : ''}
            />
            {errors.symbol && <span className="error-message">{errors.symbol}</span>}
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="type" className="form-label">
              Investment Type *
              <span className="text-tertiary" title="What kind of investment is this? Different types have different risk and return characteristics" style={{ marginLeft: '4px', cursor: 'help' }}>ⓘ</span>
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="form-select"
            >
              {investmentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">
              Quantity/Shares *
              <span className="tooltip-trigger" title="How many shares or units do you own?">ⓘ</span>
            </label>
            <input
              type="number"
              id="quantity"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              placeholder="e.g., 10"
              step="0.01"
              min="0"
              className={errors.quantity ? 'error' : ''}
            />
            {errors.quantity && <span className="error-message">{errors.quantity}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="purchaseDate">
              Purchase Date *
              <span className="tooltip-trigger" title="When did you buy this investment?">ⓘ</span>
            </label>
            <input
              type="date"
              id="purchaseDate"
              value={formData.purchaseDate}
              onChange={(e) => handleChange('purchaseDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={errors.purchaseDate ? 'error' : ''}
            />
            {errors.purchaseDate && <span className="error-message">{errors.purchaseDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="purchasePrice">
              Purchase Price (per share) *
              <span className="tooltip-trigger" title="What price did you pay for each share when you bought it?">ⓘ</span>
            </label>
            <div className="input-with-prefix">
              <span className="input-prefix">$</span>
              <input
                type="number"
                id="purchasePrice"
                value={formData.purchasePrice}
                onChange={(e) => handleChange('purchasePrice', e.target.value)}
                placeholder="e.g., 150.00"
                step="0.01"
                min="0"
                className={errors.purchasePrice ? 'error' : ''}
              />
            </div>
            {errors.purchasePrice && <span className="error-message">{errors.purchasePrice}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="currentPrice">
              Current Price (per share) *
              <span className="tooltip-trigger" title="What is the current market price of each share?">ⓘ</span>
            </label>
            <div className="input-with-prefix">
              <span className="input-prefix">$</span>
              <input
                type="number"
                id="currentPrice"
                value={formData.currentPrice}
                onChange={(e) => handleChange('currentPrice', e.target.value)}
                placeholder="e.g., 175.00"
                step="0.01"
                min="0"
                className={errors.currentPrice ? 'error' : ''}
              />
            </div>
            {errors.currentPrice && <span className="error-message">{errors.currentPrice}</span>}
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 'var(--spacing-xl)', display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <span>Add Investment</span>
          </button>
        </div>
      </form>
    </div>
  )
}
