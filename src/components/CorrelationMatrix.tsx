import { useState, useEffect } from 'react'
import { Investment, CorrelationData } from '../types'
import { GitBranch, TrendingUp, AlertTriangle } from 'lucide-react'

interface CorrelationMatrixProps {
  investments: Investment[]
}

export default function CorrelationMatrix({ investments }: CorrelationMatrixProps) {
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null)

  useEffect(() => {
    if (investments.length < 2) {
      setCorrelationData(null)
      return
    }

    // In production, calculate correlations using historical price data
    // For now, generate mock correlations based on sector/type similarity
    const symbols = investments.map(inv => inv.symbol)
    const matrix: Record<string, Record<string, number>> = {}

    // Initialize matrix
    symbols.forEach(symbol1 => {
      matrix[symbol1] = {}
      symbols.forEach(symbol2 => {
        if (symbol1 === symbol2) {
          matrix[symbol1][symbol2] = 1.0
        } else {
          // Mock correlation based on asset type similarity
          const inv1 = investments.find(i => i.symbol === symbol1)!
          const inv2 = investments.find(i => i.symbol === symbol2)!
          
          // Same type = higher correlation
          if (inv1.type === inv2.type) {
            matrix[symbol1][symbol2] = 0.6 + Math.random() * 0.3 // 0.6-0.9
          } else if (
            (inv1.type === 'stock' && inv2.type === 'etf') ||
            (inv1.type === 'etf' && inv2.type === 'stock')
          ) {
            matrix[symbol1][symbol2] = 0.4 + Math.random() * 0.3 // 0.4-0.7
          } else if (inv1.type === 'bond' || inv2.type === 'bond') {
            matrix[symbol1][symbol2] = -0.1 + Math.random() * 0.2 // -0.1-0.1 (slightly negative to neutral)
          } else {
            matrix[symbol1][symbol2] = Math.random() * 0.4 // 0-0.4
          }
        }
      })
    })

    // Calculate average correlations to find clusters
    const clusters: CorrelationData['clusters'] = []

    // Group by type for simplicity
    const typeGroups = investments.reduce((acc, inv) => {
      if (!acc[inv.type]) acc[inv.type] = []
      acc[inv.type].push(inv.symbol)
      return acc
    }, {} as Record<string, string[]>)

    Object.entries(typeGroups).forEach(([type, syms]) => {
      if (syms.length > 1) {
        const avgCorr = syms.reduce((sum, s1) => {
          return sum + syms.reduce((s, s2) => {
            return s1 === s2 ? s : s + (matrix[s1]?.[s2] || 0)
          }, 0) / (syms.length - 1)
        }, 0) / syms.length

        clusters.push({
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} cluster`,
          symbols: syms,
          avgCorrelation: avgCorr
        })
      }
    })

    // Calculate diversification score
    let totalCorrelation = 0
    let count = 0
    symbols.forEach(s1 => {
      symbols.forEach(s2 => {
        if (s1 !== s2) {
          totalCorrelation += Math.abs(matrix[s1][s2])
          count++
        }
      })
    })
    const avgCorrelation = count > 0 ? totalCorrelation / count : 0
    const diversificationScore = Math.max(0, Math.min(100, (1 - avgCorrelation) * 100))

    // Generate recommendations
    const recommendations: string[] = []
    if (diversificationScore < 40) {
      recommendations.push('⚠️ Low diversification - portfolio is highly correlated. Consider adding uncorrelated assets.')
    } else if (diversificationScore < 60) {
      recommendations.push('💡 Moderate diversification - room for improvement by adding bonds or alternative assets.')
    } else {
      recommendations.push('✅ Good diversification - portfolio has low average correlation.')
    }

    // Check for concentration in clusters
    clusters.forEach(cluster => {
      if (cluster.symbols.length >= investments.length * 0.5) {
        recommendations.push(`⚠️ Over 50% of positions in ${cluster.name} - consider reducing concentration.`)
      }
    })

    // Suggest asset classes
    const hasStocks = investments.some(i => i.type === 'stock' || i.type === 'etf')
    const hasBonds = investments.some(i => i.type === 'bond')
    const hasCrypto = investments.some(i => i.type === 'crypto')

    if (hasStocks && !hasBonds) {
      recommendations.push('💡 Consider adding bonds for downside protection and negative correlation.')
    }
    if (hasStocks && !hasCrypto && investments.length > 5) {
      recommendations.push('💡 Small crypto allocation (1-5%) could provide uncorrelated return stream.')
    }

    setCorrelationData({
      matrix,
      diversificationScore,
      clusters,
      recommendations
    })
  }, [investments])

  if (!correlationData || investments.length < 2) {
    return (
      <div className="correlation-matrix">
        <div className="section-header">
          <h2>
            <GitBranch size={24} />
            Correlation Matrix
          </h2>
        </div>
        <div className="empty-state">
          <GitBranch size={48} style={{ color: 'var(--text-light)', marginBottom: '1rem' }} />
          <h3>Need more investments</h3>
          <p>Add at least 2 investments to analyze portfolio correlations</p>
        </div>
      </div>
    )
  }

  const getCorrelationColor = (correlation: number) => {
    const absCorr = Math.abs(correlation)
    if (absCorr >= 0.7) return 'rgba(255, 51, 102, 0.8)' // High correlation - red
    if (absCorr >= 0.4) return 'rgba(255, 170, 0, 0.6)' // Medium - orange
    return 'rgba(0, 255, 136, 0.4)' // Low - green (good for diversification)
  }

  const getCorrelationLabel = (correlation: number) => {
    const absCorr = Math.abs(correlation)
    if (absCorr >= 0.7) return 'High'
    if (absCorr >= 0.4) return 'Medium'
    return 'Low'
  }

  const symbols = investments.map(inv => inv.symbol)

  return (
    <div className="correlation-matrix">
      <div className="section-header">
        <div>
          <h2>
            <GitBranch size={24} />
            Correlation Matrix
          </h2>
          <p className="section-description">Understand how your investments move together</p>
        </div>
        <div className="diversification-badge">
          <span className="badge-label">Diversification Score</span>
          <span 
            className="badge-value"
            style={{ 
              color: correlationData.diversificationScore >= 60 ? '#00ff88' : 
                     correlationData.diversificationScore >= 40 ? '#ffaa00' : '#ff3366' 
            }}
          >
            {correlationData.diversificationScore.toFixed(0)}/100
          </span>
        </div>
      </div>

      {/* Correlation Heatmap */}
      <div className="correlation-heatmap">
        <h3>Correlation Heatmap</h3>
        <p className="section-description">1.0 = perfect correlation, 0.0 = no correlation, -1.0 = inverse correlation</p>
        <div className="heatmap-container">
          <table className="heatmap-table">
            <thead>
              <tr>
                <th></th>
                {symbols.map(symbol => (
                  <th key={symbol}>{symbol}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.map(symbol1 => (
                <tr key={symbol1}>
                  <th>{symbol1}</th>
                  {symbols.map(symbol2 => {
                    const correlation = correlationData.matrix[symbol1]?.[symbol2] || 0
                    return (
                      <td 
                        key={symbol2}
                        className="heatmap-cell"
                        style={{ 
                          background: getCorrelationColor(correlation),
                          color: '#fff',
                          fontWeight: symbol1 === symbol2 ? 'bold' : 'normal'
                        }}
                        title={`${symbol1} vs ${symbol2}: ${correlation.toFixed(2)} (${getCorrelationLabel(correlation)})`}
                      >
                        {correlation.toFixed(2)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlation Clusters */}
      {correlationData.clusters.length > 0 && (
        <div className="correlation-clusters">
          <h3>
            <TrendingUp size={20} />
            Correlation Clusters
          </h3>
          <p className="section-description">Groups of assets that tend to move together</p>
          <div className="clusters-grid">
            {correlationData.clusters.map((cluster, idx) => (
              <div key={idx} className="cluster-card">
                <div className="cluster-header">
                  <h4>{cluster.name}</h4>
                  <span 
                    className="cluster-correlation"
                    style={{ 
                      color: cluster.avgCorrelation >= 0.7 ? '#ff3366' : 
                             cluster.avgCorrelation >= 0.4 ? '#ffaa00' : '#00ff88' 
                    }}
                  >
                    Avg: {cluster.avgCorrelation.toFixed(2)}
                  </span>
                </div>
                <div className="cluster-symbols">
                  {cluster.symbols.map(symbol => (
                    <span key={symbol} className="cluster-symbol-badge">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="correlation-recommendations">
        <h3>
          <AlertTriangle size={20} />
          Diversification Recommendations
        </h3>
        <ul className="recommendations-list">
          {correlationData.recommendations.map((rec, idx) => (
            <li key={idx}>{rec}</li>
          ))}
        </ul>
      </div>

      {/* Legend */}
      <div className="correlation-legend">
        <h4>Understanding Correlations</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgba(0, 255, 136, 0.4)' }}></div>
            <div className="legend-text">
              <strong>Low (0.0 - 0.4)</strong>
              <span>Good for diversification - assets move independently</span>
            </div>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgba(255, 170, 0, 0.6)' }}></div>
            <div className="legend-text">
              <strong>Medium (0.4 - 0.7)</strong>
              <span>Moderate correlation - some diversification benefit</span>
            </div>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgba(255, 51, 102, 0.8)' }}></div>
            <div className="legend-text">
              <strong>High (0.7 - 1.0)</strong>
              <span>High correlation - assets move together, limited diversification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
