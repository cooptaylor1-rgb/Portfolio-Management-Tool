import { useState, useEffect } from 'react'
import { 
  Investment, PortfolioStats, Alert, WatchlistItem, NewsItem, 
  PerformanceData, RiskMetrics 
} from './types'
import Dashboard from './components/Dashboard'
import AddInvestment from './components/AddInvestment'
import InvestmentList from './components/InvestmentList'
import HelpModal from './components/HelpModal'
import PerformanceChart from './components/PerformanceChart'
import RiskAnalysis from './components/RiskAnalysis'
import AlertsPanel from './components/AlertsPanel'
import NewsFeed from './components/NewsFeed'
import Watchlist from './components/Watchlist'
import { HelpCircle, BarChart3, Shield, Bell, Newspaper, Eye, Moon, Sun } from 'lucide-react'
import { fetchHistoricalData, fetchNews, calculateRiskMetrics, fetchMarketData } from './services/marketData'
import { generateAlerts } from './services/analytics'

function AppEnhanced() {
  const getSamplePortfolio = (): Investment[] => [
    {
      id: '1',
      name: 'Apple Inc.',
      symbol: 'AAPL',
      type: 'stock',
      quantity: 10,
      purchasePrice: 150.00,
      currentPrice: 175.50,
      purchaseDate: '2024-01-15',
      sector: 'Technology'
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
      purchaseDate: '2024-06-20',
      sector: 'Technology'
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

  // State management
  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem('investments')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.length === 0) return getSamplePortfolio()
      return parsed
    }
    return getSamplePortfolio()
  })
  
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem('watchlist')
    return saved ? JSON.parse(saved) : []
  })

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [marketDataMap, setMarketDataMap] = useState<Map<string, any>>(new Map())
  
  const [activeView, setActiveView] = useState<'dashboard' | 'analytics' | 'risk' | 'alerts' | 'news' | 'watchlist'>('dashboard')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Load data on mount and periodically
  useEffect(() => {
    loadMarketData()
    loadNews()
    generateAlertsData()
    
    const interval = setInterval(() => {
      loadMarketData()
      loadNews()
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [investments])

  useEffect(() => {
    localStorage.setItem('investments', JSON.stringify(investments))
  }, [investments])

  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  const loadMarketData = async () => {
    const symbols = [...investments.map(inv => inv.symbol), ...watchlist.map(w => w.symbol)]
    const newMarketData = new Map()
    
    for (const symbol of symbols) {
      const data = await fetchMarketData(symbol)
      if (data) newMarketData.set(symbol, data)
    }
    
    setMarketDataMap(newMarketData)

    // Load historical data for portfolio performance
    const histData = await fetchHistoricalData('PORTFOLIO', 90)
    const portfolioHistData = histData.map((d: any) => ({
      ...d,
      value: investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0) * (1 + (Math.random() - 0.5) * 0.1)
    }))
    setPerformanceData(portfolioHistData)

    // Calculate risk metrics
    if (portfolioHistData.length > 0) {
      const metrics = calculateRiskMetrics(investments, portfolioHistData)
      setRiskMetrics(metrics)
    }
  }

  const loadNews = async () => {
    const symbols = investments.map(inv => inv.symbol)
    const newsData = await fetchNews(symbols)
    setNews(newsData)
  }

  const generateAlertsData = () => {
    const generatedAlerts = generateAlerts(investments)
    setAlerts(generatedAlerts)
  }

  const calculateStats = (): PortfolioStats => {
    const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0)
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0)
    const totalGainLoss = totalValue - totalInvested
    const gainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0

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

    const averageReturn = investments.length > 0
      ? investments.reduce((sum, inv) => {
          const returnPct = (inv.currentPrice - inv.purchasePrice) / inv.purchasePrice * 100
          return sum + returnPct
        }, 0) / investments.length
      : 0

    const typeCount = new Set(investments.map(inv => inv.type)).size
    const maxTypes = 6
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
      diversificationScore,
      volatility: riskMetrics?.portfolioVolatility,
      sharpeRatio: riskMetrics?.sharpeRatio,
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

  const addToWatchlist = (item: Omit<WatchlistItem, 'id' | 'addedDate'>) => {
    const newItem: WatchlistItem = {
      ...item,
      id: Date.now().toString(),
      addedDate: new Date().toISOString()
    }
    setWatchlist([...watchlist, newItem])
  }

  const removeFromWatchlist = (id: string) => {
    setWatchlist(watchlist.filter(item => item.id !== id))
  }

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  const markAlertRead = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ))
  }

  const unreadAlertCount = alerts.filter(a => !a.read).length

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <header className="app-header-enhanced">
        <div className="header-content">
          <h1>📊 Portfolio Manager Pro</h1>
          <p className="tagline">Bloomberg-level insights for everyone</p>
        </div>
        <div className="header-actions">
          <button 
            className="header-btn"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            className="header-btn"
            onClick={() => setActiveView('alerts')}
            title="Alerts"
          >
            <Bell size={20} />
            {unreadAlertCount > 0 && <span className="notification-badge">{unreadAlertCount}</span>}
          </button>
          <button 
            className="header-btn"
            onClick={() => setShowHelp(true)}
            title="Help"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </header>

      <nav className="main-nav">
        <button 
          className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
        >
          <BarChart3 size={20} />
          <span>Dashboard</span>
        </button>
        <button 
          className={`nav-btn ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          <BarChart3 size={20} />
          <span>Analytics</span>
        </button>
        <button 
          className={`nav-btn ${activeView === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveView('risk')}
        >
          <Shield size={20} />
          <span>Risk Analysis</span>
        </button>
        <button 
          className={`nav-btn ${activeView === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActiveView('watchlist')}
        >
          <Eye size={20} />
          <span>Watchlist</span>
        </button>
        <button 
          className={`nav-btn ${activeView === 'news' ? 'active' : ''}`}
          onClick={() => setActiveView('news')}
        >
          <Newspaper size={20} />
          <span>News</span>
        </button>
      </nav>

      <main className="main-content">
        {activeView === 'dashboard' && (
          <>
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
          </>
        )}

        {activeView === 'analytics' && performanceData.length > 0 && (
          <div className="analytics-view">
            <PerformanceChart 
              data={performanceData}
              title="Portfolio Performance"
              showComparison={false}
            />
          </div>
        )}

        {activeView === 'risk' && riskMetrics && (
          <div className="risk-view">
            <RiskAnalysis metrics={riskMetrics} />
          </div>
        )}

        {activeView === 'alerts' && (
          <div className="alerts-view">
            <AlertsPanel 
              alerts={alerts}
              onDismiss={dismissAlert}
              onMarkRead={markAlertRead}
            />
          </div>
        )}

        {activeView === 'news' && (
          <div className="news-view">
            <NewsFeed 
              news={news}
              selectedSymbols={investments.map(inv => inv.symbol)}
            />
          </div>
        )}

        {activeView === 'watchlist' && (
          <div className="watchlist-view">
            <Watchlist 
              items={watchlist}
              marketData={marketDataMap}
              onAdd={addToWatchlist}
              onRemove={removeFromWatchlist}
            />
          </div>
        )}
      </main>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}

export default AppEnhanced
