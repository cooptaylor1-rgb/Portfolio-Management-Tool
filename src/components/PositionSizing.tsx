import { useState } from 'react'
import { PositionSizeCalculation } from '../types'
import { Calculator, DollarSign, TrendingDown, Percent, AlertCircle } from 'lucide-react'

export default function PositionSizing() {
  const [accountValue, setAccountValue] = useState(100000)
  const [riskPerTrade, setRiskPerTrade] = useState(2)
  const [entryPrice, setEntryPrice] = useState(100)
  const [stopLoss, setStopLoss] = useState(90)
  const [winRate, setWinRate] = useState(55)
  const [avgWin, setAvgWin] = useState(1.5)
  const [avgLoss, setAvgLoss] = useState(1.0)
  const [calculation, setCalculation] = useState<PositionSizeCalculation | null>(null)

  const calculatePosition = () => {
    const riskAmount = accountValue * (riskPerTrade / 100)
    const riskPerShare = Math.abs(entryPrice - stopLoss)
    const positionSize = Math.floor(riskAmount / riskPerShare)
    const positionValue = positionSize * entryPrice

    // Kelly Criterion: f* = (bp - q) / b
    // where b = odds (avgWin/avgLoss), p = win probability, q = loss probability
    const b = avgWin / avgLoss
    const p = winRate / 100
    const q = 1 - p
    const kellyPercentage = ((b * p - q) / b) * 100

    // Conservative Kelly (often use 1/2 or 1/4 Kelly)
    const halfKelly = kellyPercentage / 2

    setCalculation({
      symbol: 'POSITION',
      accountValue,
      riskPerTrade,
      entryPrice,
      stopLoss,
      riskAmount,
      positionSize,
      positionValue,
      kellyPercentage: halfKelly // Using half-Kelly for safety
    })
  }

  return (
    <div className="position-sizing-tool">
      <div className="section-header">
        <div>
          <h2>
            <Calculator size={24} />
            Position Sizing Calculator
          </h2>
          <p className="section-description">Calculate optimal position sizes based on risk tolerance and Kelly Criterion</p>
        </div>
      </div>

      <div className="sizing-content">
        <div className="sizing-inputs">
          <h3>Position Parameters</h3>
          <div className="form-group">
            <label>
              <DollarSign size={16} />
              Account Value
            </label>
            <input
              type="number"
              value={accountValue}
              onChange={(e) => setAccountValue(parseFloat(e.target.value) || 0)}
              placeholder="100000"
            />
          </div>

          <div className="form-group">
            <label>
              <Percent size={16} />
              Risk Per Trade (%)
            </label>
            <input
              type="number"
              value={riskPerTrade}
              onChange={(e) => setRiskPerTrade(parseFloat(e.target.value) || 0)}
              step="0.1"
              min="0"
              max="10"
            />
            <small className="input-hint">Recommended: 1-2% for conservative, 2-5% for aggressive</small>
          </div>

          <div className="form-group">
            <label>
              <TrendingDown size={16} />
              Entry Price
            </label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>
              <AlertCircle size={16} />
              Stop Loss Price
            </label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              step="0.01"
            />
          </div>

          <h3 style={{ marginTop: '2rem' }}>Kelly Criterion Parameters</h3>
          <div className="form-group">
            <label>Win Rate (%)</label>
            <input
              type="number"
              value={winRate}
              onChange={(e) => setWinRate(parseFloat(e.target.value) || 0)}
              step="1"
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label>Average Win Multiple (R)</label>
            <input
              type="number"
              value={avgWin}
              onChange={(e) => setAvgWin(parseFloat(e.target.value) || 0)}
              step="0.1"
            />
            <small className="input-hint">E.g., 1.5 means you win 1.5× your risk on average</small>
          </div>

          <div className="form-group">
            <label>Average Loss Multiple (R)</label>
            <input
              type="number"
              value={avgLoss}
              onChange={(e) => setAvgLoss(parseFloat(e.target.value) || 0)}
              step="0.1"
            />
            <small className="input-hint">Typically 1.0 if you honor stops</small>
          </div>

          <button className="btn btn-primary" onClick={calculatePosition} style={{ marginTop: '1rem' }}>
            Calculate Position Size
          </button>
        </div>

        {calculation && (
          <div className="sizing-results">
            <h3>Recommended Position</h3>
            
            <div className="result-card highlight">
              <div className="result-label">Position Size</div>
              <div className="result-value">{calculation.positionSize} shares</div>
              <div className="result-subtext">
                ${calculation.positionValue.toLocaleString()} 
                ({((calculation.positionValue / calculation.accountValue) * 100).toFixed(2)}% of portfolio)
              </div>
            </div>

            <div className="results-grid">
              <div className="result-card">
                <div className="result-label">Risk Amount</div>
                <div className="result-value">${calculation.riskAmount.toLocaleString()}</div>
                <div className="result-subtext">{calculation.riskPerTrade}% of account</div>
              </div>

              <div className="result-card">
                <div className="result-label">Risk Per Share</div>
                <div className="result-value">${Math.abs(calculation.entryPrice - calculation.stopLoss).toFixed(2)}</div>
                <div className="result-subtext">{(Math.abs(1 - calculation.stopLoss / calculation.entryPrice) * 100).toFixed(2)}% from entry</div>
              </div>

              {calculation.kellyPercentage && (
                <div className="result-card">
                  <div className="result-label">Kelly Criterion</div>
                  <div className="result-value">{calculation.kellyPercentage.toFixed(2)}%</div>
                  <div className="result-subtext">
                    {calculation.kellyPercentage > 10 
                      ? 'Very aggressive - consider reducing' 
                      : calculation.kellyPercentage > 5 
                      ? 'Aggressive - use with caution'
                      : 'Conservative sizing'}
                  </div>
                </div>
              )}
            </div>

            <div className="sizing-insights">
              <h4>💡 Position Sizing Insights</h4>
              <ul>
                <li>✓ Never risk more than you can afford to lose</li>
                <li>✓ Position size should be smaller for lower conviction trades</li>
                <li>✓ Consider correlation with existing positions</li>
                <li>✓ Kelly Criterion suggests optimal long-term growth, but use fractional Kelly (1/2 or 1/4) to reduce volatility</li>
                <li>✓ During high volatility, consider reducing position sizes by 30-50%</li>
              </ul>
            </div>

            <div className="risk-scenarios">
              <h4>Scenario Analysis</h4>
              <table className="scenarios-table">
                <thead>
                  <tr>
                    <th>Outcome</th>
                    <th>Price</th>
                    <th>P&L</th>
                    <th>Account Impact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="negative-row">
                    <td>Stop Hit</td>
                    <td>${stopLoss.toFixed(2)}</td>
                    <td className="negative">-${calculation.riskAmount.toFixed(2)}</td>
                    <td className="negative">-{riskPerTrade}%</td>
                  </tr>
                  <tr className="neutral-row">
                    <td>Break Even</td>
                    <td>${entryPrice.toFixed(2)}</td>
                    <td>$0.00</td>
                    <td>0%</td>
                  </tr>
                  <tr className="positive-row">
                    <td>1R Target</td>
                    <td>${(entryPrice + Math.abs(entryPrice - stopLoss)).toFixed(2)}</td>
                    <td className="positive">+${calculation.riskAmount.toFixed(2)}</td>
                    <td className="positive">+{riskPerTrade}%</td>
                  </tr>
                  <tr className="positive-row">
                    <td>2R Target</td>
                    <td>${(entryPrice + 2 * Math.abs(entryPrice - stopLoss)).toFixed(2)}</td>
                    <td className="positive">+${(calculation.riskAmount * 2).toFixed(2)}</td>
                    <td className="positive">+{(riskPerTrade * 2).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
