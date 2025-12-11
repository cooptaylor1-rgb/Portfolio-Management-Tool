/**
 * Position Sizing Page
 * 
 * Calculate optimal position sizes based on risk parameters
 */

import { useState, useMemo } from 'react';
import { Calculator, AlertTriangle, DollarSign, Percent, Target, Info } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { KPICard, KPIGrid } from '../components/ui';
import './pages.css';

interface CalculatorInputs {
  accountSize: number;
  riskPercent: number;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
}

export default function PositionSizingPage() {
  const { stats } = usePortfolio();
  
  const [inputs, setInputs] = useState<CalculatorInputs>({
    accountSize: stats.totalValue,
    riskPercent: 2,
    entryPrice: 100,
    stopLoss: 95,
    targetPrice: 120,
  });

  // Calculate position sizing
  const calculations = useMemo(() => {
    const { accountSize, riskPercent, entryPrice, stopLoss, targetPrice } = inputs;
    
    const riskAmount = accountSize * (riskPercent / 100);
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const shares = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
    const positionSize = shares * entryPrice;
    const positionPercent = (positionSize / accountSize) * 100;
    const potentialLoss = shares * riskPerShare;
    const potentialGain = shares * Math.abs(targetPrice - entryPrice);
    const riskRewardRatio = riskPerShare > 0 ? Math.abs(targetPrice - entryPrice) / riskPerShare : 0;
    
    return {
      riskAmount,
      riskPerShare,
      shares,
      positionSize,
      positionPercent,
      potentialLoss,
      potentialGain,
      riskRewardRatio,
      stopLossPercent: ((entryPrice - stopLoss) / entryPrice) * 100,
      targetPercent: ((targetPrice - entryPrice) / entryPrice) * 100,
    };
  }, [inputs]);

  // Preset risk levels
  const riskPresets = [
    { label: 'Conservative', percent: 1, description: 'Low risk tolerance' },
    { label: 'Moderate', percent: 2, description: 'Balanced approach' },
    { label: 'Aggressive', percent: 3, description: 'Higher risk tolerance' },
  ];

  // Kelly Criterion calculation
  const kellyCalculation = useMemo(() => {
    // Assuming 50% win rate for demonstration
    const winRate = 0.5;
    const avgWin = calculations.potentialGain;
    const avgLoss = calculations.potentialLoss;
    
    if (avgLoss === 0) return 0;
    
    const winLossRatio = avgWin / avgLoss;
    const kelly = winRate - ((1 - winRate) / winLossRatio);
    
    return Math.max(0, kelly * 100);
  }, [calculations]);

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Position Sizing Calculator</h1>
          <p className="page__subtitle">Calculate optimal position sizes based on your risk parameters</p>
        </div>
      </div>

      <div className="position-sizing-grid">
        {/* Calculator Inputs */}
        <section className="card calculator-card">
          <div className="card__header">
            <h2 className="card__title">
              <Calculator size={18} />
              Calculator
            </h2>
          </div>
          <div className="card__body">
            <div className="calculator-form">
              <div className="form-group">
                <label className="form-label">Account Size</label>
                <div className="input-with-icon">
                  <DollarSign size={16} />
                  <input
                    type="number"
                    className="form-input"
                    value={inputs.accountSize}
                    onChange={e => setInputs({ ...inputs, accountSize: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <button 
                  className="btn btn--small"
                  onClick={() => setInputs({ ...inputs, accountSize: stats.totalValue })}
                >
                  Use Portfolio Value
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Risk Per Trade</label>
                <div className="risk-presets">
                  {riskPresets.map(preset => (
                    <button
                      key={preset.label}
                      className={`preset-btn ${inputs.riskPercent === preset.percent ? 'active' : ''}`}
                      onClick={() => setInputs({ ...inputs, riskPercent: preset.percent })}
                    >
                      <span className="preset-label">{preset.label}</span>
                      <span className="preset-value">{preset.percent}%</span>
                    </button>
                  ))}
                </div>
                <div className="input-with-icon">
                  <Percent size={16} />
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={inputs.riskPercent}
                    onChange={e => setInputs({ ...inputs, riskPercent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Entry Price</label>
                  <div className="input-with-icon">
                    <DollarSign size={16} />
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={inputs.entryPrice}
                      onChange={e => setInputs({ ...inputs, entryPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Stop Loss</label>
                  <div className="input-with-icon">
                    <AlertTriangle size={16} />
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={inputs.stopLoss}
                      onChange={e => setInputs({ ...inputs, stopLoss: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <span className="input-hint text-negative">
                    -{calculations.stopLossPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Price</label>
                <div className="input-with-icon">
                  <Target size={16} />
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={inputs.targetPrice}
                    onChange={e => setInputs({ ...inputs, targetPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <span className="input-hint text-positive">
                  +{calculations.targetPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="card results-card">
          <div className="card__header">
            <h2 className="card__title">Position Size</h2>
          </div>
          <div className="card__body">
            <div className="main-result">
              <span className="result-label">Recommended Shares</span>
              <span className="result-value">{calculations.shares.toLocaleString()}</span>
              <span className="result-subtext">
                ${calculations.positionSize.toLocaleString()} ({calculations.positionPercent.toFixed(1)}% of account)
              </span>
            </div>

            <KPIGrid columns={2}>
              <KPICard
                label="Risk Amount"
                value={calculations.riskAmount}
                format="currency"
                variant="warning"
              />
              <KPICard
                label="Risk per Share"
                value={calculations.riskPerShare}
                format="currency"
              />
              <KPICard
                label="Potential Loss"
                value={-calculations.potentialLoss}
                format="currency"
                variant="danger"
              />
              <KPICard
                label="Potential Gain"
                value={calculations.potentialGain}
                format="currency"
                variant="highlight"
              />
            </KPIGrid>
          </div>
        </section>

        {/* Risk/Reward Analysis */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Risk/Reward Analysis</h2>
          </div>
          <div className="card__body">
            <div className="rr-visualization">
              <div className="rr-bar">
                <div 
                  className="rr-risk"
                  style={{ width: `${100 / (1 + calculations.riskRewardRatio)}%` }}
                >
                  <span>Risk</span>
                </div>
                <div 
                  className="rr-reward"
                  style={{ width: `${100 * calculations.riskRewardRatio / (1 + calculations.riskRewardRatio)}%` }}
                >
                  <span>Reward</span>
                </div>
              </div>
              <div className="rr-ratio">
                <span className="ratio-label">Risk/Reward Ratio</span>
                <span className={`ratio-value ${calculations.riskRewardRatio >= 2 ? 'good' : calculations.riskRewardRatio >= 1 ? 'okay' : 'poor'}`}>
                  1:{calculations.riskRewardRatio.toFixed(2)}
                </span>
              </div>
              <div className={`rr-assessment ${calculations.riskRewardRatio >= 2 ? 'good' : calculations.riskRewardRatio >= 1 ? 'okay' : 'poor'}`}>
                {calculations.riskRewardRatio >= 2 
                  ? '✓ Good risk/reward. Target meets the 2:1 minimum.'
                  : calculations.riskRewardRatio >= 1
                  ? '⚠ Acceptable but consider higher targets.'
                  : '✗ Poor risk/reward. Reconsider this trade.'}
              </div>
            </div>
          </div>
        </section>

        {/* Kelly Criterion */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Kelly Criterion</h2>
            <Info size={16} className="info-icon" title="Optimal bet sizing based on edge" />
          </div>
          <div className="card__body">
            <div className="kelly-result">
              <span className="kelly-label">Kelly % (assuming 50% win rate)</span>
              <span className="kelly-value">{kellyCalculation.toFixed(1)}%</span>
              <span className="kelly-note">
                Many traders use half-Kelly ({(kellyCalculation / 2).toFixed(1)}%) for safety
              </span>
            </div>
            <div className="kelly-comparison">
              <div className="kelly-item">
                <span className="item-label">Your Risk</span>
                <span className="item-value">{inputs.riskPercent}%</span>
              </div>
              <div className="kelly-item">
                <span className="item-label">Half Kelly</span>
                <span className="item-value">{(kellyCalculation / 2).toFixed(1)}%</span>
              </div>
              <div className="kelly-item">
                <span className="item-label">Full Kelly</span>
                <span className="item-value">{kellyCalculation.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="card tips-card">
          <div className="card__header">
            <h2 className="card__title">Position Sizing Tips</h2>
          </div>
          <div className="card__body">
            <ul className="tips-list">
              <li>
                <strong>1-2% Rule:</strong> Never risk more than 1-2% of your account on a single trade.
              </li>
              <li>
                <strong>R-Multiple:</strong> Aim for trades with at least 2:1 reward-to-risk ratio.
              </li>
              <li>
                <strong>Correlation:</strong> Reduce position size when adding correlated positions.
              </li>
              <li>
                <strong>Volatility:</strong> Use smaller position sizes for volatile stocks.
              </li>
              <li>
                <strong>Conviction:</strong> Consider sizing up for high-conviction trades (carefully).
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
