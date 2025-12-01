import { useState, useEffect } from 'react'
import { Investment, PortfolioStats } from './types'
import Dashboard from './components/Dashboard'
import AddInvestment from './components/AddInvestment'
import InvestmentList from './components/InvestmentList'
import HelpModal from './components/HelpModal'
import { HelpCircle } from 'lucide-react'

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
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>📊 My Portfolio Manager</h1>
          <p className="tagline">Track your investments with confidence</p>
        </div>
        <button 
          className="help-button"
          onClick={() => setShowHelp(true)}
          title="Get help"
        >
          <HelpCircle size={24} />
          <span>Help</span>
        </button>
      </header>

      <main className="main-content">
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
      </main>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default App
