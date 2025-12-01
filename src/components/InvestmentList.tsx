import { useState } from 'react'
import { Investment } from '../types'
import { Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'

interface InvestmentListProps {
  investments: Investment[]
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Investment>) => void
}

export default function InvestmentList({ investments, onDelete, onUpdate }: InvestmentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateGainLoss = (investment: Investment) => {
    const totalValue = investment.quantity * investment.currentPrice
    const totalCost = investment.quantity * investment.purchasePrice
    const gainLoss = totalValue - totalCost
    const percentage = ((gainLoss / totalCost) * 100)
    return { amount: gainLoss, percentage }
  }

  const handleEdit = (investment: Investment) => {
    setEditingId(investment.id)
    setEditPrice(investment.currentPrice.toString())
  }

  const handleSaveEdit = (id: string) => {
    const price = parseFloat(editPrice)
    if (price > 0) {
      onUpdate(id, { currentPrice: price })
      setEditingId(null)
      setEditPrice('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditPrice('')
  }

  const getTypeLabel = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="investment-list">
      <div className="list-header">
        <p className="list-description">
          Track all your investments in one place. Click the pencil icon to update current prices, 
          or the trash icon to remove an investment.
        </p>
      </div>

      <div className="table-container">
        <table className="investment-table">
          <thead>
            <tr>
              <th>Investment</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Purchase Price</th>
              <th>Current Price</th>
              <th>Total Value</th>
              <th>Gain/Loss</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {investments.map((investment) => {
              const { amount: gainLoss, percentage } = calculateGainLoss(investment)
              const totalValue = investment.quantity * investment.currentPrice
              const isEditing = editingId === investment.id

              return (
                <tr key={investment.id}>
                  <td>
                    <div className="investment-info">
                      <strong>{investment.name}</strong>
                      <span className="investment-symbol">{investment.symbol}</span>
                      <span className="investment-date">{formatDate(investment.purchaseDate)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="type-badge">{getTypeLabel(investment.type)}</span>
                  </td>
                  <td>{investment.quantity}</td>
                  <td>{formatCurrency(investment.purchasePrice)}</td>
                  <td>
                    {isEditing ? (
                      <div className="inline-edit">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          step="0.01"
                          min="0"
                          className="edit-input"
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button 
                            className="btn-icon btn-success" 
                            onClick={() => handleSaveEdit(investment.id)}
                            title="Save"
                          >
                            ✓
                          </button>
                          <button 
                            className="btn-icon btn-danger" 
                            onClick={handleCancelEdit}
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      formatCurrency(investment.currentPrice)
                    )}
                  </td>
                  <td>
                    <strong>{formatCurrency(totalValue)}</strong>
                  </td>
                  <td>
                    <div className={`gain-loss ${gainLoss >= 0 ? 'positive' : 'negative'}`}>
                      <div className="gain-loss-icon">
                        {gainLoss >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div className="gain-loss-values">
                        <span className="gain-loss-amount">{formatCurrency(gainLoss)}</span>
                        <span className="gain-loss-percentage">
                          {percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => handleEdit(investment)}
                        title="Update current price"
                        disabled={isEditing}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => onDelete(investment.id)}
                        title="Remove investment"
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

      <div className="list-footer">
        <p className="help-text">
          💡 <strong>Tip:</strong> Keep your current prices updated to get accurate portfolio performance tracking. 
          You can edit prices anytime by clicking the pencil icon.
        </p>
      </div>
    </div>
  )
}
