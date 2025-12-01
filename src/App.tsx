import { useState, useEffect } from 'react'
import { Investment, PortfolioStats } from './types'
import Dashboard from './components/Dashboard'
import AddInvestment from './components/AddInvestment'
import InvestmentList from './components/InvestmentList'
import HelpModal from './components/HelpModal'
import MacroIndicators from './components/MacroIndicators'
import TradeJournal from './components/TradeJournal'
import PositionSizing from './components/PositionSizing'
import CorrelationMatrix from './components/CorrelationMatrix'
import { ScenarioAnalysis } from './components/ScenarioAnalysis'
import { DividendTracker } from './components/DividendTracker'
import { EquityResearch } from './components/EquityResearch'
import { ThemeResearch } from './components/ThemeResearch'
import { WatchlistComponent } from './components/Watchlist'
import { ResearchNotes } from './components/ResearchNotes'
import { HelpCircle, TrendingUp, BookOpen, Calculator, GitBranch, Globe, AlertTriangle, Coins, Search, Eye, FileText } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

type TabView = 'portfolio' | 'macro' | 'research' | 'journal' | 'sizing' | 'correlation' | 'scenarios' | 'dividends' | 'watchlist' | 'notes'
type ResearchSubTab = 'equity' | 'themes'

function App() {
  const getSamplePortfolio = (): Investment[] => [
    {
      id: '1',
      name: 'Apple Inc.',
      symbol: 'AAPL',
      type: 'stock',
      quantity: 10,
      purchasePrice: 150.00,
      currentPrice: 175.50,
      purchaseDate: '2024-01-15'
    },
    {
      id: '2',
      name: 'Vanguard S&P 500 ETF',
      symbol: 'VOO',
      type: 'etf',
      quantity: 25,
      purchasePrice: 380.00,
      currentPrice: 425.75,
      purchaseDate: '2024-03-10'
    },
    {
      id: '3',
      name: 'Microsoft Corporation',
      symbol: 'MSFT',
      type: 'stock',
      quantity: 8,
      purchasePrice: 320.00,
      currentPrice: 295.25,
      purchaseDate: '2024-06-20'
    },
    {
      id: '4',
      name: 'Bitcoin',
      symbol: 'BTC',
      type: 'crypto',
      quantity: 0.5,
      purchasePrice: 45000.00,
      currentPrice: 52000.00,
      purchaseDate: '2024-02-14'
    },
    {
      id: '5',
      name: 'US Treasury Bond',
      symbol: 'TLT',
      type: 'bond',
      quantity: 50,
      purchasePrice: 95.00,
      currentPrice: 98.50,
      purchaseDate: '2024-04-05'
    }
  ]

  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem('investments')
    if (saved) {
      const parsed = JSON.parse(saved)
      // If empty array is saved, load sample portfolio
      if (parsed.length === 0) {
        return getSamplePortfolio()
      }
      return parsed
    }
    // No saved data, load sample portfolio
    return getSamplePortfolio()
  })
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [activeTab, setActiveTab] = useState<TabView>('portfolio')
  const [researchSubTab, setResearchSubTab] = useState<ResearchSubTab>('equity')

  useEffect(() => {
    localStorage.setItem('investments', JSON.stringify(investments))
  }, [investments])

  const calculateStats = (): PortfolioStats => {
    const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0)
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0)
    const totalGainLoss = totalValue - totalInvested
    const gainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0

    // Calculate best and worst performers
    let bestPerformer, worstPerformer
    if (investments.length > 0) {
      const performances = investments.map(inv => {
        const gainLoss = (inv.currentPrice - inv.purchasePrice) / inv.purchasePrice * 100
        return { name: inv.name, percentage: gainLoss }
      })
      performances.sort((a, b) => b.percentage - a.percentage)
      bestPerformer = performances[0]
      worstPerformer = performances[performances.length - 1]
    }

    // Calculate average return
    const averageReturn = investments.length > 0
      ? investments.reduce((sum, inv) => {
          const returnPct = (inv.currentPrice - inv.purchasePrice) / inv.purchasePrice * 100
          return sum + returnPct
        }, 0) / investments.length
      : 0

    // Calculate diversification score (0-100, higher is better)
    const typeCount = new Set(investments.map(inv => inv.type)).size
    const maxTypes = 6 // stock, etf, bond, mutual-fund, crypto, other
    const diversificationScore = investments.length > 0
      ? Math.min((typeCount / maxTypes) * 100, 100)
      : 0

    return {
      totalValue,
      totalInvested,
      totalGainLoss,
      gainLossPercentage,
      bestPerformer,
      worstPerformer,
      averageReturn,
      diversificationScore
    }
  }

  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString()
    }
    setInvestments([...investments, newInvestment])
    setShowAddForm(false)
  }

  const deleteInvestment = (id: string) => {
    if (window.confirm('Are you sure you want to remove this investment from your portfolio?')) {
      setInvestments(investments.filter(inv => inv.id !== id))
    }
  }

  const updateInvestment = (id: string, updates: Partial<Investment>) => {
    setInvestments(investments.map(inv => 
      inv.id === id ? { ...inv, ...updates } : inv
    ))
  }

  return (
    <div className="app dark-mode">
      <header className="app-header-enhanced">
        <div className="header-content">
          <h1>Demo Portfolio</h1>
          <p className="tagline">Professional Portfolio Management</p>
        </div>
        <div className="header-actions">
          <button 
            className="header-btn"
            onClick={() => setShowHelp(true)}
            title="Get help"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </header>

      {/* Professional Navigation */}
      <nav className="main-nav">
        <button 
          className={`nav-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          <TrendingUp size={18} />
          Portfolio
        </button>
        <button 
          className={`nav-btn ${activeTab === 'macro' ? 'active' : ''}`}
          onClick={() => setActiveTab('macro')}
        >
          <Globe size={18} />
          Macro
        </button>
        <button 
          className={`nav-btn ${activeTab === 'research' ? 'active' : ''}`}
          onClick={() => setActiveTab('research')}
        >
          <Search size={18} />
          Research
        </button>
        <button 
          className={`nav-btn ${activeTab === 'journal' ? 'active' : ''}`}
          onClick={() => setActiveTab('journal')}
        >
          <BookOpen size={18} />
          Trade Journal
        </button>
        <button 
          className={`nav-btn ${activeTab === 'sizing' ? 'active' : ''}`}
          onClick={() => setActiveTab('sizing')}
        >
          <Calculator size={18} />
          Position Sizing
        </button>
        <button 
          className={`nav-btn ${activeTab === 'correlation' ? 'active' : ''}`}
          onClick={() => setActiveTab('correlation')}
        >
          <GitBranch size={18} />
          Correlation
        </button>
        <button 
          className={`nav-btn ${activeTab === 'scenarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenarios')}
        >
          <AlertTriangle size={18} />
          Scenarios
        </button>
        <button 
          className={`nav-btn ${activeTab === 'dividends' ? 'active' : ''}`}
          onClick={() => setActiveTab('dividends')}
        >
          <Coins size={18} />
          Dividends
        </button>
        <button 
          className={`nav-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('watchlist')}
        >
          <Eye size={18} />
          Watchlist
        </button>
        <button 
          className={`nav-btn ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText size={18} />
          Notes
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'portfolio' && (
          <div className="main-layout">
            <div className="main-col">
              <Dashboard stats={calculateStats()} investments={investments} />

              <section className="investments-section">
                <div className="section-header">
                  <h2>Your Investments</h2>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    {showAddForm ? '✕ Cancel' : '+ Add Investment'}
                  </button>
                </div>

                {showAddForm && (
                  <AddInvestment 
                    onAdd={addInvestment}
                    onCancel={() => setShowAddForm(false)}
                  />
                )}

                {investments.length === 0 && !showAddForm && (
                  <div className="empty-state">
                    <div className="empty-state-icon">📈</div>
                    <h3>Start Building Your Portfolio</h3>
                    <p>You haven't added any investments yet. Click "Add Investment" above to get started!</p>
                    <div className="help-tip">
                      <strong>New to investing?</strong> Don't worry! Click the "Help" button in the header to learn about the basics.
                    </div>
                  </div>
                )}

                {investments.length > 0 && (
                  <InvestmentList 
                    investments={investments}
                    onDelete={deleteInvestment}
                    onUpdate={updateInvestment}
                  />
                )}
              </section>
            </div>

            <aside className="sidebar-col">
              {/* Allocation donut chart */}
              <section className="allocation-section sidebar-card">
                <h3>Allocation</h3>
                <p className="section-description">{calculateStats().totalValue > 0 ? `Total: $${(calculateStats().totalValue / 1000).toFixed(1)}K` : 'No holdings'}</p>
                {investments.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={(() => {
                            const alloc: Record<string, number> = {}
                            investments.forEach(inv => {
                              const value = inv.quantity * inv.currentPrice
                              alloc[inv.type] = (alloc[inv.type] || 0) + value
                            })
                            return Object.entries(alloc).map(([type, value]) => ({
                              name: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                              value
                            }))
                          })()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
                            <Cell key={`cell-${idx}`} fill={['#00d9ff', '#00ff88', '#ffaa00', '#ff3366', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'][idx]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              {/* Top gainers */}
              <section className="alerts-panel sidebar-card">
                <h3>Gainers</h3>
                <p className="section-description">Most profitable positions</p>
                <div style={{ marginTop: '1rem' }}>
                  {investments.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No investments</div>
                  ) : (
                    investments
                      .map(inv => ({ ...inv, gain: ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100 }))
                      .sort((a, b) => b.gain - a.gain)
                      .slice(0, 5)
                      .map(inv => (
                        <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)' }}>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>{inv.symbol}</div>
                            <div style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>${(inv.quantity * inv.currentPrice).toFixed(0)}</div>
                          </div>
                          <div style={{ color: inv.gain >= 0 ? '#00ff88' : '#ff3366', fontWeight: 600, textAlign: 'right' }}>
                            {inv.gain >= 0 ? '+' : ''}{inv.gain.toFixed(1)}%
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </section>
            </aside>
          </div>
        )}

        {activeTab === 'macro' && <MacroIndicators />}
        {activeTab === 'research' && (
          <div className="research-tabs-container">
            <nav className="research-sub-nav">
              <button 
                className={`research-sub-btn ${researchSubTab === 'equity' ? 'active' : ''}`}
                onClick={() => setResearchSubTab('equity')}
              >
                Single Names
              </button>
              <button 
                className={`research-sub-btn ${researchSubTab === 'themes' ? 'active' : ''}`}
                onClick={() => setResearchSubTab('themes')}
              >
                Themes
              </button>
            </nav>
            <div className="research-content">
              {researchSubTab === 'equity' && <EquityResearch />}
              {researchSubTab === 'themes' && <ThemeResearch />}
            </div>
          </div>
        )}
        {activeTab === 'journal' && <TradeJournal />}
        {activeTab === 'sizing' && <PositionSizing />}
        {activeTab === 'correlation' && <CorrelationMatrix investments={investments} />}
        {activeTab === 'scenarios' && <ScenarioAnalysis investments={investments} />}
        {activeTab === 'dividends' && <DividendTracker investments={investments} />}
        {activeTab === 'watchlist' && <WatchlistComponent />}
        {activeTab === 'notes' && <ResearchNotes />}
      </main>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default App
