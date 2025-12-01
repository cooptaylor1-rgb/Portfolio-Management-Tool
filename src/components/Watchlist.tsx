import { WatchlistItem, MarketData } from '../types'
import { Eye, Plus, X, TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'

interface WatchlistProps {
  items: WatchlistItem[]
  marketData: Map<string, MarketData>
  onAdd: (item: Omit<WatchlistItem, 'id' | 'addedDate'>) => void
  onRemove: (id: string) => void
}

export default function Watchlist({ items, marketData, onAdd, onRemove }: WatchlistProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [targetPrice, setTargetPrice] = useState('')

  const handleAdd = () => {
    if (symbol.trim()) {
      onAdd({
        symbol: symbol.toUpperCase(),
        name: name || symbol.toUpperCase(),
        type: 'stock',
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        notes: '',
      })
      setSymbol('')
      setName('')
      setTargetPrice('')
      setShowAddForm(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div className="watchlist">
      <div className="section-header-inline">
        <h3>
          <Eye size={24} />
          Watchlist
        </h3>
        <button 
          className="btn-icon btn-primary-sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Cancel' : 'Add'}
        </button>
      </div>

      {showAddForm && (
        <div className="watchlist-add-form">
          <input
            type="text"
            placeholder="Symbol (e.g., AAPL)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="watchlist-input"
          />
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="watchlist-input"
          />
          <input
            type="number"
            placeholder="Target Price (optional)"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            className="watchlist-input"
            step="0.01"
          />
          <button className="btn btn-primary" onClick={handleAdd}>
            Add to Watchlist
          </button>
        </div>
      )}

      <div className="watchlist-items">
        {items.length === 0 ? (
          <div className="watchlist-empty">
            <Eye size={48} />
            <p>No items in watchlist</p>
            <span>Add stocks to track potential investments</span>
          </div>
        ) : (
          items.map(item => {
            const data = marketData.get(item.symbol)
            const isAboveTarget = item.targetPrice && data && data.price > item.targetPrice
            const isBelowTarget = item.targetPrice && data && data.price < item.targetPrice

            return (
              <div key={item.id} className="watchlist-item">
                <div className="watchlist-item-header">
                  <div className="watchlist-item-info">
                    <h4>{item.symbol}</h4>
                    <span className="watchlist-item-name">{item.name}</span>
                  </div>
                  <button
                    className="btn-icon btn-sm"
                    onClick={() => onRemove(item.id)}
                    title="Remove from watchlist"
                  >
                    <X size={16} />
                  </button>
                </div>

                {data && (
                  <div className="watchlist-item-data">
                    <div className="watchlist-price">
                      <span className="price-label">Current</span>
                      <span className="price-value">{formatCurrency(data.price)}</span>
                      <span className={`price-change ${data.changePercent >= 0 ? 'positive' : 'negative'}`}>
                        {data.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                      </span>
                    </div>

                    {item.targetPrice && (
                      <div className="watchlist-target">
                        <span className="target-label">Target</span>
                        <span className="target-value">{formatCurrency(item.targetPrice)}</span>
                        {isBelowTarget && (
                          <span className="target-alert buy">
                            🎯 Buy opportunity!
                          </span>
                        )}
                        {isAboveTarget && (
                          <span className="target-alert sell">
                            ⚠️ Above target
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
