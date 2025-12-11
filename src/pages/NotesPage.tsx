/**
 * Notes Page
 * 
 * Research notes and investment documentation
 */

import { useState } from 'react';
import { FileText, Plus, Search, Edit2, Trash2, Tag, Calendar, Star, StarOff, ChevronRight } from 'lucide-react';
import './pages.css';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  symbol?: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'NVDA Q4 Earnings Analysis',
    content: 'Strong beat on revenue and EPS. Data center segment grew 409% YoY driven by AI demand. Guidance raised significantly. Key risks: competition from AMD, potential demand normalization.',
    tags: ['earnings', 'ai'],
    symbol: 'NVDA',
    createdAt: new Date('2024-02-21'),
    updatedAt: new Date('2024-02-21'),
    isPinned: true,
  },
  {
    id: '2',
    title: 'Fed Policy Outlook',
    content: 'Rate cuts likely delayed to H2 2024. Inflation remains sticky above 3%. Employment still strong. Watch for any shift in Fed language regarding timing of cuts.',
    tags: ['macro', 'fed'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-20'),
    isPinned: false,
  },
  {
    id: '3',
    title: 'AAPL Vision Pro Launch',
    content: 'Initial reviews mixed. High price point limits TAM. Long-term potential in spatial computing. Watch for developer adoption and content ecosystem growth.',
    tags: ['product', 'ar/vr'],
    symbol: 'AAPL',
    createdAt: new Date('2024-02-02'),
    updatedAt: new Date('2024-02-10'),
    isPinned: false,
  },
  {
    id: '4',
    title: 'Clean Energy Thesis Update',
    content: 'IRA continues to drive investment. Solar installations ahead of forecast. Battery storage capacity growing rapidly. Key picks: ENPH, FSLR for pure play exposure.',
    tags: ['thesis', 'clean-energy'],
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-02-18'),
    isPinned: true,
  },
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', tags: '', symbol: '' });

  const allTags = [...new Set(notes.flatMap(n => n.tags))];

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const handleCreateNote = () => {
    setEditForm({ title: '', content: '', tags: '', symbol: '' });
    setSelectedNote(null);
    setIsEditing(true);
  };

  const handleEditNote = (note: Note) => {
    setEditForm({
      title: note.title,
      content: note.content,
      tags: note.tags.join(', '),
      symbol: note.symbol || '',
    });
    setSelectedNote(note);
    setIsEditing(true);
  };

  const handleSaveNote = () => {
    const tagsArray = editForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    
    if (selectedNote) {
      setNotes(prev => prev.map(n => 
        n.id === selectedNote.id
          ? { ...n, title: editForm.title, content: editForm.content, tags: tagsArray, symbol: editForm.symbol || undefined, updatedAt: new Date() }
          : n
      ));
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: editForm.title,
        content: editForm.content,
        tags: tagsArray,
        symbol: editForm.symbol || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
      };
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
    }
    setIsEditing(false);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Delete this note?')) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    }
  };

  const togglePin = (noteId: string) => {
    setNotes(prev => prev.map(n =>
      n.id === noteId ? { ...n, isPinned: !n.isPinned } : n
    ));
  };

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Research Notes</h1>
          <p className="page__subtitle">Document your investment research and insights</p>
        </div>
        <button className="btn btn--primary" onClick={handleCreateNote}>
          <Plus size={16} />
          New Note
        </button>
      </div>

      <div className="notes-layout">
        {/* Notes List */}
        <aside className="notes-sidebar">
          <div className="notes-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="tags-filter">
            <button 
              className={`tag-btn ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="notes-list">
            {sortedNotes.map(note => (
              <div 
                key={note.id}
                className={`note-item ${selectedNote?.id === note.id ? 'selected' : ''}`}
                onClick={() => { setSelectedNote(note); setIsEditing(false); }}
              >
                <div className="note-item__header">
                  {note.isPinned && <Star size={12} className="pin-icon" />}
                  <span className="note-title">{note.title}</span>
                  {note.symbol && <span className="note-symbol">{note.symbol}</span>}
                </div>
                <p className="note-preview">{note.content.slice(0, 80)}...</p>
                <div className="note-meta">
                  <span className="note-date">
                    <Calendar size={12} />
                    {note.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Note Detail / Editor */}
        <main className="note-content">
          {isEditing ? (
            <div className="card note-editor">
              <div className="card__header">
                <h3 className="card__title">{selectedNote ? 'Edit Note' : 'New Note'}</h3>
                <div className="editor-actions">
                  <button className="btn btn--ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button className="btn btn--primary" onClick={handleSaveNote}>Save</button>
                </div>
              </div>
              <div className="card__body">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Note title..."
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Symbol (optional)</label>
                    <input
                      type="text"
                      value={editForm.symbol}
                      onChange={e => setEditForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                      placeholder="AAPL"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tags (comma separated)</label>
                    <input
                      type="text"
                      value={editForm.tags}
                      onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="earnings, thesis, macro"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Content</label>
                  <textarea
                    value={editForm.content}
                    onChange={e => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your research notes..."
                    rows={12}
                  />
                </div>
              </div>
            </div>
          ) : selectedNote ? (
            <div className="card note-view">
              <div className="card__header">
                <div className="note-view__title">
                  <h2>{selectedNote.title}</h2>
                  {selectedNote.symbol && (
                    <span className="note-symbol-large">{selectedNote.symbol}</span>
                  )}
                </div>
                <div className="note-actions">
                  <button className="btn btn--icon" onClick={() => togglePin(selectedNote.id)} title={selectedNote.isPinned ? 'Unpin' : 'Pin'}>
                    {selectedNote.isPinned ? <Star size={18} /> : <StarOff size={18} />}
                  </button>
                  <button className="btn btn--icon" onClick={() => handleEditNote(selectedNote)} title="Edit">
                    <Edit2 size={18} />
                  </button>
                  <button className="btn btn--icon btn--danger" onClick={() => handleDeleteNote(selectedNote.id)} title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="card__body">
                <div className="note-tags">
                  {selectedNote.tags.map(tag => (
                    <span key={tag} className="tag">
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="note-dates">
                  <span>Created: {selectedNote.createdAt.toLocaleDateString()}</span>
                  <span>Updated: {selectedNote.updatedAt.toLocaleDateString()}</span>
                </div>
                <div className="note-body">
                  {selectedNote.content.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={48} />
              <h3>Select a note</h3>
              <p>Choose a note from the list or create a new one</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
