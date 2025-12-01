import React, { useState } from 'react'
import { Investment } from '../types'
import { DollarSign, Calendar, TrendingUp, Percent } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DividendTrackerProps {
  investments: Investment[]
}

interface DividendData {
  symbol: string
  annualDividend: number
  yield: number
  frequency: 'monthly' | 'quarterly' | 'annual'
  nextExDate: string
  nextPayDate: string
}

// Mock dividend data - in production this would come from an API
const DIVIDEND_DATA: Record<string, DividendData> = {
  'AAPL': { symbol: 'AAPL', annualDividend: 0.96, yield: 0.52, frequency: 'quarterly', nextExDate: '2025-02-07', nextPayDate: '2025-02-14' },
  'MSFT': { symbol: 'MSFT', annualDividend: 3.00, yield: 0.71, frequency: 'quarterly', nextExDate: '2025-02-19', nextPayDate: '2025-03-13' },
  'JNJ': { symbol: 'JNJ', annualDividend: 4.76, yield: 2.94, frequency: 'quarterly', nextExDate: '2025-02-22', nextPayDate: '2025-03-09' },
  'PG': { symbol: 'PG', annualDividend: 3.88, yield: 2.32, frequency: 'quarterly', nextExDate: '2025-01-17', nextPayDate: '2025-02-15' },
  'KO': { symbol: 'KO', annualDividend: 1.94, yield: 2.97, frequency: 'quarterly', nextExDate: '2025-03-14', nextPayDate: '2025-04-01' },
  'VZ': { symbol: 'VZ', annualDividend: 2.66, yield: 6.15, frequency: 'quarterly', nextExDate: '2025-01-09', nextPayDate: '2025-02-01' },
  'T': { symbol: 'T', annualDividend: 1.11, yield: 4.89, frequency: 'quarterly', nextExDate: '2025-01-10', nextPayDate: '2025-02-03' }
}

export const DividendTracker: React.FC<DividendTrackerProps> = ({ investments }) => {
  const [dripEnabled, setDripEnabled] = useState(true)
  const [projectionYears, setProjectionYears] = useState(10)

  const calculateDividendIncome = () => {
    let annualIncome = 0
    const byStock: Record<string, { shares: number, annual: number, yield: number }> = {}

    investments.forEach(inv => {
      const divData = DIVIDEND_DATA[inv.symbol]
      if (divData) {
        const annual = inv.quantity * divData.annualDividend
        annualIncome += annual
        byStock[inv.symbol] = {
          shares: inv.quantity,
          annual,
          yield: divData.yield
        }
      }
    })

    return { annualIncome, byStock }
  }

  const projectDividendGrowth = () => {
    const { annualIncome } = calculateDividendIncome()
    const dividendGrowthRate = 0.05 // Assume 5% annual dividend growth
    const projectionData = []

    let cumulativeShares = investments.reduce((sum, inv) => {
      const divData = DIVIDEND_DATA[inv.symbol]
      return sum + (divData ? inv.quantity : 0)
    }, 0)

    let avgPrice = investments.reduce((sum, inv) => {
      const divData = DIVIDEND_DATA[inv.symbol]
      return sum + (divData ? inv.currentPrice : 0)
    }, 0) / Math.max(investments.filter(inv => DIVIDEND_DATA[inv.symbol]).length, 1)

    for (let year = 0; year <= projectionYears; year++) {
      const yearlyDividend = annualIncome * Math.pow(1 + dividendGrowthRate, year)
      
      let projectedIncome = yearlyDividend
      if (dripEnabled && year > 0) {
        // Calculate DRIP effect - reinvested dividends buy more shares
        const prevYearDividend = annualIncome * Math.pow(1 + dividendGrowthRate, year - 1)
        const newShares = prevYearDividend / avgPrice
        cumulativeShares += newShares
        projectedIncome = cumulativeShares * (annualIncome / investments.reduce((sum, inv) => {
          const divData = DIVIDEND_DATA[inv.symbol]
          return sum + (divData ? inv.quantity : 0)
        }, 1)) * Math.pow(1 + dividendGrowthRate, year)
      }

      projectionData.push({
        year: year === 0 ? 'Now' : `Year ${year}`,
        income: dripEnabled ? projectedIncome : yearlyDividend,
        shares: Math.round(cumulativeShares)
      })
    }

    return projectionData
  }

  const getUpcomingPayments = () => {
    const payments: Array<{ symbol: string, exDate: string, payDate: string, amount: number }> = []

    investments.forEach(inv => {
      const divData = DIVIDEND_DATA[inv.symbol]
      if (divData) {
        const quarterlyAmount = (divData.annualDividend / 4) * inv.quantity
        payments.push({
          symbol: inv.symbol,
          exDate: divData.nextExDate,
          payDate: divData.nextPayDate,
          amount: quarterlyAmount
        })
      }
    })

    return payments.sort((a, b) => new Date(a.exDate).getTime() - new Date(b.exDate).getTime())
  }

  const { annualIncome, byStock } = calculateDividendIncome()
  const monthlyIncome = annualIncome / 12
  const upcomingPayments = getUpcomingPayments()
  const projectionData = projectDividendGrowth()
  const portfolioValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0)
  const portfolioYield = portfolioValue > 0 ? (annualIncome / portfolioValue) * 100 : 0

  return (
    <div className="dividend-tracker">
      <div className="dividend-header">
        <div>
          <h2>Dividend Income Tracker</h2>
          <p className="section-subtitle">Monitor and project your passive income stream</p>
        </div>
      </div>

      <div className="dividend-summary-cards">
        <div className="dividend-summary-card">
          <div className="card-icon" style={{ background: 'rgba(0, 217, 255, 0.1)', color: '#00d9ff' }}>
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Annual Income</span>
            <span className="card-value">${annualIncome.toFixed(2)}</span>
            <span className="card-sublabel">${monthlyIncome.toFixed(2)}/month</span>
          </div>
        </div>

        <div className="dividend-summary-card">
          <div className="card-icon" style={{ background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88' }}>
            <Percent size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Portfolio Yield</span>
            <span className="card-value">{portfolioYield.toFixed(2)}%</span>
            <span className="card-sublabel">Weighted average</span>
          </div>
        </div>

        <div className="dividend-summary-card">
          <div className="card-icon" style={{ background: 'rgba(255, 170, 0, 0.1)', color: '#ffaa00' }}>
            <TrendingUp size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">10-Year Projection</span>
            <span className="card-value">${projectionData[projectionData.length - 1]?.income.toFixed(0)}</span>
            <span className="card-sublabel">With {dripEnabled ? 'DRIP' : 'no DRIP'}</span>
          </div>
        </div>

        <div className="dividend-summary-card">
          <div className="card-icon" style={{ background: 'rgba(255, 51, 102, 0.1)', color: '#ff3366' }}>
            <Calendar size={24} />
          </div>
          <div className="card-content">
            <span className="card-label">Next Payment</span>
            <span className="card-value">
              {upcomingPayments.length > 0 ? `$${upcomingPayments[0].amount.toFixed(2)}` : 'N/A'}
            </span>
            <span className="card-sublabel">
              {upcomingPayments.length > 0 ? upcomingPayments[0].payDate : 'No dividends'}
            </span>
          </div>
        </div>
      </div>

      <div className="dividend-content-grid">
        {/* Holdings breakdown */}
        <div className="dividend-panel">
          <h3>Dividend-Paying Holdings</h3>
          {Object.keys(byStock).length === 0 ? (
            <div className="empty-state-small">
              <p>No dividend-paying stocks in portfolio</p>
            </div>
          ) : (
            <div className="dividend-holdings-list">
              {Object.entries(byStock)
                .sort((a, b) => b[1].annual - a[1].annual)
                .map(([symbol, data]) => (
                  <div key={symbol} className="dividend-holding-row">
                    <div className="holding-info">
                      <span className="holding-symbol">{symbol}</span>
                      <span className="holding-shares">{data.shares} shares</span>
                    </div>
                    <div className="holding-stats">
                      <div className="holding-stat">
                        <span className="stat-label">Yield</span>
                        <span className="stat-value" style={{ color: data.yield >= 3 ? '#00ff88' : '#00d9ff' }}>
                          {data.yield.toFixed(2)}%
                        </span>
                      </div>
                      <div className="holding-stat">
                        <span className="stat-label">Annual</span>
                        <span className="stat-value">${data.annual.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Upcoming payments */}
        <div className="dividend-panel">
          <h3>Upcoming Payments</h3>
          {upcomingPayments.length === 0 ? (
            <div className="empty-state-small">
              <p>No upcoming dividend payments</p>
            </div>
          ) : (
            <div className="upcoming-payments-list">
              {upcomingPayments.slice(0, 8).map((payment, idx) => (
                <div key={`${payment.symbol}-${idx}`} className="payment-row">
                  <div className="payment-date">
                    <Calendar size={14} />
                    <span>{new Date(payment.payDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <span className="payment-symbol">{payment.symbol}</span>
                  <span className="payment-amount">${payment.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DRIP Projection */}
      <div className="dividend-projection-panel">
        <div className="projection-header">
          <h3>Income Projection</h3>
          <div className="projection-controls">
            <label className="drip-toggle">
              <input 
                type="checkbox" 
                checked={dripEnabled} 
                onChange={(e) => setDripEnabled(e.target.checked)}
              />
              <span>Enable DRIP (Dividend Reinvestment)</span>
            </label>
            <select 
              value={projectionYears} 
              onChange={(e) => setProjectionYears(Number(e.target.value))}
              className="year-select"
            >
              <option value={5}>5 years</option>
              <option value={10}>10 years</option>
              <option value={15}>15 years</option>
              <option value={20}>20 years</option>
            </select>
          </div>
        </div>
        
        {projectionData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
              <XAxis 
                dataKey="year" 
                stroke="#6b7280"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#9ca3af' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                contentStyle={{ 
                  background: '#1a1f2e', 
                  border: '1px solid #2a2f3e',
                  borderRadius: '8px',
                  color: '#e5e7eb'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Income']}
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#00ff88" 
                strokeWidth={2}
                dot={{ fill: '#00ff88', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <div className="projection-insights">
          <p>
            <strong>Assumptions:</strong> 5% annual dividend growth rate. 
            {dripEnabled ? ' Dividends automatically reinvested at current market prices.' : ' No dividend reinvestment.'}
          </p>
          {dripEnabled && projectionData.length > 0 && (
            <p style={{ color: '#00ff88' }}>
              With DRIP enabled, your annual income could reach <strong>${projectionData[projectionData.length - 1]?.income.toFixed(2)}</strong> in {projectionYears} years.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
