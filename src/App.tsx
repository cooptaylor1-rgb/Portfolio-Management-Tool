import { useState, useEffect } from 'react'
import { Investment, PortfolioStats } from './types'
import { useAuth } from './contexts/AuthContext'
import { useToast } from './hooks/useToast'
import { ToastContainer } from './components/ui/Toast'
import Login from './components/Login'
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
import { CollaborationPanel } from './components/CollaborationPanel'
import { HelpCircle, TrendingUp, BookOpen, Calculator, GitBranch, Globe, AlertTriangle, Coins, Search, Eye, FileText, LogOut, User, Users } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

type TabView = 'portfolio' | 'macro' | 'research' | 'journal' | 'sizing' | 'correlation' | 'scenarios' | 'dividends' | 'watchlist' | 'notes' | 'collaboration'
type ResearchSubTab = 'equity' | 'themes'

function App() {
  const authContext = useAuth();
  const { isAuthenticated, user, login, register, logout, loading } = authContext || {};
  const { toasts, success, error: showError } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // TEMPORARY: Skip login for debugging
  const skipLogin = true; // Force skip for now
  
  // Create mock user for skip auth mode
  const activeUser = skipLogin ? { id: 'demo', name: 'Demo User', email: 'demo@example.com', createdAt: new Date().toISOString() } : user;

  // Skip loading and auth checks
  // if (loading && !skipLogin) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-gray-900">
  //       <div className="text-center">
  //         <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
  //         <p className="text-gray-400">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Show login page if not authenticated (unless skipauth is in URL)
  // if (!isAuthenticated && !skipLogin) {
  //   return (
  //     <Login
  //       onLogin={async (email, password) => {
  //         await login({ email, password });
  //       }}
  //       onRegister={async (name, email, password, confirmPassword) => {
  //         await register({ name, email, password, confirmPassword });
  //       }}
  //     />
  //   );
  // }

  const handleLogout = async () => {
    if (logout && window.confirm('Are you sure you want to log out?')) {
      await logout();
      setShowUserMenu(false);
    }
  };

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
    // Use user-specific storage key
    const storageKey = `investments_${activeUser?.id || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If empty array is saved, load sample portfolio
      if (parsed.length === 0) {
        return getSamplePortfolio();
      }
      return parsed;
    }
    // No saved data, load sample portfolio
    return getSamplePortfolio();
  })
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [activeTab, setActiveTab] = useState<TabView>('portfolio')
  const [researchSubTab, setResearchSubTab] = useState<ResearchSubTab>('equity')

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K - Show help (command palette equivalent)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowHelp(true)
      }
      // Escape - Close modals
      if (e.key === 'Escape') {
        setShowHelp(false)
        setShowAddForm(false)
        setShowUserMenu(false)
      }
      // Ctrl/Cmd + N - Add new investment
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowAddForm(true)
      }
      // Number keys 1-9 for quick tab navigation
      if (e.key >= '1' && e.key <= '9' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        const tabs: TabView[] = ['portfolio', 'macro', 'research', 'journal', 'sizing', 'correlation', 'scenarios', 'dividends', 'watchlist']
        const index = parseInt(e.key) - 1
        if (index < tabs.length) {
          setActiveTab(tabs[index])
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    // Save to user-specific storage
    const storageKey = `investments_${activeUser?.id || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(investments));
  }, [investments, activeUser])

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
    success(`${investment.symbol} added to portfolio!`)
  }

  const deleteInvestment = (id: string) => {
    const investment = investments.find(inv => inv.id === id)
    if (window.confirm('Are you sure you want to remove this investment from your portfolio?')) {
      setInvestments(investments.filter(inv => inv.id !== id))
      if (investment) {
        success(`${investment.symbol} removed from portfolio`)
      }
    }
  }

  const updateInvestment = (id: string, updates: Partial<Investment>) => {
    setInvestments(investments.map(inv => 
      inv.id === id ? { ...inv, ...updates } : inv
    ))
    success('Investment updated successfully')
  }

  return (
    <div className="app-container">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="app-header" role="banner">
        <h1>
          <TrendingUp size={24} aria-hidden="true" />
          {activeUser?.name}'s Portfolio
        </h1>
        <div className="header-actions">
          <button 
            className="btn-icon btn-ghost"
            onClick={() => setShowHelp(true)}
            title="Get help (Ctrl+K)"
            aria-label="Get help - Press Control K"
          >
            <HelpCircle size={20} aria-hidden="true" />
            <span className="sr-only">Keyboard shortcut: Ctrl+K</span>
          </button>
          {!skipLogin && (
            <div className="dropdown">
              <button 
                className="btn-ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title="User menu"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <User size={20} />
                <span className="text-sm">{activeUser?.name}</span>
              </button>
              {showUserMenu && (
                <div className="dropdown-menu">
                  <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-primary)' }}>
                    <div className="font-semibold text-primary">{activeUser?.name}</div>
                    <div className="text-sm text-secondary">{activeUser?.email}</div>
                  </div>
                  <button
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Professional Navigation */}
      <nav className="tabs" style={{ paddingLeft: 'var(--spacing-xl)', paddingRight: 'var(--spacing-xl)' }} role="navigation" aria-label="Main navigation">
        <button 
          className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
          aria-label="Portfolio view - Press Control 1"
          aria-current={activeTab === 'portfolio' ? 'page' : undefined}
        >
          <TrendingUp size={18} aria-hidden="true" />
          Portfolio
        </button>
        <button 
          className={`tab ${activeTab === 'macro' ? 'active' : ''}`}
          onClick={() => setActiveTab('macro')}
        >
          <Globe size={18} />
          Macro
        </button>
        <button 
          className={`tab ${activeTab === 'research' ? 'active' : ''}`}
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
          Journal
        </button>
        <button 
          className={`tab ${activeTab === 'sizing' ? 'active' : ''}`}
          onClick={() => setActiveTab('sizing')}
        >
          <Calculator size={18} />
          Position Sizing
        </button>
        <button 
          className={`tab ${activeTab === 'correlation' ? 'active' : ''}`}
          onClick={() => setActiveTab('correlation')}
        >
          <GitBranch size={18} />
          Correlation
        </button>
        <button 
          className={`tab ${activeTab === 'scenarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenarios')}
        >
          <AlertTriangle size={18} />
          Scenarios
        </button>
        <button 
          className={`tab ${activeTab === 'dividends' ? 'active' : ''}`}
          onClick={() => setActiveTab('dividends')}
        >
          <Coins size={18} />
          Dividends
        </button>
        <button 
          className={`tab ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('watchlist')}
        >
          <Eye size={18} />
          Watchlist
        </button>
        <button 
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <FileText size={18} />
          Notes
        </button>
        <button 
          className={`tab ${activeTab === 'collaboration' ? 'active' : ''}`}
          onClick={() => setActiveTab('collaboration')}
        >
          <Users size={18} />
          Collaborate
        </button>
      </nav>

      <main className="app-main" id="main-content" role="main">
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-3" style={{ gap: 'var(--spacing-xl)' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <Dashboard stats={calculateStats()} investments={investments} />

              <section className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
                <div className="card-header">
                  <h2 className="card-title">Your Investments</h2>
                  <button 
                    className={showAddForm ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => setShowAddForm(!showAddForm)}
                    title={showAddForm ? 'Cancel' : 'Add Investment (Ctrl+N)'}
                    aria-label={showAddForm ? 'Cancel adding investment' : 'Add new investment - Press Control N'}
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
                  <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-2xl)', 
                    background: 'var(--bg-elevated)', 
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed var(--border-secondary)'
                  }}>
                    <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-md)' }}>📈</div>
                    <h3 className="text-xl font-semibold text-primary mb-sm">Start Building Your Portfolio</h3>
                    <p className="text-secondary mb-lg">You haven't added any investments yet. Click "Add Investment" above to get started!</p>
                    <div className="alert alert-info" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
                      <span style={{ fontSize: '20px' }}>💡</span>
                      <div>
                        <strong>New to investing?</strong> Click the Help button (Ctrl+K) in the header to learn about the basics.
                      </div>
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

            <aside style={{ gridColumn: 'span 1' }}>
              {/* Allocation donut chart */}
              <section className="card">
                <h3 className="card-title">Allocation</h3>
                <p className="text-secondary text-sm">{calculateStats().totalValue > 0 ? `Total: $${(calculateStats().totalValue / 1000).toFixed(1)}K` : 'No holdings'}</p>
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
              <section className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h3 className="card-title">Gainers</h3>
                <p className="text-secondary text-sm">Most profitable positions</p>
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
        {activeTab === 'collaboration' && <CollaborationPanel />}
      </main>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default App
