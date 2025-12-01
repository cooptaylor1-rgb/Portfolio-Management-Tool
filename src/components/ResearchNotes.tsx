import React, { useState, useEffect } from 'react'
import { FileText, Plus, Trash2, Edit2, Save, X, Search, Filter, Tag, Clock, TrendingUp } from 'lucide-react'

interface ResearchNote {
  id: string
  title: string
  content: string
  entityType: 'ticker' | 'theme' | 'macro'
  entityId: string // ticker symbol, theme id, or macro scenario name
  tags: string[]
  createdAt: string
  updatedAt: string
  version: number
  history: { content: string; timestamp: string; version: number }[]
}

const NOTE_TAGS = ['Fundamental', 'Valuation', 'Risk', 'Macro', 'Thesis', 'Catalyst', 'Technical', 'Earnings', 'Management', 'Competitive']

export const ResearchNotes: React.FC = () => {
  const [notes, setNotes] = useState<ResearchNote[]>(() => {
    const saved = localStorage.getItem('researchNotes')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      {
        id: '1',
        title: 'AAPL - Q4 Earnings Analysis',
        content: `Strong quarter with Services growing 16% YoY. iPhone revenue up 3% despite mature market.

Key Takeaways:
- Installed base reached 2.2B devices (new record)
- Services margin expanding to 74%
- China concerns overblown - stabilizing at 15% of revenue
- Valuation: Trading at 28x forward P/E vs. 5-year average of 25x

Next Steps:
- Monitor December quarter iPhone sales
- Watch Services attach rate trends
- Review capital allocation (dividend increase likely)`,
        entityType: 'ticker',
        entityId: 'AAPL',
        tags: ['Earnings', 'Fundamental', 'Thesis'],
        createdAt: '2024-11-15T10:30:00Z',
        updatedAt: '2024-11-20T14:22:00Z',
        version: 2,
        history: [
          {
            content: 'Initial earnings notes from Q4 call...',
            timestamp: '2024-11-15T10:30:00Z',
            version: 1
          }
        ]
      },
      {
        id: '2',
        title: 'AI Infrastructure Theme - 2025 Outlook',
        content: `Theme remains strong despite recent volatility. Key drivers intact.

Positive Catalysts:
- Enterprise AI adoption accelerating (40% of CIOs piloting GenAI)
- GPU supply constraints easing (TSMC expanding capacity)
- Hyperscaler capex guidance up 25% for 2025
- Inference opportunity just beginning (currently 10% of AI compute)

Risks to Monitor:
- Valuation compression (semiconductors at 30x vs. historical 18x)
- Competition intensifying (AMD, custom chips)
- Energy constraints for data centers
- Regulatory scrutiny on AI investments

Position Sizing: Maintain 15-18% theme weight, favor picks & shovels over application layer`,
        entityType: 'theme',
        entityId: 'ai-infrastructure',
        tags: ['Thesis', 'Macro', 'Catalyst'],
        createdAt: '2024-11-25T09:15:00Z',
        updatedAt: '2024-11-25T09:15:00Z',
        version: 1,
        history: []
      },
      {
        id: '3',
        title: 'Fed Rate Path - December FOMC Preview',
        content: `Meeting scheduled for Dec 18. Market pricing in 25bps cut (85% probability).

Key Questions:
- Dots revision (terminal rate projection)?
- Language on inflation progress
- 2025 cut pace (quarterly vs. every meeting?)

My Base Case:
- 25bps cut to 4.25-4.50%
- Hawkish hold thereafter (no cuts Q1 2025)
- Core PCE sticky above 2.5%
- Strong labor market provides cover

Portfolio Implications:
- Maintain duration hedge (TLT position)
- Favor large cap quality over small cap
- Reduce cyclical exposure
- Watch credit spreads (currently 90bps, tightening)`,
        entityType: 'macro',
        entityId: 'fed-policy',
        tags: ['Macro', 'Risk'],
        createdAt: '2024-12-01T11:00:00Z',
        updatedAt: '2024-12-01T11:00:00Z',
        version: 1,
        history: []
      }
    ]
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [filterEntityType, setFilterEntityType] = useState<'all' | 'ticker' | 'theme' | 'macro'>('all')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    entityType: 'ticker' as 'ticker' | 'theme' | 'macro',
    entityId: '',
    tags: [] as string[]
  })

  useEffect(() => {
    localStorage.setItem('researchNotes', JSON.stringify(notes))
  }, [notes])

  const selectedNote = notes.find(n => n.id === selectedNoteId)

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchQuery === '' || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.entityId.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterEntityType === 'all' || note.entityType === filterEntityType
    
    const matchesTags = filterTags.length === 0 || filterTags.every(tag => note.tags.includes(tag))
    
    return matchesSearch && matchesType && matchesTags
  })

  const toggleFilterTag = (tag: string) => {
    if (filterTags.includes(tag)) {
      setFilterTags(filterTags.filter(t => t !== tag))
    } else {
      setFilterTags([...filterTags, tag])
    }
  }

  const toggleEditTag = (tag: string) => {
    if (editForm.tags.includes(tag)) {
      setEditForm({ ...editForm, tags: editForm.tags.filter(t => t !== tag) })
    } else {
      setEditForm({ ...editForm, tags: [...editForm.tags, tag] })
    }
  }

  const startNewNote = () => {
    setEditForm({
      title: '',
      content: '',
      entityType: 'ticker',
      entityId: '',
      tags: []
    })
    setIsCreatingNote(true)
    setIsEditing(false)
  }

  const startEditNote = () => {
    if (!selectedNote) return
    setEditForm({
      title: selectedNote.title,
      content: selectedNote.content,
      entityType: selectedNote.entityType,
      entityId: selectedNote.entityId,
      tags: selectedNote.tags
    })
    setIsEditing(true)
    setIsCreatingNote(false)
  }

  const saveNewNote = () => {
    if (!editForm.title.trim() || !editForm.content.trim() || !editForm.entityId.trim()) {
      alert('Title, content, and entity ID are required')
      return
    }

    const newNote: ResearchNote = {
      id: Date.now().toString(),
      title: editForm.title,
      content: editForm.content,
      entityType: editForm.entityType,
      entityId: editForm.entityId.toUpperCase(),
      tags: editForm.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      history: []
    }

    setNotes([newNote, ...notes])
    setSelectedNoteId(newNote.id)
    setIsCreatingNote(false)
    setEditForm({ title: '', content: '', entityType: 'ticker', entityId: '', tags: [] })
  }

  const saveEditNote = () => {
    if (!selectedNote || !editForm.title.trim() || !editForm.content.trim() || !editForm.entityId.trim()) {
      alert('Title, content, and entity ID are required')
      return
    }

    // Check if content actually changed
    if (editForm.content !== selectedNote.content) {
      // Save to history
      const historyEntry = {
        content: selectedNote.content,
        timestamp: selectedNote.updatedAt,
        version: selectedNote.version
      }

      setNotes(notes.map(note => 
        note.id === selectedNoteId
          ? {
              ...note,
              ...editForm,
              entityId: editForm.entityId.toUpperCase(),
              updatedAt: new Date().toISOString(),
              version: note.version + 1,
              history: [...note.history, historyEntry]
            }
          : note
      ))
    } else {
      // Just update metadata
      setNotes(notes.map(note => 
        note.id === selectedNoteId
          ? {
              ...note,
              title: editForm.title,
              entityType: editForm.entityType,
              entityId: editForm.entityId.toUpperCase(),
              tags: editForm.tags,
              updatedAt: new Date().toISOString()
            }
          : note
      ))
    }

    setIsEditing(false)
    setEditForm({ title: '', content: '', entityType: 'ticker', entityId: '', tags: [] })
  }

  const deleteNote = (noteId: string) => {
    if (window.confirm('Delete this note? This cannot be undone.')) {
      const newNotes = notes.filter(n => n.id !== noteId)
      setNotes(newNotes)
      if (selectedNoteId === noteId) {
        setSelectedNoteId(newNotes[0]?.id || null)
      }
    }
  }

  const restoreVersion = (version: number) => {
    if (!selectedNote) return
    
    const historyEntry = selectedNote.history.find(h => h.version === version)
    if (!historyEntry) return

    if (window.confirm(`Restore version ${version}? Current version will be saved to history.`)) {
      const currentHistoryEntry = {
        content: selectedNote.content,
        timestamp: selectedNote.updatedAt,
        version: selectedNote.version
      }

      setNotes(notes.map(note => 
        note.id === selectedNoteId
          ? {
              ...note,
              content: historyEntry.content,
              updatedAt: new Date().toISOString(),
              version: note.version + 1,
              history: [...note.history, currentHistoryEntry]
            }
          : note
      ))

      setShowHistory(false)
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'ticker': return <TrendingUp size={14} />
      case 'theme': return <Tag size={14} />
      case 'macro': return <FileText size={14} />
      default: return <FileText size={14} />
    }
  }

  return (
    <div className="research-notes-container">
      {/* Sidebar */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <h3>Research Notes</h3>
          <button className="icon-btn" onClick={startNewNote} title="New note">
            <Plus size={18} />
          </button>
        </div>

        <div className="notes-search">
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="notes-filters">
          <div className="filter-group">
            <label><Filter size={14} /> Type</label>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterEntityType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterEntityType('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${filterEntityType === 'ticker' ? 'active' : ''}`}
                onClick={() => setFilterEntityType('ticker')}
              >
                Tickers
              </button>
              <button 
                className={`filter-btn ${filterEntityType === 'theme' ? 'active' : ''}`}
                onClick={() => setFilterEntityType('theme')}
              >
                Themes
              </button>
              <button 
                className={`filter-btn ${filterEntityType === 'macro' ? 'active' : ''}`}
                onClick={() => setFilterEntityType('macro')}
              >
                Macro
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label><Tag size={14} /> Tags</label>
            <div className="filter-tags">
              {NOTE_TAGS.slice(0, 5).map(tag => (
                <button
                  key={tag}
                  className={`filter-tag ${filterTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleFilterTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="notes-list">
          {filteredNotes.length === 0 ? (
            <div className="notes-empty">
              <FileText size={32} />
              <p>No notes found</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className={`note-list-item ${selectedNoteId === note.id ? 'active' : ''}`}
                onClick={() => { setSelectedNoteId(note.id); setIsCreatingNote(false); setIsEditing(false); setShowHistory(false) }}
              >
                <div className="note-list-header">
                  <span className="note-entity-badge">
                    {getEntityTypeIcon(note.entityType)}
                    {note.entityId}
                  </span>
                  <span className="note-version">v{note.version}</span>
                </div>
                <h4>{note.title}</h4>
                <p className="note-preview">{note.content.substring(0, 80)}...</p>
                <div className="note-list-footer">
                  <div className="note-tags-preview">
                    {note.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="tag-mini">{tag}</span>
                    ))}
                    {note.tags.length > 2 && <span className="tag-mini">+{note.tags.length - 2}</span>}
                  </div>
                  <span className="note-date">{formatDate(note.updatedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="notes-main">
        {isCreatingNote ? (
          <div className="note-editor">
            <div className="editor-header">
              <h2>New Research Note</h2>
              <div className="editor-actions">
                <button className="btn btn-primary" onClick={saveNewNote}>
                  <Save size={18} /> Save
                </button>
                <button className="btn" onClick={() => { setIsCreatingNote(false); setEditForm({ title: '', content: '', entityType: 'ticker', entityId: '', tags: [] }) }}>
                  <X size={18} /> Cancel
                </button>
              </div>
            </div>

            <div className="editor-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Title *</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="e.g., AAPL - Q4 Earnings Analysis"
                  />
                </div>
                <div className="form-group">
                  <label>Entity Type *</label>
                  <select
                    value={editForm.entityType}
                    onChange={(e) => setEditForm({ ...editForm, entityType: e.target.value as 'ticker' | 'theme' | 'macro' })}
                  >
                    <option value="ticker">Ticker</option>
                    <option value="theme">Theme</option>
                    <option value="macro">Macro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Entity ID *</label>
                  <input
                    type="text"
                    value={editForm.entityId}
                    onChange={(e) => setEditForm({ ...editForm, entityId: e.target.value })}
                    placeholder={editForm.entityType === 'ticker' ? 'AAPL' : editForm.entityType === 'theme' ? 'ai-infrastructure' : 'fed-policy'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="editor-tags">
                  {NOTE_TAGS.map(tag => (
                    <button
                      key={tag}
                      className={`thesis-tag ${editForm.tags.includes(tag) ? 'active' : ''}`}
                      onClick={() => toggleEditTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  placeholder="Enter your research notes here..."
                  rows={20}
                  className="note-content-editor"
                />
              </div>
            </div>
          </div>
        ) : isEditing && selectedNote ? (
          <div className="note-editor">
            <div className="editor-header">
              <h2>Edit Note</h2>
              <div className="editor-actions">
                <button className="btn btn-primary" onClick={saveEditNote}>
                  <Save size={18} /> Save
                </button>
                <button className="btn" onClick={() => { setIsEditing(false); setEditForm({ title: '', content: '', entityType: 'ticker', entityId: '', tags: [] }) }}>
                  <X size={18} /> Cancel
                </button>
              </div>
            </div>

            <div className="editor-form">
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Title *</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Entity Type *</label>
                  <select
                    value={editForm.entityType}
                    onChange={(e) => setEditForm({ ...editForm, entityType: e.target.value as 'ticker' | 'theme' | 'macro' })}
                  >
                    <option value="ticker">Ticker</option>
                    <option value="theme">Theme</option>
                    <option value="macro">Macro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Entity ID *</label>
                  <input
                    type="text"
                    value={editForm.entityId}
                    onChange={(e) => setEditForm({ ...editForm, entityId: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="editor-tags">
                  {NOTE_TAGS.map(tag => (
                    <button
                      key={tag}
                      className={`thesis-tag ${editForm.tags.includes(tag) ? 'active' : ''}`}
                      onClick={() => toggleEditTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={20}
                  className="note-content-editor"
                />
              </div>
            </div>
          </div>
        ) : showHistory && selectedNote ? (
          <div className="note-history">
            <div className="history-header">
              <h2>Version History</h2>
              <button className="btn" onClick={() => setShowHistory(false)}>
                <X size={18} /> Close
              </button>
            </div>

            <div className="history-list">
              <div className="history-item current">
                <div className="history-item-header">
                  <span className="history-version">Version {selectedNote.version} (Current)</span>
                  <span className="history-date">{formatDate(selectedNote.updatedAt)}</span>
                </div>
                <div className="history-content">
                  <pre>{selectedNote.content}</pre>
                </div>
              </div>

              {[...selectedNote.history].reverse().map(entry => (
                <div key={entry.version} className="history-item">
                  <div className="history-item-header">
                    <span className="history-version">Version {entry.version}</span>
                    <span className="history-date">{formatDate(entry.timestamp)}</span>
                    <button 
                      className="btn-sm" 
                      onClick={() => restoreVersion(entry.version)}
                    >
                      Restore
                    </button>
                  </div>
                  <div className="history-content">
                    <pre>{entry.content}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : selectedNote ? (
          <div className="note-view">
            <div className="note-view-header">
              <div>
                <div className="note-view-meta">
                  <span className="note-entity-badge large">
                    {getEntityTypeIcon(selectedNote.entityType)}
                    {selectedNote.entityId}
                  </span>
                  <span className="note-type">{selectedNote.entityType}</span>
                  <span className="note-version-badge">Version {selectedNote.version}</span>
                </div>
                <h1>{selectedNote.title}</h1>
                <div className="note-view-tags">
                  {selectedNote.tags.map(tag => (
                    <span key={tag} className="note-tag">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="note-view-actions">
                {selectedNote.history.length > 0 && (
                  <button className="btn" onClick={() => setShowHistory(true)}>
                    <Clock size={18} /> History ({selectedNote.history.length})
                  </button>
                )}
                <button className="btn" onClick={startEditNote}>
                  <Edit2 size={18} /> Edit
                </button>
                <button className="btn danger" onClick={() => deleteNote(selectedNote.id)}>
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>

            <div className="note-view-timestamps">
              <span><strong>Created:</strong> {formatDate(selectedNote.createdAt)}</span>
              <span><strong>Last Updated:</strong> {formatDate(selectedNote.updatedAt)}</span>
            </div>

            <div className="note-view-content">
              <pre>{selectedNote.content}</pre>
            </div>
          </div>
        ) : (
          <div className="notes-empty-state">
            <FileText size={64} />
            <h2>No Note Selected</h2>
            <p>Select a note from the sidebar or create a new one</p>
            <button className="btn btn-primary" onClick={startNewNote}>
              <Plus size={18} /> Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
