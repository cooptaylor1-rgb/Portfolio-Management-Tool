/**
 * Correlation Matrix Page
 * 
 * Asset correlation analysis and diversification insights
 */

import { useMemo, useState } from 'react';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import './pages.css';

// Generate mock correlation data (in reality, this would come from historical returns)
function generateCorrelationMatrix(symbols: string[]): Record<string, Record<string, number>> {
  const correlations: Record<string, Record<string, number>> = {};
  
  // Pre-defined sector correlations
  const sectorCorrelations: Record<string, Record<string, number>> = {
    'AAPL': { 'MSFT': 0.85, 'GOOGL': 0.78, 'AMZN': 0.72, 'META': 0.75, 'NVDA': 0.82 },
    'MSFT': { 'GOOGL': 0.80, 'AMZN': 0.70, 'META': 0.72, 'NVDA': 0.78 },
    'GOOGL': { 'AMZN': 0.65, 'META': 0.82, 'NVDA': 0.70 },
    'AMZN': { 'META': 0.60, 'NVDA': 0.58 },
    'META': { 'NVDA': 0.65 },
  };
  
  symbols.forEach(s1 => {
    correlations[s1] = {};
    symbols.forEach(s2 => {
      if (s1 === s2) {
        correlations[s1][s2] = 1.0;
      } else {
        // Check predefined correlations
        const predefined = sectorCorrelations[s1]?.[s2] || sectorCorrelations[s2]?.[s1];
        if (predefined) {
          correlations[s1][s2] = predefined;
        } else {
          // Generate based on type similarity
          const s1IsCrypto = s1 === 'BTC' || s1 === 'ETH';
          const s2IsCrypto = s2 === 'BTC' || s2 === 'ETH';
          const s1IsBond = s1.includes('BND') || s1 === 'VOO';
          const s2IsBond = s2.includes('BND') || s2 === 'VOO';
          
          if (s1IsCrypto && s2IsCrypto) {
            correlations[s1][s2] = 0.75 + Math.random() * 0.2;
          } else if (s1IsCrypto || s2IsCrypto) {
            correlations[s1][s2] = 0.1 + Math.random() * 0.3;
          } else if ((s1IsBond && !s2IsBond) || (!s1IsBond && s2IsBond)) {
            correlations[s1][s2] = -0.2 + Math.random() * 0.4;
          } else {
            correlations[s1][s2] = 0.3 + Math.random() * 0.4;
          }
        }
      }
    });
  });
  
  return correlations;
}

function getCorrelationColor(value: number): string {
  if (value >= 0.8) return '#f85149';
  if (value >= 0.6) return '#d29922';
  if (value >= 0.3) return '#8b949e';
  if (value >= 0) return '#3fb950';
  if (value >= -0.3) return '#58a6ff';
  return '#a855f7';
}

export default function CorrelationPage() {
  const { investments } = usePortfolio();
  const [selectedCell, setSelectedCell] = useState<{ s1: string; s2: string } | null>(null);

  const symbols = useMemo(() => 
    investments.map(inv => inv.symbol),
    [investments]
  );

  const correlationMatrix = useMemo(() => 
    generateCorrelationMatrix(symbols),
    [symbols]
  );

  // Calculate correlation stats
  const stats = useMemo(() => {
    let highCorrelations = 0;
    let lowCorrelations = 0;
    let negativeCorrelations = 0;
    let total = 0;
    let avgCorrelation = 0;

    symbols.forEach((s1, i) => {
      symbols.forEach((s2, j) => {
        if (j > i) { // Upper triangle only (excluding diagonal)
          const corr = correlationMatrix[s1][s2];
          total++;
          avgCorrelation += corr;
          
          if (corr >= 0.7) highCorrelations++;
          else if (corr <= 0.3) lowCorrelations++;
          if (corr < 0) negativeCorrelations++;
        }
      });
    });

    return {
      highCorrelations,
      lowCorrelations,
      negativeCorrelations,
      avgCorrelation: total > 0 ? avgCorrelation / total : 0,
      diversificationScore: Math.round(100 - (highCorrelations / total) * 100),
    };
  }, [symbols, correlationMatrix]);

  // Find most/least correlated pairs
  const correlationPairs = useMemo(() => {
    const pairs: { s1: string; s2: string; correlation: number }[] = [];
    
    symbols.forEach((s1, i) => {
      symbols.forEach((s2, j) => {
        if (j > i) {
          pairs.push({ s1, s2, correlation: correlationMatrix[s1][s2] });
        }
      });
    });

    pairs.sort((a, b) => b.correlation - a.correlation);
    
    return {
      highestCorrelated: pairs.slice(0, 5),
      lowestCorrelated: pairs.slice(-5).reverse(),
    };
  }, [symbols, correlationMatrix]);

  return (
    <div className="page">
      <div className="page__header">
        <div className="page__title-group">
          <h1 className="page__title">Correlation Matrix</h1>
          <p className="page__subtitle">Analyze relationships between your holdings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="correlation-stats">
        <div className="stat-card">
          <div className="stat-card__icon" style={{ backgroundColor: 'rgba(63, 185, 80, 0.1)', color: '#3fb950' }}>
            <CheckCircle size={20} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.diversificationScore}</span>
            <span className="stat-card__label">Diversification Score</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ backgroundColor: 'rgba(248, 81, 73, 0.1)', color: '#f85149' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.highCorrelations}</span>
            <span className="stat-card__label">High Correlations (≥0.7)</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ backgroundColor: 'rgba(88, 166, 255, 0.1)', color: '#58a6ff' }}>
            <Info size={20} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.negativeCorrelations}</span>
            <span className="stat-card__label">Negative Correlations</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__content">
            <span className="stat-card__value">{stats.avgCorrelation.toFixed(2)}</span>
            <span className="stat-card__label">Average Correlation</span>
          </div>
        </div>
      </div>

      <div className="correlation-grid">
        {/* Correlation Matrix */}
        <section className="card correlation-matrix-card">
          <div className="card__header">
            <h2 className="card__title">Correlation Heatmap</h2>
            <div className="correlation-legend">
              <span className="legend-item"><span className="legend-color" style={{ backgroundColor: '#f85149' }} /> High (≥0.8)</span>
              <span className="legend-item"><span className="legend-color" style={{ backgroundColor: '#d29922' }} /> Moderate</span>
              <span className="legend-item"><span className="legend-color" style={{ backgroundColor: '#3fb950' }} /> Low</span>
              <span className="legend-item"><span className="legend-color" style={{ backgroundColor: '#58a6ff' }} /> Negative</span>
            </div>
          </div>
          <div className="card__body">
            <div className="correlation-matrix">
              {/* Header row */}
              <div className="matrix-row header-row">
                <div className="matrix-cell corner-cell" />
                {symbols.map(symbol => (
                  <div key={symbol} className="matrix-cell header-cell">
                    {symbol}
                  </div>
                ))}
              </div>
              
              {/* Data rows */}
              {symbols.map((s1, i) => (
                <div key={s1} className="matrix-row">
                  <div className="matrix-cell header-cell">{s1}</div>
                  {symbols.map((s2, j) => {
                    const value = correlationMatrix[s1][s2];
                    const isSelected = selectedCell?.s1 === s1 && selectedCell?.s2 === s2;
                    const isDiagonal = i === j;
                    
                    return (
                      <div
                        key={`${s1}-${s2}`}
                        className={`matrix-cell data-cell ${isSelected ? 'selected' : ''} ${isDiagonal ? 'diagonal' : ''}`}
                        style={{ backgroundColor: isDiagonal ? '#21262d' : getCorrelationColor(value) }}
                        onClick={() => !isDiagonal && setSelectedCell({ s1, s2 })}
                        title={`${s1} × ${s2}: ${value.toFixed(2)}`}
                      >
                        {j >= i ? value.toFixed(2) : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Highest Correlated */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Highest Correlated Pairs</h2>
            <span className="card__badge warning">Monitor</span>
          </div>
          <div className="card__body card__body--flush">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Correlation</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {correlationPairs.highestCorrelated.map(pair => (
                  <tr key={`${pair.s1}-${pair.s2}`}>
                    <td>
                      <span className="pair-label">{pair.s1} ↔ {pair.s2}</span>
                    </td>
                    <td>
                      <span className="correlation-value" style={{ color: getCorrelationColor(pair.correlation) }}>
                        {pair.correlation.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`risk-label ${pair.correlation >= 0.8 ? 'high' : 'medium'}`}>
                        {pair.correlation >= 0.8 ? 'High' : 'Moderate'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Lowest Correlated */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Best Diversifiers</h2>
            <span className="card__badge success">Good</span>
          </div>
          <div className="card__body card__body--flush">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Correlation</th>
                  <th>Benefit</th>
                </tr>
              </thead>
              <tbody>
                {correlationPairs.lowestCorrelated.map(pair => (
                  <tr key={`${pair.s1}-${pair.s2}`}>
                    <td>
                      <span className="pair-label">{pair.s1} ↔ {pair.s2}</span>
                    </td>
                    <td>
                      <span className="correlation-value" style={{ color: getCorrelationColor(pair.correlation) }}>
                        {pair.correlation.toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`benefit-label ${pair.correlation < 0 ? 'excellent' : 'good'}`}>
                        {pair.correlation < 0 ? 'Excellent' : 'Good'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Insights */}
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Diversification Insights</h2>
          </div>
          <div className="card__body">
            <div className="insights-list">
              {stats.highCorrelations > symbols.length / 2 && (
                <div className="insight warning">
                  <AlertTriangle size={16} />
                  <p>
                    <strong>High concentration risk:</strong> {stats.highCorrelations} pairs have 
                    correlation ≥0.7. Consider adding uncorrelated assets.
                  </p>
                </div>
              )}
              {stats.negativeCorrelations > 0 && (
                <div className="insight success">
                  <CheckCircle size={16} />
                  <p>
                    <strong>Good hedging:</strong> You have {stats.negativeCorrelations} negatively 
                    correlated pairs providing natural hedges.
                  </p>
                </div>
              )}
              {stats.diversificationScore >= 70 && (
                <div className="insight success">
                  <CheckCircle size={16} />
                  <p>
                    <strong>Well diversified:</strong> Your portfolio has a diversification 
                    score of {stats.diversificationScore}/100.
                  </p>
                </div>
              )}
              <div className="insight info">
                <Info size={16} />
                <p>
                  <strong>Tip:</strong> Adding assets with low or negative correlation to your 
                  existing holdings can reduce portfolio volatility without sacrificing returns.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
