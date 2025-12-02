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
        Fill in the details about your investment below. All fields marked with * are required.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
          <Input
            id="name"
            label="Investment Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g., Apple Inc."
            error={errors.name}
            helpText="The full name of your investment"
            required
            disabled={isSubmitting}
          />

          <Input
            id="symbol"
            label="Symbol/Ticker"
            value={formData.symbol}
            onChange={(e) => handleChange('symbol', e.target.value.toUpperCase())}
            placeholder="e.g., AAPL"
            error={errors.symbol}
            helpText="The trading symbol"
            required
            disabled={isSubmitting}
            style={{ textTransform: 'uppercase' }}
          />

          <div style={{ gridColumn: '1 / -1' }}>
            <Select
              id="type"
              label="Investment Type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              error={errors.type}
              helpText="Different types have different risk profiles"
              required
              disabled={isSubmitting}
              options={investmentTypes.map(t => ({
                value: t.value,
                label: `${t.label} - ${t.description}`
              }))}
            />
          </div>

          <Input
            id="quantity"
            label="Quantity/Shares"
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            placeholder="e.g., 10"
            error={errors.quantity}
            helpText="How many shares or units"
            required
            disabled={isSubmitting}
            step="0.01"
            min="0"
          />

          <Input
            id="purchaseDate"
            label="Purchase Date"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => handleChange('purchaseDate', e.target.value)}
            error={errors.purchaseDate}
            helpText="When you bought it"
            required
            disabled={isSubmitting}
            max={new Date().toISOString().split('T')[0]}
          />

          <Input
            id="purchasePrice"
            label="Purchase Price"
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => handleChange('purchasePrice', e.target.value)}
            placeholder="150.00"
            error={errors.purchasePrice}
            helpText="Price per share when bought"
            required
            disabled={isSubmitting}
            leftIcon={<DollarSign size={16} />}
            step="0.01"
            min="0"
          />

          <Input
            id="currentPrice"
            label="Current Price"
            type="number"
            value={formData.currentPrice}
            onChange={(e) => handleChange('currentPrice', e.target.value)}
            placeholder="175.00"
            error={errors.currentPrice}
            helpText="Current market price per share"
            required
            disabled={isSubmitting}
            leftIcon={<DollarSign size={16} />}
            step="0.01"
            min="0"
          />
        </div>

        <div className="form-actions" style={{ marginTop: 'var(--spacing-xl)', display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
          >
            Add Investment
          </Button>
        </div>
      </form>
    </div>
  )
}
