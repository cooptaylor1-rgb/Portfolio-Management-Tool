/**
 * Trade Journal Page
 * 
 * Log and analyze trading decisions for continuous improvement
 */

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Tag, Calendar, DollarSign } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import './pages.css';

interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  action: 'buy' | 'sell' | 'short' | 'cover';
  quantity: number;
  price: number;
  outcome?: 'win' | 'loss' | 'breakeven' | 'open';
  pnl?: number;
  pnlPercent?: number;
  strategy: string;
  setup: string;
  notes: string;
  emotions: string[];
  lessons: string;
  rating: number; // 1-5
}

const STRATEGIES = ['Momentum', 'Value', 'Swing Trade', 'Day Trade', 'Breakout', 'Mean Reversion', 'Earnings Play', 'Technical'];
const SETUPS = ['Support Bounce', 'Resistance Break', 'Moving Average Cross', 'RSI Oversold', 'RSI Overbought', 'Gap Fill', 'Trend Follow', 'Reversal'];
const EMOTIONS = ['Confident', 'Fearful', 'Greedy', 'Patient', 'Impatient', 'FOMO', 'Calm', 'Anxious'];
const COLORS = ['#3fb950', '#f85149', '#8b949e', '#58a6ff'];

// Sample journal entries
const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    date: '2024-02-15',
    symbol: 'NVDA',
    action: 'buy',
    quantity: 50,
    price: 720.50,
    outcome: 'win',
    pnl: 2500,
    pnlPercent: 6.94,
    strategy: 'Momentum',
    setup: 'Breakout',
    notes: 'AI demand continues to drive growth. Entered on breakout above $700 resistance with high volume confirmation.',
    emotions: ['Confident', 'Patient'],
    lessons: 'Waiting for volume confirmation paid off. Should have sized larger given the setup quality.',
    rating: 4,
  },
  {
    id: '2',
    date: '2024-02-10',
    symbol: 'TSLA',
    action: 'buy',
    quantity: 30,
    price: 185.00,
    outcome: 'loss',
    pnl: -450,
    pnlPercent: -8.11,
    strategy: 'Mean Reversion',
    setup: 'RSI Oversold',
    notes: 'Tried to catch falling knife. RSI was oversold but trend was clearly down.',
    emotions: ['FOMO', 'Impatient'],
    lessons: 'Need to wait for trend reversal confirmation, not just oversold conditions. Counter-trend trades need tighter stops.',
    rating: 2,
  },
  {
    id: '3',
    date: '2024-02-08',
    symbol: 'AMD',
    action: 'sell',
    quantity: 100,
    price: 175.30,
    outcome: 'win',
    pnl: 1200,
    pnlPercent: 7.35,
    strategy: 'Swing Trade',
    setup: 'Resistance Break',
    notes: 'Closed position at target. Good execution on exit near resistance.',
    emotions: ['Calm', 'Patient'],
    lessons: 'Sticking to the plan worked well. Taking profits at resistance was the right call.',
    rating: 5,
  },
];

export default function TradeJournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('tradeJournal');
    return saved ? JSON.parse(saved) : INITIAL_ENTRIES;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('tradeJournal', JSON.stringify(entries));
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.strategy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesOutcome = outcomeFilter === 'all' || entry.outcome === outcomeFilter;
      return matchesSearch && matchesOutcome;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, searchTerm, outcomeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const completedTrades = entries.filter(e => e.outcome && e.outcome !== 'open');
    const wins = completedTrades.filter(e => e.outcome === 'win');
    const losses = completedTrades.filter(e => e.outcome === 'loss');
    const totalPnL = completedTrades.reduce((sum, e) => sum + (e.pnl || 0), 0);
    const avgWin = wins.length > 0 ? wins.reduce((sum, e) => sum + (e.pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, e) => sum + (e.pnl || 0), 0) / losses.length) : 0;
    
    return {
      totalTrades: completedTrades.length,
      winRate: completedTrades.length > 0 ? (wins.length / completedTrades.length) * 100 : 0,
      totalPnL,
      avgWin,
      avgLoss,
      profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0,
      avgRating: entries.length > 0 ? entries.reduce((sum, e) => sum + e.rating, 0) / entries.length : 0,
    };
  }, [entries]);

  // Strategy breakdown
  const strategyBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; pnl: number }> = {};
    entries.filter(e => e.pnl !== undefined).forEach(e => {
      if (!breakdown[e.strategy]) {
        breakdown[e.strategy] = { count: 0, pnl: 0 };
      }
      breakdown[e.strategy].count++;
      breakdown[e.strategy].pnl += e.pnl || 0;
    });
    return Object.entries(breakdown).map(([strategy, data]) => ({
      strategy,
      ...data,
    })).sort((a, b) => b.pnl - a.pnl);
  }, [entries]);

  const handleAddEntry = (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setEntries([newEntry, ...entries]);
    setShowAddModal(false);
  };

  const outcomeData = useMemo(() => [
    { name: 'Wins', value: entries.filter(e => e.outcome === 'win').length },
    { name: 'Losses', value: entries.filter(e => e.outcome === 'loss').length },
    { name: 'Breakeven', value: entries.filter(e => e.outcome === 'breakeven').length },
    { name: 'Open', value: entries.filter(e => e.outcome === 'open' || !e.outcome).length },
  ].filter(d => d.value > 0), [entries]);

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Trade Journal</h1>
          <p className="page__subtitle">{entries.length} entries logged</p>
        </div>
        <div className="page__actions">
          <button className="btn btn--primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} />
            New Entry
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="journal-stats">
        <div className="stat-card">
          <div className="stat-card__icon" style={{ backgroundColor: 'rgba(63, 185, 80, 0.1)', color: '#3fb950' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.winRate.toFixed(1)}%</span>
            <span className="stat-card__label">Win Rate</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ backgroundColor: 'rgba(88, 166, 255, 0.1)', color: '#58a6ff' }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-card__content">
            <span className={`stat-card__value ${stats.totalPnL >= 0 ? 'positive' : 'negative'}`}>
              ${stats.totalPnL.toLocaleString()}
            </span>
            <span className="stat-card__label">Total P&L</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.profitFactor.toFixed(2)}</span>
            <span className="stat-card__label">Profit Factor</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.avgRating.toFixed(1)}/5</span>
            <span className="stat-card__label">Avg Rating</span>
          </div>
        </div>
      </div>

      <div className="journal-grid">
        {/* Charts */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Trade Outcomes</h2>
          </div>
          <div className="card__body">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {outcomeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <h2 className="card__title">P&L by Strategy</h2>
          </div>
          <div className="card__body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={strategyBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis type="number" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 10 }} />
                <YAxis type="category" dataKey="strategy" stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'P&L']}
                />
                <Bar dataKey="pnl" fill="#58a6ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Filters */}
      <div className="page__filters">
        <div className="search-input">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={outcomeFilter}
            onChange={e => setOutcomeFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Outcomes</option>
            <option value="win">Wins</option>
            <option value="loss">Losses</option>
            <option value="breakeven">Breakeven</option>
            <option value="open">Open</option>
          </select>
        </div>
      </div>

      {/* Journal Entries */}
      <div className="journal-entries">
        {filteredEntries.map(entry => (
          <div key={entry.id} className="journal-entry" onClick={() => setViewingEntry(entry)}>
            <div className="journal-entry__header">
              <div className="journal-entry__title">
                <span className={`entry-action ${entry.action}`}>{entry.action.toUpperCase()}</span>
                <span className="entry-symbol">{entry.symbol}</span>
                <span className="entry-quantity">{entry.quantity} shares @ ${entry.price}</span>
              </div>
              <div className="journal-entry__meta">
                <span className="entry-date">
                  <Calendar size={14} />
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                {entry.outcome && entry.outcome !== 'open' && (
                  <span className={`entry-outcome ${entry.outcome}`}>
                    {entry.outcome === 'win' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {entry.pnl !== undefined && (
                      <span>${Math.abs(entry.pnl).toLocaleString()}</span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="journal-entry__body">
              <div className="entry-tags">
                <span className="entry-tag">
                  <Tag size={12} />
                  {entry.strategy}
                </span>
                <span className="entry-tag">{entry.setup}</span>
              </div>
              <p className="entry-notes">{entry.notes}</p>
            </div>
            <div className="journal-entry__footer">
              <div className="entry-emotions">
                {entry.emotions.map(emotion => (
                  <span key={emotion} className="emotion-tag">{emotion}</span>
                ))}
              </div>
              <div className="entry-rating">
                {'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <JournalEntryModal onSave={handleAddEntry} onClose={() => setShowAddModal(false)} />
      )}

      {/* View Modal */}
      {viewingEntry && (
        <ViewEntryModal entry={viewingEntry} onClose={() => setViewingEntry(null)} />
      )}
    </div>
  );
}

function JournalEntryModal({
  onSave,
  onClose,
}: {
  onSave: (entry: Omit<JournalEntry, 'id'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    action: 'buy' as const,
    quantity: '',
    price: '',
    outcome: 'open' as const,
    pnl: '',
    strategy: STRATEGIES[0],
    setup: SETUPS[0],
    notes: '',
    emotions: [] as string[],
    lessons: '',
    rating: 3,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date: form.date,
      symbol: form.symbol.toUpperCase(),
      action: form.action,
      quantity: parseInt(form.quantity),
      price: parseFloat(form.price),
      outcome: form.outcome,
      pnl: form.pnl ? parseFloat(form.pnl) : undefined,
      pnlPercent: form.pnl ? (parseFloat(form.pnl) / (parseInt(form.quantity) * parseFloat(form.price))) * 100 : undefined,
      strategy: form.strategy,
      setup: form.setup,
      notes: form.notes,
      emotions: form.emotions,
      lessons: form.lessons,
      rating: form.rating,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">New Journal Entry</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Symbol</label>
                <input className="form-input" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="AAPL" required />
              </div>
              <div className="form-group">
                <label className="form-label">Action</label>
                <select className="form-select" value={form.action} onChange={e => setForm({ ...form, action: e.target.value as any })}>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                  <option value="short">Short</option>
                  <option value="cover">Cover</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input type="number" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Price</label>
                <input type="number" step="0.01" className="form-input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Outcome</label>
                <select className="form-select" value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value as any })}>
                  <option value="open">Open</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="breakeven">Breakeven</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">P&L ($)</label>
                <input type="number" step="0.01" className="form-input" value={form.pnl} onChange={e => setForm({ ...form, pnl: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Strategy</label>
                <select className="form-select" value={form.strategy} onChange={e => setForm({ ...form, strategy: e.target.value })}>
                  {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Setup</label>
                <select className="form-select" value={form.setup} onChange={e => setForm({ ...form, setup: e.target.value })}>
                  {SETUPS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <select className="form-select" value={form.rating} onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Trade Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Why did you take this trade?" />
            </div>
            <div className="form-group">
              <label className="form-label">Emotions During Trade</label>
              <div className="emotion-selector">
                {EMOTIONS.map(emotion => (
                  <button
                    key={emotion}
                    type="button"
                    className={`emotion-btn ${form.emotions.includes(emotion) ? 'selected' : ''}`}
                    onClick={() => setForm({
                      ...form,
                      emotions: form.emotions.includes(emotion)
                        ? form.emotions.filter(e => e !== emotion)
                        : [...form.emotions, emotion]
                    })}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Lessons Learned</label>
              <textarea className="form-textarea" value={form.lessons} onChange={e => setForm({ ...form, lessons: e.target.value })} rows={2} placeholder="What did you learn from this trade?" />
            </div>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Save Entry</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewEntryModal({ entry, onClose }: { entry: JournalEntry; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{entry.symbol} - {entry.action.toUpperCase()}</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        <div className="modal__body">
          <div className="entry-detail-grid">
            <div className="entry-detail">
              <span className="label">Date</span>
              <span className="value">{new Date(entry.date).toLocaleDateString()}</span>
            </div>
            <div className="entry-detail">
              <span className="label">Position</span>
              <span className="value">{entry.quantity} @ ${entry.price}</span>
            </div>
            <div className="entry-detail">
              <span className="label">Outcome</span>
              <span className={`value ${entry.outcome}`}>{entry.outcome?.toUpperCase()}</span>
            </div>
            {entry.pnl !== undefined && (
              <div className="entry-detail">
                <span className="label">P&L</span>
                <span className={`value ${entry.pnl >= 0 ? 'positive' : 'negative'}`}>
                  ${entry.pnl.toLocaleString()} ({entry.pnlPercent?.toFixed(2)}%)
                </span>
              </div>
            )}
            <div className="entry-detail">
              <span className="label">Strategy</span>
              <span className="value">{entry.strategy}</span>
            </div>
            <div className="entry-detail">
              <span className="label">Setup</span>
              <span className="value">{entry.setup}</span>
            </div>
          </div>
          <div className="entry-section">
            <h3>Trade Notes</h3>
            <p>{entry.notes}</p>
          </div>
          <div className="entry-section">
            <h3>Emotions</h3>
            <div className="emotion-tags">
              {entry.emotions.map(e => <span key={e} className="emotion-tag">{e}</span>)}
            </div>
          </div>
          {entry.lessons && (
            <div className="entry-section">
              <h3>Lessons Learned</h3>
              <p>{entry.lessons}</p>
            </div>
          )}
          <div className="entry-section">
            <h3>Rating</h3>
            <span className="entry-rating large">{'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}</span>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
