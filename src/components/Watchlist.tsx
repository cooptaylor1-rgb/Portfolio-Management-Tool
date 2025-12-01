import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, Download, FolderOpen, Star } from 'lucide-react'

interface WatchlistItem {
  id: string
  ticker: string
  companyName: string
  notes: string
  thesis: string[]
  targetPrice?: number
  currentPrice?: number
  dateAdded: string
  lastUpdated: string
}

interface Watchlist {
  id: string
  name: string
  items: WatchlistItem[]
  createdAt: string
  updatedAt: string
}

const THESIS_TAGS = ['Deep Value', 'Growth', 'Turnaround', 'Quality', 'Catalyst', 'Event-Driven', 'Momentum', 'Special Situation']

const MOCK_PRICES: Record<string, { name: string, price: number }> = {
  'AAPL': { name: 'Apple Inc.', price: 175.50 },
  'MSFT': { name: 'Microsoft Corporation', price: 295.25 },
  'GOOGL': { name: 'Alphabet Inc.', price: 138.75 },
  'NVDA': { name: 'NVIDIA Corporation', price: 485.20 },
  'TSLA': { name: 'Tesla Inc.', price: 242.80 },
  'META': { name: 'Meta Platforms Inc.', price: 334.15 },
  'AMZN': { name: 'Amazon.com Inc.', price: 152.90 },
  'NFLX': { name: 'Netflix Inc.', price: 487.30 },
}

export const WatchlistComponent: React.FC = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    const saved = localStorage.getItem('watchlists')
    if (saved) {
      return JSON.parse(saved)
    }
    return [{
      id: '1',
      name: 'High Conviction',
      items: [
        {
          id: '1',
          ticker: 'AAPL',
          companyName: 'Apple Inc.',
          notes: 'Strong ecosystem, services growth accelerating. iPhone 16 cycle looks promising.',
          thesis: ['Quality', 'Growth'],
          targetPrice: 200,
          currentPrice: 175.50,
          dateAdded: '2024-10-15',
          lastUpdated: '2024-11-28'
        },
        {
          id: '2',
          ticker: 'NVDA',
          companyName: 'NVIDIA Corporation',
          notes: 'AI infrastructure leader. Data center demand remains robust. Watch for gross margin trends.',
          thesis: ['Growth', 'Catalyst'],
          targetPrice: 600,
          currentPrice: 485.20,
          dateAdded: '2024-09-20',
          lastUpdated: '2024-11-30'
        }
      ],
      createdAt: '2024-09-01',
      updatedAt: '2024-11-30'
    }]
  })

  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>(watchlists[0]?.id || '')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newWatchlistName, setNewWatchlistName] = useState('')
  const [isCreatingWatchlist, setIsCreatingWatchlist] = useState(false)

  const [editForm, setEditForm] = useState<Partial<WatchlistItem>>({})

  useEffect(() => {
    localStorage.setItem('watchlists', JSON.stringify(watchlists))
  }, [watchlists])

  const selectedWatchlist = watchlists.find(w => w.id === selectedWatchlistId)

  const createWatchlist = () => {
    if (!newWatchlistName.trim()) return
    
    const newWatchlist: Watchlist = {
      id: Date.now().toString(),
      name: newWatchlistName,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setWatchlists([...watchlists, newWatchlist])
    setSelectedWatchlistId(newWatchlist.id)
    setNewWatchlistName('')
    setIsCreatingWatchlist(false)
  }

  const deleteWatchlist = (id: string) => {
    if (watchlists.length === 1) {
      alert('Cannot delete the last watchlist')
      return
    }
    if (window.confirm('Delete this watchlist? This cannot be undone.')) {
      const newWatchlists = watchlists.filter(w => w.id !== id)
      setWatchlists(newWatchlists)
      if (selectedWatchlistId === id) {
        setSelectedWatchlistId(newWatchlists[0].id)
      }
    }
  }

  const startAddItem = () => {
    setEditForm({
      ticker: '',
      companyName: '',
      notes: '',
      thesis: [],
      targetPrice: undefined,
      currentPrice: undefined
    })
    setIsAddingItem(true)
  }

  const saveNewItem = () => {
    if (!editForm.ticker || !editForm.companyName) {
      alert('Ticker and company name are required')
      return
    }

    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      ticker: editForm.ticker.toUpperCase(),
      companyName: editForm.companyName,
      notes: editForm.notes || '',
      thesis: editForm.thesis || [],
      targetPrice: editForm.targetPrice,
      currentPrice: editForm.currentPrice || MOCK_PRICES[editForm.ticker.toUpperCase()]?.price,
      dateAdded: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0]
    }

    setWatchlists(watchlists.map(w => 
      w.id === selectedWatchlistId 
        ? { ...w, items: [...w.items, newItem], updatedAt: new Date().toISOString() }
        : w
    ))
    
    setIsAddingItem(false)
    setEditForm({})
  }

  const startEditItem = (item: WatchlistItem) => {
    setEditForm(item)
    setEditingItemId(item.id)
  }

  const saveEditItem = () => {
    if (!editForm.ticker || !editForm.companyName) {
      alert('Ticker and company name are required')
      return
    }

    setWatchlists(watchlists.map(w => 
      w.id === selectedWatchlistId 
        ? {
            ...w,
            items: w.items.map(item => 
              item.id === editingItemId
                ? { ...item, ...editForm, lastUpdated: new Date().toISOString().split('T')[0] }
                : item
            ),
            updatedAt: new Date().toISOString()
          }
        : w
    ))
    
    setEditingItemId(null)
    setEditForm({})
  }

  const deleteItem = (itemId: string) => {
    if (window.confirm('Remove this item from the watchlist?')) {
      setWatchlists(watchlists.map(w => 
        w.id === selectedWatchlistId 
          ? { ...w, items: w.items.filter(item => item.id !== itemId), updatedAt: new Date().toISOString() }
          : w
      ))
    }
  }

  const exportToCSV = () => {
    if (!selectedWatchlist) return

    const headers = ['Ticker', 'Company Name', 'Current Price', 'Target Price', 'Upside %', 'Thesis', 'Notes', 'Date Added']
    const rows = selectedWatchlist.items.map(item => {
      const upside = item.currentPrice && item.targetPrice 
        ? ((item.targetPrice - item.currentPrice) / item.currentPrice * 100).toFixed(1)
        : 'N/A'
      return [
        item.ticker,
        item.companyName,
        item.currentPrice?.toFixed(2) || 'N/A',
        item.targetPrice?.toFixed(2) || 'N/A',
        upside,
        item.thesis.join('; '),
        `"${item.notes.replace(/"/g, '""')}"`,
        item.dateAdded
      ]
    })

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedWatchlist.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleThesisTag = (tag: string) => {
    const currentThesis = editForm.thesis || []
    if (currentThesis.includes(tag)) {
      setEditForm({ ...editForm, thesis: currentThesis.filter(t => t !== tag) })
    } else {
      setEditForm({ ...editForm, thesis: [...currentThesis, tag] })
    }
  }

  const autoFillFromTicker = (ticker: string) => {
    const tickerUpper = ticker.toUpperCase()
    const mockData = MOCK_PRICES[tickerUpper]
    if (mockData) {
      setEditForm({
        ...editForm,
        ticker: tickerUpper,
        companyName: mockData.name,
        currentPrice: mockData.price
      })
    } else {
      setEditForm({ ...editForm, ticker: tickerUpper })
    }
  }

  return (
    <div className="watchlist-container">
      <div className="watchlist-sidebar">
        <div className="watchlist-sidebar-header">
          <h3>Watchlists</h3>
          {!isCreatingWatchlist && (
            <button className="icon-btn" onClick={() => setIsCreatingWatchlist(true)} title="Create new watchlist">
              <Plus size={18} />
            </button>
          )}
        </div>

        {isCreatingWatchlist && (
          <div className="new-watchlist-form">
            <input
              type="text"
              placeholder="Watchlist name"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createWatchlist()}
              autoFocus
            />
            <div className="form-actions">
              <button className="btn-sm btn-primary" onClick={createWatchlist}>
                <Save size={14} /> Save
              </button>
              <button className="btn-sm" onClick={() => { setIsCreatingWatchlist(false); setNewWatchlistName('') }}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        )}

        <div className="watchlist-list">
          {watchlists.map(watchlist => (
            <div
              key={watchlist.id}
              className={`watchlist-item ${selectedWatchlistId === watchlist.id ? 'active' : ''}`}
              onClick={() => setSelectedWatchlistId(watchlist.id)}
            >
              <div className="watchlist-item-main">
                <FolderOpen size={16} />
                <span className="watchlist-name">{watchlist.name}</span>
                <span className="watchlist-count">{watchlist.items.length}</span>
              </div>
              {watchlists.length > 1 && (
                <button
                  className="delete-watchlist-btn"
                  onClick={(e) => { e.stopPropagation(); deleteWatchlist(watchlist.id) }}
                  title="Delete watchlist"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="watchlist-main">
        {selectedWatchlist && (
          <>
            <div className="watchlist-header">
              <div>
                <h2>{selectedWatchlist.name}</h2>
                <p className="watchlist-meta">
                  {selectedWatchlist.items.length} {selectedWatchlist.items.length === 1 ? 'stock' : 'stocks'} • 
                  Updated {new Date(selectedWatchlist.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="watchlist-actions">
                <button className="btn" onClick={exportToCSV} title="Export to CSV">
                  <Download size={18} /> Export
                </button>
                <button className="btn btn-primary" onClick={startAddItem}>
                  <Plus size={18} /> Add Stock
                </button>
              </div>
            </div>

            {isAddingItem && (
              <div className="watchlist-item-form">
                <h3>Add New Stock</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Ticker *</label>
                    <input
                      type="text"
                      value={editForm.ticker || ''}
                      onChange={(e) => autoFillFromTicker(e.target.value)}
                      placeholder="AAPL"
                    />
                  </div>
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      value={editForm.companyName || ''}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      placeholder="Apple Inc."
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.currentPrice || ''}
                      onChange={(e) => setEditForm({ ...editForm, currentPrice: parseFloat(e.target.value) })}
                      placeholder="175.50"
                    />
                  </div>
                  <div className="form-group">
                    <label>Target Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.targetPrice || ''}
                      onChange={(e) => setEditForm({ ...editForm, targetPrice: parseFloat(e.target.value) })}
                      placeholder="200.00"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Investment Thesis Tags</label>
                  <div className="thesis-tags">
                    {THESIS_TAGS.map(tag => (
                      <button
                        key={tag}
                        className={`thesis-tag ${(editForm.thesis || []).includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleThesisTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="Key investment thesis, catalysts, risks..."
                    rows={4}
                  />
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary" onClick={saveNewItem}>
                    <Save size={18} /> Save
                  </button>
                  <button className="btn" onClick={() => { setIsAddingItem(false); setEditForm({}) }}>
                    <X size={18} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {selectedWatchlist.items.length === 0 && !isAddingItem && (
              <div className="empty-watchlist">
                <Star size={48} />
                <h3>No stocks in this watchlist</h3>
                <p>Click "Add Stock" to start building your watchlist</p>
              </div>
            )}

            <div className="watchlist-items">
              {selectedWatchlist.items.map(item => (
                <div key={item.id} className="watchlist-card">
                  {editingItemId === item.id ? (
                    <div className="watchlist-item-form">
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Ticker *</label>
                          <input
                            type="text"
                            value={editForm.ticker || ''}
                            onChange={(e) => setEditForm({ ...editForm, ticker: e.target.value.toUpperCase() })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Company Name *</label>
                          <input
                            type="text"
                            value={editForm.companyName || ''}
                            onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Current Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.currentPrice || ''}
                            onChange={(e) => setEditForm({ ...editForm, currentPrice: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Target Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.targetPrice || ''}
                            onChange={(e) => setEditForm({ ...editForm, targetPrice: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Investment Thesis Tags</label>
                        <div className="thesis-tags">
                          {THESIS_TAGS.map(tag => (
                            <button
                              key={tag}
                              className={`thesis-tag ${(editForm.thesis || []).includes(tag) ? 'active' : ''}`}
                              onClick={() => toggleThesisTag(tag)}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Notes</label>
                        <textarea
                          value={editForm.notes || ''}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={4}
                        />
                      </div>

                      <div className="form-actions">
                        <button className="btn btn-primary" onClick={saveEditItem}>
                          <Save size={18} /> Save
                        </button>
                        <button className="btn" onClick={() => { setEditingItemId(null); setEditForm({}) }}>
                          <X size={18} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="watchlist-card-header">
                        <div className="ticker-info">
                          <h3>{item.ticker}</h3>
                          <span className="company-name">{item.companyName}</span>
                        </div>
                        <div className="card-actions">
                          <button className="icon-btn" onClick={() => startEditItem(item)} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="icon-btn danger" onClick={() => deleteItem(item.id)} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="price-info">
                        {item.currentPrice && (
                          <div className="price-item">
                            <span className="label">Current</span>
                            <span className="value">${item.currentPrice.toFixed(2)}</span>
                          </div>
                        )}
                        {item.targetPrice && (
                          <div className="price-item">
                            <span className="label">Target</span>
                            <span className="value">${item.targetPrice.toFixed(2)}</span>
                          </div>
                        )}
                        {item.currentPrice && item.targetPrice && (
                          <div className="price-item">
                            <span className="label">Upside</span>
                            <span className={`value ${((item.targetPrice - item.currentPrice) / item.currentPrice * 100) >= 0 ? 'positive' : 'negative'}`}>
                              {((item.targetPrice - item.currentPrice) / item.currentPrice * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {item.thesis.length > 0 && (
                        <div className="thesis-display">
                          {item.thesis.map(tag => (
                            <span key={tag} className="thesis-badge">{tag}</span>
                          ))}
                        </div>
                      )}

                      {item.notes && (
                        <div className="notes-display">
                          <p>{item.notes}</p>
                        </div>
                      )}

                      <div className="card-footer">
                        <span className="date-info">Added {new Date(item.dateAdded).toLocaleDateString()}</span>
                        <span className="date-info">Updated {new Date(item.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
