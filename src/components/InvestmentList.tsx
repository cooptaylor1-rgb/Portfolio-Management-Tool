import { useState, useMemo, useCallback, memo } from 'react'
import { Investment } from '../types'
import { Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

interface InvestmentListProps {
  investments: Investment[]
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Investment>) => void
}

function InvestmentList({ investments, onDelete, onUpdate }: InvestmentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const calculateGainLoss = useCallback((investment: Investment) => {
    const totalValue = investment.quantity * investment.currentPrice
    const totalCost = investment.quantity * investment.purchasePrice
    const gainLoss = totalValue - totalCost
    const percentage = ((gainLoss / totalCost) * 100)
    return { amount: gainLoss, percentage }
  }, [])

  const handleEdit = useCallback((investment: Investment) => {
    setEditingId(investment.id)
    setEditPrice(investment.currentPrice.toString())
  }, [])

  const handleSaveEdit = useCallback((id: string) => {
    const price = parseFloat(editPrice)
    if (price > 0) {
      onUpdate(id, { currentPrice: price })
      setEditingId(null)
      setEditPrice('')
    }
  }, [editPrice, onUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditPrice('')
  }, [])

  const getTypeLabel = useCallback((type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }, [])

  // Memoize enriched investments data
  const enrichedInvestments = useMemo(() => {
    return investments.map(investment => ({
      ...investment,
      totalValue: investment.quantity * investment.currentPrice,
      totalCost: investment.quantity * investment.purchasePrice,
      gainLoss: calculateGainLoss(investment)
    }))
  }, [investments, calculateGainLoss])

  return (
    <div>
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <p className="text-secondary text-sm">
          Track all your investments in one place. Click the pencil icon to update current prices.
        </p>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Investment</th>
              <th>Type</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Purchase Price</th>
              <th className="text-right">Current Price</th>
              <th className="text-right">Total Value</th>
              <th className="text-right">Gain/Loss</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrichedInvestments.map((investment) => {
              const isEditing = editingId === investment.id

              return (
                <tr key={investment.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong className="text-primary">{investment.name}</strong>
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                        <span className="text-xs font-mono text-secondary">{investment.symbol}</span>
                        <span className="text-xs text-tertiary">•</span>
                        <span className="text-xs text-tertiary">{formatDate(investment.purchaseDate)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-primary">{getTypeLabel(investment.type)}</span>
                  </td>
                  <td className="text-right font-medium">{investment.quantity}</td>
                  <td className="text-right">{formatCurrency(investment.purchasePrice)}</td>
                  <td className="text-right">
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          step="0.01"
                          min="0"
                          className="form-input"
                          style={{ width: '120px', padding: '6px 8px', fontSize: 'var(--font-size-sm)' }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(investment.id)
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                        />
                        <button 
                          className="btn-sm btn-success" 
                          onClick={() => handleSaveEdit(investment.id)}
                          title="Save (Enter)"
                        >
                          ✓
                        </button>
                        <button 
                          className="btn-sm btn-secondary" 
                          onClick={handleCancelEdit}
                          title="Cancel (Esc)"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium">{formatCurrency(investment.currentPrice)}</span>
                    )}
                  </td>
                  <td className="text-right">
                    <strong className="text-lg">{formatCurrency(investment.totalValue)}</strong>
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        {investment.gainLoss.amount >= 0 ? <TrendingUp size={14} className="text-success" /> : <TrendingDown size={14} className="text-danger" />}
                        <span className={`font-semibold ${investment.gainLoss.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(investment.gainLoss.amount)}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${investment.gainLoss.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                        {investment.gainLoss.percentage >= 0 ? '+' : ''}{investment.gainLoss.percentage.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                      <button
                        className="btn-icon btn-ghost"
                        onClick={() => handleEdit(investment)}
                        title="Update current price"
                        disabled={isEditing}
                        aria-label="Edit price"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn-icon btn-ghost text-danger"
                        onClick={() => onDelete(investment.id)}
                        title="Remove investment"
                        aria-label="Delete investment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="alert alert-info" style={{ marginTop: 'var(--spacing-md)' }}>
        <span style={{ fontSize: '18px' }}>💡</span>
        <div>
          <strong>Tip:</strong> Keep your current prices updated to get accurate portfolio performance tracking. 
          Click the pencil icon to edit, or press Enter to save and Escape to cancel.
        </div>
      </div>
    </div>
  )
}

export default memo(InvestmentList)
