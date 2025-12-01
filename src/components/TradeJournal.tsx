import { useState, useEffect } from 'react'
import { TradeIdea } from '../types'
import { BookOpen, Plus, TrendingUp, Target, AlertTriangle, Calendar, Tag, X } from 'lucide-react'

export default function TradeJournal() {
  const [ideas, setIdeas] = useState<TradeIdea[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'watching' | 'active' | 'closed'>('all')
  const [selectedIdea, setSelectedIdea] = useState<TradeIdea | null>(null)

  useEffect(() => {
    // Load trade ideas from localStorage
    const saved = localStorage.getItem('tradeIdeas')
    if (saved) {
      setIdeas(JSON.parse(saved))
    } else {
      // Sample trade ideas for demonstration
      const sampleIdeas: TradeIdea[] = [
        {
          id: '1',
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          status: 'active',
          entryDate: '2024-11-01',
          entryPrice: 450.00,
          targetPrice: 550.00,
          stopLoss: 400.00,
          conviction: 5,
          timeHorizon: 'position',
          thesis: 'AI revolution leader with expanding TAM in data centers, automotive, and edge computing. Strong pricing power and margin expansion.',
          entryRationale: 'Entered after strong Q3 earnings beat and raised guidance. Technical breakout above $440 resistance with high volume.',
          tags: ['AI', 'semiconductors', 'growth'],
          catalysts: ['GTC conference', 'new product launches', 'data center buildout'],
          risks: ['China exposure', 'valuation', 'competition from AMD/Intel'],
          notes: 'Position size: 3% of portfolio. Will add on pullback to $420.',
          performance: 50.00,
          performancePercent: 11.11
        },
        {
          id: '2',
          symbol: 'JPM',
          name: 'JPMorgan Chase',
          status: 'watching',
          targetPrice: 160.00,
          stopLoss: 130.00,
          conviction: 4,
          timeHorizon: 'long-term',
          thesis: 'Best-in-class bank with fortress balance sheet. Benefits from higher rates. Strong ROE and capital return program.',
          entryRationale: 'Waiting for pullback to $140-145 zone for entry. Current price extended.',
          tags: ['financials', 'value', 'dividend'],
          catalysts: ['rising rates', 'loan growth', 'M&A activity'],
          risks: ['rate cuts', 'recession', 'credit losses'],
          notes: 'Target entry $142. Will be 4-5% position size.'
        }
      ]
      setIdeas(sampleIdeas)
      localStorage.setItem('tradeIdeas', JSON.stringify(sampleIdeas))
    }
  }, [])

  const saveIdeas = (updatedIdeas: TradeIdea[]) => {
    setIdeas(updatedIdeas)
    localStorage.setItem('tradeIdeas', JSON.stringify(updatedIdeas))
  }

  const addIdea = (idea: Omit<TradeIdea, 'id'>) => {
    const newIdea: TradeIdea = {
      ...idea,
      id: Date.now().toString()
    }
    saveIdeas([...ideas, newIdea])
    setShowAddForm(false)
  }

  const updateIdea = (id: string, updates: Partial<TradeIdea>) => {
    saveIdeas(ideas.map(idea => idea.id === id ? { ...idea, ...updates } : idea))
  }

  const deleteIdea = (id: string) => {
    if (window.confirm('Delete this trade idea?')) {
      saveIdeas(ideas.filter(idea => idea.id !== id))
      setSelectedIdea(null)
    }
  }

  const filteredIdeas = filter === 'all' ? ideas : ideas.filter(idea => idea.status === filter)

  const getConvictionColor = (conviction: number) => {
    if (conviction >= 4) return '#00ff88'
    if (conviction >= 3) return '#ffaa00'
    return '#ff3366'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00d9ff'
      case 'watching': return '#ffaa00'
      case 'closed': return 'var(--text-secondary)'
      case 'stopped': return '#ff3366'
      default: return 'var(--text-secondary)'
    }
  }

  return (
    <div className="trade-journal">
      <div className="section-header">
        <div>
          <h2>
            <BookOpen size={24} />
            Trade Journal & Ideas
          </h2>
          <p className="section-description">Track investment thesis, conviction levels, and trade rationale</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={18} />
          New Idea
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['all', 'watching', 'active', 'closed'] as const).map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="filter-count">
              {f === 'all' ? ideas.length : ideas.filter(i => i.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Ideas List */}
      <div className="ideas-grid">
        {filteredIdeas.map(idea => (
          <div 
            key={idea.id} 
            className="idea-card"
            onClick={() => setSelectedIdea(idea)}
          >
            <div className="idea-card-header">
              <div>
                <h3>{idea.symbol}</h3>
                <span className="idea-name">{idea.name}</span>
              </div>
              <div className="idea-badges">
                <span 
                  className="status-badge"
                  style={{ background: getStatusColor(idea.status), color: '#fff' }}
                >
                  {idea.status}
                </span>
              </div>
            </div>

            <div className="idea-metrics">
              <div className="idea-metric">
                <span className="metric-label">Conviction</span>
                <span className="metric-value" style={{ color: getConvictionColor(idea.conviction) }}>
                  {'⭐'.repeat(idea.conviction)}
                </span>
              </div>
              {idea.performance !== undefined && (
                <div className="idea-metric">
                  <span className="metric-label">Performance</span>
                  <span className={`metric-value ${idea.performance >= 0 ? 'positive' : 'negative'}`}>
                    {idea.performance >= 0 ? '+' : ''}${idea.performance.toFixed(2)} ({idea.performancePercent}%)
                  </span>
                </div>
              )}
            </div>

            <div className="idea-thesis">
              {idea.thesis.length > 120 ? `${idea.thesis.substring(0, 120)}...` : idea.thesis}
            </div>

            <div className="idea-tags">
              {idea.tags.map(tag => (
                <span key={tag} className="idea-tag">
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>

            <div className="idea-footer">
              <div className="idea-prices">
                {idea.entryPrice && <span className="price-label">Entry: ${idea.entryPrice}</span>}
                <span className="price-label">Target: ${idea.targetPrice}</span>
                <span className="price-label">Stop: ${idea.stopLoss}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredIdeas.length === 0 && (
        <div className="empty-state">
          <BookOpen size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3>No trade ideas yet</h3>
          <p>Start documenting your investment ideas and track your decision-making process</p>
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedIdea && (
        <div className="modal-overlay" onClick={() => setSelectedIdea(null)}>
          <div className="modal-content idea-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedIdea.symbol} - {selectedIdea.name}</h2>
              <button className="modal-close" onClick={() => setSelectedIdea(null)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body idea-detail-body">
              <div className="idea-detail-section">
                <h3><Target size={20} /> Investment Thesis</h3>
                <p>{selectedIdea.thesis}</p>
              </div>

              <div className="idea-detail-section">
                <h3><TrendingUp size={20} /> Entry Rationale</h3>
                <p>{selectedIdea.entryRationale}</p>
                {selectedIdea.exitRationale && (
                  <>
                    <h4>Exit Rationale</h4>
                    <p>{selectedIdea.exitRationale}</p>
                  </>
                )}
              </div>

              <div className="idea-detail-section">
                <h3><Calendar size={20} /> Catalysts</h3>
                <ul>
                  {selectedIdea.catalysts.map((catalyst, idx) => (
                    <li key={idx}>✓ {catalyst}</li>
                  ))}
                </ul>
              </div>

              <div className="idea-detail-section">
                <h3><AlertTriangle size={20} /> Risks</h3>
                <ul>
                  {selectedIdea.risks.map((risk, idx) => (
                    <li key={idx}>⚠️ {risk}</li>
                  ))}
                </ul>
              </div>

              {selectedIdea.notes && (
                <div className="idea-detail-section">
                  <h3>Notes</h3>
                  <p>{selectedIdea.notes}</p>
                </div>
              )}

              <div className="idea-actions">
                {selectedIdea.status === 'watching' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => updateIdea(selectedIdea.id, { status: 'active', entryDate: new Date().toISOString().split('T')[0] })}
                  >
                    Mark as Active
                  </button>
                )}
                {selectedIdea.status === 'active' && (
                  <button 
                    className="btn btn-secondary"
                    onClick={() => updateIdea(selectedIdea.id, { status: 'closed', exitDate: new Date().toISOString().split('T')[0] })}
                  >
                    Close Position
                  </button>
                )}
                <button 
                  className="btn btn-secondary"
                  onClick={() => deleteIdea(selectedIdea.id)}
                  style={{ marginLeft: 'auto' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Trade Idea</h2>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                addIdea({
                  symbol: formData.get('symbol') as string,
                  name: formData.get('name') as string,
                  status: formData.get('status') as any,
                  targetPrice: parseFloat(formData.get('targetPrice') as string),
                  stopLoss: parseFloat(formData.get('stopLoss') as string),
                  conviction: parseInt(formData.get('conviction') as string) as any,
                  timeHorizon: formData.get('timeHorizon') as any,
                  thesis: formData.get('thesis') as string,
                  entryRationale: formData.get('entryRationale') as string,
                  tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
                  catalysts: (formData.get('catalysts') as string).split('\n').filter(Boolean),
                  risks: (formData.get('risks') as string).split('\n').filter(Boolean),
                  notes: formData.get('notes') as string || '',
                  entryPrice: formData.get('entryPrice') ? parseFloat(formData.get('entryPrice') as string) : undefined,
                  entryDate: formData.get('entryDate') as string || undefined
                })
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Symbol *</label>
                    <input type="text" name="symbol" required />
                  </div>
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input type="text" name="name" required />
                  </div>
                  <div className="form-group">
                    <label>Status *</label>
                    <select name="status" required>
                      <option value="watching">Watching</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Conviction (1-5) *</label>
                    <input type="number" name="conviction" min="1" max="5" required defaultValue="3" />
                  </div>
                  <div className="form-group">
                    <label>Time Horizon *</label>
                    <select name="timeHorizon" required>
                      <option value="day">Day Trade</option>
                      <option value="swing">Swing (days-weeks)</option>
                      <option value="position">Position (weeks-months)</option>
                      <option value="long-term">Long-term (6+ months)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Entry Price</label>
                    <input type="number" name="entryPrice" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Target Price *</label>
                    <input type="number" name="targetPrice" step="0.01" required />
                  </div>
                  <div className="form-group">
                    <label>Stop Loss *</label>
                    <input type="number" name="stopLoss" step="0.01" required />
                  </div>
                  <div className="form-group full-width">
                    <label>Investment Thesis *</label>
                    <textarea name="thesis" rows={4} required placeholder="Why is this a good investment?" />
                  </div>
                  <div className="form-group full-width">
                    <label>Entry Rationale *</label>
                    <textarea name="entryRationale" rows={3} required placeholder="Why enter now? Technical/fundamental triggers..." />
                  </div>
                  <div className="form-group full-width">
                    <label>Catalysts (one per line)</label>
                    <textarea name="catalysts" rows={3} placeholder="Earnings&#10;Product launch&#10;Regulatory approval" />
                  </div>
                  <div className="form-group full-width">
                    <label>Risks (one per line)</label>
                    <textarea name="risks" rows={3} placeholder="Competition&#10;Regulation&#10;Market conditions" />
                  </div>
                  <div className="form-group full-width">
                    <label>Tags (comma-separated)</label>
                    <input type="text" name="tags" placeholder="tech, growth, momentum" />
                  </div>
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea name="notes" rows={2} placeholder="Additional observations..." />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Idea
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
